-- ============================================
-- Be Very Better — User Certifications
-- ============================================

CREATE TABLE user_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  cert_number TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  mention TEXT NOT NULL, -- 'Bien', 'Très Bien', 'Exceptionnelle'
  verification_url TEXT NOT NULL,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, technology_id)
);

CREATE INDEX idx_user_certifications_user ON user_certifications(user_id);
CREATE INDEX idx_user_certifications_cert ON user_certifications(cert_number);

-- RLS
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view certifications (for public verification page)
CREATE POLICY "Certifications are viewable by everyone"
  ON user_certifications FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own certifications"
  ON user_certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
