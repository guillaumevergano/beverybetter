// ============================================
// Be Very Better — Types
// ============================================

// ---- Database Enums ----
export type ChapterLevel = "débutant" | "intermédiaire" | "avancé";
export type ContentType = "course" | "qcm";

// ---- Database Tables ----
export interface Profile {
  id: string;
  pseudo: string;
  avatar_url: string | null;
  xp_total: number;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: string; // slug: 'nextjs' | 'tailwind'
  name: string;
  icon: string;
  color: string;
  accent: string;
  display_order: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  tech_id: string;
  title: string;
  description: string;
  level: ChapterLevel;
  display_order: number;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  completed: boolean;
  score: number | null;
  best_score: number | null;
  attempts: number;
  xp_earned: number;
  completed_at: string | null;
  updated_at: string;
}

export interface QCMSession {
  id: string;
  user_id: string;
  chapter_id: string;
  score: number;
  total: number;
  started_at: string;
  completed_at: string;
}

export interface QCMAnswer {
  id: string;
  session_id: string;
  question_index: number;
  question_text: string;
  selected_option: number;
  correct_option: number;
  is_correct: boolean;
  created_at: string;
}

export interface GeneratedContent {
  id: string;
  chapter_id: string;
  content_type: ContentType;
  content: CourseContent | QCMQuestion[];
  generated_at: string;
}

// ---- Claude Generated Content ----
export interface CourseSection {
  title: string;
  content: string;
}

export interface CourseContent {
  sections: CourseSection[];
  keyPoints: string[];
}

export interface QCMQuestion {
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
}

// ---- API Request/Response ----
export interface GenerateContentRequest {
  techId: string;
  chapterId: string;
}

export interface GenerateCourseResponse {
  course: CourseContent;
  fromCache: boolean;
}

export interface GenerateQCMResponse {
  questions: QCMQuestion[];
  fromCache: boolean;
}

// ---- UI State ----
export interface TechProgress {
  tech: Technology;
  chapters: Chapter[];
  progress: Map<string, UserProgress>;
  completedCount: number;
  totalChapters: number;
  percentage: number;
}

// ---- Level Colors ----
export const LEVEL_COLORS: Record<
  ChapterLevel,
  { bg: string; text: string; dot: string }
> = {
  débutant: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  intermédiaire: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  avancé: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};
