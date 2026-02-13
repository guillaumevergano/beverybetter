-- ============================================
-- Be Very Better — Migration 008 : Teams
-- ============================================

-- ---- Table teams ----
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  description TEXT DEFAULT '',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Table team_members ----
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Un utilisateur ne peut etre que dans une seule equipe
CREATE UNIQUE INDEX IF NOT EXISTS team_members_user_unique ON team_members(user_id);

-- ---- Fonction : generer un code d'invitation ----
-- Caracteres sans ambiguite (pas de 0/O/1/I/L)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ---- Trigger : auto-generer invite_code avant INSERT ----
CREATE OR REPLACE FUNCTION trigger_set_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM teams WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.invite_code := new_code;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER teams_set_invite_code
  BEFORE INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_invite_code();

-- ---- Trigger : auto-ajouter owner comme membre ----
CREATE OR REPLACE FUNCTION trigger_add_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER teams_add_owner_member
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_owner_as_member();

-- ---- Trigger : updated_at sur teams ----
CREATE OR REPLACE FUNCTION trigger_teams_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION trigger_teams_updated_at();

-- ---- Fonction helper RLS : get_my_team_id ----
-- SECURITY DEFINER pour bypass RLS et eviter la recursion infinie
CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ---- Fonction helper RLS : is_teammate ----
CREATE OR REPLACE FUNCTION is_teammate(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = target_user_id
      AND tm1.user_id != tm2.user_id
  );
$$;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ---- teams policies ----
CREATE POLICY "teams_select_authenticated"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teams_insert_owner"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "teams_update_owner"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "teams_delete_owner"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ---- team_members policies ----
CREATE POLICY "team_members_select_same_team"
  ON team_members FOR SELECT
  TO authenticated
  USING (team_id = get_my_team_id());

CREATE POLICY "team_members_insert_self"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'member');

CREATE POLICY "team_members_delete_self_or_owner"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT t.owner_id FROM teams t WHERE t.id = team_id
    )
  );

-- ---- Nouvelles policies sur tables existantes (acces coequipiers) ----

-- profiles : coequipiers peuvent voir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_teammate' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_select_teammate" ON profiles FOR SELECT TO authenticated USING (is_teammate(id))';
  END IF;
END $$;

-- user_progress : coequipiers peuvent voir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_progress_select_teammate' AND tablename = 'user_progress'
  ) THEN
    EXECUTE 'CREATE POLICY "user_progress_select_teammate" ON user_progress FOR SELECT TO authenticated USING (is_teammate(user_id))';
  END IF;
END $$;

-- user_streaks : coequipiers peuvent voir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_streaks_select_teammate' AND tablename = 'user_streaks'
  ) THEN
    EXECUTE 'CREATE POLICY "user_streaks_select_teammate" ON user_streaks FOR SELECT TO authenticated USING (is_teammate(user_id))';
  END IF;
END $$;

-- user_badges : coequipiers peuvent voir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_badges_select_teammate' AND tablename = 'user_badges'
  ) THEN
    EXECUTE 'CREATE POLICY "user_badges_select_teammate" ON user_badges FOR SELECT TO authenticated USING (is_teammate(user_id))';
  END IF;
END $$;

-- xp_events : coequipiers peuvent voir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'xp_events_select_teammate' AND tablename = 'xp_events'
  ) THEN
    EXECUTE 'CREATE POLICY "xp_events_select_teammate" ON xp_events FOR SELECT TO authenticated USING (is_teammate(user_id))';
  END IF;
END $$;

-- user_certifications : coequipiers peuvent voir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_certifications_select_teammate' AND tablename = 'user_certifications'
  ) THEN
    EXECUTE 'CREATE POLICY "user_certifications_select_teammate" ON user_certifications FOR SELECT TO authenticated USING (is_teammate(user_id))';
  END IF;
END $$;
