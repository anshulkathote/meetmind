const AGENT_COLORS = {
  ParserAgent:      { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8' },
  SentimentAgent:   { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc' },
  DependencyAgent:  { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
  SLAMonitor:       { bg: 'rgba(234,179,8,0.15)',   color: '#fbbf24' },
  EscalationAgent:  { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  SummaryAgent:     { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  ROIAgent:         { bg: 'rgba(20,184,166,0.15)',  color: '#2dd4bf' },
  AuditAgent:       { bg: 'rgba(236,72,153,0.15)',  color: '#f472b6' },
}

function formatTime(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return str }
}

export default function AuditTable({ entries }) {
  const sorted = [...entries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Timestamp', 'Agent', 'Action', 'Input', 'Output', 'Status'].map(h => (
              <th key={h} style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontFamily: 'Syne',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => {
            const agentStyle = AGENT_COLORS[entry.agent_name] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
            const isSuccess  = entry.status === 'success'
            return (
              <tr key={entry.id || i} style={{
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
              >
                {/* Timestamp */}
                <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatTime(entry.created_at)}
                  </span>
                </td>

                {/* Agent Name */}
                <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                  <span style={{
                    ...agentStyle,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                  }}>
                    {entry.agent_name}
                  </span>
                </td>

                {/* Action */}
                <td style={{ padding: '0.8rem 1rem' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    background: 'rgba(14,165,233,0.08)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                  }}>
                    {entry.action}
                  </span>
                </td>

                {/* Input Summary */}
                <td style={{ padding: '0.8rem 1rem', maxWidth: '220px' }}>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                    title={entry.input_summary}
                  >
                    {entry.input_summary}
                  </p>
                </td>

                {/* Output Summary */}
                <td style={{ padding: '0.8rem 1rem', maxWidth: '220px' }}>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                    title={entry.output_summary}
                  >
                    {entry.output_summary}
                  </p>
                </td>

                {/* Status */}
                <td style={{ padding: '0.8rem 1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color:      isSuccess ? '#4ade80'              : '#f87171',
                    border:     isSuccess ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                  }}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}