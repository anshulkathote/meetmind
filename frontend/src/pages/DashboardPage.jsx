import { useEffect, useState } from 'react'
import { useMeeting } from '../context/MeetingContext'
import { getTasks, getAlerts } from '../api/client'
import TaskBoard from '../components/TaskBoard'
import AlertBanner from '../components/AlertBanner'
import SentimentPanel from '../components/SentimentPanel'

export default function DashboardPage() {
  const { analysisResult, setAnalysisResult, refreshTasks } = useMeeting()
  const [alerts,  setAlerts]  = useState(analysisResult?.alerts || [])
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    async function init() {
      if (analysisResult) {
        // Always pull fresh task statuses from DB on every mount
        await refreshTasks()
        setAlerts(analysisResult.alerts || [])
      } else {
        try {
          const [t, a] = await Promise.all([getTasks(), getAlerts()])
          setAlerts(a.data)
          setAnalysisResult({
            tasks           : t.data,
            alerts          : a.data,
            sentiment_flags : [],
            dependencies    : [],
            summary         : null,
            audit_entries   : [],
            roi             : null,
          })
        } catch {
          setOffline(true)
        }
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Always read directly from context — updates automatically when refreshTasks fires
  const tasks        = analysisResult?.tasks           || []
  const sentiment    = analysisResult?.sentiment_flags || []
  const highPriority = tasks.filter(t => t.priority   === 'high').length
  const atRisk       = tasks.filter(t => t.risk_score >= 0.75).length

  const metrics = [
    { label: 'Total Tasks',   value: tasks.length,  color: '#38bdf8' },
    { label: 'High Priority', value: highPriority,  color: '#f87171' },
    { label: 'Alerts',        value: alerts.length, color: '#fbbf24' },
    { label: 'At-Risk Tasks', value: atRisk,        color: '#fb923c' },
  ]

  return (
    <div className="page">
      {offline && (
        <div style={{
          background  : 'rgba(234,179,8,0.1)',
          border      : '1px solid rgba(234,179,8,0.3)',
          color       : '#fbbf24',
          padding     : '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize    : '0.875rem',
          fontFamily  : 'DM Sans',
        }}>
          Backend offline — showing cached data
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily   : 'Syne',
          fontWeight   : 800,
          fontSize     : '1.8rem',
          color        : 'var(--text-primary)',
          letterSpacing: '-0.5px',
        }}>
          Meeting <span style={{ color: 'var(--accent)' }}>Dashboard</span>
        </h1>
        {analysisResult?.summary?.sentiment_overview && (
          <p style={{
            color     : 'var(--text-muted)',
            fontFamily: 'DM Sans',
            marginTop : '0.35rem',
            fontSize  : '0.9rem',
          }}>
            {analysisResult.summary.sentiment_overview}
          </p>
        )}
      </div>

      {/* Metric Cards */}
      <div style={{
        display             : 'grid',
        gridTemplateColumns : 'repeat(4, 1fr)',
        gap                 : '1rem',
        marginBottom        : '2rem',
      }}>
        {metrics.map(m => (
          <div key={m.label} className="glow-card" style={{ padding: '1.25rem' }}>
            <p style={{
              fontFamily   : 'DM Sans',
              fontSize     : '0.78rem',
              color        : 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom : '0.5rem',
            }}>
              {m.label}
            </p>
            <p style={{
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize  : '2rem',
              color     : m.color,
            }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Task Board — key={tasks} forces re-render when task list changes */}
      <div style={{ marginBottom: '2rem' }}>
        <TaskBoard
          key={tasks.map(t => `${t.id}-${t.status}`).join(',')}
          tasks={tasks}
        />
      </div>

      {alerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontFamily  : 'Syne',
            fontWeight  : 700,
            fontSize    : '1.1rem',
            color       : 'var(--text-primary)',
            marginBottom: '1rem',
          }}>
            Escalation Alerts
          </h2>
          {alerts.map((alert, i) => (
            <AlertBanner key={i} alert={alert} />
          ))}
        </div>
      )}

      {sentiment.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontFamily  : 'Syne',
            fontWeight  : 700,
            fontSize    : '1.1rem',
            color       : 'var(--text-primary)',
            marginBottom: '1rem',
          }}>
            Sentiment Flags
          </h2>
          <SentimentPanel flags={sentiment} />
        </div>
      )}
    </div>
  )
}