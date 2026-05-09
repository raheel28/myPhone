// client/src/pages/Catalog.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Filters from '../components/Filters.jsx';
import PhoneCard from '../components/PhoneCard.jsx';
import Loader from '../components/Loader.jsx';
import { fetchPhones } from '../services/api.js';

// Convert URLSearchParams ↔ filter object.
const paramsToObject = (sp) => {
  const obj = {};
  for (const [k, v] of sp.entries()) if (v) obj[k] = v;
  return obj;
};

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => paramsToObject(searchParams), [searchParams]);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    fetchPhones({ ...filters, page: filters.page || 1, limit: 24 })
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Failed to load phones.'); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [searchParams]);

  const updateFilters = (next) => {
    const cleaned = {};
    Object.entries(next).forEach(([k, v]) => { if (v !== '' && v != null) cleaned[k] = v; });
    cleaned.page = 1;
    setSearchParams(cleaned);
  };

  const goPage = (p) => {
    const next = paramsToObject(searchParams);
    next.page = p;
    setSearchParams(next);
  };

  return (
    <section className="catalog section">
      <div className="container catalog-grid">
        <Filters value={filters} onChange={updateFilters} />

        <div className="results">
          <div className="r-head">
            <h2>{loading ? 'Loading…' : `${data.total} phones`}</h2>
            <span className="muted">{filters.brand && `Brand: ${filters.brand}`}</span>
          </div>

          {error && <div className="err">{error}</div>}

          {loading ? (
            <Loader rows={9} />
          ) : data.items.length === 0 ? (
            <div className="empty">
              <strong>No phones match your filters.</strong>
              <p>Try resetting filters or broadening the price range.</p>
            </div>
          ) : (
            <div className="grid">
              {data.items.map((p) => <PhoneCard key={p._id} phone={p} />)}
            </div>
          )}

          {data.pages > 1 && (
            <div className="pager">
              <button disabled={data.page <= 1} onClick={() => goPage(data.page - 1)}>← Prev</button>
              <span>Page {data.page} of {data.pages}</span>
              <button disabled={data.page >= data.pages} onClick={() => goPage(data.page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .catalog-grid { display: grid; grid-template-columns: 280px 1fr; gap: 28px; }
        .r-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
        .muted { color: var(--text-muted); font-size: 0.9rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .empty { padding: 60px; text-align: center; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius); }
        .err { color: var(--danger); padding: 14px; background: rgba(255,92,92,.08); border-radius: var(--radius-sm); }
        .pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 32px; }
        .pager button { padding: 10px 18px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); }
        .pager button:disabled { opacity: .4; cursor: not-allowed; }
        @media (max-width: 880px) { .catalog-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
