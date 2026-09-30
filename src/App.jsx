import { useState, useEffect } from 'react'
import { useResize } from './hooks/useResize.js'
import { supabase } from './lib/supabase.js'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import CategoryPanel from './components/CategoryPanel.jsx'
import SubsectionDetail from './components/SubsectionDetail.jsx'
import QuestionsOverview from './components/QuestionsOverview.jsx'
import Modal from './components/Modal.jsx'
import Dashboard from './components/Dashboard.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AuthPage from './components/auth/AuthPage.jsx'
import LandingPage from './components/landing/LandingPage.jsx'

function computeStats(data) {
  let total = 0, done = 0
  for (const cat of data) {
    for (const topic of cat.topics || []) {
      const allSubQ = (topic.subsections || []).flatMap(s => s.questions || [])
      const topicQ = topic.questions || []
      const allQ = [...allSubQ, ...topicQ]
      if (allQ.length > 0) {
        total += allQ.length
        done += allQ.filter(q => q.status === 'done').length
      } else {
        total += 1
        if (topic.status === 'done') done += 1
      }
    }
  }
  return { total, done }
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading, null = no session
  const [authView, setAuthView] = useState('landing') // 'landing' | 'login' | 'register'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_OUT') setAuthView('landing')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="auth-page"><div style={{ color: 'var(--text-muted)' }}>Loading…</div></div>
  }

  if (!session) {
    if (authView === 'landing') {
      return <LandingPage onLogin={() => setAuthView('login')} onRegister={() => setAuthView('register')} />
    }
    return <AuthPage initialTab={authView === 'register' ? 'register' : 'login'} onBack={() => setAuthView('landing')} />
  }

  return <AppMain session={session} />
}

