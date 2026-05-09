// server/src/seed/seedPhones.js
// Wipes and re-inserts phones + branches from the bundled JSON files.
// Run with:  npm run seed

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Phone from '../models/Phone.js';
import Branch from '../models/Branch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const main = async () => {
  await connectDB();

  const phonesRaw = await readFile(join(__dirname, 'phones.seed.json'), 'utf-8');
  const branchesRaw = await readFile(join(__dirname, 'branches.seed.json'), 'utf-8');
  const phones = JSON.parse(phonesRaw);
  const branches = JSON.parse(branchesRaw);

  console.log(`Wiping existing phones & branches…`);
  await Phone.deleteMany({});
  await Branch.deleteMany({});

  console.log(`Inserting ${phones.length} phones…`);
  await Phone.insertMany(phones, { ordered: false });

  console.log(`Inserting ${branches.length} branches…`);
  await Branch.insertMany(branches, { ordered: false });

  // Mark a curated set as "featured" for the carousel.
  const featuredCandidates = await Phone.find({ price: { $gte: 28000 } })
    .sort({ rating: -1 })
    .limit(8)
    .lean();
  await Phone.updateMany(
    { _id: { $in: featuredCandidates.map((p) => p._id) } },
    { $addToSet: { tags: 'featured' } }
  );
  console.log(`✓ Marked ${featuredCandidates.length} phones as featured.`);

  console.log('✅ Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
