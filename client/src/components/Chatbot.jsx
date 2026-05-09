// client/src/components/Chatbot.jsx
// Fixed bottom-right AI shopping assistant. Listens for the global
// 'open-chat' event so any CTA on the site can open the panel.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendChat } from '../services/api.js';

const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN');

const STARTER = {
  role: 'assistant',
  content:
    "Hey, I'm Buzz 🐝. What kind of phone are you in the market for? Tell me what you'll mostly use it for, or roughly how much you're looking to spend.",
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER]);
  const [recs, setRecs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(null); // 'llm' | 'fallback' | null
  const scrollerRef = useRef(null);

  // Allow other components to open the chat via window event.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, recs, busy]);

  const send = async (text) => {
    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];

    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');
    
    try {
      // We only send text-content messages to the API (assistant block-content
      // turns are server-internal and not part of our local history).
      const cleanHistory = next
        .filter((m) => typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChat(cleanHistory);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply || '…' }]);
      if (res.recommendations?.length) setRecs(res.recommendations);
      if (res.mode) setMode(res.mode);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Chat failed');
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    send(text);
  };

  const quickPrompts = [
    'Gaming phone around 25k',
    'Best camera under 35k',
    'Phone for my parents, simple to use',
    'Show me iPhones under 60k',
  ];

  return (
    <>
      <button
        className={`fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '×' : '💬'}
      </button>

      <aside className={`panel ${open ? 'open' : ''}`} role="dialog" aria-label="Phone shopping assistant">
        <header className="ph">
          <div className="ph-mark" /> Buzz · AI shopping assistant
          <span className={`mode-badge ${mode === 'fallback' ? 'fallback' : 'llm'}`} title={mode === 'fallback' ? 'Rule-based fallback (LLM unavailable)' : 'Powered by GPT-4o-mini'}>
            {mode === 'fallback' ? 'offline' : 'AI'}
          </span>
          <button className="ph-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </header>

        <div className="scroller" ref={scrollerRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg msg-${m.role}`}>
              {typeof m.content === 'string' ? m.content : '…'}
            </div>
          ))}

          {recs.length > 0 && (
            <div className="recs">
              <div className="recs-head">Recommended for you</div>
              {recs.slice(0, 5).map((p) => (
                <Link
                  key={p._id || p.slug}
                  to={`/phones/${p.slug}`}
                  className="rec"
                  onClick={() => setOpen(false)}
                >
                  {p.image && <img src={p.image} alt="" />}
                  <div className="rec-body">
                    <div className="rec-name">{p.name}</div>
                    <div className="rec-meta">
                      {p.brand} · {p.ram ? `${p.ram}/${p.storage}GB` : ''}{p.is5G ? ' · 5G' : ''}
                    </div>
                    <div className="rec-price">{formatINR(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {busy && (
            <div className="msg msg-assistant typing">
              <span/><span/><span/>
            </div>
          )}
          {error && <div className="err">{error}</div>}
        </div>

        {messages.length <= 1 && (
          <div className="quicks">
            {quickPrompts.map((q) => (
              <button key={q} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        <form className="composer" onSubmit={onSubmit}>
          <input
            placeholder="Ask Buzz anything about phones…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
            {busy ? '…' : 'Send'}
          </button>
        </form>
      </aside>

      <style>{`
        .fab {
          position: fixed; right: 22px; bottom: 22px; z-index: 60;
          width: 56px; height: 56px; border-radius: 50%; border: 0;
          color: white; font-size: 1.4rem;
          background: var(--gradient-1);
          box-shadow: 0 18px 36px rgba(124,92,255,.45);
          animation: pulseGlow 2.4s ease-in-out infinite;
        }
        .fab.is-open { background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); animation: none; }

        .panel {
          position: fixed; right: 22px; bottom: 92px; z-index: 60;
          width: min(390px, calc(100vw - 32px));
          height: min(620px, calc(100vh - 130px));
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 80px rgba(0,0,0,.5);
          display: flex; flex-direction: column; overflow: hidden;
          transform: translateY(20px) scale(.96); opacity: 0; pointer-events: none;
          transition: transform .25s cubic-bezier(.2,.9,.3,1.2), opacity .2s ease;
        }
        .panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }

        .ph {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-bottom: 1px solid var(--border);
          font-weight: 700;
        }
        .ph-mark { width: 10px; height: 10px; border-radius: 50%; background: var(--neon-2); box-shadow: 0 0 12px var(--neon-2); }
        .ph-close { margin-left: auto; background: transparent; border: 0; color: var(--text-muted); font-size: 1.4rem; }
        .mode-badge {
          display: inline-block; margin-left: 8px;
          padding: 2px 8px; border-radius: 999px;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; cursor: help;
        }
        .mode-badge.llm      { background: rgba(35,211,164,.18); color: var(--neon-2); border: 1px solid rgba(35,211,164,.35); }
        .mode-badge.fallback { background: rgba(255,181,71,.18); color: var(--warn);   border: 1px solid rgba(255,181,71,.35); }

        .scroller { flex: 1 1 auto; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .msg {
          padding: 10px 14px; border-radius: 14px; max-width: 88%;
          font-size: 0.93rem; line-height: 1.45; white-space: pre-wrap;
        }
        .msg-assistant { background: var(--bg-elevated); border: 1px solid var(--border); align-self: flex-start; border-top-left-radius: 4px; }
        .msg-user      { background: var(--gradient-1); color: white; align-self: flex-end; border-top-right-radius: 4px; }
        .typing { display: inline-flex; gap: 4px; align-items: center; }
        .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: blink 1s infinite; }
        .typing span:nth-child(2) { animation-delay: .15s; } .typing span:nth-child(3) { animation-delay: .3s; }
        @keyframes blink { 0%, 60%, 100% { opacity: .3; } 30% { opacity: 1; } }

        .recs { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
        .recs-head { font-size: 0.78rem; color: var(--text-faint); text-transform: uppercase; letter-spacing: .12em; padding: 4px 0; }
        .rec {
          display: flex; gap: 10px; padding: 8px; border-radius: 10px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          transition: border-color .15s ease, transform .15s ease;
        }
        .rec:hover { border-color: var(--neon); transform: translateY(-1px); }
        .rec img { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; }
        .rec-body { flex: 1; min-width: 0; }
        .rec-name { font-weight: 700; font-size: 0.9rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rec-meta { font-size: 0.75rem; color: var(--text-muted); }
        .rec-price { font-size: 0.95rem; font-weight: 700; color: var(--neon-2); margin-top: 2px; }

        .quicks { padding: 0 16px 8px; display: flex; flex-wrap: wrap; gap: 6px; }
        .quicks button {
          background: var(--bg-elevated); border: 1px solid var(--border);
          color: var(--text-muted); padding: 6px 10px; border-radius: 999px;
          font-size: 0.78rem;
        }
        .quicks button:hover { color: var(--text); border-color: var(--neon); }

        .composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border); }
        .composer input { flex: 1; }
        .err { color: var(--danger); font-size: 0.85rem; padding: 6px 10px; }
      `}</style>
    </>
  );
}