function AppMain({ session }) {
  const uid = session.user.id
  const [data, setData] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // --- Profile fetch ---
  useEffect(() => {
    if (!uid) return
    const meta = session.user.user_metadata || {}
    const makeCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let c = 'USR-'
      for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]
      c += '-'
      for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]
      return c
    }
    supabase.from('profiles').select('*').eq('id', uid).single()
      .then(async ({ data: row, error }) => {
        if (error && error.code !== 'PGRST116') {
          console.error('[profiles] fetch error:', error.message)
          return
        }
        if (row && row.user_code) {
          setProfile(row)
        } else if (row && !row.user_code) {
          const { data: patched } = await supabase
            .from('profiles').update({ user_code: makeCode() }).eq('id', uid).select().single()
          setProfile(patched || row)
        } else {
          const firstName = meta.first_name || ''
          const lastName = meta.last_name || ''
          const { data: created } = await supabase.from('profiles').upsert({
            id: uid,
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`.trim() || session.user.email,
            avatar_url: meta.avatar_url || '👨‍💻',
            role: meta.role || 'user',
            user_code: makeCode(),
          }, { onConflict: 'id' }).select().single()
          if (created) setProfile(created)
        }
      })
  }, [session])

  // --- Data loading ---
  useEffect(() => { loadAllData() }, [uid])

  const loadAllData = async () => {
    setDataLoading(true)
    const [catsRes, progressRes, topicStatusRes] = await Promise.all([
      supabase.from('categories').select(`
        id, title, icon, position,
        topics (
          id, category_id, title, position,
          subsections (
            id, topic_id, title, description, position,
            resources (id, type, label, url, position),
            questions (id, subsection_id, title, url, position)
          ),
          questions (id, topic_id, title, url, position)
        )
      `).eq('created_by', uid).order('position'),
      supabase.from('user_question_progress').select('question_id, status').eq('user_id', uid),
      supabase.from('user_topic_status').select('topic_id, status').eq('user_id', uid),
    ])

    if (catsRes.error) {
      console.error('[load data]', catsRes.error.message)
      setDataLoading(false)
      return
    }

    const progressMap = Object.fromEntries((progressRes.data || []).map(r => [r.question_id, r.status]))
    const topicStatusMap = Object.fromEntries((topicStatusRes.data || []).map(r => [r.topic_id, r.status]))

    const merged = (catsRes.data || []).map(cat => ({
      ...cat,
      topics: (cat.topics || [])
        .sort((a, b) => a.position - b.position)
        .map(t => ({
          ...t,
          status: topicStatusMap[t.id] || 'not_started',
          questions: (t.questions || [])
            .sort((a, b) => a.position - b.position)
            .map(q => ({ ...q, status: progressMap[q.id] || 'not_started' })),
          subsections: (t.subsections || [])
            .sort((a, b) => a.position - b.position)
            .map(s => ({
              ...s,
              resources: (s.resources || []).sort((a, b) => a.position - b.position),
              questions: (s.questions || [])
                .sort((a, b) => a.position - b.position)
                .map(q => ({ ...q, status: progressMap[q.id] || 'not_started' })),
            })),
        })),
    }))

    setData(merged)
    setDataLoading(false)
  }

  // --- UI state ---
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedRef, setSelectedRef] = useState(null) // { type, categoryId, topicId, subsectionId? }
  const [showDashboard, setShowDashboard] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [mobileView, setMobileView] = useState('topics') // 'topics' | 'detail'

  const [sidebarWidth, onSidebarResizerDown, onSidebarResizerDbl] = useResize('panel-sidebar', 240, 160, 400)
  const [middleWidth, onMiddleResizerDown, onMiddleResizerDbl] = useResize('panel-middle', 420, 260, 900)

  // Select first category once data loads
  useEffect(() => {
    if (!dataLoading && data.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(data[0].id)
    }
  }, [dataLoading, data])

  const { total, done } = computeStats(data)

  const selectedCategory = data.find(c => c.id === selectedCategoryId) ?? data[0] ?? null
  const selectedTopic = selectedRef
    ? selectedCategory?.topics?.find(t => t.id === selectedRef.topicId)
    : null
  const selectedSubsection = selectedRef?.type === 'subsection'
    ? selectedTopic?.subsections?.find(s => s.id === selectedRef.subsectionId)
    : null

  const handleLogout = async () => { await supabase.auth.signOut() }

  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id)
    setSelectedRef(null)
    setMobileView('topics')
  }

  const handleSubsectionSelect = (topicId, subsectionId) => {
    setSelectedRef({ type: 'subsection', categoryId: selectedCategory?.id, topicId, subsectionId })
    setMobileView('detail')
  }

  const handleTopicQuestionsSelect = (topicId) => {
    setSelectedRef({ type: 'topic', categoryId: selectedCategory?.id, topicId })
    setMobileView('detail')
  }

  // --- Category CRUD ---
  const handleAddCategory = async ({ title, icon }) => {
    const id = crypto.randomUUID()
    const position = data.length * 10
    const newCat = { id, title, icon: icon || '📁', position, topics: [] }
    setData(prev => [...prev, newCat])
    setSelectedCategoryId(id)
    const { error } = await supabase.from('categories').insert({ id, title, icon: newCat.icon, position, created_by: uid })
    if (error) console.error('[add category]', error.message)
  }

  const handleEditCategorySubmit = async ({ title, icon }) => {
    const id = editingCategory.id
    const finalIcon = icon || editingCategory.icon
    setData(prev => prev.map(c => c.id === id ? { ...c, title, icon: finalIcon } : c))
    setEditingCategory(null)
    const { error } = await supabase.from('categories').update({ title, icon: finalIcon }).eq('id', id)
    if (error) console.error('[edit category]', error.message)
  }

  const handleDeleteCategory = async (categoryId) => {
    setData(prev => {
      const next = prev.filter(c => c.id !== categoryId)
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(next[0]?.id ?? null)
        setSelectedRef(null)
      }
      return next
    })
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (error) console.error('[delete category]', error.message)
  }

  // --- Topic CRUD ---
  const handleAddTopic = async (categoryId, { title }) => {
    const id = crypto.randomUUID()
    const cat = data.find(c => c.id === categoryId)
    const position = (cat?.topics?.length || 0) * 10
    const newTopic = { id, title, status: 'not_started', questions: [], subsections: [], position }
    setData(prev => prev.map(c =>
      c.id === categoryId ? { ...c, topics: [...c.topics, newTopic] } : c
    ))
    const { error } = await supabase.from('topics').insert({ id, category_id: categoryId, title, position, created_by: uid })
    if (error) console.error('[add topic]', error.message)
  }

  const handleEditTopic = async (categoryId, topicId, { title }) => {
    setData(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, topics: c.topics.map(t => t.id === topicId ? { ...t, title } : t) }
        : c
    ))
    const { error } = await supabase.from('topics').update({ title }).eq('id', topicId)
    if (error) console.error('[edit topic]', error.message)
  }

  const handleDeleteTopic = async (categoryId, topicId) => {
    if (selectedRef?.topicId === topicId) setSelectedRef(null)
    setData(prev => prev.map(c =>
      c.id === categoryId ? { ...c, topics: c.topics.filter(t => t.id !== topicId) } : c
    ))
    const { error } = await supabase.from('topics').delete().eq('id', topicId)
    if (error) console.error('[delete topic]', error.message)
  }

  const handleTopicStatusChange = async (categoryId, topicId, newStatus) => {
    setData(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, topics: c.topics.map(t => t.id === topicId ? { ...t, status: newStatus } : t) }
        : c
    ))
    const { error } = await supabase.from('user_topic_status').upsert(
      { user_id: uid, topic_id: topicId, status: newStatus },
      { onConflict: 'user_id,topic_id' }
    )
    if (error) console.error('[topic status]', error.message)
  }

  // --- Subsection CRUD ---
  const handleAddSubsection = async (categoryId, topicId, { title, description, resources }) => {
    const id = crypto.randomUUID()
    const topic = data.find(c => c.id === categoryId)?.topics?.find(t => t.id === topicId)
    const position = (topic?.subsections?.length || 0) * 10
    const newSub = { id, title, description: description || '', resources: resources || [], questions: [], position }
    setData(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, topics: c.topics.map(t =>
            t.id === topicId ? { ...t, subsections: [...(t.subsections || []), newSub] } : t
          )}
        : c
    ))
    const { error } = await supabase.from('subsections').insert({
      id, topic_id: topicId, title, description: description || '', position, created_by: uid,
    })
    if (error) { console.error('[add subsection]', error.message); return }
    if (resources?.length) {
      const { error: resErr } = await supabase.from('resources').insert(
        resources.map((r, i) => ({ subsection_id: id, type: r.type, label: r.label || '', url: r.url, position: i * 10 }))
      )
      if (resErr) console.error('[add subsection resources]', resErr.message)
    }
  }

  const handleEditSubsection = async (categoryId, topicId, subsectionId, { title, description, resources }) => {
    setData(prev => prev.map(c =>
      c.id === categoryId ? {
        ...c, topics: c.topics.map(t =>
          t.id === topicId ? {
            ...t, subsections: (t.subsections || []).map(s =>
              s.id === subsectionId ? { ...s, title, description: description || '', resources: resources || [] } : s
            ),
          } : t
        ),
      } : c
    ))
    const { error } = await supabase.from('subsections')
      .update({ title, description: description || '' }).eq('id', subsectionId)
    if (error) { console.error('[edit subsection]', error.message); return }
    await supabase.from('resources').delete().eq('subsection_id', subsectionId)
    if (resources?.length) {
      const { error: resErr } = await supabase.from('resources').insert(
        resources.map((r, i) => ({ subsection_id: subsectionId, type: r.type, label: r.label || '', url: r.url, position: i * 10 }))
      )
      if (resErr) console.error('[edit subsection resources]', resErr.message)
    }
  }

  const handleDeleteSubsection = async (categoryId, topicId, subsectionId) => {
    if (selectedRef?.subsectionId === subsectionId) {
      setSelectedRef(null)
      setMobileView('topics')
    }
    setData(prev => prev.map(c =>
      c.id === categoryId ? {
        ...c, topics: c.topics.map(t =>
          t.id === topicId ? { ...t, subsections: (t.subsections || []).filter(s => s.id !== subsectionId) } : t
        ),
      } : c
    ))
    const { error } = await supabase.from('subsections').delete().eq('id', subsectionId)
    if (error) console.error('[delete subsection]', error.message)
  }

  // --- Question CRUD ---
  const handleAddSubsectionQuestion = async (categoryId, topicId, subsectionId, { title, url }) => {
    const id = crypto.randomUUID()
    const sub = data.find(c => c.id === categoryId)?.topics?.find(t => t.id === topicId)?.subsections?.find(s => s.id === subsectionId)
    const position = (sub?.questions?.length || 0) * 10
    const newQ = { id, title, url: url || '', status: 'not_started', position }
    setData(prev => prev.map(c =>
      c.id === categoryId ? {
        ...c, topics: c.topics.map(t =>
          t.id === topicId ? {
            ...t, subsections: (t.subsections || []).map(s =>
              s.id === subsectionId ? { ...s, questions: [...(s.questions || []), newQ] } : s
            ),
          } : t
        ),
      } : c
    ))
    const { error } = await supabase.from('questions').insert({
      id, subsection_id: subsectionId, title, url: url || '', position, created_by: uid,
    })
    if (error) console.error('[add question]', error.message)
  }

  const handleEditSubsectionQuestion = async (categoryId, topicId, subsectionId, questionId, { title, url }) => {
    setData(prev => prev.map(c =>
      c.id === categoryId ? {
        ...c, topics: c.topics.map(t =>
          t.id === topicId ? {
            ...t, subsections: (t.subsections || []).map(s =>
              s.id === subsectionId ? {
                ...s, questions: s.questions.map(q =>
                  q.id === questionId ? { ...q, title, url: url || '' } : q
                ),
              } : s
            ),
          } : t
        ),
      } : c
    ))
    const { error } = await supabase.from('questions').update({ title, url: url || '' }).eq('id', questionId)
    if (error) console.error('[edit question]', error.message)
  }

  const handleDeleteSubsectionQuestion = async (categoryId, topicId, subsectionId, questionId) => {
    setData(prev => prev.map(c =>
      c.id === categoryId ? {
        ...c, topics: c.topics.map(t =>
          t.id === topicId ? {
            ...t, subsections: (t.subsections || []).map(s =>
              s.id === subsectionId ? {
                ...s, questions: s.questions.filter(q => q.id !== questionId),
              } : s
            ),
          } : t
        ),
      } : c
    ))
    const { error } = await supabase.from('questions').delete().eq('id', questionId)
    if (error) console.error('[delete question]', error.message)
  }

  const handleSubsectionQuestionStatus = async (categoryId, topicId, subsectionId, questionId, newStatus) => {
    setData(prev => prev.map(c =>
      c.id === categoryId ? {
        ...c, topics: c.topics.map(t =>
          t.id === topicId ? {
            ...t, subsections: (t.subsections || []).map(s =>
              s.id === subsectionId ? {
                ...s, questions: s.questions.map(q =>
                  q.id === questionId ? { ...q, status: newStatus } : q
                ),
              } : s
            ),
          } : t
        ),
      } : c
    ))
    const { error } = await supabase.from('user_question_progress').upsert(
      { user_id: uid, question_id: questionId, status: newStatus },
      { onConflict: 'user_id,question_id' }
    )
    if (error) console.error('[question status]', error.message)
  }

  // Bound handlers for the right panel
  const rightPanelHandlers = selectedRef ? {
    onEdit: (d) =>
      handleEditSubsection(selectedRef.categoryId, selectedRef.topicId, selectedRef.subsectionId, d),
    onDelete: () =>
      handleDeleteSubsection(selectedRef.categoryId, selectedRef.topicId, selectedRef.subsectionId),
    onAddQuestion: (d) =>
      handleAddSubsectionQuestion(selectedRef.categoryId, selectedRef.topicId, selectedRef.subsectionId, d),
    onEditQuestion: (qId, d) =>
      handleEditSubsectionQuestion(selectedRef.categoryId, selectedRef.topicId, selectedRef.subsectionId, qId, d),
    onDeleteQuestion: (qId) =>
      handleDeleteSubsectionQuestion(selectedRef.categoryId, selectedRef.topicId, selectedRef.subsectionId, qId),
    onQuestionStatusChange: (qId, newStatus) =>
      handleSubsectionQuestionStatus(selectedRef.categoryId, selectedRef.topicId, selectedRef.subsectionId, qId, newStatus),
  } : {}

  const meta = session?.user?.user_metadata || {}
  const displayProfile = profile || {
    id: uid,
    first_name: meta.first_name || session?.user?.email?.split('@')[0] || '',
    last_name: meta.last_name || '',
    display_name: meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || session?.user?.email || '',
    avatar_url: meta.avatar_url || '👨‍💻',
    role: meta.role || 'user',
    user_code: null,
  }

  if (dataLoading) {
    return (
      <div className="auth-page">
        <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading your plan…
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        totalUnits={total} doneUnits={done}
        onMenuOpen={() => setSidebarOpen(o => !o)}
        onDashboard={() => setShowDashboard(true)}
        profile={displayProfile} email={session?.user?.email}
        onLogout={handleLogout} onSettings={() => setShowSettings(true)}
      />

      <div className="app-body">
        <Sidebar
          categories={data}
          selectedCategoryId={selectedCategory?.id}
          onSelectCategory={handleSelectCategory}
          onAddCategory={() => setShowAddCategory(true)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          width={sidebarWidth}
        />

        <div
          className="panel-resizer"
          onMouseDown={onSidebarResizerDown}
          onDoubleClick={onSidebarResizerDbl}
          title="Drag to resize · Double-click to reset"
        />

        <div className={`main-panels ${mobileView === 'detail' ? 'mobile-detail-active' : ''}`}>
          <div className="middle-panel" style={{ width: middleWidth, flex: 'none' }}>
            {selectedCategory ? (
              <CategoryPanel
                category={selectedCategory}
                selectedSubsectionId={selectedRef?.type === 'subsection' ? selectedRef.subsectionId : null}
                selectedTopicQuestionsId={selectedRef?.type === 'topic' ? selectedRef.topicId : null}
                onSubsectionSelect={handleSubsectionSelect}
                onTopicQuestionsSelect={handleTopicQuestionsSelect}
                onEditCategory={setEditingCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddTopic={handleAddTopic}
                onEditTopic={handleEditTopic}
                onDeleteTopic={handleDeleteTopic}
                onTopicStatusChange={handleTopicStatusChange}
                onAddSubsection={handleAddSubsection}
                onEditSubsection={handleEditSubsection}
                onDeleteSubsection={handleDeleteSubsection}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p>Add a category from the sidebar to get started.</p>
              </div>
            )}
          </div>

          <div
            className="panel-resizer"
            onMouseDown={onMiddleResizerDown}
            onDoubleClick={onMiddleResizerDbl}
            title="Drag to resize · Double-click to reset"
          />

          <div className="right-panel">
            <button className="mobile-back-btn" onClick={() => setMobileView('topics')}>
              ← Back to topics
            </button>
            {selectedRef?.type === 'subsection' && selectedSubsection ? (
              <SubsectionDetail
                key={selectedSubsection.id}
                subsection={selectedSubsection}
                {...rightPanelHandlers}
              />
            ) : selectedRef?.type === 'topic' && selectedTopic ? (
              <QuestionsOverview
                key={selectedTopic.id}
                topic={selectedTopic}
                onQuestionStatusChange={(subId, qId, newStatus) =>
                  handleSubsectionQuestionStatus(selectedRef.categoryId, selectedRef.topicId, subId, qId, newStatus)
                }
              />
            ) : (
              <div className="right-panel-empty">
                <span className="right-panel-empty-icon">📖</span>
                <h3 className="right-panel-empty-title">Select a subsection</h3>
                <p>Click any subsection in the middle panel to view its resources and practice questions, or open <strong>📋 Questions Overview</strong> to see all questions for a topic.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        title="Add Category"
        onSubmit={handleAddCategory}
        type="category"
      />
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        onSubmit={handleEditCategorySubmit}
        initialData={editingCategory}
        type="category"
      />
      {showDashboard && (
        <Dashboard data={data} onClose={() => setShowDashboard(false)} />
      )}
      {showSettings && (
        <SettingsModal
          profile={profile || displayProfile}
          email={session?.user?.email}
          onClose={() => setShowSettings(false)}
          onSave={(updated) => { setProfile(updated); setShowSettings(false) }}
        />
      )}
    </div>
  )
}
