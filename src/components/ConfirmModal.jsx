import { useEffect } from 'react'

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box confirm-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-icon">🗑️</div>
          <h3 className="confirm-title">{title}</h3>
          {message && <p className="confirm-message">{message}</p>}
        </div>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
