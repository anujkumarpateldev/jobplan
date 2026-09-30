import { useState } from 'react'
import Modal from './Modal.jsx'
import SubsectionModal from './SubsectionModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const STATUS_CYCLE = { not_started: 'in_progress', in_progress: 'done', done: 'not_started' }
const STATUS_LABELS = { not_started: 'Not started', in_progress: 'In progress', done: '✓ Done' }
const STATUS_CLASSES = { not_started: 'badge-not-started', in_progress: 'badge-in-progress', done: 'badge-done' }

function computeProgress(topics) {
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
  return { total, done }
}

function TopicRow({
  topic,
  selectedSubsectionId,
  selectedTopicQuestionsId,
  onSubsectionSelect,
  onTopicQuestionsSelect,
  onStatusChange,
  onEdit,
  onDelete,
  onAddSubsection,
  onEditSubsection,
  onDeleteSubsection,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAddSub, setShowAddSub] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const subsections = topic.subsections || []
  const allQ = subsections.flatMap(s => s.questions || [])
  const doneQ = allQ.filter(q => q.status === 'done').length

  return (
    <div className={`cp-topic-wrapper ${expanded ? 'cp-topic-expanded' : ''}`}>
      <div className="cp-topic-row" onClick={() => setExpanded(v => !v)}>
        <span className={`topic-expand-icon ${expanded ? 'rotated' : ''}`}>›</span>
        <span className="topic-title">{topic.title}</span>
        <div className="cp-topic-badges">
          {subsections.length > 0 && <span className="cp-badge" title="Subsections">📖 {subsections.length}</span>}
          {allQ.length > 0 && <span className="cp-badge" title="Questions">✏️ {doneQ}/{allQ.length}</span>}
        </div>
        <button
          className={`status-badge ${STATUS_CLASSES[topic.status]}`}
          onClick={e => { e.stopPropagation(); onStatusChange(topic.id, STATUS_CYCLE[topic.status]) }}
          title="Click to cycle status"
        >
          {STATUS_LABELS[topic.status]}
        </button>
        <div className="topic-actions">
          <button className="icon-btn edit-btn" onClick={e => { e.stopPropagation(); onEdit(topic) }} title="Edit">✏️</button>
          <button className="icon-btn delete-btn" onClick={e => { e.stopPropagation(); onDelete(topic.id) }} title="Delete">🗑️</button>
        </div>
      </div>

      {expanded && (
        <div className="cp-subsections">
          {allQ.length > 0 && (
            <div
              className={`cp-sub-row cp-questions-row ${selectedTopicQuestionsId === topic.id ? 'cp-sub-row-active' : ''}`}
              onClick={() => onTopicQuestionsSelect(topic.id)}
            >
              <span className="cp-questions-row-icon">📋</span>
              <span className="cp-sub-title">Questions Overview</span>
              <div className="cp-sub-badges">
                <span className="cp-badge">✏️ {doneQ}/{allQ.length}</span>
              </div>
            </div>
          )}

          {subsections.length === 0 ? (
            <p className="empty-section-msg">No subsections yet.</p>
          ) : (
            subsections.map(sub => {
              const resources = sub.resources || []
              const subQ = sub.questions || []
              const subDone = subQ.filter(q => q.status === 'done').length
              const isActive = sub.id === selectedSubsectionId
              return (
                <div
                  key={sub.id}
                  className={`cp-sub-row ${isActive ? 'cp-sub-row-active' : ''}`}
                  onClick={() => onSubsectionSelect(topic.id, sub.id)}
                >
                  <span className="cp-sub-title">{sub.title}</span>
                  <div className="cp-sub-badges">
                    {resources.filter(r => r.type === 'video').length > 0 && (
                      <span className="cp-badge">🎥 {resources.filter(r => r.type === 'video').length}</span>
                    )}
                    {resources.filter(r => r.type === 'website').length > 0 && (
                      <span className="cp-badge">🌐 {resources.filter(r => r.type === 'website').length}</span>
                    )}
                    {subQ.length > 0 && (
                      <span className="cp-badge">✏️ {subDone}/{subQ.length}</span>
                    )}
                  </div>
                  <div className="cp-sub-actions" onClick={e => e.stopPropagation()}>
                    <button className="icon-btn edit-btn" onClick={() => setEditingSub(sub)} title="Edit">✏️</button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => setDeleteConfirm({ title: `Delete "${sub.title}"?`, message: 'This will remove the subsection and all its questions.', action: () => onDeleteSubsection(topic.id, sub.id) })}
                      title="Delete"
                    >🗑️</button>
                  </div>
                </div>
              )
            })
          )}
          <button
            className="btn btn-ghost add-sub-btn"
            onClick={e => { e.stopPropagation(); setShowAddSub(true) }}
          >
            + Add Subsection
          </button>
        </div>
      )}

      <SubsectionModal
        isOpen={showAddSub}
        onClose={() => setShowAddSub(false)}
        title="Add Subsection"
        onSubmit={data => onAddSubsection(topic.id, data)}
      />
      <SubsectionModal
        isOpen={!!editingSub}
        onClose={() => setEditingSub(null)}
        title="Edit Subsection"
        onSubmit={data => { if (editingSub) onEditSubsection(topic.id, editingSub.id, data) }}
        initialData={editingSub}
      />
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.title}
        message={deleteConfirm?.message}
        onConfirm={() => { deleteConfirm?.action(); setDeleteConfirm(null) }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

export default function CategoryPanel({
  category,
  selectedSubsectionId,
  selectedTopicQuestionsId,
  onSubsectionSelect,
  onTopicQuestionsSelect,
  onEditCategory,
  onDeleteCategory,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onTopicStatusChange,
  onAddSubsection,
  onEditSubsection,
  onDeleteSubsection,
}) {
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const topics = category.topics || []
  const { total, done } = computeProgress(topics)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const colorClass = percent === 100 ? 'fill-green' : percent > 0 ? 'fill-blue' : 'fill-gray'

  return (
    <div className="category-panel">
      <div className="category-panel-header">
        <div className="category-title-row">
          {category.icon && <span className="category-icon">{category.icon}</span>}
          <h2 className="category-title">{category.title}</h2>
        </div>
        <div className="category-header-actions">
          <button className="icon-btn edit-btn" onClick={() => onEditCategory(category)} title="Edit">✏️</button>
          <button
            className="icon-btn delete-btn"
            onClick={() => setDeleteConfirm({ title: `Delete "${category.title}"?`, message: 'This will permanently remove the category and all its topics.' })}
            title="Delete"
          >🗑️</button>
        </div>
      </div>

      <div className="category-progress-row">
        <div className="progress-bar-track">
          <div className={`progress-bar-fill ${colorClass}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="category-progress-label">{done} / {total} done ({percent}%)</span>
      </div>

      <div className="topics-list">
        {topics.length === 0 ? (
          <p className="empty-topics-msg">No topics yet. Add one below.</p>
        ) : (
          topics.map(topic => (
            <TopicRow
              key={topic.id}
              topic={topic}
              selectedSubsectionId={selectedSubsectionId}
              selectedTopicQuestionsId={selectedTopicQuestionsId}
              onSubsectionSelect={onSubsectionSelect}
              onTopicQuestionsSelect={onTopicQuestionsSelect}
              onStatusChange={(topicId, newStatus) => onTopicStatusChange(category.id, topicId, newStatus)}
              onEdit={t => setEditingTopic(t)}
              onDelete={(topicId) => {
                const t = topics.find(t => t.id === topicId)
                setDeleteConfirm({ title: `Delete "${t?.title}"?`, message: 'This will remove the topic and all its subsections.', action: () => onDeleteTopic(category.id, topicId) })
              }}
              onAddSubsection={(topicId, data) => onAddSubsection(category.id, topicId, data)}
              onEditSubsection={(topicId, subId, data) => onEditSubsection(category.id, topicId, subId, data)}
              onDeleteSubsection={(topicId, subId) => onDeleteSubsection(category.id, topicId, subId)}
            />
          ))
        )}
      </div>

      <button className="btn btn-ghost add-topic-btn" onClick={() => setShowAddTopic(true)}>
        + Add Topic
      </button>

      <Modal
        isOpen={showAddTopic}
        onClose={() => setShowAddTopic(false)}
        title="Add Topic"
        onSubmit={({ title }) => onAddTopic(category.id, { title })}
        type="topic"
      />
      <Modal
        isOpen={!!editingTopic}
        onClose={() => setEditingTopic(null)}
        title="Edit Topic"
        onSubmit={({ title }) => { if (editingTopic) onEditTopic(category.id, editingTopic.id, { title }) }}
        initialData={editingTopic}
        type="topic"
      />
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.title}
        message={deleteConfirm?.message}
        onConfirm={() => { deleteConfirm?.action?.(); setDeleteConfirm(null) }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
