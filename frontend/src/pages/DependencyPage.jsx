import { useMeeting } from '../context/MeetingContext'
import DependencyGraph from '../components/DependencyGraph'

const LEGEND = [
  { status: 'done',        color: '#4ade80', label: 'Done'        },
  { status: 'in_progress', color: '#38bdf8', label: 'In Progress' },
  { status: 'todo',        color: '#94a3b8', label: 'To Do'       },
  { status: 'stalled',     color: '#f87171', label: 'Stalled'     },
]

export default function DependencyPage() {
  const { analysisResult } = useMeeting()

  const tasks        = analysisResult?.tasks        || []
  const dependencies = analysisResult?.dependencies || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

      {/* Header Bar */}
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

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {LEGEND.map(l => (
            <div key={l.status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph or Empty State */}
      {tasks.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontFamily: 'DM Sans',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕸️</div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No dependency data yet
          </p>
          <p style={{ fontSize: '0.875rem' }}>Analyze a meeting first to see the graph</p>
        </div>
      ) : dependencies.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontFamily: 'DM Sans',
        }}>
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