import { useMeeting } from '../context/MeetingContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { getAudit } from '../api/client'
import { useEffect, useState } from 'react'
import AuditTable from '../components/AuditTable'

export default function AuditPage() {
  const { analysisResult } = useMeeting()
  const { workspace } = useWorkspace()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      // If we have fresh in-memory results (admin just analyzed), use them
      if (analysisResult?.audit_entries?.length > 0) {
        setEntries(analysisResult.audit_entries)
        setLoading(false)
        return
      }
      // Otherwise fetch from DB — works for members and returning admins
      try {
        const workspaceId = workspace?.id || 1
        const r = await getAudit(workspaceId)
        setEntries(r.data)
      } catch {
        setError('Could not load audit trail. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [analysisResult, workspace])

  return (
    <div className="page">
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

      {entries.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Actions', value: entries.length,                                         color: '#38bdf8' },
            { label: 'Successful',    value: entries.filter(e => e.status === 'success').length,     color: '#4ade80' },
            { label: 'Errors',        value: entries.filter(e => e.status === 'error').length,       color: '#f87171' },
            { label: 'Agents Run',    value: new Set(entries.map(e => e.agent_name)).size,           color: '#c084fc' },
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
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171', fontFamily: 'DM Sans' }}>
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No audit entries yet
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              The admin needs to analyze a meeting first to generate the audit log.
            </p>
          </div>
        ) : (
          <AuditTable entries={entries} />
        )}
      </div>
    </div>
  )
}
