import { useState } from 'react'
import TaskCard from './TaskCard'

const COLUMNS = [
  { key: 'todo',        label: 'To Do',      color: '#94a3b8' },
  { key: 'in_progress', label: 'In Progress', color: '#38bdf8' },
  { key: 'done',        label: 'Done',        color: '#4ade80' },
  { key: 'stalled',     label: 'Stalled',     color: '#f87171' },
]

export default function TaskBoard({ tasks: initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks)

  function handleStatusChange(id, newStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            minHeight: '300px',
          }}>
            {/* Column Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', color: col.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.label}
              </span>
              <span style={{
                background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700,
              }}>
                {colTasks.length}
              </span>
            </div>
            {/* Cards */}
            {colTasks.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: '2rem' }}>No tasks</p>
              : colTasks.map(task => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />)
            }
          </div>
        )
      })}
    </div>
  )
}