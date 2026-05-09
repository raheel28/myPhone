// client/src/components/PromoBanner.jsx
import { Link } from 'react-router-dom';

export default function PromoBanner() {
  return (
    <section className="promo">
      <div className="container promos">
        <div className="promo-card promo-1">
          <span className="chip green">HDFC offer</span>
          <h3>Up to ₹3,000 instant discount</h3>
          <p>On HDFC Bank Credit Cards & EMI for select premium phones.</p>
          <Link to="/phones?minPrice=25000" className="btn btn-sm">Explore eligible →</Link>
        </div>

        <div className="promo-card promo-2">
          <span className="chip pink">Trade-in</span>
          <h3>Save up to ₹4,000 on exchange</h3>
          <p>Trade in your old phone — instant on-spot quote at any New World Of Mobile store.</p>
          <Link to="/branches" className="btn btn-sm">Find a store →</Link>
        </div>

        <div className="promo-card promo-3">
          <span className="chip">No-cost EMI</span>
          <h3>6 / 9 / 12 month plans</h3>
          <p>Pay over time on flagships at zero extra cost. Subject to bank approval.</p>
          <Link to="/phones?minPrice=30000" className="btn btn-sm">View flagships →</Link>
        </div>
      </div>

      <style>{`
        .promo { padding: 56px 0; }
        .promos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .promo-card {
          padding: 28px; border-radius: var(--radius-lg);
          background: var(--bg-card); border: 1px solid var(--border);
          position: relative; overflow: hidden;
        }
        .promo-card::after {
          content: ''; position: absolute; right: -60px; top: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          opacity: .35; filter: blur(50px); pointer-events: none;
        }
        .promo-1::after { background: var(--neon-2); }
        .promo-2::after { background: var(--neon-3); }
        .promo-3::after { background: var(--neon); }
        .promo-card h3 { margin-top: 14px; font-size: 1.3rem; }
        .promo-card .btn { background: var(--bg-elevated); }
        @media (max-width: 900px) { .promos { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
