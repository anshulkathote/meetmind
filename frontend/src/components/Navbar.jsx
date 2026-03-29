import { useNavigate, useLocation } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { useMeeting } from '../context/MeetingContext'

const LINKS = [
  { path: '/upload',       label: 'Upload',       adminOnly: true  },
  { path: '/dashboard',    label: 'Dashboard',    adminOnly: false },
  { path: '/my-tasks',     label: 'My Tasks',     adminOnly: false },
  { path: '/dependencies', label: 'Dependencies', adminOnly: false },
  { path: '/audit',        label: 'Audit Trail',  adminOnly: false },
  { path: '/summary',      label: 'Summary',      adminOnly: false },
]

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { workspace, leaveWorkspace, isAdmin } = useWorkspace()
  const { setAnalysisResult } = useMeeting()

  function handleLeave() {
    setAnalysisResult(null)
    leaveWorkspace()
    navigate('/')
  }

  const visibleLinks = LINKS.filter(l => !l.adminOnly || isAdmin)

  return (
    <nav style={{
      background    : 'var(--bg-secondary)',
      borderBottom  : '1px solid var(--border)',
      padding       : '0 1.5rem',
      display       : 'flex',
      alignItems    : 'center',
      justifyContent: 'space-between',
      height        : '56px',
      position      : 'sticky',
      top           : 0,
      zIndex        : 100,
    }}>

      {/* Left — logo + workspace name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span
          onClick={() => navigate('/dashboard')}
          style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.1rem', color: 'var(--text-primary)',
            cursor: 'pointer', letterSpacing: '-0.5px',
          }}
        >
          Meet<span style={{ color: 'var(--accent)' }}>Mind</span>
        </span>

        {workspace && (
          <>
            <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>
            <span style={{
              fontFamily: 'DM Sans', fontSize: '0.82rem',
              color: 'var(--text-muted)', maxWidth: '160px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {workspace.name}
            </span>
            <span style={{
              background: isAdmin ? 'rgba(14,165,233,0.12)' : 'rgba(148,163,184,0.12)',
              color     : isAdmin ? 'var(--accent)' : 'var(--text-muted)',
              border    : `1px solid ${isAdmin ? 'rgba(14,165,233,0.3)' : 'rgba(148,163,184,0.2)'}`,
              borderRadius: '999px', padding: '2px 8px',
              fontSize: '0.7rem', fontWeight: 600, fontFamily: 'DM Sans',
            }}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </>
        )}
      </div>

      {/* Center — nav links */}
      <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
        {visibleLinks.map(link => {
          const active = location.pathname === link.path
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                padding    : '0.4rem 0.8rem',
                background : active ? 'rgba(14,165,233,0.1)' : 'transparent',
                color      : active ? 'var(--accent)' : 'var(--text-muted)',
                border     : active ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent',
                borderRadius: '6px',
                fontFamily : 'DM Sans, sans-serif', fontWeight: 500,
                fontSize   : '0.82rem', cursor: 'pointer',
                transition : 'all 0.15s',
              }}
            >
              {link.label}
            </button>
          )
        })}
      </div>

      {/* Right — member name + leave */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {workspace && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Avatar circle */}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: '#fff',
              fontFamily: 'Syne',
            }}>
              {workspace.memberName?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {workspace.memberName}
            </span>
          </div>
        )}

        <button
          onClick={handleLeave}
          style={{
            padding: '0.35rem 0.85rem',
            background: 'transparent', color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: '6px',
            fontFamily: 'DM Sans', fontSize: '0.78rem', cursor: 'pointer',
          }}
        >
          Leave
        </button>
      </div>
    </nav>
  )
}