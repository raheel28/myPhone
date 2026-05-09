// client/src/pages/Branches.jsx
import { useEffect, useMemo, useState } from 'react';
import { fetchBranches } from '../services/api.js';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchBranches()
      .then((b) => alive && setBranches(b))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const cities = useMemo(() => Array.from(new Set(branches.map((b) => b.city))).sort(), [branches]);
  const visible = useMemo(
    () => (city ? branches.filter((b) => b.city === city) : branches),
    [branches, city]
  );

  return (
    <section className="branches section">
      <div className="container">
        <span className="chip">Visit us</span>
        <h1>Our stores</h1>
        <p>Walk in for hands-on demos, instant trade-in valuations, and same-day service.</p>

        <div className="filters-row">
          <button className={!city ? 'on' : ''} onClick={() => setCity('')}>All ({branches.length})</button>
          {cities.map((c) => (
            <button key={c} className={city === c ? 'on' : ''} onClick={() => setCity(c)}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 16, marginTop: 24 }} />
        ) : (
          <div className="grid">
            {visible.map((b) => (
              <article key={b._id || b.name} className="card branch">
                <h3>{b.name}</h3>
                <div className="loc">{b.address}</div>
                <div className="loc muted">{b.city}, {b.state} — {b.pincode}</div>
                <div className="meta">
                  <span>📞 {b.phone}</span>
                  {b.email && <span>✉️ {b.email}</span>}
                  <span>🕒 {b.hours}</span>
                </div>
                {b.services?.length > 0 && (
                  <div className="services">
                    {b.services.map((s) => <span key={s} className="chip">{s}</span>)}
                  </div>
                )}
                {b.lat != null && b.lng != null && (
                  <a
                    className="btn btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                  >
                    Open in Maps →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .filters-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 22px 0 18px; }
        .filters-row button {
          padding: 8px 14px; border-radius: 999px;
          background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-muted);
        }
        .filters-row button.on { background: var(--neon); color: white; border-color: var(--neon); }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .branch { padding: 22px; display: flex; flex-direction: column; gap: 6px; }
        .branch h3 { margin-bottom: 4px; }
        .branch .loc { color: var(--text); }
        .branch .muted { color: var(--text-muted); font-size: 0.9rem; }
        .branch .meta { display: flex; flex-direction: column; gap: 4px; color: var(--text-muted); font-size: 0.88rem; margin: 8px 0; }
        .branch .services { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 12px; }
        .branch .btn { width: max-content; }
      `}</style>
    </section>
  );
}
