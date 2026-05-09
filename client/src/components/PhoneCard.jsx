// client/src/components/PhoneCard.jsx
import { Link } from 'react-router-dom';

const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function PhoneCard({ phone, compact = false }) {
  if (!phone) return null;
  const discount = phone.mrp && phone.price ? Math.max(0, Math.round(((phone.mrp - phone.price) / phone.mrp) * 100)) : 0;
  return (
    <Link to={`/phones/${phone.slug}`} className={`pcard ${compact ? 'compact' : ''}`}>
      <div className="pcard-img">
        {phone.image ? (
          <img src={phone.image} alt={phone.name} loading="lazy" />
        ) : (
          <div className="pcard-img-fallback">{(phone.brand || '').slice(0, 1)}</div>
        )}
        {phone.is5G && <span className="badge-5g">5G</span>}
        {discount > 5 && <span className="badge-save">-{discount}%</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-brand">{phone.brand}</div>
        <div className="pcard-name" title={phone.name}>{phone.name}</div>
        {phone.specs && (
          <div className="pcard-specs">
            {phone.ram && <span>{phone.ram}GB</span>}
            {phone.storage && <span>{phone.storage}GB</span>}
            {phone.specs.cameraMP && <span>{phone.specs.cameraMP}MP</span>}
            {phone.specs.batterymAh && <span>{phone.specs.batterymAh}mAh</span>}
          </div>
        )}
        <div className="pcard-price-row">
          <span className="pcard-price">{formatINR(phone.price)}</span>
          {phone.mrp > phone.price && (
            <span className="pcard-mrp">{formatINR(phone.mrp)}</span>
          )}
        </div>
        {phone.offers?.length > 0 && (
          <div className="pcard-offer">⚡ {phone.offers[0].description}</div>
        )}
      </div>

      <style>{`
        .pcard {
          display: flex; flex-direction: column;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius); overflow: hidden;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .pcard:hover {
          transform: translateY(-4px);
          border-color: rgba(124, 92, 255, 0.5);
          box-shadow: 0 18px 40px rgba(0,0,0,.35), 0 0 30px rgba(124,92,255,.18);
        }
        .pcard-img {
          position: relative; aspect-ratio: 4/3;
          background: linear-gradient(135deg, #1a1f2c 0%, #232938 100%);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .pcard-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
        .pcard:hover .pcard-img img { transform: scale(1.06); }
        .pcard-img-fallback {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--gradient-1); color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 1.6rem;
        }
        .badge-5g, .badge-save {
          position: absolute; top: 10px; padding: 4px 9px;
          border-radius: 999px; font-size: 0.7rem; font-weight: 700;
        }
        .badge-5g { left: 10px; background: var(--neon); color: white; }
        .badge-save { right: 10px; background: var(--neon-2); color: #04221a; }

        .pcard-body { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
        .pcard-brand { font-size: 0.72rem; color: var(--text-faint); letter-spacing: .14em; text-transform: uppercase; }
        .pcard-name {
          font-weight: 700; font-size: 0.98rem; color: var(--text);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 2.6em;
        }
        .pcard-specs { display: flex; gap: 6px; flex-wrap: wrap; font-size: 0.74rem; color: var(--text-muted); margin: 4px 0; }
        .pcard-specs span { padding: 3px 8px; background: var(--bg-elevated); border-radius: 6px; }
        .pcard-price-row { display: flex; align-items: baseline; gap: 8px; margin-top: auto; }
        .pcard-price { font-size: 1.15rem; font-weight: 800; color: var(--text); font-family: var(--font-display); }
        .pcard-mrp { font-size: 0.85rem; color: var(--text-faint); text-decoration: line-through; }
        .pcard-offer { font-size: 0.78rem; color: var(--neon-2); margin-top: 6px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
      `}</style>
    </Link>
  );
}
