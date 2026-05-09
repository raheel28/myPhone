// server/src/controllers/chatbotController.js
// Orchestrates: user message -> LLM -> (optional) recommend_phones tool -> LLM -> response.

import { asyncHandler } from '../utils/asyncHandler.js';
import {
  isLlmConfigured,
  runChatTurn,
  runChatTurnWithToolResult,
} from '../services/llmService.js';
import { recommendPhones } from '../services/recommendService.js';

// Coerce LLM-emitted args into the right JS types and enforce strict-budget rule.
function coercePrefs(raw = {}) {
  const out = { ...raw };
  for (const k of ['minBudget', 'maxBudget', 'minRam']) {
    if (out[k] != null) {
      const n = Number(out[k]);
      out[k] = Number.isFinite(n) && n > 0 ? n : undefined;
    }
  }
  if (out.need5G != null) {
    if (typeof out.need5G === 'string') out.need5G = out.need5G.toLowerCase() === 'true';
    else out.need5G = Boolean(out.need5G);
  }
  for (const k of ['brands', 'useCases', 'cards']) {
    if (Array.isArray(out[k])) {
      out[k] = out[k].filter((v) => typeof v === 'string').map((v) => v.trim()).filter(Boolean);
    } else {
      out[k] = [];
    }
  }
  return out;
}


// Extract the largest budget number from a single text string.
// Returns null if none found.
function extractBudgetFromText(text = '') {
  const t = String(text).toLowerCase();
  const kMatches = [...t.matchAll(/(\d{1,3})\s*[kK]\b/g)]
    .map((m) => Number(m[1]) * 1000)
    .filter((n) => n >= 3000 && n <= 500000);
  const numMatches = [...t.matchAll(/(\d{4,7})/g)]
    .map((m) => Number(m[0]))
    .filter((n) => n >= 3000 && n <= 500000);
  const all = [...new Set([...kMatches, ...numMatches])];
  return all.length > 0 ? Math.max(...all) : null;
}

// Detect if the text contains an explicit budget number (e.g. "25k", "25000").
function hasBudgetNumber(text = '') {
  return extractBudgetFromText(text) !== null;
}

// Detect refinement messages — tweaks to an existing search that legitimately reuse a prior budget.
function isRefinement(text = '') {
  const t = String(text).toLowerCase();
  return /(cheaper|go lower|lower budget|less expensive|higher budget|more expensive|premium|same budget|more options|show more|show \w+ more|different brand|what about|how about|any other|also show|another option|try something|\bmore\b.{0,20}(pick|phone|option|result)|(pick|phone|option|result).{0,20}\bmore\b|under that|within that|in that range|still under|at that price|add 5g|with 5g|better camera|bigger battery|more ram)/.test(t);
}

// Check if any previous user message in the conversation contained a budget number.
function hasBudgetInHistory(messages = []) {
  return messages
    .filter((m) => m.role === 'user' && typeof m.content === 'string')
    .some((m) => hasBudgetNumber(m.content));
}

// Detect if the last bot message was asking a clarifying question (use case, brand, 5G, etc.)
// after having already received a budget. In that case the user's short answer ("gaming",
// "Samsung", "yes 5G") is a valid continuation — not a new search requiring a fresh budget.
function wasBotAskingClarification(messages = []) {
  const lastAssistant = [...messages].reverse()
    .find((m) => m.role === 'assistant' && typeof m.content === 'string');
  if (!lastAssistant) return false;
  const t = lastAssistant.content.toLowerCase();
  return /(use case|main use|what.{0,30}(use|for|purpose)|gaming|camera|daily|content|brand|which brand|any brand|prefer.{0,20}brand|5g|need 5g|going to (use|be used)|what kind|what type|primarily|mainly)/.test(t);
}

// Detect short acknowledgements that should never trigger a tool call.
function isAcknowledgement(text = '') {
  const t = String(text).trim().toLowerCase();
  return /^(ok|okay|ok\.|okay\.|k|kk|cool|nice|great|thanks|thank you|got it|sure|alright|sounds good|perfect|noted|👍|🙏|😊|yep|yup|yes|yeah|fine|good|awesome|👌|understood|i see|makes sense|right|hmm|hm|oh|ah|no problem|np)$/.test(t);
}

