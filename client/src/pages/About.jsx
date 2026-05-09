// client/src/pages/About.jsx
export default function About() {
  return (
    <section className="about section">
      <div className="container">
        <span className="chip">About New World Of Mobile</span>
        <h1>We make buying a phone <span className="grad">refreshingly simple.</span></h1>
        <p style={{ maxWidth: 720, fontSize: '1.1rem' }}>
          New World Of Mobile is an Ahmedabad-based mobile phone marketplace serving customers across India. We carry
          500+ models from every major brand — Samsung, OnePlus, Realme, Redmi, Oppo, Motorola, Tecno,
          Poco and Nothing — and we partner with leading banks (HDFC, ICICI, Axis, SBI) to surface the
          right offer for each customer.
        </p>

        <div className="grid">
          <div className="card panel">
            <h3>Honest pricing</h3>
            <p>Every price page shows the MRP, our offer price and the live bank discount — no surprises at checkout.</p>
          </div>
          <div className="card panel">
            <h3>AI-assisted shopping</h3>
            <p>Our in-house assistant Buzz asks what you actually need — gaming, camera, battery — and recommends 3 to 5 great matches.</p>
          </div>
          <div className="card panel">
            <h3>Pan-India service</h3>
            <p>Stores in Ahmedabad, Mumbai, Bengaluru, Delhi and Pune. On-spot service, EMI counters, and trade-in.</p>
          </div>
          <div className="card panel">
            <h3>Trust & guarantees</h3>
            <p>100% authentic stock, 7-day no-questions return, and brand-authorised after-sales service.</p>
          </div>
        </div>
      </div>

      <style>{`
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 32px; }
        .panel { padding: 28px; }
        .grad { background: var(--gradient-1); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
