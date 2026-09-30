const STATUS_CYCLE = { not_started: 'in_progress', in_progress: 'done', done: 'not_started' }
const STATUS_LABELS = { not_started: 'Not started', in_progress: 'In progress', done: '✓ Done' }
const STATUS_CLASSES = { not_started: 'badge-not-started', in_progress: 'badge-in-progress', done: 'badge-done' }

export default function QuestionsOverview({ topic, onQuestionStatusChange }) {
  const subsections = topic.subsections || []

  const groups = subsections
    .map(s => ({ id: s.id, title: s.title, questions: s.questions || [] }))
    .filter(g => g.questions.length > 0)

  const totalQ = groups.reduce((acc, g) => acc + g.questions.length, 0)
  const doneQ = groups.reduce((acc, g) => acc + g.questions.filter(q => q.status === 'done').length, 0)
  const percent = totalQ === 0 ? 0 : Math.round((doneQ / totalQ) * 100)

  return (
    <div className="qov-panel">
      <div className="qov-header">
        <div>
          <p className="qov-breadcrumb">Questions Overview</p>
          <h2 className="qov-title">{topic.title}</h2>
        </div>
        <div className="qov-stats">
          <span className="qov-count"><strong>{doneQ}</strong> / {totalQ}</span>
          <span className="qov-pct">{percent}%</span>
        </div>
      </div>

      <div className="qov-progress-track">
        <div
          className="qov-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      {groups.length === 0 ? (
        <div className="right-panel-empty">
          <span className="right-panel-empty-icon">📭</span>
          <p>No questions yet. Expand a subsection and add questions to see them here.</p>
        </div>
      ) : (
        <div className="qov-groups">
          {groups.map(group => {
            const groupDone = group.questions.filter(q => q.status === 'done').length
            return (
              <div key={group.id} className="qov-group">
                <div className="qov-group-header">
                  <span className="qov-group-title">{group.title}</span>
                  <span className="qov-group-count">{groupDone}/{group.questions.length}</span>
                </div>
                {group.questions.map(q => (
                  <div key={q.id} className="qov-question-row">
                    <span className="question-bullet">–</span>
                    <span className="question-title">{q.title}</span>
                    {q.url && (
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="question-link"
                        title="Open reference"
                      >
                        ↗
                      </a>
                    )}
                    <button
                      className={`status-badge ${STATUS_CLASSES[q.status]}`}
                      onClick={() => onQuestionStatusChange(group.id, q.id, STATUS_CYCLE[q.status])}
                      title="Click to cycle status"
                    >
                      {STATUS_LABELS[q.status]}
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
