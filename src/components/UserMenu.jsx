import { useState, useEffect, useRef } from 'react'

export default function UserMenu({ profile, email, onSettings, onLogout }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const firstName = profile?.first_name || profile?.display_name?.split(' ')[0] || 'there'
  const avatar = profile?.avatar_url || '👤'

  return (
    <div className="user-menu-wrap" ref={containerRef}>
      <button className="user-menu-trigger" onClick={() => setOpen(o => !o)}>
        <span className="user-menu-avatar">{avatar}</span>
        <span className="user-menu-greeting">Welcome, {firstName}</span>
        <span className={`user-menu-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-profile">
            <div className="user-menu-avatar-lg">{avatar}</div>
            <div className="user-menu-info">
              <div className="user-menu-name">{profile?.display_name || firstName}</div>
              <div className="user-menu-email">{email}</div>
              {profile?.user_code && (
                <div className="user-menu-code">{profile.user_code}</div>
              )}
            </div>
          </div>
          <div className="user-menu-divider" />
          <button className="user-menu-item" onClick={() => { onSettings(); setOpen(false) }}>
            <span>⚙️</span> Settings
          </button>
          <button className="user-menu-item user-menu-item-danger" onClick={onLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
