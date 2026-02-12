# CLAUDE.md — Be Very Better

## 🎯 Projet

**Be Very Better** est une plateforme d'apprentissage basée sur des projets réels.
L'utilisateur apprend des technologies web en suivant des cours générés par IA (Claude) et en passant des QCM.
Le MVP couvre **Next.js** et **Tailwind CSS** (2 technos, 8 chapitres chacune).

## 🏗️ Stack technique

| Couche | Techno | Détail |
|--------|--------|--------|
| Framework | Next.js 15 | App Router, Server Components, Route Handlers |
| Styling | Tailwind CSS 4 | Utility-first, config custom |
| BDD | Supabase | PostgreSQL + Auth + RLS + Realtime |
| Auth | Supabase Auth | Email/password, middleware protection |
| IA | API Anthropic | claude-sonnet-4-20250514, génère cours + QCM |
| Déploiement | Vercel | Auto-deploy depuis GitHub |
| Langage | TypeScript | Mode strict, zéro `any` |

## 📁 Structure du projet

```
src/
├── app/
│   ├── layout.tsx                          # Layout racine (fonts, providers, metadata)
│   ├── page.tsx                            # Landing → redirect /dashboard ou /auth/login
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Connexion email/password
│   │   └── signup/page.tsx                 # Inscription + choix pseudo
│   ├── (protected)/
│   │   ├── layout.tsx                      # Layout protégé (vérifie auth, affiche Header)
│   │   ├── dashboard/page.tsx              # Dashboard : cards technos + progression
│   │   ├── learn/[techId]/
│   │   │   ├── page.tsx                    # Liste chapitres d'une techno
│   │   │   └── [chapterId]/page.tsx        # Cours généré par Claude
│   │   └── qcm/[techId]/[chapterId]/page.tsx  # QCM généré par Claude
│   └── api/
│       ├── generate-course/route.ts        # POST → génère cours via Claude
│       └── generate-qcm/route.ts           # POST → génère QCM via Claude
├── components/
│   ├── ui/          # Button, Card, Badge, ProgressRing, Spinner, CodeBlock
│   ├── layout/      # Header, MobileNav, UserMenu
│   ├── course/      # CourseContent, CourseSection, KeyPoints
│   └── qcm/        # QCMQuestion, QCMOptions, QCMResult, ScoreCard
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # createBrowserClient()
│   │   ├── server.ts      # createServerClient() pour Server Components
│   │   └── middleware.ts   # Auth middleware helper
│   ├── claude.ts           # callClaude(), prompts cours/QCM
│   ├── constants.ts        # TECHS, CHAPTERS, LEVELS
│   └── utils.ts            # cn(), formatXP(), etc.
├── hooks/
│   ├── useAuth.ts          # Session utilisateur
│   └── useProgress.ts      # Progression (lecture/écriture Supabase)
├── types/
│   └── index.ts            # Tous les types TS du projet
└── styles/
    └── globals.css         # @tailwind directives + fonts + custom
```

## 🗄️ Base de données Supabase

Le schéma complet est dans `supabase/migrations/001_initial_schema.sql`.

### Tables
- **profiles** : pseudo, avatar_url, xp_total (créé auto via trigger à l'inscription)
- **technologies** : id slug, name, icon, color, accent, order
- **chapters** : techno_id FK, title, description, level (enum), order
- **user_progress** : user_id FK, chapter_id FK, completed, score, best_score, attempts, xp_earned
- **qcm_sessions** : user_id, chapter_id, score, total, started_at, completed_at
- **qcm_answers** : session_id FK, question_index, selected, correct, question_text
- **generated_content** : chapter_id, content_type (enum: course/qcm), content (JSONB), generated_at

### RLS (Row Level Security) — OBLIGATOIRE
- `profiles` : SELECT/UPDATE own row only
- `technologies` / `chapters` : SELECT pour tous (données publiques)
- `user_progress` : SELECT/INSERT/UPDATE own rows only
- `qcm_sessions` / `qcm_answers` : SELECT/INSERT own rows only
- `generated_content` : SELECT pour tous (cache partagé)

## 🤖 Génération de contenu IA

### Flow cours
1. Client GET `/learn/[techId]/[chapterId]`
2. Server Component vérifie `generated_content` en cache
3. Si absent → POST `/api/generate-course` → Claude génère → stocke en cache → retourne
4. Si présent → sert le cache directement

### Flow QCM
1. Client navigue vers `/qcm/[techId]/[chapterId]`
2. Même logique de cache que les cours
3. À la fin du QCM : écriture dans `qcm_sessions`, `qcm_answers`, mise à jour `user_progress`

### Modèle Claude
- Modèle : `claude-sonnet-4-20250514`
- Max tokens : 2000
- Réponse : JSON pur (pas de markdown, pas de backticks)
- Prompts dans `lib/claude.ts`

## 🔐 Authentification

- **Supabase Auth** email/password
- **Middleware Next.js** (`middleware.ts` à la racine de `src/`) :
  - Routes `(protected)/*` → redirect `/auth/login` si pas de session
  - Routes `(auth)/*` → redirect `/dashboard` si déjà connecté
- **Trigger SQL** : à la création d'un user auth, insert automatique dans `profiles`
- **Pseudo** demandé à l'inscription, stocké dans `profiles.pseudo`

## 🎨 Design System

### Tokens
- Background page : `#f8fafc`
- Background header : `#0f172a`
- Primary : `#0070f3`
- Next.js color : `#000000`
- Tailwind color : `#0ea5e9`
- Success : `#10b981` | Warning : `#f59e0b` | Error : `#ef4444`
- Border radius : cards `20px`, buttons `12px`, badges `8px`

### Fonts (Google Fonts)
- **Space Grotesk** 700-800 : titres
- **DM Sans** 400-800 : corps
- **JetBrains Mono** 400-600 : code

### Niveaux
- Débutant : bg `#d1fae5`, text `#065f46`, dot `#10b981`
- Intermédiaire : bg `#fef3c7`, text `#92400e`, dot `#f59e0b`
- Avancé : bg `#fee2e2`, text `#991b1b`, dot `#ef4444`

### Responsive
- Mobile-first
- Breakpoints Tailwind par défaut : sm/md/lg/xl
- Cards technos : 1 col mobile, 2 cols desktop
- Navigation : header desktop, bottom nav mobile

## ✅ Règles de code

1. **TypeScript strict** — Zéro `any`, tout typé dans `types/index.ts`
2. **Server Components par défaut** — `"use client"` seulement si interactivité
3. **Error boundaries** — Chaque route a un `error.tsx`
4. **Loading states** — Chaque route async a un `loading.tsx`
5. **Variables d'env** — Jamais de clé en dur. Tout dans `.env.local`
6. **RLS Supabase** — Jamais de `service_role_key` côté client
7. **Cache IA** — Toujours vérifier `generated_content` avant d'appeler Claude
8. **Commits** — Format conventionnel : `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

## 🚀 Déploiement

### Vercel
- Connecter repo GitHub `guillaumevergano/beverybetter`
- Framework preset : Next.js
- Root directory : `.` (défaut)
- Build : `next build`
- Env vars à configurer :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`

### Supabase
- Créer un projet sur supabase.com
- Exécuter `supabase/migrations/001_initial_schema.sql`
- Exécuter `supabase/migrations/002_seed_data.sql`
- Activer RLS sur toutes les tables

## 📋 Commandes

```bash
npm run dev          # Dev server localhost:3000
npm run build        # Build production
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```
