-- ============================================
-- Be Very Better — Seed Badges (20 badges)
-- ============================================

INSERT INTO badges (slug, name, description, icon, rarity, condition_type, condition_value, xp_reward) VALUES
-- Common (4)
('first_course', 'Premier Pas', 'Terminer votre premier cours', '📖', 'common', 'courses_completed', 1, 50),
('first_quiz', 'Première Épreuve', 'Compléter votre premier QCM', '✏️', 'common', 'quizzes_completed', 1, 50),
('ten_courses', 'Étudiant Assidu', 'Terminer 10 cours', '📚', 'common', 'courses_completed', 10, 100),
('first_perfect', 'Sans Faute', 'Obtenir un score parfait à un QCM', '🎯', 'common', 'perfect_quizzes', 1, 100),

-- Rare (7)
('streak_7', 'Semaine de Feu', 'Maintenir un streak de 7 jours', '🔥', 'rare', 'streak_days', 7, 200),
('six_perfects', 'Perfectionniste', 'Obtenir 6 scores parfaits', '💎', 'rare', 'perfect_quizzes', 6, 250),
('three_technos', 'Explorateur', 'Commencer 3 technologies différentes', '🧭', 'rare', 'technologies_started', 3, 200),
('night_owl', 'Oiseau de Nuit', 'Étudier entre minuit et 5h du matin', '🦉', 'rare', 'night_study', 1, 150),
('comeback', 'Retour en Force', 'Revenir après 7 jours d''absence', '💪', 'rare', 'comeback_days', 7, 150),
('speedrunner', 'Speedrunner', 'Compléter un QCM parfait en moins de 60 secondes', '⚡', 'rare', 'speed_perfect', 1, 200),
('all_courses_techno', 'Maître de Techno', 'Terminer tous les cours d''une technologie', '🏅', 'rare', 'techno_courses_complete', 1, 300),

-- Epic (5)
('streak_30', 'Flamme Éternelle', 'Maintenir un streak de 30 jours', '🌟', 'epic', 'streak_days', 30, 500),
('techno_perfect', 'Perfection Absolue', 'Score parfait sur tous les QCM d''une techno', '👑', 'epic', 'techno_all_perfect', 1, 500),
('all_technos', 'Touche-à-tout', 'Commencer toutes les technologies disponibles', '🌍', 'epic', 'all_technologies', 1, 400),
('level_10', 'Niveau Max', 'Atteindre le niveau 10', '⭐', 'epic', 'level_reached', 10, 500),
('marathon', 'Marathon', 'Compléter 5 cours en une seule journée', '🏃', 'epic', 'daily_courses', 5, 400),

-- Legendary (4)
('streak_100', 'Légende Vivante', 'Maintenir un streak de 100 jours', '🏆', 'legendary', 'streak_days', 100, 1000),
('founder', 'Fondateur', 'Être parmi les 100 premiers inscrits', '🎖️', 'legendary', 'early_adopter', 100, 500),
('insomniac', 'Insomniaque', 'Étudier 5 nuits différentes entre minuit et 5h', '🌙', 'legendary', 'night_study', 5, 500),
('redemption', 'Rédemption', 'Obtenir un score parfait après 3 échecs au même QCM', '🔄', 'legendary', 'redemption_perfect', 1, 750);
