// client/src/components/Hero.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="container hero-inner">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-copy"
        >
          <span className="chip">✨ AI-assisted shopping</span>
          <h1>
            Find the <span className="grad">perfect smartphone</span><br/>
            for the way <em>you</em> live.
          </h1>
          <p>
            500+ phones, real-time bank offers, and an in-house AI advisor that asks
            the right questions — so you don't have to scroll endlessly.
          </p>
          <div className="hero-cta">
            <Link to="/phones" className="btn btn-primary">Browse phones →</Link>
            <button
              className="btn btn-ghost"
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
            >
              💬 Talk to Buzz
            </button>
          </div>
          <div className="hero-stats">
            <div><strong>500+</strong><span>Models</span></div>
            <div><strong>9</strong><span>Brands</span></div>
            <div><strong>6</strong><span>Cities</span></div>
            <div><strong>4.7★</strong><span>Avg rating</span></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="hero-art"
        >
          <div className="phone-mock phone-1">
            <div className="screen" />
            <div className="notch" />
          </div>
          <div className="phone-mock phone-2">
            <div className="screen alt" />
            <div className="notch" />
          </div>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </motion.div>
      </div>

      <style>{`
        .hero { position: relative; overflow: hidden; padding: 64px 0 100px; }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: var(--gradient-glow);
        }
        .hero-inner { position: relative; display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: center; }
        .hero-copy h1 .grad {
          background: var(--gradient-1);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-copy p { font-size: 1.1rem; max-width: 540px; }
        .hero-cta { display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
        .hero-stats {
          display: flex; gap: 26px; margin-top: 38px; padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .hero-stats > div { display: flex; flex-direction: column; }
        .hero-stats strong { font-family: var(--font-display); font-size: 1.45rem; color: var(--text); }
        .hero-stats span   { font-size: 0.78rem; color: var(--text-faint); text-transform: uppercase; letter-spacing: .12em; }

        .hero-art { position: relative; height: 480px; }
        .phone-mock {
          position: absolute;
          width: 200px; height: 410px; border-radius: 38px;
          background: linear-gradient(180deg, #2a3148, #1a1f2c);
          border: 1px solid #2c3447;
          box-shadow: 0 30px 60px rgba(0,0,0,.5), 0 0 60px rgba(124,92,255,.2);
          padding: 10px;
        }
        .phone-1 { top: 20px; left: 30%; transform: rotate(-8deg); animation: float 6s ease-in-out infinite; }
        .phone-2 { top: 70px; left: 56%; transform: rotate(7deg); animation: float 7s ease-in-out infinite reverse; z-index: 2; }
        .phone-mock .screen {
          width: 100%; height: 100%; border-radius: 30px;
          background: linear-gradient(135deg, #7c5cff 0%, #23d3a4 100%);
          position: relative; overflow: hidden;
        }
        .phone-mock .screen.alt { background: linear-gradient(135deg, #ff5cab 0%, #7c5cff 100%); }
        .phone-mock .screen::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.35), transparent 55%);
        }
        .phone-mock .notch {
          position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
          width: 60px; height: 18px; background: #0b0d12; border-radius: 12px;
        }
        .orb {
          position: absolute; border-radius: 50%; filter: blur(40px); opacity: .55;
          pointer-events: none;
        }
        .orb-1 { width: 220px; height: 220px; background: var(--neon); top: -20px; left: -20px; }
        .orb-2 { width: 260px; height: 260px; background: var(--neon-2); bottom: -40px; right: -20px; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50%      { transform: translateY(-14px) rotate(-6deg); }
        }

        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; }
          .hero-art { height: 380px; margin-top: 12px; }
          .phone-1 { left: 22%; } .phone-2 { left: 48%; }
        }
        @media (max-width: 520px) {
          .hero-stats { gap: 18px; flex-wrap: wrap; }
        }
      `}</style>
    </section>
  );
}
