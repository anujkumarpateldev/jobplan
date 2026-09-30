import { useEffect, useRef, useState } from 'react'

const EMPTY_RESOURCE = () => ({ id: crypto.randomUUID(), url: '', type: 'website', label: '' })

export default function SubsectionModal({ isOpen, onClose, title, onSubmit, initialData }) {
  const [formTitle, setFormTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resources, setResources] = useState([EMPTY_RESOURCE()])
  const overlayRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setFormTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      const initResources = initialData?.resources?.length
        ? initialData.resources.map((r) => ({ ...r }))
        : [EMPTY_RESOURCE()]
      setResources(initResources)
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const updateResource = (id, field, value) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const addResource = () => setResources((prev) => [...prev, EMPTY_RESOURCE()])

  const removeResource = (id) => {
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.length === 0 ? [EMPTY_RESOURCE()] : next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedTitle = formTitle.trim()
    if (!trimmedTitle) return
    const cleanResources = resources
      .filter((r) => r.url.trim())
      .map((r) => ({ ...r, url: r.url.trim(), label: r.label.trim() }))
    onSubmit({ title: trimmedTitle, description: description.trim(), resources: cleanResources })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-box modal-box-lg" role="dialog" aria-modal="true" aria-labelledby="sub-modal-title">
        <div className="modal-header">
          <h2 id="sub-modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">&#x2715;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="sub-title">Subsection Title <span className="required">*</span></label>
            <input
              id="sub-title"
              ref={titleRef}
              type="text"
              placeholder="e.g. Horizontal vs Vertical Scaling"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="sub-desc">Description / Notes (optional)</label>
            <textarea
              id="sub-desc"
              placeholder="Key concepts, summary, things to remember..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input form-textarea"
              rows={3}
            />
          </div>

          {/* Resources */}
          <div className="form-group">
            <label>Resources (optional)</label>
            <div className="resources-list">
              {resources.map((res, idx) => (
                <div key={res.id} className="resource-row">
                  {/* Type toggle */}
                  <div className="resource-type-toggle">
                    <button
                      type="button"
                      className={`type-btn ${res.type === 'video' ? 'type-btn-active' : ''}`}
                      onClick={() => updateResource(res.id, 'type', 'video')}
                      title="Video"
                    >
                      🎥
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${res.type === 'website' ? 'type-btn-active' : ''}`}
                      onClick={() => updateResource(res.id, 'type', 'website')}
                      title="Website"
                    >
                      🌐
                    </button>
                  </div>

                  <div className="resource-fields">
                    <input
                      type="text"
                      placeholder={`Label (e.g. ${res.type === 'video' ? 'System Design Primer' : 'AWS Docs'})`}
                      value={res.label}
                      onChange={(e) => updateResource(res.id, 'label', e.target.value)}
                      className="form-input resource-label-input"
                    />
                    <input
                      type="url"
                      placeholder={res.type === 'video' ? 'https://youtube.com/...' : 'https://docs.example.com/...'}
                      value={res.url}
                      onChange={(e) => updateResource(res.id, 'url', e.target.value)}
                      className="form-input resource-url-input"
                    />
                  </div>

                  <button
                    type="button"
                    className="icon-btn delete-btn resource-remove-btn"
                    onClick={() => removeResource(res.id)}
                    aria-label={`Remove resource ${idx + 1}`}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              ))}

              <button type="button" className="btn btn-ghost add-resource-btn" onClick={addResource}>
                + Add Resource
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
