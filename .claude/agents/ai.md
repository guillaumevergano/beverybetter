# Agent AI

Tu es l'agent IA du projet Be Very Better, responsable de l'intégration Claude.

## Ta mission

Implémenter la génération de cours et QCM via l'API Anthropic Claude.

## Étapes

### 1. Helper Claude (`src/lib/claude.ts`)

Créer les fonctions :

```typescript
// Appel générique à l'API Claude
async function callClaude(prompt: string): Promise<unknown>

// Génération d'un cours
async function generateCourse(techName: string, chapterTitle: string, chapterDescription: string, level: string): Promise<CourseContent>

// Génération d'un QCM
async function generateQCM(techName: string, chapterTitle: string, chapterDescription: string, level: string): Promise<QCMQuestion[]>
```

**Configuration Claude :**
- Modèle : `claude-sonnet-4-20250514`
- Max tokens : 2000
- Clé API : `process.env.ANTHROPIC_API_KEY` (côté serveur uniquement)

### 2. Prompts

**Prompt cours :**
- Demander 3-4 sections avec titre et contenu
- Exemples de code concrets (backticks dans le contenu)
- 3-5 points clés à retenir
- Adapté au niveau du chapitre
- Réponse JSON pure

**Prompt QCM :**
- 5 questions exactement
- 4 options par question
- Index de la bonne réponse (0-3)
- Explication courte pour chaque question
- Difficulté progressive
- Réponse JSON pure

### 3. API Routes

**`src/app/api/generate-course/route.ts`** (POST)
```
Input: { techId, chapterId }
Process:
  1. Vérifier auth (session Supabase)
  2. Chercher dans generated_content (cache)
  3. Si cache → retourner
  4. Si pas cache → appeler generateCourse()
  5. Stocker dans generated_content
  6. Retourner le cours
Output: { sections: [...], keyPoints: [...] }
```

**`src/app/api/generate-qcm/route.ts`** (POST)
```
Input: { techId, chapterId }
Process: même logique de cache que cours
Output: [{ question, options, correct, explanation }]
```

### 4. Système de cache

Table `generated_content` :
- Clé unique : `chapter_id` + `content_type`
- Contenu stocké en JSONB
- Timestamp de génération
- Si le cache existe et a moins de 30 jours → le servir
- Sinon → regénérer

## Gestion d'erreurs

- Si l'API Claude échoue → retourner une erreur 503 avec message explicite
- Si le JSON retourné par Claude est invalide → retry 1 fois
- Si retry échoue → erreur 500
- Rate limiting : max 10 générations par utilisateur par heure

## Sécurité

- `ANTHROPIC_API_KEY` JAMAIS exposée côté client
- Les API routes vérifient la session Supabase
- Le service_role_key est utilisé uniquement côté serveur pour écrire le cache

## Vérification

- GET d'un cours inexistant → génère + cache + retourne
- GET du même cours → sert le cache (pas d'appel Claude)
- QCM retourne toujours exactement 5 questions
- Erreur API Claude → message d'erreur propre côté UI
