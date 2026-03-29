import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorkspace } from '../api/client'
import { useWorkspace } from '../context/WorkspaceContext'

export default function CreateWorkspacePage() {
  const navigate      = useNavigate()
  const { setWorkspace } = useWorkspace()

  const [name,      setName]      = useState('')
  const [adminName, setAdminName] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [created,   setCreated]   = useState(null) // holds { code, name }

  async function handleCreate() {
    if (!name.trim())      { setError('Please enter a workspace name.'); return }
    if (!adminName.trim()) { setError('Please enter your name.'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await createWorkspace(name.trim(), adminName.trim())
      const data = res.data
      setCreated(data)
      // Save to context + localStorage
      setWorkspace({
        id        : data.id,
        code      : data.code,
        name      : data.name,
        admin_name: data.admin_name,
        memberName: data.admin_name,
        role      : 'admin',
      })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to create workspace.')
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={headingStyle}>Workspace Created!</h2>
            <p style={mutedStyle}>Share this code with your team members</p>
          </div>

          {/* Invite code display */}
          <div style={{
            background: 'var(--bg-secondary)', border: '2px dashed var(--accent)',
            borderRadius: '12px', padding: '1.5rem',
            textAlign: 'center', marginBottom: '1.5rem',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'DM Sans', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Invite Code
            </p>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              fontSize: '2.5rem', color: 'var(--accent)', letterSpacing: '8px',
            }}>
              {created.code}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigator.clipboard.writeText(created.code)}
              style={secondaryBtnStyle}
            >
              Copy Code
            </button>
            <button
              onClick={() => navigate('/upload')}
              style={primaryBtnStyle}
            >
              Go to Upload →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>← Back</button>

        <h2 style={headingStyle}>Create a Workspace</h2>
        <p style={{ ...mutedStyle, marginBottom: '1.5rem' }}>
          You'll get a 6-character invite code to share with your team.
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Workspace Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Engineering Team, Q3 Planning"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Your Name (Admin)</label>
          <input
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            placeholder="e.g. Alice"
            style={inputStyle}
          />
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <button
          onClick={handleCreate}
          disabled={loading}
          style={{ ...primaryBtnStyle, width: '100%', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh', background: 'var(--bg-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
}
const cardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px',
}
const headingStyle = {
  fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem',
  color: 'var(--text-primary)', marginBottom: '0.35rem',
}
const mutedStyle = { color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }
const labelStyle = {
  display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
  fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem',
  textTransform: 'uppercase', letterSpacing: '0.5px',
}
const inputStyle = {
  width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '0.7rem 0.9rem', color: 'var(--text-primary)',
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', outline: 'none',
  boxSizing: 'border-box',
}
const primaryBtnStyle = {
  padding: '0.85rem 1.5rem', background: 'var(--accent)', color: '#fff',
  border: 'none', borderRadius: '10px', fontFamily: 'Syne, sans-serif',
  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
}
const secondaryBtnStyle = {
  padding: '0.85rem 1.5rem', background: 'transparent', color: 'var(--accent)',
  border: '1.5px solid var(--accent)', borderRadius: '10px',
  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
  flex: 1,
}
const errorStyle = {
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
  color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px',
  marginBottom: '1rem', fontSize: '0.875rem', fontFamily: 'DM Sans',
}
const backBtnStyle = {
  background: 'none', border: 'none', color: 'var(--text-muted)',
  fontFamily: 'DM Sans', fontSize: '0.875rem', cursor: 'pointer',
  marginBottom: '1.25rem', padding: 0,
}