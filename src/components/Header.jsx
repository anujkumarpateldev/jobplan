import UserMenu from './UserMenu.jsx'

export default function Header({ totalUnits, doneUnits, onMenuOpen, onDashboard, profile, email, onLogout, onSettings }) {
  const percent = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100)
  return (
    <header className="app-header">
      <div className="header-content">

        {/* LEFT: user menu → dashboard → progress */}
        <div className="header-left">
          {profile && (
            <UserMenu profile={profile} email={email} onSettings={onSettings} onLogout={onLogout} />
          )}
          <button className="dash-open-btn" onClick={onDashboard} type="button">
            📊 <span className="dash-open-label">Dashboard</span>
          </button>
          <div className="header-progress-group">
            <div className="header-progress-stats">
              <span className="progress-count"><strong>{doneUnits}</strong> / {totalUnits} completed</span>
              <span className="progress-percent">{percent}%</span>
            </div>
            <div className="header-progress-bar-track">
              <div className="header-progress-bar-fill" style={{ width: `${percent}%` }}
                role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress" />
            </div>
          </div>
        </div>

        {/* CENTER: logo + app name (absolutely centred) */}
        <div className="header-title-group">
          <span className="header-logo">👨‍💻</span>
          <div>
            <h1 className="header-title">SWE Prep Tracker</h1>
            <p className="header-subtitle">Interview preparation hub</p>
          </div>
        </div>

        {/* mobile sidebar toggle — right side on small screens */}
        <button className="header-menu-btn" onClick={onMenuOpen} aria-label="Open categories">&#9776;</button>

      </div>
    </header>
  )
}
