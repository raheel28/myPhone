// server/src/services/recommendService.js
// Enhanced phone recommendation.
//
// HARD filter:
//   - price <= maxBudget (and >= minBudget if user gave a range)
//   - need5G / minRam if requested
//
// SOFT scoring (sum):
//   1. Brand match (when user named brands)              +6
//   2. Use-case tag overlap                              +2 per match
//   3. Use-case feature boost (RAM+refresh for gaming,
//      cameraMP for camera, battery+RAM for daily)       0..7
//   4. Bank-card offer match (when user mentioned cards) +4
//   5. Budget proximity, soft curve peaking at ~85%
//      of budget so we don't always max out the wallet   0..6
//   6. Discount value (mrp − price) / mrp                0..2
//   7. Rating, weighted properly                         rating * 1.5
//   8. 5G nice-to-have when user didn't strictly require +0.5
//
// DIVERSITY: cap at 2 phones per brand in top-N, unless the user explicitly
//   asked for one specific brand (then we return up to N from that brand).
//
// Returns top N (default 5) with `_score` for debugging.

import Phone from '../models/Phone.js';
import { resolveImages } from './imageResolver.js';

// ---------- helpers ----------

function useCaseFeatureScore(phone, wantUses) {
  if (!wantUses.length) return 0;
  let total = 0;
  for (const u of wantUses) {
    if (u === 'gaming') {
      const ram = phone.ram || 0;
      const rr = phone.specs?.refreshRateHz || 60;
      // 8GB+ and 90Hz+ are the gaming sweet spot; cap to keep score bounded.
      total += Math.min(ram / 12, 1) * 4 + (rr >= 120 ? 3 : rr >= 90 ? 2 : 0);
    } else if (u === 'camera' || u === 'photography') {
      const mp = phone.specs?.cameraMP || 0;
      // Diminishing returns past 108MP.
      total += Math.min(mp / 108, 1) * 5;
    } else if (u === 'daily') {
      const battery = phone.specs?.batterymAh || 0;
      const ram = phone.ram || 0;
      total += Math.min(battery / 6000, 1) * 3 + Math.min(ram / 8, 1) * 2;
    } else if (u === 'content' || u === 'video') {
      const rr = phone.specs?.refreshRateHz || 60;
      const mp = phone.specs?.cameraMP || 0;
      total += (rr >= 90 ? 2 : 0) + Math.min(mp / 64, 1) * 3;
    }
  }
  return total;
}

// Soft bell curve centred at 85% of budget. A ₹21k phone on a ₹25k budget
// (84%) hits the peak; a ₹12k phone (48%) and a ₹25k phone (100%) score less.
// Stops the system from always recommending the most expensive in-budget phone.
function budgetProximityScore(price, maxBudget) {
  if (!price || !maxBudget) return 0;
  const ratio = Math.min(price / maxBudget, 1);
  const distance = Math.abs(ratio - 0.85);
  return Math.max(0, 6 * (1 - distance * 1.6));
}

function discountScore(phone) {
  const mrp = phone.mrp || phone.price;
  if (!mrp || mrp <= phone.price) return 0;
  const pct = (mrp - phone.price) / mrp;
  // Cap at 30% — beyond that the discount is suspiciously large or a clearance.
  return Math.min(pct / 0.3, 1) * 2;
}

// ---------- main ----------

export const recommendPhones = async (prefs = {}, limit = 5) => {
  const maxBudget = Number(prefs.maxBudget);
  if (!Number.isFinite(maxBudget) || maxBudget <= 0) return [];

  const filter = { price: { $lte: maxBudget } };
  if (prefs.minBudget) {
    const min = Number(prefs.minBudget);
    if (Number.isFinite(min) && min > 0) {
      filter.price = { ...filter.price, $gte: min };
    }
  }
  if (prefs.need5G) filter.is5G = true;
  if (prefs.minRam) filter.ram = { $gte: Number(prefs.minRam) };

  const candidates = await Phone.find(filter).lean();
  if (candidates.length === 0) return [];

  const wantBrands = (prefs.brands || []).map((b) => String(b).toUpperCase());
  const wantUses   = (prefs.useCases || []).map((u) => String(u).toLowerCase());
  const wantCards  = (prefs.cards || []).map((c) => String(c).toUpperCase());

  const scored = candidates.map((p) => {
    let score = 0;

    // 1. Brand match
    if (wantBrands.length && wantBrands.includes(p.brand)) score += 6;

    // 2. Use-case tag overlap
    const useTagOverlap = (p.useCases || []).filter((u) => wantUses.includes(u)).length;
    score += useTagOverlap * 2;

    // 3. Use-case feature boost
    score += useCaseFeatureScore(p, wantUses);

    // 4. Card offer match (only counts if user mentioned cards)
    if (wantCards.length) {
      const cardMatch = (p.offers || []).some(
        (o) => o.type === 'card' && wantCards.includes((o.bank || '').toUpperCase())
      );
      if (cardMatch) score += 4;
    }

    // 5. Budget proximity (soft curve)
    score += budgetProximityScore(p.price, maxBudget);

    // 6. Discount value
    score += discountScore(p);

    // 7. Rating with proper weight
    score += (p.rating || 0) * 1.5;

    // 8. 5G as a nice-to-have when not explicitly required
    if (!prefs.need5G && p.is5G) score += 0.5;

    return { phone: p, score };
  });

  // Primary sort by score; tiebreakers favour higher rating then phones
  // closer to (but still under) budget.
  scored.sort((a, b) =>
    b.score - a.score
    || (b.phone.rating || 0) - (a.phone.rating || 0)
    || (b.phone.price || 0) - (a.phone.price || 0)
  );

  // Brand diversity: at most 2 per brand unless user explicitly asked
  // for a single specific brand.
  const maxPerBrand = wantBrands.length === 1 ? limit : 2;
  const brandCount = new Map();
  const top = [];
  for (const s of scored) {
    const brand = s.phone.brand || 'UNKNOWN';
    const count = brandCount.get(brand) || 0;
    if (count >= maxPerBrand) continue;
    top.push(s);
    brandCount.set(brand, count + 1);
    if (top.length >= limit) break;
  }
  // Diversity may have left us short if there are very few brands; backfill.
  if (top.length < limit) {
    const seen = new Set(top.map((t) => String(t.phone._id)));
    for (const s of scored) {
      if (seen.has(String(s.phone._id))) continue;
      top.push(s);
      if (top.length >= limit) break;
    }
  }

  const result = top.map((s) => ({
    ...s.phone,
    _score: Number(s.score.toFixed(2)),
  }));
  await resolveImages(result);
  return result;
};
