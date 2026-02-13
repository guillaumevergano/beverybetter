-- ============================================
-- Be Very Better — Migration 009 : Parrainage
-- ============================================

-- ---- Ajouter referral_code et referred_by a profiles ----
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- ---- Ajouter 'referral' au type xp_source ----
ALTER TYPE xp_source ADD VALUE IF NOT EXISTS 'referral';

-- ---- Fonction : generer code parrainage (reutilise le meme charset) ----
CREATE OR REPLACE FUNCTION generate_referral_code()
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

-- ---- Backfill : generer des codes pour les profils existants ----
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(
        SELECT 1 FROM profiles WHERE referral_code = new_code
        UNION ALL
        SELECT 1 FROM teams WHERE invite_code = new_code
      ) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE profiles SET referral_code = new_code WHERE id = r.id;
  END LOOP;
END $$;

-- ---- Rendre NOT NULL apres backfill ----
ALTER TABLE profiles ALTER COLUMN referral_code SET NOT NULL;

-- ---- Mettre a jour le trigger handle_new_user pour generer referral_code + referred_by ----
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
  new_referral_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Chercher le parrain via le code fourni a l'inscription
  ref_code := NEW.raw_user_meta_data->>'referral_code';

  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT id INTO referrer_id FROM profiles WHERE referral_code = upper(ref_code);
  END IF;

  -- Generer un code de parrainage unique pour le nouvel utilisateur
  LOOP
    new_referral_code := generate_referral_code();
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE referral_code = new_referral_code
      UNION ALL
      SELECT 1 FROM teams WHERE invite_code = new_referral_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  INSERT INTO profiles (id, pseudo, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'pseudo', 'Utilisateur'),
    new_referral_code,
    referrer_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---- Badges parrainage ----
INSERT INTO badges (slug, name, description, icon, rarity, condition_type, condition_value, xp_reward) VALUES
('first_referral', 'Parrain', 'Parrainer un premier utilisateur', '🤝', 'common', 'referrals', 1, 50),
('five_referrals', 'Recruteur', 'Parrainer 5 utilisateurs', '🌟', 'rare', 'referrals', 5, 150),
('ten_referrals', 'Ambassadeur', 'Parrainer 10 utilisateurs', '👑', 'epic', 'referrals', 10, 300),
('twenty_five_referrals', 'Legendaire', 'Parrainer 25 utilisateurs', '🏆', 'legendary', 'referrals', 25, 500)
ON CONFLICT (slug) DO NOTHING;
