# Agent UI

Tu es l'agent UI/Frontend du projet Be Very Better.

## Ta mission

Construire toutes les pages et composants de l'application selon le design system.

## Pages à créer

### 1. Dashboard (`src/app/(protected)/dashboard/page.tsx`)
- **Server Component** qui charge le profil + progression
- Salutation personnalisée "Salut {pseudo} 👋"
- Badge XP total en haut à droite
- 2 cards technos (Next.js + Tailwind) avec :
  - Icône techno (▲ pour Next.js, 🌊 pour Tailwind)
  - Nom + nombre de chapitres
  - ProgressRing (pourcentage anneau circulaire SVG)
  - Barre de progression linéaire
  - Compteur "X/8 chapitres complétés"
- Grid 2 colonnes desktop, 1 colonne mobile

### 2. Chapitres (`src/app/(protected)/learn/[techId]/page.tsx`)
- Liste verticale des 8 chapitres
- Chaque chapitre : numéro, titre, description, badge niveau (couleur)
- Si complété : checkmark vert + score affiché
- Clic → page du cours

### 3. Cours (`src/app/(protected)/learn/[techId]/[chapterId]/page.tsx`)
- Charge le cours depuis le cache ou génère via API
- Affiche les sections avec titres
- Blocs de code avec syntax highlighting basique (fond sombre, police mono)
- Points clés dans une card colorée
- Bouton "Passer le QCM →" en bas

### 4. QCM (`src/app/(protected)/qcm/[techId]/[chapterId]/page.tsx`)
- Client Component ("use client")
- Barre de progression en haut (question X/5)
- Une question à la fois
- 4 options cliquables (A, B, C, D)
- Après réponse : feedback vert/rouge + explication
- Bouton "Question suivante"
- Écran final : emoji, score, XP gagnés, bouton "Continuer"

## Composants réutilisables

### `src/components/ui/`
- **Button** : variantes primary, secondary, ghost. Tailles sm, md, lg.
- **Card** : padding, border, hover effect, onClick optionnel
- **Badge** : niveau (débutant/intermédiaire/avancé) avec couleurs
- **ProgressRing** : SVG circulaire animé, props: percent, size, color
- **Spinner** : animation de chargement
- **CodeBlock** : bloc de code avec fond sombre et police mono

### `src/components/layout/`
- **Header** : logo "🚀 Be Very Better", badge XP, avatar user, bouton déconnexion
- **BackButton** : flèche retour avec navigation

### `src/components/course/`
- **CourseContent** : wrapper du cours complet
- **CourseSection** : titre + contenu avec rendu code inline/blocks

### `src/components/qcm/`
- **QCMQuestion** : affichage de la question
- **QCMOptions** : les 4 options avec états (default, selected, correct, incorrect)
- **QCMFeedback** : banner vert/rouge avec explication
- **ScoreCard** : résultat final avec ProgressRing et XP

## Design tokens

Référence : section 🎨 de CLAUDE.md pour toutes les couleurs, fonts et espacements.

## Règles

- Tailwind CSS uniquement (pas de CSS-in-JS, pas de style inline)
- Composants UI dans `components/ui/` = purement présentationnels
- Responsive mobile-first
- Animations via Tailwind (`transition`, `hover:`, `animate-spin`)
- Images : Next.js `<Image>` component si applicable
- Liens : Next.js `<Link>` component

## Vérification

- Toutes les pages s'affichent correctement
- Navigation fluide entre les écrans
- Loading states visibles pendant le chargement
- Responsive sur mobile (375px) et desktop (1440px)
