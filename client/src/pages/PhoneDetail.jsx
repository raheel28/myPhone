// client/src/pages/PhoneDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPhone } from '../services/api.js';

const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function PhoneDetail() {
  const { slug } = useParams();
  const [phone, setPhone] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPhone(null); setError('');
    fetchPhone(slug).then(setPhone).catch((e) => setError(e?.response?.data?.error || 'Phone not found'));
  }, [slug]);

  if (error) {
    return (
      <section className="section container">
        <h2>Hmm, that phone isn't here.</h2>
        <p>{error}</p>
        <Link to="/phones" className="btn">Back to catalog</Link>
      </section>
    );
  }
  if (!phone) {
    return <section className="section container"><div className="skeleton" style={{ height: 480, borderRadius: 16 }}/></section>;
  }

  const discount = phone.mrp > phone.price ? Math.round(((phone.mrp - phone.price) / phone.mrp) * 100) : 0;

  return (
    <section className="pd section">
      <div className="container pd-grid">
        <div className="pd-img-wrap">
          {phone.image && <img src={phone.image} alt={phone.name} />}
          {phone.is5G && <span className="b5g">5G</span>}
        </div>
        <div className="pd-body">
          <div className="brand">{phone.brand}</div>
          <h1>{phone.name}</h1>
          <div className="rating">★ {phone.rating?.toFixed(1)} <span>· {phone.inStock ? 'In stock' : 'Out of stock'}</span></div>

          <div className="price-row">
            <span className="price">{formatINR(phone.price)}</span>
            {phone.mrp > phone.price && <>
              <span className="mrp">{formatINR(phone.mrp)}</span>
              <span className="save">SAVE {discount}%</span>
            </>}
          </div>

          {phone.offers?.length > 0 && (
            <div className="offers">
              <h4>Available offers</h4>
              <ul>
                {phone.offers.map((o, i) => (
                  <li key={i}><strong>{o.bank || o.type}:</strong> {o.description}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="actions">
            <button className="btn btn-primary">Buy now</button>
            <button
              className="btn"
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
            >
              💬 Ask Buzz about this phone
            </button>
          </div>
        </div>

        <div className="pd-specs">
          <h3>Specifications</h3>
          <table>
            <tbody>
              <tr><th>Brand</th><td>{phone.brand}</td></tr>
              <tr><th>RAM / Storage</th><td>{phone.ram ?? '—'} GB / {phone.storage ?? '—'} GB</td></tr>
              <tr><th>Display</th><td>{phone.specs?.display} · {phone.specs?.refreshRateHz}Hz</td></tr>
              <tr><th>Rear camera</th><td>{phone.specs?.cameraMP} MP</td></tr>
              <tr><th>Front camera</th><td>{phone.specs?.frontCameraMP} MP</td></tr>
              <tr><th>Battery</th><td>{phone.specs?.batterymAh} mAh · {phone.specs?.fastChargingW}W charging</td></tr>
              <tr><th>Processor</th><td>{phone.specs?.processor}</td></tr>
              <tr><th>OS</th><td>{phone.specs?.os}</td></tr>
              <tr><th>Network</th><td>{phone.is5G ? '5G ready' : '4G LTE'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .pd-img-wrap {
          position: relative; aspect-ratio: 1; border-radius: var(--radius-lg); overflow: hidden;
          background: linear-gradient(135deg, #1a1f2c, #232938);
        }
        .pd-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .b5g { position: absolute; top: 16px; left: 16px; padding: 6px 12px; border-radius: 999px; background: var(--neon); color: white; font-weight: 700; font-size: 0.8rem; }
        .pd-body .brand { font-size: 0.78rem; color: var(--text-faint); letter-spacing: .14em; text-transform: uppercase; }
        .rating { color: var(--neon-2); font-weight: 600; margin-bottom: 18px; }
        .rating span { color: var(--text-muted); font-weight: 400; margin-left: 6px; }
        .price-row { display: flex; align-items: baseline; gap: 14px; padding: 18px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .price { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; }
        .mrp { color: var(--text-faint); text-decoration: line-through; }
        .save { background: var(--neon-2); color: #04221a; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 0.78rem; }
        .offers { margin: 22px 0; }
        .offers h4 { margin-bottom: 8px; }
        .offers ul { padding: 0 0 0 18px; color: var(--text-muted); }
        .offers li { margin: 6px 0; }
        .offers strong { color: var(--text); }
        .actions { display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
        .pd-specs { grid-column: 1 / -1; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); }
        .pd-specs table { width: 100%; border-collapse: collapse; }
        .pd-specs th, .pd-specs td { padding: 10px 0; text-align: left; border-bottom: 1px solid var(--border); }
        .pd-specs th { color: var(--text-muted); font-weight: 500; width: 220px; }
        @media (max-width: 800px) { .pd-grid { grid-template-columns: 1fr; } .pd-specs th { width: 140px; } }
      `}</style>
    </section>
  );
}
