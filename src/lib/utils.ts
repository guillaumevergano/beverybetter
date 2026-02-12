// ============================================
// Be Very Better — Utilities
// ============================================

import { clsx, type ClassValue } from "clsx";

/**
 * Merge class names conditionally
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format XP pour affichage (ex: 1250 → "1 250 XP")
 */
export function formatXP(xp: number): string {
  return `${xp.toLocaleString("fr-FR")} XP`;
}

/**
 * Calculer le pourcentage de progression
 */
export function calcPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Emoji de résultat QCM selon le score
 */
export function scoreEmoji(score: number, total: number): string {
  const percent = (score / total) * 100;
  if (percent === 100) return "🏆";
  if (percent >= 80) return "🎉";
  if (percent >= 60) return "👍";
  if (percent >= 40) return "💪";
  return "📚";
}

/**
 * Score message selon le résultat
 */
export function scoreMessage(score: number, total: number): string {
  const percent = (score / total) * 100;
  if (percent === 100) return "Parfait ! Tu maîtrises ce chapitre !";
  if (percent >= 80) return "Excellent travail !";
  if (percent >= 60) return "Bien joué, chapitre validé !";
  if (percent >= 40) return "Pas mal, mais tu peux mieux faire !";
  return "Continue à apprendre, tu progresseras !";
}
