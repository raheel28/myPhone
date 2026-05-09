// server/src/controllers/phoneController.js
import Phone from '../models/Phone.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveImage, resolveImages } from '../services/imageResolver.js';

// Escape user input so it can be safely used inside a RegExp.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/phones
 * Query params:
 *   brand, minPrice, maxPrice, minRam, useCase, is5G, q, sort, page, limit
 *
 * Search (`q`) does case-insensitive partial matching across name, brand,
 * and processor — so typing "s" matches Samsung, Snapdragon, etc.
 */
export const listPhones = asyncHandler(async (req, res) => {
  const {
    brand, minPrice, maxPrice, minRam, useCase, is5G, q,
    sort = 'price_asc', page = 1, limit = 20,
  } = req.query;

  const filter = {};
  if (brand) filter.brand = { $in: brand.split(',').map((b) => b.toUpperCase().trim()) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minRam) filter.ram = { $gte: Number(minRam) };
  if (useCase) filter.useCases = useCase.toLowerCase();
  if (is5G === 'true') filter.is5G = true;
  if (is5G === 'false') filter.is5G = false;

  // Partial / case-insensitive search across multiple fields.
  // Single character ("s") matches Samsung, Snapdragon, etc.
  const trimmed = (q || '').trim();
  if (trimmed) {
    const rx = new RegExp(escapeRegex(trimmed), 'i');
    filter.$or = [
      { name: rx },
      { brand: rx },
      { 'specs.processor': rx },
    ];
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating_desc: { rating: -1 },
    newest: { createdAt: -1 },
  };

  const lim = Math.min(Number(limit) || 20, 60);
  const pg = Math.max(Number(page) || 1, 1);

  const [items, total] = await Promise.all([
    Phone.find(filter)
      .sort(sortMap[sort] || sortMap.price_asc)
      .skip((pg - 1) * lim)
      .limit(lim)
      .lean(),
    Phone.countDocuments(filter),
  ]);

  await resolveImages(items);

  res.json({ items, total, page: pg, pages: Math.ceil(total / lim), limit: lim });
});

/** GET /api/phones/featured */
export const featuredPhones = asyncHandler(async (_req, res) => {
  let items = await Phone.find({ tags: 'featured' }).limit(10).lean();
  if (items.length < 4) {
    items = await Phone.find().sort({ rating: -1, price: -1 }).limit(8).lean();
  }
  await resolveImages(items);
  res.json(items);
});

/** GET /api/phones/brands */
export const listBrands = asyncHandler(async (_req, res) => {
  const agg = await Phone.aggregate([
    { $group: { _id: '$brand', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
    { $project: { _id: 0, brand: '$_id', count: 1, minPrice: 1 } },
    { $sort: { brand: 1 } },
  ]);
  res.json(agg);
});

/** GET /api/phones/:slug */
export const getPhone = asyncHandler(async (req, res) => {
  const phone = await Phone.findOne({ slug: req.params.slug }).lean();
  if (!phone) {
    res.status(404);
    throw new Error('Phone not found');
  }
  await resolveImage(phone);
  res.json(phone);
});
