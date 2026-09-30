function computeCategoryStats(cat) {
  let total = 0, done = 0, inProgress = 0
  for (const topic of cat.topics || []) {
    const allSubQ = (topic.subsections || []).flatMap(s => s.questions || [])
    const topicQ = topic.questions || []
    const allQ = [...allSubQ, ...topicQ]
    if (allQ.length > 0) {
      total += allQ.length
      done += allQ.filter(q => q.status === 'done').length
      inProgress += allQ.filter(q => q.status === 'in_progress').length
    } else {
      total += 1
      if (topic.status === 'done') done += 1
      else if (topic.status === 'in_progress') inProgress += 1
    }
  }
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, inProgress, notStarted: total - done - inProgress, percent }
}

export default function Dashboard({ data, onClose }) {
  const catStats = data.map(cat => ({ cat, stats: computeCategoryStats(cat) }))

  const totalQ       = catStats.reduce((a, { stats }) => a + stats.total, 0)
  const totalDone    = catStats.reduce((a, { stats }) => a + stats.done, 0)
  const totalInProg  = catStats.reduce((a, { stats }) => a + stats.inProgress, 0)
  const totalNot     = catStats.reduce((a, { stats }) => a + stats.notStarted, 0)
  const overallPct   = totalQ === 0 ? 0 : Math.round((totalDone / totalQ) * 100)

  const completedCats = catStats.filter(({ stats }) => stats.percent === 100).length
  const activeCats    = catStats.filter(({ stats }) => stats.percent > 0 && stats.percent < 100).length

  return (
    <div className="dash-overlay">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <span className="dash-header-icon">📊</span>
          <span className="dash-header-title">Progress Dashboard</span>
        </div>
        <button className="dash-close-btn" onClick={onClose} aria-label="Close dashboard">✕</button>
      </div>

      <div className="dash-body">

        {/* Overall hero card */}
        <div className="dash-hero">
          <div className="dash-hero-left">
            <div className="dash-hero-pct">{overallPct}%</div>
            <div className="dash-hero-label">Overall Complete</div>
            <div className="dash-hero-bar-track">
              <div
                className="dash-hero-bar-fill"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
          <div className="dash-hero-stats">
            <div className="dash-stat">
              <div className="dash-stat-value dash-val-green">{totalDone}</div>
              <div className="dash-stat-label">Done</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value dash-val-yellow">{totalInProg}</div>
              <div className="dash-stat-label">In Progress</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value">{totalNot}</div>
              <div className="dash-stat-label">Not Started</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value">{totalQ}</div>
              <div className="dash-stat-label">Total</div>
            </div>
          </div>
        </div>

        {/* Category summary pills */}
        {data.length > 0 && (
          <div className="dash-summary-pills">
            <span className="dash-pill dash-pill-green">✓ {completedCats} {completedCats === 1 ? 'category' : 'categories'} complete</span>
            <span className="dash-pill dash-pill-blue">◑ {activeCats} in progress</span>
            <span className="dash-pill">{data.length - completedCats - activeCats} not started</span>
          </div>
        )}

        {/* Per-category grid */}
        <h3 className="dash-section-title">By Category</h3>

        {data.length === 0 ? (
          <p className="dash-empty">No categories yet. Add one from the sidebar to start tracking.</p>
        ) : (
          <div className="dash-cats-grid">
            {catStats.map(({ cat, stats }) => {
              const fillClass = stats.percent === 100 ? 'dash-fill-green' : stats.percent > 0 ? 'dash-fill-blue' : 'dash-fill-gray'
              const pctClass  = stats.percent === 100 ? 'dash-val-green' : stats.percent > 0 ? 'dash-val-blue' : ''
              return (
                <div key={cat.id} className="dash-cat-card">
                  <div className="dash-cat-top">
                    <span className="dash-cat-icon">{cat.icon || '📁'}</span>
                    <div className="dash-cat-info">
                      <div className="dash-cat-title">{cat.title}</div>
                      <div className="dash-cat-meta">{(cat.topics || []).length} topics</div>
                    </div>
                    <div className={`dash-cat-pct ${pctClass}`}>{stats.percent}%</div>
                  </div>

                  <div className="dash-cat-bar-track">
                    <div className={`dash-cat-bar-fill ${fillClass}`} style={{ width: `${stats.percent}%` }} />
                  </div>

                  <div className="dash-cat-footer">
                    <span className="dash-cat-done">✓ {stats.done} done</span>
                    {stats.inProgress > 0 && (
                      <span className="dash-cat-inprog">◑ {stats.inProgress}</span>
                    )}
                    <span className="dash-cat-total">{stats.total} total</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