// Detect "clear recommendations" / "reset" / "start over" intent.
function detectClearIntent(text = '') {
  const t = String(text).toLowerCase();
  return /(remove|clear|reset|hide|dismiss|forget|cancel|delete|close|start\s*over)\s+(all\s+)?(the\s+)?(recs?|recommendations?|suggestions?|results?|list|cards?|phones?)/.test(t)
      || /(start over|clear chat|reset chat|new search|forget what i said)/.test(t);
}

const ASK_BUDGET_REPLY =
  "Sure - what's your budget for the phone? You can say something like \"under 25000\" or \"around 30k\" and I'll find the best 5 within that.";

/**
 * POST /api/chatbot/message
 */
export const chat = asyncHandler(async (req, res) => {
  const messages = Array.isArray(req.body.messages) ? req.body.messages : [];

  if (messages.length === 0) {
    res.status(400);
    throw new Error('messages[] is required.');
  }
  if (messages.length > 40) messages.splice(0, messages.length - 40);

  // STRICT: clear / reset intent — short-circuit the LLM, dismiss recs.
  const lastUser = [...messages].reverse().find((m) => m.role === 'user' && typeof m.content === 'string')?.content || '';
  if (detectClearIntent(lastUser)) {
    const reply = "Done — cleared. What budget should I look in next?";
    return res.json({
      reply,
      recommendations: [],
      clear: true,
      mode: 'llm',
      updatedHistory: [...messages, { role: 'assistant', content: reply }],
    });
  }

  if (!isLlmConfigured()) {
    const fallback = await fallbackChat(messages);
    return res.json({ ...fallback, mode: 'fallback', reason: 'no-api-key' });
  }

  try {
    const turn1 = await runChatTurn(messages);

    if (!turn1.toolCall) {
      return res.json({
        reply: turn1.message,
        recommendations: [],
        updatedHistory: [...messages, { role: 'assistant', content: turn1.message }],
        mode: 'llm',
      });
    }

    const prefs = coercePrefs(turn1.toolCall.input);

    // If the current user message contains an explicit budget number, always use it.
    // This prevents the LLM from silently carrying forward a stale budget from history
    // (e.g. user said "90k" before, now says "20k" — we must use 20k).
    const budgetFromCurrentMsg = extractBudgetFromText(lastUser);
    if (budgetFromCurrentMsg) {
      prefs.maxBudget = budgetFromCurrentMsg;
    }

    // STRICT BUDGET RULE: if the LLM tried to call the tool without a budget,
    // override and ask for a budget instead of recommending.
    if (!prefs.maxBudget) {
      return res.json({
        reply: ASK_BUDGET_REPLY,
        recommendations: [],
        updatedHistory: [...messages, { role: 'assistant', content: ASK_BUDGET_REPLY }],
        mode: 'llm',
      });
    }

    // PROTOCOL ENFORCEMENT:
    // Recommendations are only allowed when EITHER:
    //   (a) the current user message contains a budget number, OR
    //   (b) it's a refinement ("cheaper", "what about Samsung", etc.) AND a budget
    //       was already confirmed somewhere earlier in the conversation.
    //
    // This blocks three cases:
    //   1. Short acknowledgements ("ok", "thanks", "cool") — never re-show recs.
    //   2. Fresh new-topic message with no budget ("camera phone" after a gaming session).
    //   3. Refinement-style opener ("what about Realme?") when no budget exists yet at all.
    const budgetNow        = hasBudgetNumber(lastUser);
    const refinement       = isRefinement(lastUser);
    const budgetHistory    = hasBudgetInHistory(messages);
    // True when bot asked "what's the use case / brand / 5G?" and budget already exists —
    // the user's short answer ("gaming", "Samsung", "yes") is a valid follow-up, not a new search.
    const answeringClarification = wasBotAskingClarification(messages) && budgetHistory;

    if (isAcknowledgement(lastUser) || (!budgetNow && !answeringClarification && !(refinement && budgetHistory))) {
      return res.json({
        reply: ASK_BUDGET_REPLY,
        recommendations: [],
        updatedHistory: [...messages, { role: 'assistant', content: ASK_BUDGET_REPLY }],
        mode: 'llm',
      });
    }

    const recommendations = await recommendPhones(prefs, 5);
    const historyWithToolUse = [...messages, turn1.assistantMessage];
    const turn2 = await runChatTurnWithToolResult(
      historyWithToolUse, turn1.toolCall.id, { recommendations }
    );

    return res.json({
      reply: turn2.message,
      recommendations,
      preferences: prefs,
      updatedHistory: [...messages, { role: 'assistant', content: turn2.message }],
      mode: 'llm',
    });
  } catch (err) {
    console.warn('[chatbot] LLM path failed, falling back:', err?.message || err);
    const fallback = await fallbackChat(messages);
    return res.json({ ...fallback, mode: 'fallback', reason: err?.message || 'llm-error' });
  }
});

