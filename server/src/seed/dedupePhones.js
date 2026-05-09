// server/src/seed/dedupePhones.js
// Reports and (optionally) removes duplicate phones from the live DB.
//
// Usage:
//   npm run dedupe          - DRY RUN: only print what would be removed
//   npm run dedupe -- --fix - actually delete the duplicates (keeps the newest)
//
// Two duplicate kinds are checked:
//   1. EXACT — same brand + same name + same ram + same storage
//   2. NAME  — same brand + same name (different ram/storage = different SKU,
//              treated as legitimate, not a duplicate)

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Phone from '../models/Phone.js';

const FIX = process.argv.includes('--fix');

const main = async () => {
  await connectDB();
  console.log(FIX ? 'MODE: FIX (will delete duplicates)' : 'MODE: DRY RUN (no changes)');
  console.log();

  const total = await Phone.countDocuments();
  console.log(`Total phones in DB: ${total}`);
  console.log();

  // --- 1. Same brand + name + ram + storage = exact SKU duplicate
  const exactGroups = await Phone.aggregate([
    { $group: {
        _id: { brand: '$brand', name: '$name', ram: '$ram', storage: '$storage' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
        slugs: { $push: '$slug' },
        createdAts: { $push: '$createdAt' },
    }},
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log('--- EXACT duplicates (same brand + name + ram + storage) ---');
  let exactRemoved = 0;
  if (exactGroups.length === 0) {
    console.log('  None.');
  } else {
    for (const g of exactGroups) {
      console.log(`  ${g.count}x  "${g._id.name}"  (brand=${g._id.brand}, ram=${g._id.ram}, storage=${g._id.storage})`);
      console.log(`        slugs: ${g.slugs.join(', ')}`);

      if (FIX) {
        // Keep newest, delete the rest
        const sorted = g.ids
          .map((id, i) => ({ id, createdAt: g.createdAts[i], slug: g.slugs[i] }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        console.log(`        KEEP ${toKeep.slug}, DELETE ${toDelete.map((d) => d.slug).join(', ')}`);
        const res = await Phone.deleteMany({ _id: { $in: toDelete.map((d) => d.id) } });
        exactRemoved += res.deletedCount;
      }
    }
  }
  console.log();

  // --- 2. Same brand + name only (different RAM/storage is normal — flag for review)
  const nameGroups = await Phone.aggregate([
    { $group: {
        _id: { brand: '$brand', name: '$name' },
        count: { $sum: 1 },
        slugs: { $push: '$slug' },
        rams: { $push: '$ram' },
        storages: { $push: '$storage' },
    }},
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Filter out groups that are legitimate variants (different RAM or storage)
  const nameDupes = nameGroups.filter((g) => {
    const variants = new Set(g.rams.map((r, i) => `${r}/${g.storages[i]}`));
    return variants.size === 1; // all variants identical -> duplicate
  });

  console.log('--- NAME duplicates (same brand + name, identical specs) ---');
  if (nameDupes.length === 0) {
    console.log('  None (any duplicate names found are different RAM/storage variants).');
  } else {
    for (const g of nameDupes) {
      console.log(`  ${g.count}x  "${g._id.name}"  brand=${g._id.brand}`);
      console.log(`        slugs: ${g.slugs.join(', ')}`);
    }
  }
  console.log();

  // --- 3. Slug duplicates (should be impossible due to unique index, but check)
  const slugGroups = await Phone.aggregate([
    { $group: { _id: '$slug', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  console.log('--- SLUG duplicates (would indicate a missing unique index) ---');
  if (slugGroups.length === 0) {
    console.log('  None (slug uniqueness is intact).');
  } else {
    for (const g of slugGroups) console.log(`  ${g.count}x  ${g._id}`);
  }
  console.log();

  // Summary
  const after = await Phone.countDocuments();
  console.log('=== Summary ===');
  console.log(`  Started with:    ${total} phones`);
  if (FIX) console.log(`  Removed:         ${exactRemoved}`);
  console.log(`  Now in DB:       ${after}`);
  if (!FIX && exactGroups.length > 0) {
    console.log();
    console.log('  Re-run with `npm run dedupe -- --fix` to actually delete them.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => { console.error('Dedupe failed:', err); process.exit(1); });
