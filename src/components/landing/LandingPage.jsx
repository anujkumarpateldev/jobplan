import React, { useState, useEffect, useRef } from 'react'
import './LandingPage.css'
import Logo from '../Logo.jsx'

const TYPEWRITER_TEXT = 'Crack Every Interview.'
const TYPEWRITER_DELAY = 80

const FLOAT_SNIPPETS = [
  'while(learning) { grow() }',
  'const skills = [...existing, ...new]',
  'O(log n) // binary search',
  'dp[i] = dp[i-1] + dp[i-2]',
  'graph.bfs(startNode)',
  'if (prepared) { succeed() }',
  'return sorted.merge(arr)',
  'class Solution { solve() }',
]

const FEATURES = [
  {
    icon: '📚',
    title: 'Structured Learning',
    desc: 'Organize topics into categories, subsections, and questions — a clear roadmap from beginner to interview-ready.',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: 'Mark questions as done, track streaks, and watch your completion percentage climb toward 100%.',
  },
  {
    icon: '🎯',
    title: 'Question Bank',
    desc: 'Curated LeetCode-style questions mapped to real interview patterns. Never wonder what to study next.',
  },
  {
    icon: '🚀',
    title: 'Interview Ready',
    desc: 'Simulate the full SWE interview loop: DSA, system design, behavioral. Walk in with confidence.',
  },
]

const STEPS = [
  {
    num: '01',
    icon: '✍️',
    title: 'Set Up Your Plan',
    desc: 'Add your target interview tracks — DSA, system design, behavioral. Customize to your dream company.',
  },
  {
    num: '02',
    icon: '📖',
    title: 'Study & Track',
    desc: 'Work through questions daily. Check off topics as you go and watch your progress bar fill up.',
  },
  {
    num: '03',
    icon: '🏆',
    title: 'Ace the Interview',
    desc: 'Walk into every interview fully prepared, with a clear picture of your strengths and weak spots covered.',
  },
]

