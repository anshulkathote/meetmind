import { useState } from 'react'
import TaskCard from './TaskCard'
import { updateTaskStatus } from '../api/client'
import { useMeeting } from '../context/MeetingContext'

const COLUMNS = [
  { key: 'todo',        label: 'To Do',      color: '#94a3b8' },
  { key: 'in_progress', label: 'In Progress', color: '#38bdf8' },
  { key: 'done',        label: 'Done',        color: '#4ade80' },
  { key: 'stalled',     label: 'Stalled',     color: '#f87171' },
]

export default function TaskBoard({ tasks }) {
  const { refreshTasks } = useMeeting()
  const [updating, setUpdating] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleStatusChange(id, newStatus) {
    setUpdating(id)
    setErrorMsg(null)
    try {
      await updateTaskStatus(id, newStatus)
      await refreshTasks()
    } catch (e) {
      const detail = e?.response?.data?.detail || 'Could not update task status.'
      setErrorMsg(detail)
      setTimeout(() => setErrorMsg(null), 5000)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>

      {/* ── Error banner — shows when a dependency blocks the status change ── */}
      {errorMsg && (
        <div style={{
          background  : 'rgba(239,68,68,0.1)',
          border      : '1px solid rgba(239,68,68,0.4)',
          color       : '#f87171',
          padding     : '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize    : '0.875rem',
          fontFamily  : 'DM Sans, sans-serif',
          lineHeight  : '1.5',
        }}>
          {errorMsg}
        </div>
      )}

      {/* ── Kanban columns ── */}
      <div style={{
        display            : 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap                : '1rem',
      }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          return (
            <div key={col.key} style={{
              background  : 'var(--bg-card)',
              border      : '1px solid var(--border)',
              borderRadius: '12px',
              padding     : '1rem',
              minHeight   : '300px',
            }}>
              <div style={{
                display       : 'flex',
                justifyContent: 'space-between',
                alignItems    : 'center',
                marginBottom  : '0.85rem',
              }}>
                <span style={{
                  fontFamily   : 'Syne',
                  fontWeight   : 700,
                  fontSize     : '0.85rem',
                  color        : col.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {col.label}
                </span>
                <span style={{
                  background  : 'var(--bg-secondary)',
                  color       : 'var(--text-muted)',
                  borderRadius: '999px',
                  padding     : '0.1rem 0.5rem',
                  fontSize    : '0.75rem',
                  fontWeight  : 700,
                }}>
                  {colTasks.length}
                </span>
              </div>

              {colTasks.length === 0
                ? (
                  <p style={{
                    color    : 'var(--text-muted)',
                    fontSize : '0.78rem',
                    textAlign: 'center',
                    marginTop: '2rem',
                  }}>
                    No tasks
                  </p>
                )
                : colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    updating={updating === task.id}
                    onStatusChange={handleStatusChange}
                  />
                ))
              }
            </div>
          )
        })}
      </div>

    </div>
  )
}