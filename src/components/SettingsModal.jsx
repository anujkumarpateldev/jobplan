import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AVATARS = [
  '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🎓',
  '🦁', '🐯', '🦊', '🐼', '🦄', '🦅',
  '🤖', '👾', '🎭', '🚀', '⚡', '🔥',
  '💎', '🌟', '🎯', '🧠', '🏆', '🎸',
]

export default function SettingsModal({ profile, email, onClose, onSave }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    avatar_url: profile?.avatar_url || '👨‍💻',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleCopy = () => {
    navigator.clipboard.writeText(profile?.user_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)
    const display_name = `${form.first_name} ${form.last_name}`.trim() || email
    const { data, error: err } = await supabase
      .from('profiles')
      .update({ first_name: form.first_name, last_name: form.last_name, display_name, avatar_url: form.avatar_url })
      .eq('id', profile.id)
      .select()
      .single()
    setLoading(false)
    if (err) return setError(err.message)
    onSave(data)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box settings-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Account Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* User ID */}
          <div className="settings-section">
            <div className="settings-section-label">User ID</div>
            <div className="settings-id-row">
              <input className="form-input settings-id-input" value={profile?.user_code || '—'} readOnly />
              <button className="btn btn-ghost settings-copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Avatar */}
          <div className="settings-section">
            <div className="settings-section-label">Avatar</div>
            <div className="avatar-grid">
              {AVATARS.map(av => (
                <button
                  key={av} type="button"
                  className={`avatar-btn ${form.avatar_url === av ? 'avatar-btn-active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, avatar_url: av }))}
                >{av}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="settings-section">
            <div className="settings-section-label">Personal Info</div>
            <div className="settings-name-row">
              <div className="auth-field">
                <label className="auth-label">First Name</label>
                <input className="form-input" value={form.first_name} onChange={set('first_name')} placeholder="First name" />
              </div>
              <div className="auth-field">
                <label className="auth-label">Last Name</label>
                <input className="form-input" value={form.last_name} onChange={set('last_name')} placeholder="Last name" />
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="settings-section">
            <div className="settings-section-label">Account</div>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input className="form-input" value={email} readOnly />
              <span className="settings-field-note">Email changes require re-verification</span>
            </div>
            <div className="settings-role-row">
              <span className="settings-section-label">Role</span>
              <span className={`settings-role-badge ${profile?.role === 'admin' ? 'settings-role-admin' : 'settings-role-user'}`}>
                {profile?.role === 'admin' ? '🔑 Admin' : '👤 User'}
              </span>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
        </div>

        <div className="settings-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
