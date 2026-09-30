import { useEffect, useRef, useState } from 'react'

const CATEGORY_ICONS = [
  // Coding & Tech
  '💻', '🖥️', '⌨️', '🖱️', '📱', '🔌',
  // Data & Algorithms
  '🧮', '📊', '📈', '🗂️', '🔢', '🧩',
  // Engineering
  '🏗️', '⚙️', '🔧', '🔩', '🛠️', '🏛️',
  // Learning & Study
  '📚', '📖', '🎓', '✏️', '📝', '🔬',
  // Goals & Performance
  '🎯', '🚀', '⚡', '🔥', '🏆', '⭐',
  // Communication & Teamwork
  '💼', '🤝', '👥', '💬', '📣', '🗣️',
  // Security & Logic
  '🔐', '🛡️', '🔑', '🔍', '🧠', '💡',
  // Misc
  '🌐', '☁️', '🗃️', '📦', '🎲', '🧪',
]

export default function Modal({ isOpen, onClose, title, onSubmit, initialData, type }) {
  const [formData, setFormData] = useState({ title: '', icon: '', url: '' })
  const overlayRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || '',
        icon: initialData?.icon || (type === 'category' ? CATEGORY_ICONS[0] : ''),
        url: initialData?.url || '',
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedTitle = formData.title.trim()
    if (!trimmedTitle) return
    onSubmit({
      title: trimmedTitle,
      icon: formData.icon.trim() || undefined,
      url: formData.url.trim() || undefined,
    })
    onClose()
  }

  if (!isOpen) return null

  const isCategoryType = type === 'category'
  const isQuestionType = type === 'question'

  const titleLabel = isCategoryType ? 'Category Name' : isQuestionType ? 'Question Title' : 'Topic Title'
  const titlePlaceholder = isCategoryType
    ? 'e.g. System Design'
    : isQuestionType
    ? 'e.g. Two Sum'
    : 'e.g. Binary Search Trees'

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className={`modal-box${isCategoryType ? ' modal-box-category' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &#x2715;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {isCategoryType && (
            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker-grid">
                {CATEGORY_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-picker-btn ${formData.icon === ic ? 'icon-picker-btn-active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, icon: ic }))}
                    title={ic}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              {formData.icon && (
                <div className="icon-picker-preview">
                  Selected: <span className="icon-picker-selected">{formData.icon}</span>
                </div>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="modal-title-input">
              {titleLabel} <span className="required">*</span>
            </label>
            <input
              id="modal-title-input"
              ref={inputRef}
              type="text"
              placeholder={titlePlaceholder}
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="form-input"
              required
            />
          </div>
          {isQuestionType && (
            <div className="form-group">
              <label htmlFor="modal-url-input">Reference Link (optional)</label>
              <input
                id="modal-url-input"
                type="url"
                placeholder="e.g. https://leetcode.com/problems/two-sum"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                className="form-input"
              />
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
