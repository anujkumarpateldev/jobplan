-- =============================================================
-- SWE Prep Tracker — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- future: fuzzy search on titles


-- ---------------------------------------------------------------
-- 1. PROFILES
--    One row per authenticated user.
--    Auto-created via trigger when auth.users row is inserted.
-- ---------------------------------------------------------------
CREATE TABLE profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  -- interview goals (used by future dashboard features)
  target_role     TEXT        DEFAULT '',
  target_companies TEXT[]     DEFAULT '{}',
  interview_date  DATE,
  daily_goal_hrs  NUMERIC(3,1) DEFAULT 2,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE profiles IS
  'Public-facing user data. Extends auth.users 1-to-1.';


-- ---------------------------------------------------------------
-- 2. CATEGORIES
--    Top-level buckets (DSA, System Design, Behavioral…).
--    created_by IS NULL  → system template, readable by all users.
--    created_by = uuid   → user-created, private to that user.
-- ---------------------------------------------------------------
CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT '📁',
  position    INTEGER     NOT NULL DEFAULT 0,
  is_archived BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN categories.created_by IS
  'NULL = system template visible to all. UUID = private to that user.';


-- ---------------------------------------------------------------
-- 3. TOPICS
--    A named area inside a category (e.g. "Arrays & Hashing").
-- ---------------------------------------------------------------
CREATE TABLE topics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ---------------------------------------------------------------
-- 4. SUBSECTIONS
--    A focused sub-topic under a topic (e.g. "Sliding Window").
-- ---------------------------------------------------------------
CREATE TABLE subsections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID        NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ---------------------------------------------------------------
-- 5. RESOURCES
--    Video or website links attached to a subsection.
-- ---------------------------------------------------------------
CREATE TABLE resources (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id  UUID  NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  type           TEXT  NOT NULL CHECK (type IN ('video', 'website')),
  label          TEXT  NOT NULL DEFAULT '',
  url            TEXT  NOT NULL,
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);


-- ---------------------------------------------------------------
-- 6. QUESTIONS
--    A single practice question.
--    Belongs to EITHER a subsection OR a topic directly (not both).
-- ---------------------------------------------------------------
CREATE TABLE questions (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id  UUID  REFERENCES subsections(id) ON DELETE CASCADE,
  topic_id       UUID  REFERENCES topics(id) ON DELETE CASCADE,
  created_by     UUID  REFERENCES profiles(id) ON DELETE SET NULL,
  title          TEXT  NOT NULL,
  url            TEXT  NOT NULL DEFAULT '',
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT question_single_parent CHECK (
    (subsection_id IS NOT NULL AND topic_id IS NULL) OR
    (subsection_id IS NULL     AND topic_id IS NOT NULL)
  )
);

COMMENT ON CONSTRAINT question_single_parent ON questions IS
  'A question must belong to exactly one parent: a subsection OR a topic.';


-- ---------------------------------------------------------------
-- 7. USER_CATEGORY_SELECTIONS
--    Which categories each user has added to their study plan.
--    Allows custom ordering per user (position column).
-- ---------------------------------------------------------------
CREATE TABLE user_category_selections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  position    INTEGER     NOT NULL DEFAULT 0,  -- user's personal sort order
  added_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, category_id)
);

COMMENT ON TABLE user_category_selections IS
  'Defines each user''s personal study plan: which categories they enrolled in.';


-- ---------------------------------------------------------------
-- 8. USER_QUESTION_PROGRESS
--    Per-user status for every question they have accessed.
--    Decoupled from content so shared questions work for N users.
-- ---------------------------------------------------------------
CREATE TABLE user_question_progress (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started', 'in_progress', 'done')),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, question_id)
);


-- ---------------------------------------------------------------
-- 9. USER_TOPIC_STATUS
--    For topics that have NO questions (status tracked at topic level).
-- ---------------------------------------------------------------
CREATE TABLE user_topic_status (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id    UUID        NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started', 'in_progress', 'done')),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, topic_id)
);


-- ---------------------------------------------------------------
-- 10. USER_QUESTION_NOTES  (future: notes per question)
--     Each user can write their own notes/answers per question.
-- ---------------------------------------------------------------
CREATE TABLE user_question_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, question_id)
);


-- ---------------------------------------------------------------
-- 11. STUDY_SESSIONS  (future: streaks & activity heatmap)
--     One row per user per day they studied anything.
-- ---------------------------------------------------------------
CREATE TABLE study_sessions (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                DATE    NOT NULL DEFAULT CURRENT_DATE,
  questions_reviewed  INTEGER NOT NULL DEFAULT 0,
  questions_completed INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, date)
);


-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_categories_created_by   ON categories(created_by);
CREATE INDEX idx_topics_category_id      ON topics(category_id);
CREATE INDEX idx_topics_created_by       ON topics(created_by);
CREATE INDEX idx_subsections_topic_id    ON subsections(topic_id);
CREATE INDEX idx_resources_subsection_id ON resources(subsection_id);
CREATE INDEX idx_questions_subsection_id ON questions(subsection_id);
CREATE INDEX idx_questions_topic_id      ON questions(topic_id);

CREATE INDEX idx_ucs_user_id      ON user_category_selections(user_id);
CREATE INDEX idx_ucs_category_id  ON user_category_selections(category_id);

CREATE INDEX idx_uqp_user_id      ON user_question_progress(user_id);
CREATE INDEX idx_uqp_question_id  ON user_question_progress(question_id);

CREATE INDEX idx_uts_user_id      ON user_topic_status(user_id);
CREATE INDEX idx_uts_topic_id     ON user_topic_status(topic_id);

