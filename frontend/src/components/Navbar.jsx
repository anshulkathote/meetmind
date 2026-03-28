import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',             label: 'Upload' },
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/dependencies', label: 'Dependencies' },
  { to: '/audit',        label: 'Audit' },
  { to: '/summary',      label: 'Summary' },
]

export default function Navbar() {
  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '1.3rem',
        color: 'var(--accent)',
        letterSpacing: '-0.5px',
      }}>
        Meet<span style={{ color: 'var(--text-primary)' }}>Mind</span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            style={({ isActive }) => ({
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              border: isActive ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}