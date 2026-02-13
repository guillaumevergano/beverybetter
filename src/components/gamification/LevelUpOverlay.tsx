"use client";

import { useEffect, useState } from "react";

interface LevelUpOverlayProps {
  level: number;
  title: string;
  onClose: () => void;
}

export function LevelUpOverlay({ level, title, onClose }: LevelUpOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setShow(true));

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 cursor-pointer ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => {
        setShow(false);
        setTimeout(onClose, 500);
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-sm" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: "-5%",
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            <div
              className="w-2 h-2 rounded-sm"
              style={{
                backgroundColor: [
                  "#0070f3",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                  "#8b5cf6",
                  "#ec4899",
                ][i % 6],
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-700 ${
          show ? "scale-100 translate-y-0" : "scale-50 translate-y-8"
        }`}
      >
        <div className="text-6xl">🏆</div>
        <div
          className="text-8xl font-extrabold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {level}
        </div>
        <div className="text-center">
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Niveau {level} !
          </p>
          <p className="text-lg text-[#94a3b8] mt-1">{title}</p>
        </div>
        <p className="text-sm text-[#64748b] mt-4">
          Cliquez pour fermer
        </p>
      </div>
    </div>
  );
}
