import { useState } from 'react'
import { updateTaskStatus } from '../api/client'

const STATUSES = ['todo', 'in_progress', 'done', 'stalled']

const priorityStyle = {
  high:   { background: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'  },
  medium: { background: 'rgba(234,179,8,0.15)',  color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)'  },
  low:    { background: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'  },
}

export default function TaskCard({ task, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const isOverdue = task.deadline && new Date(task.deadline) < new Date()
  const riskColor = task.risk_score >= 0.75 ? '#f87171' : task.risk_score >= 0.5 ? '#fbbf24' : '#4ade80'

  async function handleStatus(newStatus) {
    setUpdating(true)
    try { await updateTaskStatus(task.id, newStatus) } catch {}
    onStatusChange(task.id, newStatus)
    setUpdating(false)
    setOpen(false)
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '0.9rem',
      marginBottom: '0.6rem',
      transition: 'border-color 0.2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Title + Priority */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <p style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1, marginRight: '0.5rem' }}>
          {task.title}
        </p>
        <span style={{ ...priorityStyle[task.priority], padding: '0.15rem 0.5rem', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          {task.priority}
        </span>
      </div>

      {/* Owner */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        👤 {task.owner}
      </p>

      {/* Deadline */}
      {task.deadline && (
        <p style={{ fontSize: '0.75rem', color: isOverdue ? '#f87171' : 'var(--text-muted)', marginBottom: '0.5rem' }}>
          📅 {task.deadline} {isOverdue && '· Overdue'}
        </p>
      )}

      {/* Risk Score Bar */}
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Risk</span>
          <span style={{ fontSize: '0.7rem', color: riskColor, fontWeight: 600 }}>{Math.round(task.risk_score * 100)}%</span>
        </div>
        <div style={{ height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${task.risk_score * 100}%`, background: riskColor, borderRadius: '2px', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Status Changer */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          disabled={updating}
          style={{
            width: '100%', padding: '0.35rem', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: '6px',
            color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: 'DM Sans', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>Status: <strong style={{ color: 'var(--text-primary)' }}>{task.status}</strong></span>
          <span>▾</span>
        </button>
        {open && (
          <div style={{
            position: 'absolute', bottom: '110%', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', zIndex: 10, overflow: 'hidden',
          }}>
            {STATUSES.map(s => (
              <div key={s} onClick={() => handleStatus(s)} style={{
                padding: '0.5rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
                color: s === task.status ? 'var(--accent)' : 'var(--text-primary)',
                background: s === task.status ? 'var(--accent-glow)' : 'transparent',
                fontFamily: 'DM Sans',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = s === task.status ? 'var(--accent-glow)' : 'transparent'}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}