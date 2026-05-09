// client/src/pages/Contact.jsx
import { useState } from 'react';
import { submitContact } from '../services/api.js';

const initial = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [err, setErr] = useState('');

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setDone('');
    try {
      const res = await submitContact(form);
      setDone(res.message || 'Thanks!');
      setForm(initial);
    } catch (er) {
      setErr(er?.response?.data?.error || 'Could not send — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="contact section">
      <div className="container c-grid">
        <div>
          <span className="chip">Talk to us</span>
          <h1>We'd love to hear from you.</h1>
          <p>
            Questions about a phone, a bank offer, or your order? Send us a note and a real human
            from our store team will get back within a working day.
          </p>
          <ul className="info">
            <li>📍 Iscon Mega Mall, Satellite, Ahmedabad — 380015</li>
            <li>📞 +91 91739 23453</li>
            <li>✉️ aircom.ahmedabad@gmail.com</li>
            <li>🕒 Mon – Sun · 10:00 AM – 9:30 PM</li>
          </ul>
        </div>

        <form className="card form" onSubmit={submit}>
          {done && <div className="ok">{done}</div>}
          {err && <div className="err">{err}</div>}

          <div className="row">
            <div>
              <label>Name *</label>
              <input required value={form.name} onChange={change('name')} />
            </div>
            <div>
              <label>Email *</label>
              <input required type="email" value={form.email} onChange={change('email')} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Phone</label>
              <input value={form.phone} onChange={change('phone')} />
            </div>
            <div>
              <label>Subject</label>
              <input value={form.subject} onChange={change('subject')} />
            </div>
          </div>
          <div>
            <label>Message *</label>
            <textarea required rows={5} value={form.message} onChange={change('message')} />
          </div>
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>

      <style>{`
        .c-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 32px; }
        .info { list-style: none; padding: 0; color: var(--text-muted); }
        .info li { padding: 6px 0; }
        .form { padding: 26px; display: flex; flex-direction: column; gap: 14px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ok { background: rgba(35,211,164,.12); color: var(--neon-2); padding: 10px 14px; border-radius: var(--radius-sm); }
        .err { background: rgba(255,92,92,.12); color: var(--danger); padding: 10px 14px; border-radius: var(--radius-sm); }
        @media (max-width: 800px) { .c-grid { grid-template-columns: 1fr; } .row { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
