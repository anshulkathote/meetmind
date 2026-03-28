import { useEffect, useState } from 'react'
import { useMeeting } from '../context/MeetingContext'
import { getTasks, getAlerts } from '../api/client'
import TaskBoard from '../components/TaskBoard'
import AlertBanner from '../components/AlertBanner'
import SentimentPanel from '../components/SentimentPanel'

export default function DashboardPage() {
  const { analysisResult } = useMeeting()
  const [tasks, setTasks]   = useState([])
  const [alerts, setAlerts] = useState([])
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (analysisResult) {
      setTasks(analysisResult.tasks || [])
      setAlerts(analysisResult.alerts || [])
    } else {
      // Try fetching fresh from API
      Promise.all([getTasks(), getAlerts()])
        .then(([t, a]) => { setTasks(t.data); setAlerts(a.data) })
        .catch(() => setOffline(true))
    }
  }, [analysisResult])

  const highPriority = tasks.filter(t => t.priority === 'high').length
  const atRisk       = tasks.filter(t => t.risk_score >= 0.75).length
  const sentiment    = analysisResult?.sentiment_flags || []

  const metrics = [
    { label: 'Total Tasks',    value: tasks.length,  color: '#38bdf8' },
    { label: 'High Priority',  value: highPriority,  color: '#f87171' },
    { label: 'Alerts',         value: alerts.length, color: '#fbbf24' },
    { label: 'At-Risk Tasks',  value: atRisk,        color: '#fb923c' },
  ]

  return (
    <div className="page">
      {/* Offline Banner */}
      {offline && (
        <div style={{
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
          color: '#fbbf24', padding: '0.75rem 1rem', borderRadius: '8px',
          marginBottom: '1.5rem', fontSize: '0.875rem', fontFamily: 'DM Sans',
        }}>
          ⚠️ Backend offline — showing demo data
        </div>
      )}

      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Meeting <span style={{ color: 'var(--accent)' }}>Dashboard</span>
        </h1>
        {analysisResult?.summary?.sentiment_overview && (
          <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', marginTop: '0.35rem', fontSize: '0.9rem' }}>
            {analysisResult.summary.sentiment_overview}
          </p>
        )}
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {metrics.map(m => (
          <div key={m.label} className="glow-card" style={{ padding: '1.25rem' }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
              {m.label}
            </p>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Task Board */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          📋 Task Board
        </h2>
        {tasks.length > 0
          ? <TaskBoard tasks={tasks} />
          : <div className="glow-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tasks yet. Analyze a meeting first.
            </div>
        }
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🚨 Alerts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {alerts.map(a => <AlertBanner key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Sentiment Panel */}
      {sentiment.length > 0 && (
        <div className="glow-card" style={{ padding: '1.5rem' }}>
          <SentimentPanel flags={sentiment} />
        </div>
      )}
    </div>
  )
}