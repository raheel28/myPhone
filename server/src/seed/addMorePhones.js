// server/src/seed/addMorePhones.js
// Upsert (insert-or-update by slug) the extra phones from extraPhones.seed.json.
// Safe to run multiple times; existing phones are not duplicated.

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Phone from '../models/Phone.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const main = async () => {
  await connectDB();

  const raw = await readFile(join(__dirname, 'extraPhones.seed.json'), 'utf-8');
  const phones = JSON.parse(raw);
  console.log(`Loading ${phones.length} extra phones...`);

  let added = 0;
  let updated = 0;
  for (const p of phones) {
    const res = await Phone.updateOne(
      { slug: p.slug },
      { $set: p },
      { upsert: true }
    );
    if (res.upsertedCount > 0) added++;
    else if (res.modifiedCount > 0) updated++;
  }

  // Mark featured tagged phones as featured (in case the field is missing)
  const featuredCount = await Phone.countDocuments({ tags: 'featured' });
  console.log(`Done. Added ${added}, updated ${updated}, total featured in DB: ${featuredCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error('addMorePhones failed:', err);
  process.exit(1);
});
