"use client";

import { useState, useRef } from "react";
import { RichContent } from "./RichContent";
import type { CourseSection } from "@/types";

interface CourseAccordionProps {
  sections: CourseSection[];
  techColor: string;
}

export function CourseAccordion({ sections, techColor }: CourseAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const progress = ((openIndex + 1) / sections.length) * 100;

  function scrollToSection(index: number) {
    setTimeout(() => {
      sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleNext() {
    if (openIndex < sections.length - 1) {
      setOpenIndex(openIndex + 1);
      scrollToSection(openIndex + 1);
    } else {
      document.getElementById("key-points")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handlePrev() {
    if (openIndex > 0) {
      setOpenIndex(openIndex - 1);
      scrollToSection(openIndex - 1);
    }
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-100 -mx-4 px-4 py-3 mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500">Progression</span>
          <span className="text-xs font-bold" style={{ color: techColor }}>
            {openIndex + 1}/{sections.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: techColor }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {sections.map((section, i) => {
          const isOpen = i === openIndex;
          const isPassed = i < openIndex;
          const isFuture = i > openIndex;

          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="scroll-mt-28"
            >
              {/* Header */}
              <button
                onClick={() => setOpenIndex(i)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 text-left ${
                  isOpen
                    ? "bg-white border-slate-200 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white"
                }`}
              >
                {/* Number badge */}
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200"
                  style={{
                    backgroundColor: isPassed ? techColor : isOpen ? techColor : "#e2e8f0",
                    color: isPassed || isOpen ? "white" : "#94a3b8",
                  }}
                >
                  {isPassed ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>

                {/* Title */}
                <span
                  className={`flex-1 font-semibold transition-colors ${
                    isOpen ? "text-slate-900" : isPassed ? "text-slate-500" : "text-slate-600"
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {section.title}
                </span>

                {/* Chevron */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isFuture ? "#cbd5e1" : "#94a3b8"}
                  strokeWidth="2"
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Content */}
              {isOpen && (
                <div className="mt-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm animate-fade-in">
                  <RichContent content={section.content} accentColor={techColor} />

                  {/* Navigation buttons */}
                  <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
                    {i > 0 ? (
                      <button
                        onClick={handlePrev}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Précédent
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: techColor }}
                    >
                      {i === sections.length - 1 ? (
                        <>
                          À retenir
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Suivant
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
