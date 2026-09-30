import { useState } from 'react'
import SubsectionItem from './SubsectionItem.jsx'
import SubsectionModal from './SubsectionModal.jsx'
import Modal from './Modal.jsx'

const STATUS_CYCLE = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_CLASSES = {
  not_started: 'badge-not-started',
  in_progress: 'badge-in-progress',
  done: 'badge-done',
}

function QuestionsOverview({ subsections, onQuestionStatusChange }) {
  const [open, setOpen] = useState(false)

  // Aggregate all questions from all subsections
  const groups = subsections
    .map((sub) => ({ id: sub.id, title: sub.title, questions: sub.questions || [] }))
    .filter((g) => g.questions.length > 0)

  const totalQ = groups.reduce((acc, g) => acc + g.questions.length, 0)
  const doneQ = groups.reduce((acc, g) => acc + g.questions.filter((q) => q.status === 'done').length, 0)

  if (totalQ === 0) {
    return (
      <div className="expanded-section">
        <div className="expanded-section-header">
          <span className="expanded-section-label">✏️ Questions</span>
        </div>
        <p className="empty-section-msg">Add questions inside subsections above.</p>
      </div>
    )
  }

  return (
    <div className="expanded-section">
      <div
        className="questions-overview-header"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`topic-expand-icon ${open ? 'rotated' : ''}`}>›</span>
        <span className="expanded-section-label">✏️ Questions</span>
        <span className="questions-overview-count">
          <strong>{doneQ}</strong> / {totalQ} done
        </span>
      </div>

      {open && (
        <div className="questions-overview-body">
          {groups.map((group) => (
            <div key={group.id} className="questions-group">
              <p className="questions-group-label">{group.title}</p>
              {group.questions.map((q) => (
                <div key={q.id} className="questions-overview-row">
                  <span className="question-bullet">–</span>
                  <span className="question-title">{q.title}</span>
                  {q.url && (
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="question-link"
                      title="Open reference"
                      onClick={(e) => e.stopPropagation()}
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
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopicItem({
  topic,
  onStatusChange,
  onEdit,
  onDelete,
  onAddSubsection,
  onEditSubsection,
  onDeleteSubsection,
  onAddSubsectionQuestion,
  onEditSubsectionQuestion,
  onDeleteSubsectionQuestion,
  onSubsectionQuestionStatus,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAddSubsection, setShowAddSubsection] = useState(false)
  const [editingSubsection, setEditingSubsection] = useState(null)

  const subsections = topic.subsections || []

  // Count for header badge: questions across all subsections
  const allSubQ = subsections.flatMap((s) => s.questions || [])
  const totalSubQ = allSubQ.length
  const doneSubQ = allSubQ.filter((q) => q.status === 'done').length

  const handleCycleStatus = (e) => {
    e.stopPropagation()
    onStatusChange(topic.id, STATUS_CYCLE[topic.status])
  }

  const handleDeleteSubsection = (subsectionId) => {
    const s = subsections.find((s) => s.id === subsectionId)
    if (window.confirm(`Delete subsection "${s?.title}" and all its questions?`)) {
      onDeleteSubsection(topic.id, subsectionId)
    }
  }

  return (
    <div className={`topic-item-wrapper ${expanded ? 'topic-expanded' : ''}`}>
      {/* Topic header row */}
      <div className="topic-item" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
        <div className="topic-left">
          <span className={`topic-expand-icon ${expanded ? 'rotated' : ''}`}>›</span>
          <span className="topic-title">{topic.title}</span>
          <span className="topic-question-count">
            {subsections.length > 0 && <span title="Subsections">📖 {subsections.length}</span>}
            {totalSubQ > 0 && <span title="Questions">&nbsp;✏️ {doneSubQ}/{totalSubQ}</span>}
          </span>
        </div>
        <div className="topic-right">
          <button
            className={`status-badge ${STATUS_CLASSES[topic.status]}`}
            onClick={handleCycleStatus}
            title="Click to cycle status"
            aria-label={`Status: ${STATUS_LABELS[topic.status]}. Click to change.`}
          >
            {STATUS_LABELS[topic.status]}
          </button>
          <div className="topic-actions">
            <button
              className="icon-btn edit-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(topic) }}
              title="Edit"
            >✏️</button>
            <button
              className="icon-btn delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(topic.id) }}
              title="Delete"
            >🗑️</button>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="topic-expanded-body">
          {/* Subsections management */}
          <div className="expanded-section">
            <div className="expanded-section-header">
              <span className="expanded-section-label">📖 Subsections</span>
              <button
                className="btn btn-ghost add-sub-btn"
                onClick={(e) => { e.stopPropagation(); setShowAddSubsection(true) }}
              >
                + Add Subsection
              </button>
            </div>
            {subsections.length === 0 ? (
              <p className="empty-section-msg">No subsections yet.</p>
            ) : (
              <div className="subsections-list">
                {subsections.map((sub) => (
                  <SubsectionItem
                    key={sub.id}
                    subsection={sub}
                    onEdit={(s) => setEditingSubsection(s)}
                    onDelete={handleDeleteSubsection}
                    onAddQuestion={(data) => onAddSubsectionQuestion(topic.id, sub.id, data)}
                    onEditQuestion={(qId, data) => onEditSubsectionQuestion(topic.id, sub.id, qId, data)}
                    onDeleteQuestion={(qId) => onDeleteSubsectionQuestion(topic.id, sub.id, qId)}
                    onQuestionStatusChange={(qId, status) => onSubsectionQuestionStatus(topic.id, sub.id, qId, status)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Aggregated questions overview */}
          <QuestionsOverview
            subsections={subsections}
            onQuestionStatusChange={(subId, qId, newStatus) =>
              onSubsectionQuestionStatus(topic.id, subId, qId, newStatus)
            }
          />
        </div>
      )}

      <SubsectionModal
        isOpen={showAddSubsection}
        onClose={() => setShowAddSubsection(false)}
        title="Add Subsection"
        onSubmit={(data) => onAddSubsection(topic.id, data)}
      />
      <SubsectionModal
        isOpen={!!editingSubsection}
        onClose={() => setEditingSubsection(null)}
        title="Edit Subsection"
        onSubmit={(data) => { if (editingSubsection) onEditSubsection(topic.id, editingSubsection.id, data) }}
        initialData={editingSubsection}
      />
    </div>
  )
}
