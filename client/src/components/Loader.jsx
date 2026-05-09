// client/src/components/Loader.jsx
export default function Loader({ rows = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="card sk" key={i}>
          <div className="skeleton" style={{ aspectRatio: '4/3' }} />
          <div className="skeleton" style={{ height: 16, margin: '14px 16px 6px' }} />
          <div className="skeleton" style={{ height: 12, margin: '0 16px 16px', width: '60%' }} />
        </div>
      ))}
      <style>{`
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .sk { overflow: hidden; }
      `}</style>
    </div>
  );
}
