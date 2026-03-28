export default function SummaryCard({ title, icon, items, color = 'var(--accent)' }) {
  return (
    <div className="glow-card" style={{ padding: '1.5rem' }}>
      <h3 style={{
        fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem',
        color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        <span>{icon}</span> {title}
      </h3>
      {items && items.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: color, flexShrink: 0, marginTop: '6px',
              }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'DM Sans', lineHeight: 1.5 }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>None recorded</p>
      )}
    </div>
  )
}