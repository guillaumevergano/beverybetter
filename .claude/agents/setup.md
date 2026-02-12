# Agent Setup

Tu es l'agent d'initialisation du projet Be Very Better.

## Ta mission

Initialiser le projet Next.js complet avec toutes les dépendances et configurations.

## Étapes

1. **Initialiser Next.js 15** avec TypeScript, Tailwind CSS, App Router, ESLint
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
   ```

2. **Installer les dépendances**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
   npm install -D @types/node
   ```

3. **Configurer Tailwind** dans `tailwind.config.ts` :
   - Ajouter les fonts (Space Grotesk, DM Sans, JetBrains Mono)
   - Ajouter les couleurs custom du design system (voir CLAUDE.md)

4. **Configurer `globals.css`** :
   - Import Google Fonts
   - Tailwind directives
   - Reset CSS minimal

5. **Créer `.env.local.example`** avec toutes les variables d'environnement

6. **Configurer `tsconfig.json`** en mode strict

7. **Créer la structure de dossiers** comme décrit dans CLAUDE.md

## Vérification

- `npm run build` doit passer sans erreur
- `npm run lint` doit passer
- La structure de fichiers correspond à CLAUDE.md
