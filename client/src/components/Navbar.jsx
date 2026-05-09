// client/src/components/Navbar.jsx
import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/phones', label: 'Phones' },
    { to: '/branches', label: 'Branches' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">New World Of Mobile</span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label="Toggle dark / light mode"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link to="/phones" className="btn btn-primary btn-sm">Shop</Link>
          <button
            className="hamburger"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span/><span/><span/>
          </button>
        </div>
      </div>

      <style>{`
        .nav {
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: blur(14px);
          background: color-mix(in oklab, var(--bg) 75%, transparent);
          border-bottom: 1px solid transparent;
          transition: border-color .2s ease, background .2s ease;
        }
        .nav.scrolled { border-bottom-color: var(--border); }
        .nav-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: 68px;
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-family: var(--font-display); font-size: 1rem; letter-spacing: -0.01em; }
        .brand-text { white-space: nowrap; }
        @media (max-width: 480px) { .brand-text { font-size: 0.85rem; } }
        .brand-mark {
          width: 26px; height: 26px; border-radius: 8px;
          background: var(--gradient-1);
          box-shadow: var(--shadow-glow);
        }
        .nav-links { display: flex; gap: 6px; }
        .nav-link {
          padding: 8px 14px; border-radius: 10px;
          color: var(--text-muted); font-weight: 500; font-size: 0.95rem;
          transition: color .15s ease, background .15s ease;
        }
        .nav-link:hover { color: var(--text); background: var(--bg-elevated); }
        .nav-link.active {
          color: var(--text);
          background: linear-gradient(180deg, rgba(124,92,255,.15), rgba(124,92,255,0));
          box-shadow: inset 0 -2px 0 var(--neon);
        }
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        .theme-toggle {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text); font-size: 1.1rem;
        }
        .hamburger { display: none; flex-direction: column; gap: 4px; background: transparent; border: 0; padding: 8px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; }

        @media (max-width: 820px) {
          .nav-links {
            position: absolute; top: 68px; left: 0; right: 0;
            flex-direction: column; gap: 0;
            background: var(--bg-alt); border-bottom: 1px solid var(--border);
            padding: 8px;
            transform: translateY(-12px); opacity: 0; pointer-events: none;
            transition: all .2s ease;
          }
          .nav-links.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
          .nav-link { padding: 12px 16px; border-radius: 0; }
          .hamburger { display: flex; }
        }
      `}</style>
    </header>
  );
}
