export default function Sidebar({ categories, selectedCategoryId, onSelectCategory, onAddCategory, isOpen, onToggle, width }) {
  const getCategoryProgress = (category) => {
    const topics = category.topics || []
    if (topics.length === 0) return { percent: 0, done: 0, total: 0 }
    let total = 0, done = 0
    for (const t of topics) {
      const allSubQ = (t.subsections || []).flatMap(s => s.questions || [])
      const topicQ = t.questions || []
      const allQ = [...allSubQ, ...topicQ]
      if (allQ.length > 0) {
        total += allQ.length
        done += allQ.filter(q => q.status === 'done').length
      } else {
        total += 1
        if (t.status === 'done') done += 1
      }
    }
    return { percent: total === 0 ? 0 : Math.round((done / total) * 100), done, total }
  }

  const getProgressClass = (percent) => {
    if (percent === 100) return 'sidebar-progress-green'
    if (percent > 0) return 'sidebar-progress-blue'
    return 'sidebar-progress-gray'
  }

  const handleSelect = (id) => {
    onSelectCategory(id)
    if (window.innerWidth < 768 && onToggle) onToggle()
  }

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onToggle} />}

      <aside
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
        style={width ? { width, minWidth: width } : undefined}
      >
        <div className="sidebar-header">
          <h3 className="sidebar-heading">Categories</h3>
          <button className="sidebar-close-btn" onClick={onToggle} aria-label="Close sidebar">&#x2715;</button>
        </div>

        <nav className="sidebar-nav">
          {categories.map((category) => {
            const { percent, done, total } = getCategoryProgress(category)
            const progressClass = getProgressClass(percent)
            const isActive = category.id === selectedCategoryId
            return (
              <button
                key={category.id}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => handleSelect(category.id)}
                title={`${done}/${total} done`}
              >
                <div className="sidebar-item-top">
                  <span className="sidebar-item-icon">{category.icon || '📁'}</span>
                  <span className="sidebar-item-title">{category.title}</span>
                  <span className="sidebar-item-pct">{percent}%</span>
                </div>
                <div className="sidebar-mini-track">
                  <div className={`sidebar-mini-fill ${progressClass}`} style={{ width: `${percent}%` }} />
                </div>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-primary sidebar-add-btn" onClick={onAddCategory}>
            + Add Category
          </button>
        </div>
      </aside>
    </>
  )
}
