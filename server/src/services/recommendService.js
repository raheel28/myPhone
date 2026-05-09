// server/src/services/recommendService.js
// Strict-budget recommendation:
//   - REQUIRES maxBudget. Returns [] if missing.
//   - Hard filter: price <= maxBudget. No phone above the budget is ever returned.
//   - Soft scoring: brand match, use-case overlap, card-offer match,
//     budget-proximity (phones near the budget rank higher), rating tiebreaker.
//   - Returns top 5.

import Phone from '../models/Phone.js';
import { resolveImages } from './imageResolver.js';

export const recommendPhones = async (prefs = {}, limit = 5) => {
  const maxBudget = Number(prefs.maxBudget);
  if (!Number.isFinite(maxBudget) || maxBudget <= 0) {
    // Hard rule: no budget => no recommendations.
    return [];
  }

  const filter = { price: { $lte: maxBudget } };
  if (prefs.need5G) filter.is5G = true;
  if (prefs.minRam) filter.ram = { $gte: Number(prefs.minRam) };

  // Pull ALL qualifying phones so no in-budget phone is excluded by an arbitrary limit.
  // Sorting by price desc ensures expensive phones near the budget aren't skipped.
  const candidates = await Phone.find(filter).sort({ price: -1 }).lean();

  const wantBrands = (prefs.brands || []).map((b) => String(b).toUpperCase());
  const wantUses   = (prefs.useCases || []).map((u) => String(u).toLowerCase());
  const wantCards  = (prefs.cards || []).map((c) => String(c).toUpperCase());

  const scored = candidates.map((p) => {
    let score = 0;

    // Brand match (heaviest weight)
    if (wantBrands.length && wantBrands.includes(p.brand)) score += 5;

    // Use-case overlap
    score += (p.useCases || []).filter((u) => wantUses.includes(u)).length * 3;

    // Bank-card offer match
    const cardMatch = (p.offers || []).some(
      (o) => o.type === 'card' && wantCards.includes((o.bank || '').toUpperCase())
    );
    if (cardMatch) score += 4;

    // Budget proximity: strongly prefer phones close to (but below) the budget.
    // Weight is 8 so a phone at 96% of budget (e.g. ₹48k on a ₹50k budget) scores
    // ~7.7 here, easily outranking a ₹17k phone (ratio 0.34 → ~2.7) unless there
    // are very strong brand + use-case overlaps to compensate.
    const ratio = p.price / maxBudget;            // 0..1
    score += Math.max(0, ratio) * 8;

    // Rating tiebreaker
    score += (p.rating || 0) * 0.4;

    return { phone: p, score };
  });

  scored.sort((a, b) =>
    b.score - a.score
    || b.phone.rating - a.phone.rating
    || b.phone.price - a.phone.price   // among ties, prefer closer to budget
  );

  const top = scored.slice(0, limit).map((s) => ({ ...s.phone, _score: Number(s.score.toFixed(2)) }));
  await resolveImages(top);
  return top;
};
