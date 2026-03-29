import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinWorkspace } from '../api/client'
import { useWorkspace } from '../context/WorkspaceContext'

export default function JoinWorkspacePage() {
  const navigate      = useNavigate()
  const { setWorkspace } = useWorkspace()

  const [code,    setCode]    = useState('')
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter an invite code.'); return }
    if (!name.trim()) { setError('Please enter your name.'); return }
    setError(null)
    setLoading(true)
    try {
      const res  = await joinWorkspace(code.trim().toUpperCase(), name.trim())
      const data = res.data
      setWorkspace({
        id        : data.id,
        code      : data.code,
        name      : data.name,
        admin_name: data.admin_name,
        memberName: name.trim(),
        role      : data.role,
      })
      navigate('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Could not join workspace. Check your invite code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>← Back</button>

        <h2 style={headingStyle}>Join a Workspace</h2>
        <p style={{ ...mutedStyle, marginBottom: '1.5rem' }}>
          Enter the invite code your admin shared with you.
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Invite Code</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A3K9X2"
            maxLength={6}
            style={{
              ...inputStyle,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.4rem', letterSpacing: '6px',
              textAlign: 'center', textTransform: 'uppercase',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Your Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Must match your name in the meeting transcript"
            style={inputStyle}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: 'DM Sans' }}>
            Use the exact name your admin used when listing attendees.
          </p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <button
          onClick={handleJoin}
          disabled={loading}
          style={{ ...primaryBtnStyle, width: '100%', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Joining...' : 'Join Workspace →'}
        </button>
      </div>
    </div>
  )
}

// ── Shared styles (same as CreateWorkspacePage) ────────────────────────────
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