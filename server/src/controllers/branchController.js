// server/src/controllers/branchController.js
import Branch from '../models/Branch.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** GET /api/branches  (?city=Ahmedabad) */
export const listBranches = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.city) filter.city = new RegExp(`^${req.query.city}$`, 'i');
  const branches = await Branch.find(filter).sort({ city: 1, name: 1 }).lean();
  res.json(branches);
});
