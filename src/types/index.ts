// ============================================
// Be Very Better — Types
// ============================================

// ---- Database Enums ----
export type ChapterLevel = "débutant" | "intermédiaire" | "avancé";
export type ContentType = "course" | "qcm";
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";
export type ChallengeType = "weekly" | "monthly";
export type XPSource = "course" | "quiz" | "badge" | "challenge" | "streak" | "certification";

// ---- Database Tables ----
export interface Profile {
  id: string;
  pseudo: string;
  avatar_url: string | null;
  xp_total: number;
  current_level: number;
  current_title: string;
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

// ---- Quiz UI ----
export interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
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

// ---- Gamification ----

export interface XPEvent {
  id: string;
  user_id: string;
  amount: number;
  source: XPSource;
  source_id: string | null;
  created_at: string;
}

export interface StreakInfo {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  freeze_count: number;
  updated_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UserChallenge {
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  challenge?: Challenge;
}

export interface CertificationInfo {
  id: string;
  technology_id: string;
  name: string;
  description: string;
  required_chapters: number;
  required_avg_score: number;
  xp_reward: number;
  created_at: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  currentXP: number;
  progress: number;
}

export interface UserStats {
  xp_total: number;
  current_level: number;
  current_title: string;
  level_progress: LevelInfo;
  streak: StreakInfo | null;
  badges_count: number;
  courses_completed: number;
  quizzes_completed: number;
  perfect_quizzes: number;
}

export interface GamificationEvent {
  type: "xp" | "level_up" | "badge" | "streak";
  amount?: number;
  badge?: Badge;
  new_level?: number;
  new_title?: string;
  streak_days?: number;
}

// ---- Exam / Certification ----

export type CertMention = "Bien" | "Très Bien" | "Exceptionnelle";

export interface ExamAttempt {
  id: string;
  user_id: string;
  technology_id: string;
  score: number;
  total: number;
  passed: boolean;
  completed_at: string;
}

export interface UserCertification {
  id: string;
  user_id: string;
  technology_id: string;
  exam_attempt_id: string;
  cert_number: string;
  score: number;
  total: number;
  mention: CertMention;
  verification_url: string;
  certified_at: string;
}

export interface ExamQuestion {
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  chapter_id: string;
  chapter_title: string;
}

export interface ExamQuestionClient {
  question: string;
  options: [string, string, string, string];
  chapter_title: string;
  index: number;
}

export interface ExamResult {
  passed: boolean;
  score: number;
  total: number;
  percentage: number;
  mention: CertMention | null;
  cert_number: string | null;
  questions: ExamQuestion[];
  answers: number[];
  attemptsThisWeek: number;
  maxAttemptsPerWeek: number;
}
