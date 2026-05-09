// server/src/services/imageResolver.js
// Resolves a per-phone image URL.
//
// Order of precedence:
//   1. user-supplied override in seed/imageOverrides.json (real product photo)
//   2. a deterministically-chosen photo from a 30-image pool of real
//      smartphone photos (Unsplash). Different phones get different photos;
//      adjacent phones in a list rarely collide.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = join(__dirname, '..', 'seed', 'imageOverrides.json');

// 30 real smartphone photos hosted by Unsplash. URLs end with quality params
// that keep file size small and let the browser cache aggressively.
const PHOTO_POOL = [
  'https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592434134753-a70baf7979d5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611791484670-ce19b801d192?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573739022854-abceaeb585dc?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592286927505-1def25115fa8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1547658721-da2b9b1f23a5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1525598912003-663126343e1f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
];

// Deterministic 32-bit FNV-1a hash so the same slug always picks the same photo.
function hash32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

let _cache = { overrides: {}, loadedAt: 0 };
const TTL_MS = 30_000;

async function getOverrides() {
  if (Date.now() - _cache.loadedAt < TTL_MS) return _cache.overrides;
  try {
    const raw = await readFile(OVERRIDES_PATH, 'utf-8');
    const obj = JSON.parse(raw);
    const overrides = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!k.startsWith('_') && typeof v === 'string') overrides[k] = v;
    }
    _cache = { overrides, loadedAt: Date.now() };
  } catch (err) {
    console.warn('[imageResolver] failed to read overrides:', err.message);
    _cache = { overrides: {}, loadedAt: Date.now() };
  }
  return _cache.overrides;
}

// Pick a photo by hashing the slug. Keeps the same photo per phone across pages.
function pickFromPool(slug) {
  const idx = hash32(slug || '') % PHOTO_POOL.length;
  return PHOTO_POOL[idx];
}

// Resolve a single phone (e.g. on the detail page).
export async function resolveImage(phone) {
  if (!phone) return phone;
  const overrides = await getOverrides();
  phone.image = overrides[phone.slug] || pickFromPool(phone.slug);
  return phone;
}

// Resolve images on a LIST of phones.
// Uses slug-hashing (so refreshing the page never reshuffles), but if two
// adjacent phones happen to land on the same image, the second one is shifted
// to the next slot in the pool. This prevents the visible "two identical cards
// next to each other" problem.
export async function resolveImages(phones = []) {
  await getOverrides();
  const overrides = _cache.overrides;
  let lastIdx = -1;
  return phones.map((p) => {
    const real = overrides[p.slug];
    if (real) {
      p.image = real;
      lastIdx = -1; // a real photo doesn't count toward pool collision tracking
      return p;
    }
    let idx = hash32(p.slug || '') % PHOTO_POOL.length;
    if (idx === lastIdx) {
      idx = (idx + 1) % PHOTO_POOL.length;
    }
    lastIdx = idx;
    p.image = PHOTO_POOL[idx];
    return p;
  });
}
