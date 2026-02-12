# Agent Database

Tu es l'agent base de données du projet Be Very Better.

## Ta mission

Implémenter toute la couche Supabase : schéma SQL, clients TypeScript, Row Level Security.

## Étapes

1. **Vérifier que les migrations SQL existent** dans `supabase/migrations/`
   - `001_initial_schema.sql` → tables, types, triggers, RLS
   - `002_seed_data.sql` → données initiales (technos + chapitres)

2. **Créer les clients Supabase** :
   - `src/lib/supabase/client.ts` → `createBrowserClient()` pour les Client Components
   - `src/lib/supabase/server.ts` → `createServerClient()` pour les Server Components et Route Handlers
   - `src/lib/supabase/middleware.ts` → helper pour le middleware auth

3. **Créer le middleware Next.js** (`src/middleware.ts`) :
   - Rafraîchir la session Supabase à chaque requête
   - Protéger les routes `(protected)/*`
   - Rediriger les utilisateurs connectés depuis `(auth)/*`

4. **Créer les types TypeScript** dans `src/types/index.ts` :
   - Générer les types depuis le schéma Supabase
   - Types pour `Database`, `Tables`, `Enums`

5. **Créer le hook `useProgress`** dans `src/hooks/useProgress.ts` :
   - Lire la progression d'un utilisateur
   - Mettre à jour après un QCM
   - Calculer XP total

## Règles

- JAMAIS utiliser `supabase.auth.admin` côté client
- JAMAIS exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- TOUJOURS utiliser le client `server.ts` dans les Server Components
- TOUJOURS utiliser le client `client.ts` dans les Client Components ("use client")
- RLS activé sur TOUTES les tables avec données utilisateur

## Vérification

- Les types TypeScript correspondent au schéma SQL
- Le middleware redirige correctement
- Les clients fonctionnent dans leurs contextes respectifs
