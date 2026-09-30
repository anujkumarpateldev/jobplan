import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'
import Logo from '../Logo.jsx'

const AVATARS = [
  '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🎓',
  '🦁', '🐯', '🦊', '🐼', '🦄', '🦅',
  '🤖', '👾', '🎭', '🚀', '⚡', '🔥',
  '💎', '🌟', '🎯', '🧠', '🏆', '🎸',
]

function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '',
    avatar: AVATARS[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          last_name:  form.lastName.trim(),
          avatar_url: form.avatar,
          role:       'user',
        },
      },
    })
    setLoading(false)

    if (signUpError) return setError(signUpError.message)
    onSuccess('registered')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Name row */}
      <div className="auth-row">
        <div className="auth-field">
          <label className="auth-label">First Name <span className="required">*</span></label>
          <input className="form-input" placeholder="Jane" value={form.firstName} onChange={set('firstName')} required />
        </div>
        <div className="auth-field">
          <label className="auth-label">Last Name <span className="required">*</span></label>
          <input className="form-input" placeholder="Smith" value={form.lastName} onChange={set('lastName')} required />
        </div>
      </div>

      {/* Email */}
      <div className="auth-field">
        <label className="auth-label">Email <span className="required">*</span></label>
        <input className="form-input" type="email" placeholder="jane@example.com" value={form.email} onChange={set('email')} required />
      </div>

      {/* Password row */}
      <div className="auth-row">
        <div className="auth-field">
          <label className="auth-label">Password <span className="required">*</span></label>
          <input className="form-input" type="password" placeholder="Min 6 chars" value={form.password} onChange={set('password')} required />
        </div>
        <div className="auth-field">
          <label className="auth-label">Confirm Password <span className="required">*</span></label>
          <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
        </div>
      </div>

      {/* Avatar picker */}
      <div className="auth-field">
        <label className="auth-label">Choose Avatar</label>
        <div className="avatar-grid">
          {AVATARS.map(av => (
            <button
              key={av} type="button"
              className={`avatar-btn ${form.avatar === av ? 'avatar-btn-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, avatar: av }))}
            >
              {av}
            </button>
          ))}
        </div>
        <div className="avatar-preview">
          Selected: <span className="avatar-preview-icon">{form.avatar}</span>
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button className="btn btn-primary auth-submit-btn" type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}

function LoginForm({ onSuccess, onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (signInError) return setError(signInError.message)
    onSuccess('logged_in')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label">Email</label>
        <input className="form-input" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label">Password</label>
          <button type="button" className="auth-forgot-link" onClick={onForgotPassword}>
            Forgot password?
          </button>
        </div>
        <input className="form-input" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button className="btn btn-primary auth-submit-btn" type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Please enter your email address.')
    setError('')
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (resetError) return setError(resetError.message)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-success">
        <div className="auth-success-icon">📬</div>
        <h3 className="auth-success-title">Check your inbox</h3>
        <p className="auth-success-msg">
          We sent a password reset link to <strong>{email}</strong>. Check your email and follow the link.
        </p>
        <button className="btn btn-ghost" onClick={onBack}>← Back to Sign In</button>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <p className="auth-forgot-desc">
        Enter the email address you used to register and we'll send you a reset link.
      </p>
      <div className="auth-field">
        <label className="auth-label">Email address <span className="required">*</span></label>
        <input
          className="form-input"
          type="email"
          placeholder="jane@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button className="btn btn-primary auth-submit-btn" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send Reset Link'}
      </button>
      <button type="button" className="auth-switch-btn auth-back-link" onClick={onBack}>
        ← Back to Sign In
      </button>
    </form>
  )
}

function SuccessBanner({ type, onGoToLogin }) {
  return (
    <div className="auth-success">
      <div className="auth-success-icon">✅</div>
      <h3 className="auth-success-title">
        {type === 'registered' ? 'Account created!' : 'Welcome back!'}
      </h3>
      <p className="auth-success-msg">
        {type === 'registered'
          ? 'Check your email to confirm your account, then sign in.'
          : 'You are now signed in.'}
      </p>
      {type === 'registered' && (
        <button className="btn btn-ghost" onClick={onGoToLogin}>Go to Sign In →</button>
      )}
    </div>
  )
}

export default function AuthPage({ initialTab = 'login', onBack }) {
  const [tab, setTab] = useState(initialTab) // 'login' | 'register' | 'forgot'
  const [successType, setSuccessType] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const CHARS = 'アイウエオカキクケコサシスセソ01アBCDEFGHアカサタナ><{}[]01'
    const FONT_SIZE = 13
    let cols, drops, animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Math.floor(canvas.width / FONT_SIZE)
      drops = Array(cols).fill(0).map(() => Math.random() * -80)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${FONT_SIZE}px monospace`
      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const opacity = 0.12 + Math.random() * 0.1
        ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE)
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.978) drops[i] = 0
        drops[i] += 0.5
      }
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const handleSuccess = (type) => {
    setSuccessType(type)
    if (type === 'logged_in') {
      // Supabase onAuthStateChange in App.jsx will handle the redirect
    }
  }

  return (
    <div className="auth-page">
      <canvas ref={canvasRef} className="auth-matrix-canvas" aria-hidden="true" />
      <div className="auth-card">
        {onBack && (
          <button className="auth-close-btn" onClick={onBack} aria-label="Close">✕</button>
        )}
        {/* Logo */}
        <div className="auth-logo">
          <Logo size={48} />
          <div>
            <h1 className="auth-logo-title">TechUplift</h1>
            <p className="auth-logo-sub">Your personal interview preparation hub</p>
          </div>
        </div>

        {!successType ? (
          <>
            {/* Tab switcher — hidden on forgot password view */}
            {tab !== 'forgot' && (
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${tab === 'login' ? 'auth-tab-active' : ''}`}
                  onClick={() => setTab('login')}
                >
                  Sign In
                </button>
                <button
                  className={`auth-tab ${tab === 'register' ? 'auth-tab-active' : ''}`}
                  onClick={() => setTab('register')}
                >
                  Create Account
                </button>
              </div>
            )}

            {tab === 'login' && (
              <LoginForm onSuccess={handleSuccess} onForgotPassword={() => setTab('forgot')} />
            )}
            {tab === 'register' && (
              <RegisterForm onSuccess={handleSuccess} />
            )}
            {tab === 'forgot' && (
              <ForgotPasswordForm onBack={() => setTab('login')} />
            )}

            {tab !== 'forgot' && (
              <p className="auth-switch">
                {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  className="auth-switch-btn"
                  onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
                >
                  {tab === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            )}
          </>
        ) : (
          <SuccessBanner type={successType} onGoToLogin={() => { setSuccessType(null); setTab('login') }} />
        )}
      </div>
    </div>
  )
}
