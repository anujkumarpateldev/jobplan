import { useState } from 'react'
import QuestionItem from './QuestionItem.jsx'
import SubsectionModal from './SubsectionModal.jsx'
import Modal from './Modal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { getEmbedUrl } from '../utils/embed.js'

const TYPE_ICON = { video: '🎥', website: '🌐' }
const TYPE_LABEL = { video: 'Video', website: 'Website' }

function ResourceItem({ res }) {
  const embedUrl = res.type === 'video' ? getEmbedUrl(res.url) : null
  const [playing, setPlaying] = useState(false)

  return (
    <div className="resource-item">
      <div className="resource-item-row">
        <a
          href={res.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`resource-chip resource-chip-${res.type}`}
        >
          <span className="resource-chip-icon">{TYPE_ICON[res.type]}</span>
          <span className="resource-chip-label">{res.label || res.url}</span>
          <span className="resource-chip-type">{TYPE_LABEL[res.type]}</span>
          <span className="resource-chip-arrow">↗</span>
        </a>
        {embedUrl && (
          <button
            className={`embed-toggle-btn ${playing ? 'embed-toggle-active' : ''}`}
            onClick={() => setPlaying(v => !v)}
            title={playing ? 'Hide video' : 'Play inline'}
          >
            {playing ? '▼ Hide' : '▶ Play'}
          </button>
        )}
      </div>

      {embedUrl && playing && (
        <div className="video-embed">
          <iframe
            src={embedUrl}
            title={res.label || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}

export default function SubsectionDetail({
  subsection,
  onEdit,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onQuestionStatusChange,
}) {
  const [showEdit, setShowEdit] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)
  const [editingQ, setEditingQ] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const resources = subsection.resources || []
  const questions = subsection.questions || []
  const doneQ = questions.filter(q => q.status === 'done').length

  return (
    <div className="subsection-detail">
      {/* Header */}
      <div className="subsection-detail-header">
        <h2 className="subsection-detail-title">{subsection.title}</h2>
        <div className="category-header-actions">
          <button className="icon-btn edit-btn" onClick={() => setShowEdit(true)} title="Edit subsection">✏️</button>
          <button className="icon-btn delete-btn" onClick={() => setDeleteConfirm({ type: 'subsection' })} title="Delete subsection">🗑️</button>
        </div>
      </div>

      {/* Description */}
      {subsection.description && (
        <div className="subsection-detail-desc">
          <p>{subsection.description}</p>
        </div>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <div className="subsection-detail-section">
          <h3 className="subsection-detail-section-title">Resources</h3>
          <div className="resources-items-list">
            {resources.map(res => (
              <ResourceItem key={res.id} res={res} />
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="subsection-detail-section">
        <div className="subsection-detail-qheader">
          <h3 className="subsection-detail-section-title">
            Practice Questions
            {questions.length > 0 && (
              <span className="subsection-detail-q-count"> — {doneQ}/{questions.length} done</span>
            )}
          </h3>
          <button className="btn btn-ghost add-question-btn" onClick={() => setShowAddQ(true)}>
            + Add Question
          </button>
        </div>
        {questions.length === 0 ? (
          <p className="empty-section-msg">No questions yet.</p>
        ) : (
          <div className="questions-list">
            {questions.map(q => (
              <QuestionItem
                key={q.id}
                question={q}
                onStatusChange={(qId, newStatus) => onQuestionStatusChange(qId, newStatus)}
                onEdit={q => setEditingQ(q)}
                onDelete={(qId) => {
                    const q = questions.find(q => q.id === qId)
                    setDeleteConfirm({ type: 'question', id: qId, title: q?.title })
                  }}
              />
            ))}
          </div>
        )}
      </div>

      <SubsectionModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Subsection"
        onSubmit={onEdit}
        initialData={subsection}
      />
      <Modal
        isOpen={showAddQ}
        onClose={() => setShowAddQ(false)}
        title="Add Question"
        onSubmit={({ title, url }) => onAddQuestion({ title, url })}
        type="question"
      />
      <Modal
        isOpen={!!editingQ}
        onClose={() => setEditingQ(null)}
        title="Edit Question"
        onSubmit={({ title, url }) => { if (editingQ) onEditQuestion(editingQ.id, { title, url }) }}
        initialData={editingQ}
        type="question"
      />
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === 'subsection'
          ? `Delete "${subsection.title}"?`
          : `Delete "${deleteConfirm?.title}"?`}
        message={deleteConfirm?.type === 'subsection'
          ? 'This will remove the subsection and all its questions.'
          : 'This question will be permanently removed.'}
        onConfirm={() => {
          if (deleteConfirm?.type === 'subsection') onDelete()
          else if (deleteConfirm?.type === 'question') onDeleteQuestion(deleteConfirm.id)
          setDeleteConfirm(null)
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
