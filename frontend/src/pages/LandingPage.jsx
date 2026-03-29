import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'

export default function LandingPage() {
  const navigate  = useNavigate()
  const { workspace } = useWorkspace()

  // If already in a workspace, skip straight to dashboard
  useEffect(() => {
    if (workspace) navigate('/dashboard')
  }, [workspace, navigate])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          color: 'var(--text-primary)', letterSpacing: '-1.5px',
          marginBottom: '0.75rem',
        }}>
          Meet<span style={{ color: 'var(--accent)' }}>Mind</span>
        </h1>
        <p style={{
          color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif',
          fontSize: '1.1rem', maxWidth: '480px', lineHeight: '1.6',
        }}>
          AI-powered meeting intelligence. Paste a transcript, let 8 agents extract tasks,
          map dependencies, and keep your whole team accountable.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/create')}
          style={{
            padding: '0.9rem 2.5rem',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: '1rem', cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={e => e.target.style.opacity = '0.85'}
          onMouseOut={e  => e.target.style.opacity = '1'}
        >
          Create Workspace
        </button>

        <button
          onClick={() => navigate('/join')}
          style={{
            padding: '0.9rem 2.5rem',
            background: 'transparent', color: 'var(--accent)',
            border: '1.5px solid var(--accent)', borderRadius: '10px',
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: '1rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.target.style.background = 'rgba(14,165,233,0.08)' }}
          onMouseOut={e  => { e.target.style.background = 'transparent' }}
        >
          Join Workspace
        </button>
      </div>

      <p style={{
        marginTop: '3rem', color: 'var(--text-muted)',
        fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif',
      }}>
        Admin creates a workspace and shares the 6-character invite code with the team.
      </p>
    </div>
  )
}