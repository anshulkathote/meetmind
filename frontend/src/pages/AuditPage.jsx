import { useMeeting } from '../context/MeetingContext'
import { getAudit } from '../api/client'
import { useEffect, useState } from 'react'
import AuditTable from '../components/AuditTable'

export default function AuditPage() {
  const { analysisResult } = useMeeting()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (analysisResult?.audit_entries) {
      setEntries(analysisResult.audit_entries)
      setLoading(false)
    } else {
      getAudit()
        .then(r => { setEntries(r.data); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [analysisResult])

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: '1.8rem',
          color: 'var(--text-primary)', letterSpacing: '-0.5px',
        }}>
          Agent <span style={{ color: 'var(--accent)' }}>Audit Trail</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Full log of every AI agent action — sorted by execution order
        </p>
      </div>

      {/* Stats Row */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Actions', value: entries.length,                                          color: '#38bdf8' },
            { label: 'Successful',    value: entries.filter(e => e.status === 'success').length,      color: '#4ade80' },
            { label: 'Errors',        value: entries.filter(e => e.status === 'error').length,        color: '#f87171' },
            { label: 'Agents Run',    value: new Set(entries.map(e => e.agent_name)).size,            color: '#c084fc' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.85rem 1.25rem',
              minWidth: '130px',
            }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem', fontFamily: 'DM Sans' }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            Loading audit trail...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No audit entries yet
            </p>
            <p style={{ fontSize: '0.875rem' }}>Analyze a meeting to see the full agent pipeline log</p>
          </div>
        ) : (
          <AuditTable entries={entries} />
        )}
      </div>
    </div>
  )
}