CREATE INDEX idx_ss_user_date     ON study_sessions(user_id, date DESC);


-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','categories','topics','subsections',
    'questions','user_question_progress','user_topic_status',
    'user_question_notes','study_sessions'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()',
      t
    );
  END LOOP;
END;
$$;


-- Auto-create profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();


-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections               ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_selections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_status         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions            ENABLE ROW LEVEL SECURITY;


-- ---- profiles ----
CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE USING (auth.uid() = id);


-- ---- categories ----
-- System templates (created_by IS NULL) → all authenticated users can read.
-- User-created categories → only that user can read/write.
CREATE POLICY "categories: read system templates or own"
  ON categories FOR SELECT
  USING (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY "categories: insert own"
  ON categories FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "categories: update own"
  ON categories FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "categories: delete own"
  ON categories FOR DELETE
  USING (created_by = auth.uid());


-- ---- topics ----
CREATE POLICY "topics: read if category is accessible"
  ON topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = topics.category_id
        AND (c.created_by IS NULL OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "topics: write if own category"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = topics.category_id AND c.created_by = auth.uid()
    )
  );


-- ---- subsections ----
CREATE POLICY "subsections: read if topic is accessible"
  ON subsections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN categories c ON c.id = t.category_id
      WHERE t.id = subsections.topic_id
        AND (c.created_by IS NULL OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "subsections: write if own category"
  ON subsections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM topics t
      JOIN categories c ON c.id = t.category_id
      WHERE t.id = subsections.topic_id AND c.created_by = auth.uid()
    )
  );


-- ---- resources ----
CREATE POLICY "resources: read if subsection is accessible"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subsections s
      JOIN topics t ON t.id = s.topic_id
      JOIN categories c ON c.id = t.category_id
      WHERE s.id = resources.subsection_id
        AND (c.created_by IS NULL OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "resources: write if own category"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subsections s
      JOIN topics t ON t.id = s.topic_id
      JOIN categories c ON c.id = t.category_id
      WHERE s.id = resources.subsection_id AND c.created_by = auth.uid()
    )
  );


-- ---- questions ----
CREATE POLICY "questions: read if parent is accessible"
  ON questions FOR SELECT
  USING (
    -- question under subsection
    (subsection_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM subsections s
      JOIN topics t ON t.id = s.topic_id
      JOIN categories c ON c.id = t.category_id
      WHERE s.id = questions.subsection_id
        AND (c.created_by IS NULL OR c.created_by = auth.uid())
    ))
    OR
    -- question directly under topic
    (topic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM topics t
      JOIN categories c ON c.id = t.category_id
      WHERE t.id = questions.topic_id
        AND (c.created_by IS NULL OR c.created_by = auth.uid())
    ))
  );

CREATE POLICY "questions: write if own category"
  ON questions FOR ALL
  USING (
    (subsection_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM subsections s
      JOIN topics t ON t.id = s.topic_id
      JOIN categories c ON c.id = t.category_id
      WHERE s.id = questions.subsection_id AND c.created_by = auth.uid()
    ))
    OR
    (topic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM topics t
      JOIN categories c ON c.id = t.category_id
      WHERE t.id = questions.topic_id AND c.created_by = auth.uid()
    ))
  );


-- ---- user-owned tables (strict: only the owner) ----
CREATE POLICY "user_category_selections: own rows only"
  ON user_category_selections FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_question_progress: own rows only"
  ON user_question_progress FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_topic_status: own rows only"
  ON user_topic_status FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_question_notes: own rows only"
  ON user_question_notes FOR ALL USING (user_id = auth.uid());

CREATE POLICY "study_sessions: own rows only"
  ON study_sessions FOR ALL USING (user_id = auth.uid());


-- =============================================================
-- HELPER VIEW: user's full plan with progress
-- Returns a user's enrolled categories with per-category stats.
-- Usage: SELECT * FROM v_user_plan WHERE user_id = auth.uid();
-- =============================================================
CREATE OR REPLACE VIEW v_user_plan AS
SELECT
  ucs.user_id,
  c.id                  AS category_id,
  c.title               AS category_title,
  c.icon                AS category_icon,
  ucs.position          AS user_position,
  COUNT(DISTINCT t.id)  AS topic_count,
  COUNT(DISTINCT q.id)  AS question_count,
  COUNT(DISTINCT uqp.question_id)
    FILTER (WHERE uqp.status = 'done')
                        AS questions_done,
  COUNT(DISTINCT uqp.question_id)
    FILTER (WHERE uqp.status = 'in_progress')
                        AS questions_in_progress,
  CASE
    WHEN COUNT(DISTINCT q.id) = 0 THEN 0
    ELSE ROUND(
      100.0 * COUNT(DISTINCT uqp.question_id) FILTER (WHERE uqp.status = 'done')
      / NULLIF(COUNT(DISTINCT q.id), 0)
    )
  END                   AS progress_pct
FROM user_category_selections ucs
JOIN categories c ON c.id = ucs.category_id
LEFT JOIN topics t ON t.category_id = c.id
LEFT JOIN (
  SELECT q.id, q.topic_id, q.subsection_id
  FROM questions q
) q ON q.topic_id = t.id
    OR q.subsection_id IN (SELECT id FROM subsections WHERE topic_id = t.id)
LEFT JOIN user_question_progress uqp
  ON uqp.question_id = q.id AND uqp.user_id = ucs.user_id
GROUP BY ucs.user_id, c.id, c.title, c.icon, ucs.position;
