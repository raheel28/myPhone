// client/src/components/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="col">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true" />
            <strong>New World Of Mobile</strong>
          </div>
          <p>Premium smartphones, expertly chosen — with AI-powered guidance and exclusive bank offers.</p>
        </div>

        <div className="col">
          <h4>Shop</h4>
          <Link to="/phones?brand=SAMSUNG">Samsung</Link>
          <Link to="/phones?brand=ONEPLUS">OnePlus</Link>
          <Link to="/phones?brand=REALME">Realme</Link>
          <Link to="/phones?brand=OPPO">Oppo</Link>
        </div>

        <div className="col">
          <h4>Company</h4>
          <Link to="/about">About us</Link>
          <Link to="/branches">Branches</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="col">
          <h4>Get in touch</h4>
          <p>aircom.ahmedabad@gmail.com<br/>+91 91739 23453</p>
        </div>
      </div>
      <div className="container fineprint">
        © {new Date().getFullYear()} New World Of Mobile. All product images are illustrative.
      </div>

      <style>{`
        .footer { border-top: 1px solid var(--border); background: var(--bg-alt); margin-top: 64px; padding: 56px 0 18px; }
        .footer-inner { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 32px; }
        .col h4 { font-size: 0.95rem; color: var(--text); margin-bottom: 10px; }
        .col a { display: block; color: var(--text-muted); padding: 4px 0; }
        .col a:hover { color: var(--text); }
        .brand-row { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 1.15rem; margin-bottom: 8px; }
        .brand-mark { width: 22px; height: 22px; border-radius: 6px; background: var(--gradient-1); }
        .fineprint { color: var(--text-faint); font-size: 0.82rem; padding-top: 18px; border-top: 1px solid var(--border); margin-top: 36px; }
        @media (max-width: 800px) { .footer-inner { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 460px) { .footer-inner { grid-template-columns: 1fr; } }
      `}</style>
    </footer>
  );
}
