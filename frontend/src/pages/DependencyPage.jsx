import { useMeeting } from '../context/MeetingContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { getTasks, getDependencies } from '../api/client'
import { useEffect, useState } from 'react'
import DependencyGraph from '../components/DependencyGraph'

const LEGEND = [
  { status: 'done',        color: '#4ade80', label: 'Done'        },
  { status: 'in_progress', color: '#38bdf8', label: 'In Progress' },
  { status: 'todo',        color: '#94a3b8', label: 'To Do'       },
  { status: 'stalled',     color: '#f87171', label: 'Stalled'     },
]

export default function DependencyPage() {
  const { analysisResult } = useMeeting()
  const { workspace } = useWorkspace()
  const [tasks,        setTasks]        = useState([])
  const [dependencies, setDependencies] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    // Admin: use fresh in-memory result immediately, no API call needed
    if (analysisResult?.tasks?.length > 0) {
      setTasks(analysisResult.tasks)
      setDependencies(analysisResult.dependencies || [])
      setLoading(false)
      return
    }

    // Wait for workspace to be loaded from localStorage before fetching
    // (workspace is null on first render, populated by WorkspaceContext useEffect)
    if (!workspace?.id) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [taskRes, depRes] = await Promise.all([
          getTasks(workspace.id),
          getDependencies(workspace.id),
        ])
        setTasks(taskRes.data || [])
        setDependencies(depRes.data || [])
      } catch {
        setError('Could not load dependency data. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [analysisResult, workspace?.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

      {/* Header Bar — identical to original */}
      <div style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Task <span style={{ color: 'var(--accent)' }}>Dependency Graph</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'DM Sans', marginTop: '2px' }}>
            {tasks.length} tasks · {dependencies.length} dependencies · drag to rearrange
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {LEGEND.map(l => (
            <div key={l.status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body — same empty states as original, plus loading/error for member fetch */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
          Loading dependency graph...
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontFamily: 'DM Sans' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕸️</div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No dependency data yet
          </p>
          <p style={{ fontSize: '0.875rem' }}>Analyze a meeting first to see the graph</p>
        </div>
      ) : dependencies.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No dependencies found
          </p>
          <p style={{ fontSize: '0.875rem' }}>All tasks are independent — no blockers detected</p>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <DependencyGraph tasks={tasks} dependencies={dependencies} />
        </div>
      )}
    </div>
  )
}
