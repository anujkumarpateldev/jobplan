import { useState } from 'react'
import QuestionItem from './QuestionItem.jsx'
import Modal from './Modal.jsx'

const TYPE_ICON = { video: '🎥', website: '🌐' }
const TYPE_LABEL = { video: 'Video', website: 'Website' }

const STATUS_CYCLE = { not_started: 'in_progress', in_progress: 'done', done: 'not_started' }

export default function SubsectionItem({
  subsection,
  onEdit,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onQuestionStatusChange,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  const resources = subsection.resources || []
  const questions = subsection.questions || []
  const doneQuestions = questions.filter((q) => q.status === 'done').length

  const handleDeleteQuestion = (questionId) => {
    const q = questions.find((q) => q.id === questionId)
    if (window.confirm(`Delete question "${q?.title}"?`)) {
      onDeleteQuestion(questionId)
    }
  }

  return (
    <div className={`subsection-item-wrapper ${expanded ? 'subsection-expanded' : ''}`}>
      {/* Header row */}
      <div className="subsection-item" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
        <div className="subsection-left">
          <span className={`topic-expand-icon ${expanded ? 'rotated' : ''}`}>›</span>
          <span className="subsection-title">{subsection.title}</span>
          <span className="subsection-resource-count">
            {resources.filter((r) => r.type === 'video').length > 0 && (
              <span title="Videos">🎥 {resources.filter((r) => r.type === 'video').length}</span>
            )}
            {resources.filter((r) => r.type === 'website').length > 0 && (
              <span title="Websites">🌐 {resources.filter((r) => r.type === 'website').length}</span>
            )}
            {questions.length > 0 && (
              <span title="Questions">✏️ {doneQuestions}/{questions.length}</span>
            )}
          </span>
        </div>
        <div className="subsection-actions">
          <button
            className="icon-btn edit-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(subsection) }}
            title="Edit subsection"
          >✏️</button>
          <button
            className="icon-btn delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(subsection.id) }}
            title="Delete subsection"
          >🗑️</button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="subsection-body">
          {/* Description */}
          {subsection.description && (
            <p className="subsection-description">{subsection.description}</p>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div className="subsection-resources">
              {resources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`resource-chip resource-chip-${res.type}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="resource-chip-icon">{TYPE_ICON[res.type]}</span>
                  <span className="resource-chip-label">{res.label || res.url}</span>
                  <span className="resource-chip-type">{TYPE_LABEL[res.type]}</span>
                  <span className="resource-chip-arrow">↗</span>
                </a>
              ))}
            </div>
          )}

          {/* Questions */}
          <div className="subsection-questions-section">
            <div className="expanded-section-header">
              <span className="expanded-section-label">✏️ Practice Questions</span>
              <button
                className="btn btn-ghost add-question-btn"
                onClick={(e) => { e.stopPropagation(); setShowAddQuestion(true) }}
              >
                + Add Question
              </button>
            </div>
            {questions.length === 0 ? (
              <p className="empty-section-msg">No questions yet.</p>
            ) : (
              <div className="questions-list">
                {questions.map((q) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    onStatusChange={(qId, newStatus) => onQuestionStatusChange(qId, newStatus)}
                    onEdit={(q) => setEditingQuestion(q)}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddQuestion}
        onClose={() => setShowAddQuestion(false)}
        title="Add Question"
        onSubmit={({ title, url }) => onAddQuestion({ title, url })}
        type="question"
      />
      <Modal
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        title="Edit Question"
        onSubmit={({ title, url }) => { if (editingQuestion) onEditQuestion(editingQuestion.id, { title, url }) }}
        initialData={editingQuestion}
        type="question"
      />
    </div>
  )
}
