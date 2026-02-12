# 📋 Guide de développement avec Claude Code

## Ordre d'exécution des agents

Voici l'ordre recommandé pour développer l'application avec Claude Code :

### Phase 1 : Setup
```
Utilise l'agent setup : initialise le projet Next.js, installe les dépendances, configure Tailwind et TypeScript.
```

### Phase 2 : Database
```
Utilise l'agent database : crée les clients Supabase, le middleware, et les hooks de données.
Les migrations SQL sont déjà prêtes dans supabase/migrations/.
```

### Phase 3 : Auth
```
Utilise l'agent auth : implémente les pages login/signup, le hook useAuth, et la protection des routes.
```

### Phase 4 : UI
```
Utilise l'agent ui : construis toutes les pages (dashboard, chapitres, cours, QCM) et les composants réutilisables.
```

### Phase 5 : AI
```
Utilise l'agent ai : intègre l'API Claude pour la génération de cours et QCM, avec le système de cache.
```

### Phase 6 : Deploy
```
Utilise l'agent deploy : vérifie le build, prépare les métadonnées, et déploie sur Vercel.
```

## Commandes Claude Code

Pour lancer un agent spécifique :
```bash
claude "Exécute l'agent setup pour initialiser le projet"
claude "Exécute l'agent database pour configurer Supabase"
claude "Exécute l'agent auth pour implémenter l'authentification"
claude "Exécute l'agent ui pour construire les pages et composants"
claude "Exécute l'agent ai pour intégrer la génération de contenu"
claude "Exécute l'agent deploy pour préparer le déploiement"
```

## Prérequis

Avant de commencer :

1. **Node.js 20+** installé
2. **Compte Supabase** créé avec un projet
3. **Clé API Anthropic** disponible
4. **Compte Vercel** connecté au repo GitHub
5. **Fichier `.env.local`** créé à partir de `.env.local.example`

## Troubleshooting

### "Module not found"
→ Vérifier que `npm install` a été exécuté

### "Missing environment variable"
→ Vérifier `.env.local` et que les variables sont bien définies

### "RLS violation"
→ Vérifier que les policies RLS sont créées (migration 001)

### "Claude API error"
→ Vérifier `ANTHROPIC_API_KEY` et le quota du compte