// --- Rule-based fallback ---
async function fallbackChat(messages) {
  const userMessages = messages.filter((m) => m.role === 'user' && typeof m.content === 'string');
  const lastUserText  = (userMessages.slice(-1)[0]?.content || '').toLowerCase();
  const recentUserText = userMessages.slice(-4).map((m) => m.content).join(' ').toLowerCase();
  const text = recentUserText || '';

  // ALWAYS check the latest message first for a budget.
  // Only fall back to scanning recent history if the latest message has no budget
  // (e.g. a refinement like "cheaper" or "show more").
  let maxBudget = extractBudgetFromText(lastUserText);

  if (!maxBudget) {
    // No budget in the latest message — scan recent history (covers refinements).
    const numericMatches = [...text.matchAll(/(\d{1,3}(?:[,\s]\d{3})+|\d{4,7})/g)]
      .map((m) => Number(m[0].replace(/[,\s]/g, '')))
      .filter((n) => n >= 3000 && n <= 500000);
    const kMatches = [...text.matchAll(/(\d{1,3})\s*[kK]\b/g)]
      .map((m) => Number(m[1]) * 1000)
      .filter((n) => n >= 3000 && n <= 500000);
    const allNums = [...new Set([...numericMatches, ...kMatches])];

    if (allNums.length >= 1) {
      const n = Math.max(...allNums);
      if (/(above|over|more than|min|atleast|at least)/.test(lastUserText)) maxBudget = null;
      else maxBudget = n;
    }
  }

  // STRICT RULE: no budget means we ask for one.
  if (!maxBudget) {
    return {
      reply: ASK_BUDGET_REPLY,
      recommendations: [],
      updatedHistory: messages,
    };
  }

  const brandAliases = {
    samsung: 'SAMSUNG', galaxy: 'SAMSUNG',
    oneplus: 'ONEPLUS', '1+': 'ONEPLUS', 'one plus': 'ONEPLUS',
    realme: 'REALME', redmi: 'REDMI', mi: 'REDMI', xiaomi: 'XIAOMI',
    oppo: 'OPPO', motorola: 'MOTOROLA', moto: 'MOTOROLA',
    tecno: 'TECNO', poco: 'POCO', nothing: 'NOTHING',
    apple: 'APPLE', iphone: 'APPLE', google: 'GOOGLE', pixel: 'GOOGLE',
    vivo: 'VIVO', iqoo: 'IQOO', honor: 'HONOR', infinix: 'INFINIX',
    lava: 'LAVA', itel: 'ITEL', sony: 'SONY',
  };
  const brands = [];
  for (const [key, brand] of Object.entries(brandAliases)) {
    if (new RegExp('\\b' + key + '\\b').test(text) && !brands.includes(brand)) brands.push(brand);
  }

  const useCases = [];
  if (/(gam|pubg|bgmi|cod|fortnite|fps|cricket\s*game)/.test(text)) useCases.push('gaming');
  if (/(camera|photo|selfie|insta(gram)?|reel|vlog|youtub|content\s*creat)/.test(text)) useCases.push('camera');
  if (/(daily|basic|regular|normal|general|college|office|student|work|browsing|whatsapp)/.test(text)) useCases.push('daily');

  const need5G = /\b5\s*g\b/.test(text);
  const cards = [];
  ['HDFC', 'ICICI', 'AXIS', 'SBI', 'KOTAK'].forEach((b) => {
    if (new RegExp('\\b' + b + '\\b', 'i').test(text)) cards.push(b);
  });

  const recs = await recommendPhones({ maxBudget, brands, useCases, cards, need5G }, 5);

  const bits = [];
  if (brands.length) bits.push('brand: ' + brands.join(', '));
  if (useCases.length) bits.push('for ' + useCases.join(' & '));
  bits.push('budget up to Rs ' + maxBudget.toLocaleString('en-IN'));
  if (need5G) bits.push('5G');

  const reply = recs.length
    ? 'Got it - ' + bits.join(', ') + '. Top ' + recs.length + ' picks within budget:'
    : 'Nothing in stock at ' + bits.join(', ') + '. Try a higher budget?';

  return { reply, recommendations: recs, updatedHistory: messages };
}
