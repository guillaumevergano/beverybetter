-- ============================================
-- Be Very Better — Seed Data
-- Technos et chapitres initiaux
-- ============================================

-- Technologies
INSERT INTO technologies (id, name, icon, color, accent, display_order) VALUES
  ('nextjs', 'Next.js', '▲', '#000000', '#0070f3', 1),
  ('tailwind', 'Tailwind CSS', '🌊', '#0ea5e9', '#06b6d4', 2);

-- Chapitres Next.js
INSERT INTO chapters (tech_id, title, description, level, display_order) VALUES
  ('nextjs', 'Introduction à Next.js', 'Découvre ce qu''est Next.js, pourquoi l''utiliser et comment créer ton premier projet.', 'débutant', 1),
  ('nextjs', 'Le Routing (App Router)', 'Comprends le système de routing basé sur les fichiers avec le App Router de Next.js 13+.', 'débutant', 2),
  ('nextjs', 'Les Composants Server & Client', 'Maîtrise la différence entre Server Components et Client Components.', 'débutant', 3),
  ('nextjs', 'Le Data Fetching', 'Apprends à récupérer des données côté serveur et côté client dans Next.js.', 'intermédiaire', 4),
  ('nextjs', 'Les Server Actions', 'Utilise les Server Actions pour gérer les mutations de données sans API.', 'intermédiaire', 5),
  ('nextjs', 'Le Rendering (SSR, SSG, ISR)', 'Comprends les stratégies de rendu : Static, Server-Side et Incremental.', 'intermédiaire', 6),
  ('nextjs', 'Middleware & Auth', 'Implémente des middlewares et la gestion d''authentification.', 'avancé', 7),
  ('nextjs', 'Optimisation & Déploiement', 'Optimise les performances et déploie sur Vercel.', 'avancé', 8);

-- Chapitres Tailwind CSS
INSERT INTO chapters (tech_id, title, description, level, display_order) VALUES
  ('tailwind', 'Introduction à Tailwind', 'Découvre l''approche utility-first et installe Tailwind dans ton projet.', 'débutant', 1),
  ('tailwind', 'Layout & Spacing', 'Maîtrise Flexbox, Grid, padding, margin et le système d''espacement.', 'débutant', 2),
  ('tailwind', 'Typographie & Couleurs', 'Gère les polices, tailles de texte et la palette de couleurs Tailwind.', 'débutant', 3),
  ('tailwind', 'Responsive Design', 'Crée des interfaces adaptatives avec les breakpoints de Tailwind.', 'intermédiaire', 4),
  ('tailwind', 'États & Pseudo-classes', 'Utilise hover, focus, active, group et les variants conditionnels.', 'intermédiaire', 5),
  ('tailwind', 'Animations & Transitions', 'Ajoute du mouvement avec les classes d''animation et de transition.', 'intermédiaire', 6),
  ('tailwind', 'Personnalisation du thème', 'Étends et personnalise Tailwind via tailwind.config.js.', 'avancé', 7),
  ('tailwind', 'Composants réutilisables & @apply', 'Crée des patterns réutilisables et organise ton CSS.', 'avancé', 8);
