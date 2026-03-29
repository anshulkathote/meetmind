import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEffect } from 'react'

const statusColor = {
  done:        '#4ade80',
  in_progress: '#38bdf8',
  todo:        '#94a3b8',
  stalled:     '#f87171',
}

function buildLayout(tasks, dependencies) {
  // Simple grid layout — identical to original
  const COLS  = 3
  const X_GAP = 280
  const Y_GAP = 160

  const nodes = tasks.map((task, i) => ({
    id: String(task.id),
    data: {
      label: (
        <div style={{ textAlign: 'left', padding: '2px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: '3px', color: '#f1f5f9' }}>
            {task.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            👤 {task.owner}
          </div>
          <div style={{
            marginTop: '5px',
            display: 'inline-block',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            background: `${statusColor[task.status]}22`,
            color: statusColor[task.status],
            border: `1px solid ${statusColor[task.status]}44`,
          }}>
            {task.status}
          </div>
        </div>
      ),
    },
    position: {
      x: (i % COLS) * X_GAP + 60,
      y: Math.floor(i / COLS) * Y_GAP + 60,
    },
    style: {
      background: '#1e293b',
      border: `2px solid ${statusColor[task.status] || '#334155'}`,
      borderRadius: '10px',
      padding: '10px 14px',
      width: 220,
      boxShadow: `0 0 12px ${statusColor[task.status]}33`,
    },
  }))

  const edges = dependencies.map(d => ({
    id: `e${d.from_task_id}-${d.to_task_id}`,
    source: String(d.from_task_id),
    target: String(d.to_task_id),
    label: d.reason,
    animated: true,
    labelStyle: { fill: '#94a3b8', fontSize: 10 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
    labelBgPadding: [4, 6],
    labelBgBorderRadius: 4,
    style: { stroke: '#38bdf8', strokeWidth: 1.5 },
    markerEnd: { type: 'arrowclosed', color: '#38bdf8' },
  }))

  return { nodes, edges }
}

export default function DependencyGraph({ tasks, dependencies }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // useEffect so async-loaded data (member fetch) correctly updates the graph
  useEffect(() => {
    const { nodes: n, edges: e } = buildLayout(tasks, dependencies)
    setNodes(n)
    setEdges(e)
  }, [tasks, dependencies])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
      >
        <MiniMap
          nodeColor={n => {
            const task = tasks.find(t => String(t.id) === n.id)
            return task ? statusColor[task.status] : '#334155'
          }}
          style={{ background: '#0f172a', border: '1px solid #334155' }}
          maskColor="rgba(0,0,0,0.6)"
        />
        <Controls style={{ button: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' } }} />
        <Background color="#1e293b" gap={24} size={1} />
      </ReactFlow>
    </div>
  )
}
