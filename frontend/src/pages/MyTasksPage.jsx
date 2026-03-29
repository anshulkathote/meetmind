import { useEffect, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { getMyTasks, updateTaskStatus } from '../api/client'

const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' }
const STATUS_COLOR   = { todo: '#94a3b8', in_progress: '#38bdf8', done: '#4ade80', stalled: '#f87171' }
const STATUS_LABELS  = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', stalled: 'Stalled' }

function daysUntil(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function MyTasksPage() {
  const { workspace } = useWorkspace()
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [updating, setUpdating] = useState(null)
  const [statusError, setStatusError] = useState(null)

  async function fetchMyTasks() {
    try {
      const res = await getMyTasks(workspace.code, workspace.memberName)
      setTasks(res.data)
    } catch {
      setError('Could not load your tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyTasks()
    // Poll every 15 seconds for real-time updates from teammates
    const interval = setInterval(fetchMyTasks, 15000)
    return () => clearInterval(interval)
  }, [])

  async function handleMarkComplete(task) {
    setUpdating(task.id)
    setStatusError(null)
    try {
      await updateTaskStatus(task.id, 'done')
      await fetchMyTasks()
    } catch (e) {
      const detail = e?.response?.data?.detail || 'Could not update task.'
      setStatusError(detail)
      setTimeout(() => setStatusError(null), 6000)
    } finally {
      setUpdating(null)
    }
  }

  async function handleMarkInProgress(task) {
    setUpdating(task.id)
    setStatusError(null)
    try {
      await updateTaskStatus(task.id, 'in_progress')
      await fetchMyTasks()
    } catch (e) {
      const detail = e?.response?.data?.detail || 'Could not update task.'
      setStatusError(detail)
      setTimeout(() => setStatusError(null), 6000)
    } finally {
      setUpdating(null)
    }
  }

  // Deadline warning — tasks due within 24 hours that aren't done
  const urgentTasks = tasks.filter(t => {
    const d = daysUntil(t.deadline)
    return d !== null && d <= 1 && t.status !== 'done'
  })

  if (loading) return (
    <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>Loading your tasks...</p>
    </div>
  )

  if (error) return (
    <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: '#f87171', fontFamily: 'DM Sans' }}>{error}</p>
    </div>
  )

  return (
    <div style={pageStyle}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '-0.5px',
        }}>
          My <span style={{ color: 'var(--accent)' }}>Tasks</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          {workspace.memberName} · {workspace.name} · {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {/* Urgent deadline warning */}
      {urgentTasks.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
          fontFamily: 'DM Sans',
        }}>
          <p style={{ color: '#f87171', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
            Deadline Alert
          </p>
          {urgentTasks.map(t => (
            <p key={t.id} style={{ color: '#fca5a5', fontSize: '0.82rem' }}>
              "{t.title}" is due {daysUntil(t.deadline) <= 0 ? 'today or overdue' : 'tomorrow'} — {t.deadline}
            </p>
          ))}
        </div>
      )}

      {/* Dependency error */}
      {statusError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem',
          color: '#f87171', fontFamily: 'DM Sans', fontSize: '0.875rem',
        }}>
          {statusError}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: 'var(--text-muted)', fontFamily: 'DM Sans',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No tasks assigned to you
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Tasks will appear here after admin analyzes a meeting with your name as an attendee.
          </p>
        </div>
      )}

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.map(task => {
          const days   = daysUntil(task.deadline)
          const isUrgent  = days !== null && days <= 1 && task.status !== 'done'
          const isOverdue = days !== null && days < 0  && task.status !== 'done'
          const isDone    = task.status === 'done'
          const isUpdating = updating === task.id

          return (
            <div key={task.id} style={{
              background  : 'var(--bg-card)',
              border      : `1px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding     : '1.25rem 1.5rem',
              opacity     : isDone ? 0.65 : 1,
              transition  : 'opacity 0.2s',
            }}>

              {/* Top row — title + status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                <h3 style={{
                  fontFamily  : 'Syne, sans-serif', fontWeight: 700,
                  fontSize    : '1rem', color: 'var(--text-primary)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  margin: 0,
                }}>
                  {task.title}
                </h3>
                <span style={{
                  fontSize    : '0.72rem', fontWeight: 600, padding: '3px 10px',
                  borderRadius: '999px', whiteSpace: 'nowrap',
                  background  : `${STATUS_COLOR[task.status]}22`,
                  color       : STATUS_COLOR[task.status],
                  border      : `1px solid ${STATUS_COLOR[task.status]}55`,
                  fontFamily  : 'DM Sans',
                }}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>

              {/* Description */}
              <p style={{
                color: 'var(--text-muted)', fontFamily: 'DM Sans',
                fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem',
              }}>
                {task.description}
              </p>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>

                {/* Priority */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</span>
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans',
                    color: PRIORITY_COLOR[task.priority],
                  }}>
                    {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                  </span>
                </div>

                {/* Deadline */}
                {task.deadline && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deadline</span>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans',
                      color: isOverdue ? '#f87171' : isUrgent ? '#fbbf24' : 'var(--text-primary)',
                    }}>
                      {task.deadline}
                      {isOverdue  && ' — Overdue'}
                      {!isOverdue && isUrgent && days === 0 && ' — Due today'}
                      {!isOverdue && isUrgent && days === 1 && ' — Due tomorrow'}
                    </span>
                  </div>
                )}

                {/* Risk score */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '60px', height: '5px', borderRadius: '3px',
                      background: 'var(--bg-secondary)', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${task.risk_score * 100}%`,
                        background: task.risk_score >= 0.75 ? '#f87171' : task.risk_score >= 0.5 ? '#fbbf24' : '#4ade80',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                      {Math.round(task.risk_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Dependencies warning */}
              {task.dependencies?.length > 0 && task.status === 'todo' && (
                <div style={{
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: '8px', padding: '0.6rem 0.9rem',
                  marginBottom: '1rem', fontFamily: 'DM Sans', fontSize: '0.8rem',
                  color: '#fbbf24',
                }}>
                  This task has {task.dependencies.length} dependency{task.dependencies.length > 1 ? 'ies' : 'y'} — other tasks must be completed first.
                </div>
              )}

              {/* Action buttons */}
              {!isDone && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {task.status === 'todo' && (
                    <button
                      onClick={() => handleMarkInProgress(task)}
                      disabled={isUpdating}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: 'transparent', color: '#38bdf8',
                        border: '1px solid #38bdf8', borderRadius: '8px',
                        fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.85rem',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.5 : 1,
                      }}
                    >
                      {isUpdating ? 'Updating...' : 'Start Task'}
                    </button>
                  )}
                  <button
                    onClick={() => handleMarkComplete(task)}
                    disabled={isUpdating}
                    style={{
                      padding: '0.6rem 1.25rem',
                      background: isDone ? 'transparent' : '#4ade8022',
                      color: '#4ade80',
                      border: '1px solid #4ade80', borderRadius: '8px',
                      fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.85rem',
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      opacity: isUpdating ? 0.5 : 1,
                    }}
                  >
                    {isUpdating ? 'Updating...' : 'Mark Complete ✓'}
                  </button>
                </div>
              )}

              {isDone && (
                <p style={{ color: '#4ade80', fontFamily: 'DM Sans', fontSize: '0.85rem', fontWeight: 600 }}>
                  ✓ Completed
                </p>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh', background: 'var(--bg-primary)',
  padding: '2rem', maxWidth: '800px', margin: '0 auto',
}