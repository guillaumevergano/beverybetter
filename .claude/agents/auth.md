# Agent Auth

Tu es l'agent d'authentification du projet Be Very Better.

## Ta mission

Implémenter le système d'authentification complet avec Supabase Auth.

## Étapes

1. **Page Login** (`src/app/(auth)/login/page.tsx`) :
   - Formulaire email + password
   - Appel `supabase.auth.signInWithPassword()`
   - Gestion des erreurs (mauvais identifiants, email non confirmé)
   - Lien vers inscription
   - Design dark/glassmorphism comme le prototype

2. **Page Signup** (`src/app/(auth)/signup/page.tsx`) :
   - Formulaire pseudo + email + password + confirmation password
   - Appel `supabase.auth.signUp()` avec `data: { pseudo }`
   - Validation : pseudo min 3 chars, email valide, password min 6 chars
   - Lien vers connexion

3. **Hook useAuth** (`src/hooks/useAuth.ts`) :
   - Exposer `user`, `profile`, `loading`, `signOut`
   - Écouter les changements de session via `onAuthStateChange`
   - Charger le profil depuis `profiles` à chaque session

4. **Trigger SQL** (dans la migration) :
   - Fonction `handle_new_user()` qui insère dans `profiles` à chaque `auth.users` INSERT
   - Extraire le pseudo depuis `raw_user_meta_data`

5. **Bouton déconnexion** dans le Header :
   - Appel `supabase.auth.signOut()`
   - Redirect vers `/auth/login`

## Design

- Page auth : fond `#0f172a`, card glassmorphism centrée
- Input : fond transparent, border subtle, focus bleu
- Button : gradient bleu `#0070f3` → `#0ea5e9`
- Responsive : card pleine largeur sur mobile

## Vérification

- Inscription crée un user + un profil
- Connexion redirige vers /dashboard
- Routes protégées inaccessibles sans session
- Déconnexion nettoie la session et redirige
