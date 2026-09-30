import { useState } from 'react'
import TopicItem from './TopicItem.jsx'
import Modal from './Modal.jsx'

function ProgressBar({ percent, colorClass }) {
  return (
    <div className="progress-bar-track">
      <div
        className={`progress-bar-fill ${colorClass}`}
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

// Count done/total units within a category (mirrors App.jsx computeStats logic)
function computeCategoryProgress(topics) {
  let total = 0
  let done = 0
  for (const topic of topics) {
    const qs = topic.questions || []
    if (qs.length > 0) {
      total += qs.length
      done += qs.filter((q) => q.status === 'done').length
    } else {
      total += 1
      if (topic.status === 'done') done += 1
    }
  }
  return { total, done }
}

export default function CategoryCard({
  category,
  onEditCategory,
  onDeleteCategory,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onTopicStatusChange,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onQuestionStatusChange,
  onAddSubsection,
  onEditSubsection,
  onDeleteSubsection,
  onAddSubsectionQuestion,
  onEditSubsectionQuestion,
  onDeleteSubsectionQuestion,
  onSubsectionQuestionStatus,
}) {
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)

  const topics = category.topics || []
  const { total, done } = computeCategoryProgress(topics)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const colorClass = percent === 100 ? 'fill-green' : percent > 0 ? 'fill-blue' : 'fill-gray'

  const handleDeleteCategory = () => {
    if (window.confirm(`Delete category "${category.title}"? This will also delete all topics inside.`)) {
      onDeleteCategory(category.id)
    }
  }

  const handleDeleteTopic = (topicId) => {
    const topic = topics.find((t) => t.id === topicId)
    if (window.confirm(`Delete topic "${topic?.title}"? This will also delete its questions.`)) {
      onDeleteTopic(category.id, topicId)
    }
  }

  return (
    <div className="category-card" id={`category-${category.id}`}>
      <div className="category-card-header">
        <div className="category-title-row">
          {category.icon && <span className="category-icon">{category.icon}</span>}
          <h2 className="category-title">{category.title}</h2>
        </div>
        <div className="category-header-actions">
          <button
            className="icon-btn edit-btn"
            onClick={() => onEditCategory(category)}
            aria-label={`Edit category: ${category.title}`}
            title="Edit Category"
          >
            ✏️
          </button>
          <button
            className="icon-btn delete-btn"
            onClick={handleDeleteCategory}
            aria-label={`Delete category: ${category.title}`}
            title="Delete Category"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="category-progress-row">
        <ProgressBar percent={percent} colorClass={colorClass} />
        <span className="category-progress-label">
          {done} / {total} done ({percent}%)
        </span>
      </div>

      <div className="topics-list">
        {topics.length === 0 ? (
          <p className="empty-topics-msg">No topics yet. Add one below.</p>
        ) : (
          topics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              onStatusChange={(topicId, newStatus) => onTopicStatusChange(category.id, topicId, newStatus)}
              onEdit={(topic) => setEditingTopic(topic)}
              onDelete={handleDeleteTopic}
              onAddQuestion={(topicId, data) => onAddQuestion(category.id, topicId, data)}
              onEditQuestion={(topicId, questionId, data) => onEditQuestion(category.id, topicId, questionId, data)}
              onDeleteQuestion={(topicId, questionId) => onDeleteQuestion(category.id, topicId, questionId)}
              onQuestionStatusChange={(topicId, questionId, newStatus) =>
                onQuestionStatusChange(category.id, topicId, questionId, newStatus)
              }
              onAddSubsection={(topicId, data) => onAddSubsection(category.id, topicId, data)}
              onEditSubsection={(topicId, subId, data) => onEditSubsection(category.id, topicId, subId, data)}
              onDeleteSubsection={(topicId, subId) => onDeleteSubsection(category.id, topicId, subId)}
              onAddSubsectionQuestion={(topicId, subId, data) => onAddSubsectionQuestion(category.id, topicId, subId, data)}
              onEditSubsectionQuestion={(topicId, subId, qId, data) => onEditSubsectionQuestion(category.id, topicId, subId, qId, data)}
              onDeleteSubsectionQuestion={(topicId, subId, qId) => onDeleteSubsectionQuestion(category.id, topicId, subId, qId)}
              onSubsectionQuestionStatus={(topicId, subId, qId, s) => onSubsectionQuestionStatus(category.id, topicId, subId, qId, s)}
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
    </div>
  )
}
