"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function WelcomePopup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const isWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    if (!isWelcome) return;

    // Afficher apres un court delai
    const showTimer = setTimeout(() => setVisible(true), 300);

    // Commencer le fade-out
    const fadeTimer = setTimeout(() => setFading(true), 4500);

    // Supprimer completement + nettoyer l'URL
    const removeTimer = setTimeout(() => {
      setVisible(false);
      router.replace("/profile", { scroll: false });
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [isWelcome, router]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Card */}
      <div
        className={`relative pointer-events-auto bg-white rounded-[24px] border border-[#e2e8f0] shadow-2xl p-8 max-w-sm mx-4 text-center transition-all duration-500 ${
          fading
            ? "opacity-0 scale-95 translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
        onClick={() => {
          setFading(true);
          setTimeout(() => {
            setVisible(false);
            router.replace("/profile", { scroll: false });
          }, 500);
        }}
      >
        <div className="text-5xl mb-4">🎉</div>
        <h2
          className="text-xl font-bold text-[#0f172a] mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Bienvenue sur <span className="text-[#0070f3]">B</span>e Very Better !
        </h2>
        <p className="text-sm text-[#64748b] leading-relaxed">
          Ton compte est cree. Commence par explorer les cours et gagne de l&apos;XP pour monter en niveau !
        </p>
        <div className="mt-5 flex items-center justify-center gap-3 text-xs text-[#94a3b8]">
          <span className="flex items-center gap-1">⚡ 0 XP</span>
          <span>·</span>
          <span className="flex items-center gap-1">📖 Niveau 1</span>
          <span>·</span>
          <span className="flex items-center gap-1">🔥 0 streak</span>
        </div>
      </div>
    </div>
  );
}
