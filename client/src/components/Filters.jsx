// client/src/components/Filters.jsx
import { useEffect, useRef, useState } from 'react';
import { fetchBrands } from '../services/api.js';

export default function Filters({ value, onChange }) {
  const [brands, setBrands] = useState([]);
  const [local, setLocal] = useState(value);

  // Local-only state for the search input so we can debounce it before
  // pushing it up. Other filters still go up instantly.
  const [searchInput, setSearchInput] = useState(value.q || '');
  const debounceRef = useRef(null);

  useEffect(() => { fetchBrands().then(setBrands).catch(() => {}); }, []);
  useEffect(() => {
    setLocal(value);
    setSearchInput(value.q || '');
  }, [value]);

  const update = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  // Debounced search update — fires 300ms after the user stops typing.
  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearchInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update({ q: v });
    }, 300);
  };

  // Run the search immediately on Enter
  const onSearchKey = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      update({ q: searchInput });
    }
  };

  // Cleanup the timer on unmount
  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  const reset = () => {
    setSearchInput('');
    onChange({});
  };

  return (
    <aside className="filters card">
      <div className="filters-head">
        <strong>Filters</strong>
        <button className="reset" onClick={reset}>Reset</button>
      </div>

      <div className="group">
        <label>Search</label>
        <input
          placeholder="Try: s, samsung, gaming, snapdragon..."
          value={searchInput}
          onChange={onSearchChange}
          onKeyDown={onSearchKey}
        />
      </div>

      <div className="group">
        <label>Brand</label>
        <select value={local.brand || ''} onChange={(e) => update({ brand: e.target.value })}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.brand} value={b.brand}>
              {b.brand} ({b.count})
            </option>
          ))}
        </select>
      </div>

      <div className="group two">
        <div>
          <label>Min price (Rs)</label>
          <input type="number" min={0} step={1000} value={local.minPrice || ''} onChange={(e) => update({ minPrice: e.target.value })} />
        </div>
        <div>
          <label>Max price (Rs)</label>
          <input type="number" min={0} step={1000} value={local.maxPrice || ''} onChange={(e) => update({ maxPrice: e.target.value })} />
        </div>
      </div>

      <div className="group">
        <label>Use case</label>
        <select value={local.useCase || ''} onChange={(e) => update({ useCase: e.target.value })}>
          <option value="">Any</option>
          <option value="gaming">Gaming</option>
          <option value="camera">Camera</option>
          <option value="photography">Photography</option>
          <option value="daily">Daily use</option>
        </select>
      </div>

      <div className="group">
        <label>Min RAM (GB)</label>
        <select value={local.minRam || ''} onChange={(e) => update({ minRam: e.target.value })}>
          <option value="">Any</option>
          <option value="4">4+ GB</option>
          <option value="6">6+ GB</option>
          <option value="8">8+ GB</option>
          <option value="12">12+ GB</option>
        </select>
      </div>

      <div className="group">
        <label>Network</label>
        <div className="seg">
          <button className={!local.is5G ? 'on' : ''} onClick={() => update({ is5G: '' })}>Any</button>
          <button className={local.is5G === 'true' ? 'on' : ''} onClick={() => update({ is5G: 'true' })}>5G</button>
          <button className={local.is5G === 'false' ? 'on' : ''} onClick={() => update({ is5G: 'false' })}>4G</button>
        </div>
      </div>

      <div className="group">
        <label>Sort by</label>
        <select value={local.sort || 'price_asc'} onChange={(e) => update({ sort: e.target.value })}>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating_desc">Top rated</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <style>{`
        .filters { padding: 18px; position: sticky; top: 88px; }
        .filters-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .reset { background: transparent; border: 0; color: var(--neon); font-weight: 600; }
        .group { margin-top: 14px; }
        .group.two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .seg { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
        .seg button { padding: 10px; background: var(--bg-elevated); border: 0; color: var(--text-muted); font-weight: 600; }
        .seg button.on { background: var(--neon); color: white; }
      `}</style>
    </aside>
  );
}
