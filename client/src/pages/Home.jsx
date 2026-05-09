// client/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import FeaturedCarousel from '../components/FeaturedCarousel.jsx';
import PromoBanner from '../components/PromoBanner.jsx';
import { fetchBrands } from '../services/api.js';

const BRAND_LOGOS = {
  SAMSUNG: 'Samsung', ONEPLUS: 'OnePlus', REALME: 'realme',
  REDMI: 'Redmi', OPPO: 'OPPO', MOTOROLA: 'moto',
  TECNO: 'TECNO', POCO: 'POCO', NOTHING: 'Nothing',
};

export default function Home() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetchBrands().then(setBrands).catch(() => {});
  }, []);

  return (
    <>
      <Hero />

      <section className="brands section">
        <div className="container">
          <span className="chip">Top brands</span>
          <h2>Shop the brands you love</h2>
          <p style={{ maxWidth: 560 }}>
            From flagship Samsung Galaxies to OnePlus speed demons — we stock
            every name worth owning.
          </p>
          <div className="brand-grid">
            {brands.map((b) => (
              <Link key={b.brand} to={`/phones?brand=${b.brand}`} className="brand-tile">
                <div className="brand-name">{BRAND_LOGOS[b.brand] || b.brand}</div>
                <div className="brand-meta">{b.count} models · from ₹{Number(b.minPrice).toLocaleString('en-IN')}</div>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          .brand-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; margin-top: 22px; }
          .brand-tile {
            padding: 22px 18px; background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); text-align: center;
            transition: border-color .15s ease, transform .15s ease;
          }
          .brand-tile:hover { border-color: var(--neon); transform: translateY(-2px); }
          .brand-name { font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; }
          .brand-meta { font-size: 0.78rem; color: var(--text-faint); margin-top: 4px; }
        `}</style>
      </section>

      <FeaturedCarousel />
      <PromoBanner />

      <section className="cta section">
        <div className="container">
          <div className="cta-card">
            <div>
              <span className="chip">Need help choosing?</span>
              <h2 style={{ marginTop: 10 }}>Let Buzz pick for you</h2>
              <p style={{ maxWidth: 460 }}>
                Answer 4 quick questions in chat, and our AI advisor will recommend the
                top 3–5 phones that match your budget, use case and bank offers.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
              >
                Start chatting →
              </button>
            </div>
            <div className="cta-art" aria-hidden="true">💬</div>
          </div>
        </div>

        <style>{`
          .cta-card {
            display: grid; grid-template-columns: 2fr 1fr; align-items: center; gap: 24px;
            padding: 44px; border-radius: var(--radius-lg);
            background: var(--gradient-2); color: white;
            box-shadow: 0 24px 60px rgba(124,92,255,.35);
          }
          .cta-card .chip { background: rgba(255,255,255,.2); color: white; border-color: rgba(255,255,255,.4); }
          .cta-card p { color: rgba(255,255,255,.85); }
          .cta-card .btn-primary { background: white; color: #2a1f6b; box-shadow: none; }
          .cta-art { font-size: 8rem; text-align: center; opacity: .9; }
          @media (max-width: 720px) { .cta-card { grid-template-columns: 1fr; padding: 28px; } .cta-art { display: none; } }
        `}</style>
      </section>
    </>
  );
}
