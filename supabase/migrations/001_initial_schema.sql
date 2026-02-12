-- ============================================
-- Be Very Better — Schema initial
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE chapter_level AS ENUM ('débutant', 'intermédiaire', 'avancé');
CREATE TYPE content_type AS ENUM ('course', 'qcm');

-- ============================================
-- TABLE: profiles
-- Profil utilisateur, créé automatiquement à l'inscription
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo TEXT NOT NULL,
  avatar_url TEXT,
  xp_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: technologies
-- Les technos disponibles sur la plateforme
-- ============================================
CREATE TABLE technologies (
  id TEXT PRIMARY KEY, -- slug: 'nextjs', 'tailwind'
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  accent TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: chapters
-- Chapitres de cours par techno
-- ============================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tech_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level chapter_level NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tech_id, display_order)
);

-- ============================================
-- TABLE: user_progress
-- Progression de l'utilisateur par chapitre
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  score INTEGER, -- dernier score
  best_score INTEGER, -- meilleur score
  attempts INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- ============================================
-- TABLE: qcm_sessions
-- Historique des sessions QCM
-- ============================================
CREATE TABLE qcm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: qcm_answers
-- Réponses détaillées d'une session QCM
-- ============================================
CREATE TABLE qcm_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES qcm_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  selected_option INTEGER NOT NULL,
  correct_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: generated_content
-- Cache des contenus générés par Claude
-- ============================================
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, content_type)
);

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, pseudo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'pseudo', 'Utilisateur')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: update updated_at on profiles
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Technologies (public read)
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Technologies are viewable by everyone"
  ON technologies FOR SELECT
  USING (true);

-- Chapters (public read)
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters are viewable by everyone"
  ON chapters FOR SELECT
  USING (true);

-- User Progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- QCM Sessions
ALTER TABLE qcm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON qcm_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON qcm_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- QCM Answers
ALTER TABLE qcm_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON qcm_answers FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM qcm_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers"
  ON qcm_answers FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM qcm_sessions WHERE user_id = auth.uid()
    )
  );

-- Generated Content (public read, server write)
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Generated content is viewable by everyone"
  ON generated_content FOR SELECT
  USING (true);

-- Note: INSERT/UPDATE on generated_content is done via service_role_key server-side

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_chapters_tech ON chapters(tech_id, display_order);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_chapter ON user_progress(chapter_id);
CREATE INDEX idx_qcm_sessions_user ON qcm_sessions(user_id);
CREATE INDEX idx_generated_content_chapter ON generated_content(chapter_id, content_type);
