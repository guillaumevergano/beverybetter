// ============================================
// Be Very Better — Constants
// ============================================

// XP par bonne réponse au QCM
export const XP_PER_CORRECT_ANSWER = 20;

// Nombre de questions par QCM
export const QCM_QUESTIONS_COUNT = 5;

// Pourcentage minimum pour valider un chapitre
export const PASSING_SCORE_PERCENT = 60;

// Durée du cache contenu généré (en jours)
export const CONTENT_CACHE_DAYS = 30;

// Max générations par utilisateur par heure
export const MAX_GENERATIONS_PER_HOUR = 10;

// Modèle Claude utilisé
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const CLAUDE_MAX_TOKENS = 2000;

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  DASHBOARD: "/dashboard",
  LEARN: (techId: string) => `/learn/${techId}`,
  CHAPTER: (techId: string, chapterId: string) =>
    `/learn/${techId}/${chapterId}`,
  QCM: (techId: string, chapterId: string) => `/qcm/${techId}/${chapterId}`,
} as const;

// Design tokens
export const COLORS = {
  primary: "#0070f3",
  background: {
    page: "#f8fafc",
    header: "#0f172a",
    card: "#ffffff",
  },
  tech: {
    nextjs: { color: "#000000", accent: "#0070f3" },
    tailwind: { color: "#0ea5e9", accent: "#06b6d4" },
  },
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
    muted: "#94a3b8",
    inverse: "#f8fafc",
  },
} as const;
