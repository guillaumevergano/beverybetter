"use client";

import type { CourseSection as CourseSectionType } from "@/types";

interface CourseSectionProps {
  section: CourseSectionType;
  index: number;
}

export function CourseSection({ section, index }: CourseSectionProps) {
  return (
    <section className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
      <h2
        className="text-xl font-bold text-[#0f172a] mb-4"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {section.title}
      </h2>
      <div
        className="prose-custom text-[#334155] leading-relaxed space-y-3 [&_code]:bg-[#f1f5f9] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-[#0f172a] [&_pre]:text-[#e2e8f0] [&_pre]:p-4 [&_pre]:rounded-[12px] [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_strong]:text-[#0f172a]"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    </section>
  );
}
