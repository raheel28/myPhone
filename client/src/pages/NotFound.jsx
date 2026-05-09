// client/src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section container" style={{ textAlign: 'center', padding: '120px 0' }}>
      <h1 style={{ fontSize: '5rem', margin: 0 }}>404</h1>
      <p>That page wandered off. Try going back to the homepage.</p>
      <Link to="/" className="btn btn-primary">← Home</Link>
    </section>
  );
}
