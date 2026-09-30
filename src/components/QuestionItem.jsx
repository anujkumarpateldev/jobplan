const STATUS_CYCLE = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: '✓ Done',
}

const STATUS_CLASSES = {
  not_started: 'badge-not-started',
  in_progress: 'badge-in-progress',
  done: 'badge-done',
}

export default function QuestionItem({ question, onStatusChange, onEdit, onDelete }) {
  const handleCycleStatus = () => {
    onStatusChange(question.id, STATUS_CYCLE[question.status])
  }

  return (
    <div className="question-item">
      <div className="question-left">
        <span className="question-bullet">–</span>
        <span className="question-title">{question.title}</span>
        {question.url && (
          <a
            href={question.url}
            target="_blank"
            rel="noopener noreferrer"
            className="question-link"
            title="Open reference link"
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        )}
      </div>
      <div className="question-right">
        <button
          className={`status-badge ${STATUS_CLASSES[question.status]}`}
          onClick={handleCycleStatus}
          title="Click to cycle status"
          aria-label={`Status: ${STATUS_LABELS[question.status]}. Click to change.`}
        >
          {STATUS_LABELS[question.status]}
        </button>
        <div className="question-actions">
          <button
            className="icon-btn edit-btn"
            onClick={() => onEdit(question)}
            aria-label={`Edit question: ${question.title}`}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="icon-btn delete-btn"
            onClick={() => onDelete(question.id)}
            aria-label={`Delete question: ${question.title}`}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
