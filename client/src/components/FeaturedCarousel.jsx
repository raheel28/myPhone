// client/src/components/FeaturedCarousel.jsx
import { useEffect, useRef, useState } from 'react';
import PhoneCard from './PhoneCard.jsx';
import { fetchFeatured } from '../services/api.js';

export default function FeaturedCarousel() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetchFeatured()
      .then((data) => alive && setPhones(data || []))
      .catch(() => alive && setPhones([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <section className="featured section">
      <div className="container">
        <div className="head">
          <div>
            <span className="chip">Hot picks</span>
            <h2>Featured this week</h2>
            <p>Hand-picked flagships and bestsellers, all with active bank offers.</p>
          </div>
          <div className="scroll-btns">
            <button onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
            <button onClick={() => scroll(1)} aria-label="Scroll right">›</button>
          </div>
        </div>

        <div className="track" ref={trackRef}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton" style={{ aspectRatio: '4/3' }} />
                  <div className="skeleton" style={{ height: 16, margin: '14px 16px 6px' }} />
                  <div className="skeleton" style={{ height: 12, margin: '0 16px 16px', width: '60%' }} />
                </div>
              ))
            : phones.map((p) => (
                <div key={p._id} className="track-item fade-up">
                  <PhoneCard phone={p} />
                </div>
              ))}
        </div>
      </div>

      <style>{`
        .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 24px; }
        .head h2 { margin: 8px 0 6px; }
        .head p  { margin: 0; }
        .scroll-btns { display: flex; gap: 8px; }
        .scroll-btns button {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text); font-size: 1.4rem; line-height: 1;
        }
        .track {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(240px, 1fr);
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 12px;
        }
        .track-item { scroll-snap-align: start; }
        .skeleton-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        @media (min-width: 1100px) { .track { grid-auto-columns: minmax(260px, 1fr); } }
      `}</style>
    </section>
  );
}
