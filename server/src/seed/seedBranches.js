// server/src/seed/seedBranches.js
// Wipes and re-inserts ONLY the Branches collection from branches.seed.json.
// The Phones collection is untouched - safe to run any time.
//
// Run with:  npm run seed:branches

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Branch from '../models/Branch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const main = async () => {
  await connectDB();
  const raw = await readFile(join(__dirname, 'branches.seed.json'), 'utf-8');
  const branches = JSON.parse(raw);

  console.log(`Wiping existing branches...`);
  await Branch.deleteMany({});
  console.log(`Inserting ${branches.length} branches...`);
  await Branch.insertMany(branches, { ordered: false });

  console.log('Branches seeded:');
  for (const b of await Branch.find().sort({ city: 1, name: 1 }).lean()) {
    console.log(`  - ${b.name} (${b.city})`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
