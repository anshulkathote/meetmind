const sentimentStyle = {
  frustrated:   { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  confused:     { bg: 'rgba(234,179,8,0.1)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'   },
  disagreement: { bg: 'rgba(249,115,22,0.1)',  color: '#fb923c', border: 'rgba(249,115,22,0.3)'  },
  concern:      { bg: 'rgba(168,85,247,0.1)',  color: '#c084fc', border: 'rgba(168,85,247,0.3)'  },
  overwhelmed:  { bg: 'rgba(236,72,153,0.1)',  color: '#f472b6', border: 'rgba(236,72,153,0.3)'  },
}

export default function SentimentPanel({ flags }) {
  if (!flags || flags.length === 0) return null
  return (
    <div>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
        🧠 Sentiment Flags
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {flags.map((f, i) => {
          const s = sentimentStyle[f.sentiment] || sentimentStyle.concern
          return (
            <div key={i} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: '8px', padding: '0.75rem 1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.82rem', color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {f.sentiment}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {f.speaker && `${f.speaker} · `}{f.topic}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', fontStyle: 'italic' }}>
                "{f.quote}"
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}