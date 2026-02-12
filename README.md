# 🚀 Be Very Better

Plateforme d'apprentissage basée sur des projets réels. Apprends les technologies web en suivant des cours générés par IA et en passant des QCM.

## Stack

- **Next.js 15** — App Router, Server Components
- **Tailwind CSS 4** — Utility-first styling
- **Supabase** — PostgreSQL, Auth, Row Level Security
- **Claude AI** — Génération de cours et QCM
- **Vercel** — Déploiement

## Démarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/guillaumevergano/beverybetter.git
cd beverybetter

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local
# Remplir les valeurs dans .env.local

# 4. Lancer en développement
npm run dev
```

## Setup Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations SQL :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
3. Copier l'URL et les clés dans `.env.local`

## Déploiement

Le projet se déploie automatiquement sur **Vercel** à chaque push sur `main`.

Configurer les variables d'environnement sur Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

## Structure

Voir [CLAUDE.md](./CLAUDE.md) pour la documentation technique complète.