export default function LandingPage({ onLogin, onRegister }) {
  const [typedText, setTypedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const canvasRef = useRef(null)

  // Typewriter effect
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTypedText(TYPEWRITER_TEXT.slice(0, i + 1))
      i++
      if (i >= TYPEWRITER_TEXT.length) {
        clearInterval(interval)
        setTypingDone(true)
      }
    }, TYPEWRITER_DELAY)
    return () => clearInterval(interval)
  }, [])

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const CHARS = 'アイウエオカキクケコサシスセソ01アBCDEFGHアカサタナ><{}[]01'
    const FONT_SIZE = 13
    let cols, drops, animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
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

  return (
    <div className="lp-root">
      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} className="lp-matrix-canvas" aria-hidden="true" />

      {/* Ambient blobs */}
      <div className="lp-blob lp-blob-1" />
      <div className="lp-blob lp-blob-2" />
      <div className="lp-blob lp-blob-3" />

      {/* Floating code snippets */}
      {FLOAT_SNIPPETS.map((snippet, i) => (
        <div key={i} className={`lp-float lp-float-${i + 1}`}>
          {snippet}
        </div>
      ))}

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-logo">
            <Logo size={32} />
            <span className="lp-nav-logo-text">TechUplift</span>
          </div>
          <div className="lp-nav-actions">
            <button className="btn btn-ghost lp-nav-btn" onClick={onLogin}>
              Sign In
            </button>
            <button className="btn btn-primary lp-nav-btn" onClick={onRegister}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          {/* Left: text */}
          <div className="lp-hero-text">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              Free · No credit card required
            </div>

            <h1 className="lp-headline">
              <span className="lp-headline-typed">
                {typedText}
                {!typingDone && <span className="lp-cursor">|</span>}
              </span>
              <br />
              <span className="lp-headline-grad">One Plan at a Time.</span>
            </h1>

            <p className="lp-hero-sub">
              The structured interview prep tracker built for software engineers.
              Organize topics, track questions, measure progress — all in one place.
            </p>

            <div className="lp-cta-row">
              <button className="lp-cta-primary" onClick={onRegister}>
                Start Preparing Free →
              </button>
              <button className="lp-cta-ghost btn btn-ghost" onClick={onLogin}>
                Sign In
              </button>
            </div>

            <div className="lp-social-proof">
              <div className="lp-avatars">
                {['👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎓', '👩‍🎓'].map((av, i) => (
                  <span key={i} className="lp-av">{av}</span>
                ))}
              </div>
              <span className="lp-social-text">
                Join engineers leveling up for their next role
              </span>
            </div>
          </div>

          {/* Right: laptop visual */}
          <div className="lp-hero-visual">
            <div className="lp-laptop">
              {/* Screen */}
              <div className="lp-laptop-screen">
                <div className="lp-screen-header">
                  <span className="lp-dot lp-dot-r" />
                  <span className="lp-dot lp-dot-y" />
                  <span className="lp-dot lp-dot-g" />
                  <span className="lp-screen-title">prep-tracker.js</span>
                </div>
                <div className="lp-screen-code">
                  <div className="lp-code-line lp-code-line-1">
                    <span className="lp-kw">const</span>{' '}
                    <span className="lp-fn">plan</span> = {'{'}
                  </div>
                  <div className="lp-code-line lp-code-line-2">
                    &nbsp;&nbsp;<span className="lp-str">"DSA"</span>:{' '}
                    <span className="lp-fn">trackProgress</span>(),
                  </div>
                  <div className="lp-code-line lp-code-line-3">
                    &nbsp;&nbsp;<span className="lp-str">"System Design"</span>:{' '}
                    <span className="lp-fn">study</span>(),
                  </div>
                  <div className="lp-code-line lp-code-line-4">
                    &nbsp;&nbsp;<span className="lp-str">"Behavioral"</span>:{' '}
                    <span className="lp-fn">practice</span>(),
                  </div>
                  <div className="lp-code-line lp-code-line-5">
                    {'}'};
                  </div>
                  <div className="lp-code-line lp-code-line-6">&nbsp;</div>
                  <div className="lp-code-line lp-code-line-7">
                    <span className="lp-kw">function</span>{' '}
                    <span className="lp-fn">crackInterview</span>() {'{'}
                  </div>
                  <div className="lp-code-line lp-code-line-8">
                    &nbsp;&nbsp;<span className="lp-kw">return</span>{' '}
                    <span className="lp-fn">Object</span>.
                    <span className="lp-fn">keys</span>(plan)
                  </div>
                  <div className="lp-code-line lp-code-line-9">
                    &nbsp;&nbsp;&nbsp;&nbsp;.<span className="lp-fn">every</span>(
                    <span className="lp-kw">k</span> =&gt;{' '}
                    plan[k].done);
                  </div>
                  <div className="lp-code-line lp-code-line-10">{'}'}</div>
                </div>
              </div>
              {/* Laptop base */}
              <div className="lp-laptop-base" />
            </div>

            {/* Floating badges */}
            <div className="lp-badge-float lp-bf-1">✅ Arrays done!</div>
            <div className="lp-badge-float lp-bf-2">🔥 7-day streak</div>
            <div className="lp-badge-float lp-bf-3">📈 82% complete</div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="lp-stats-strip">
        <div className="lp-stats-inner">
          {[
            { num: '500+', label: 'Questions' },
            { num: '12+', label: 'Categories' },
            { num: '3', label: 'Interview Rounds' },
            { num: '100%', label: 'Free' },
          ].map((s, i) => (
            <div key={i} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="lp-section lp-features-section">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Features</div>
          <h2 className="lp-section-title">Everything you need to prepare</h2>
          <p className="lp-section-sub">
            Built specifically for software engineering interviews. No fluff, just results.
          </p>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-section lp-how-section">
        <div className="lp-section-inner">
          <div className="lp-section-tag">How It Works</div>
          <h2 className="lp-section-title">Three steps to interview confidence</h2>
          <p className="lp-section-sub">
            Simple, focused, and effective. Start in minutes, see results in weeks.
          </p>

          <div className="lp-steps-row">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="lp-step">
                  <div className="lp-step-num">{step.num}</div>
                  <div className="lp-step-icon">{step.icon}</div>
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-desc">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="lp-step-arrow">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-emoji">🚀</div>
          <h2 className="lp-cta-title">Ready to land your dream job?</h2>
          <p className="lp-cta-sub">
            Start your structured interview prep today — completely free.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-cta-primary" onClick={onRegister}>
              Create Free Account →
            </button>
            <button className="lp-cta-ghost btn btn-ghost" onClick={onLogin}>
              Already have an account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <Logo size={28} />
            <span className="lp-footer-logo-text">TechUplift</span>
          </div>
          <p className="lp-footer-copy">
            © {new Date().getFullYear()} TechUplift. Built for engineers, by engineers.
          </p>
          <p className="lp-footer-tagline">Free forever. No credit card. No nonsense.</p>
        </div>
      </footer>
    </div>
  )
}
