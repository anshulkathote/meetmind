const severityStyle = {
  high:   { background: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.3)',  color: '#f87171', icon: '🔴' },
  medium: { background: 'rgba(234,179,8,0.1)',  border: '1px solid rgba(234,179,8,0.3)',  color: '#fbbf24', icon: '🟡' },
  low:    { background: 'rgba(34,197,94,0.1)',  border: '1px solid rgba(34,197,94,0.3)',  color: '#4ade80', icon: '🟢' },
}

export default function AlertBanner({ alert }) {
  const s = severityStyle[alert.severity] || severityStyle.low
  return (
    <div style={{ ...s, borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <span>{s.icon}</span>
      <div>
        <p style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.85rem', color: s.color, marginBottom: '0.2rem' }}>
          {alert.task_title} · <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>{alert.alert_type}</span>
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>{alert.message}</p>
      </div>
    </div>
  )
}