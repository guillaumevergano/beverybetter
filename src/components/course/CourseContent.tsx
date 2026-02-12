"use client";

import type { CourseContent as CourseContentType } from "@/types";
import { CourseSection } from "./CourseSection";
import { KeyPoints } from "./KeyPoints";

interface CourseContentProps {
  course: CourseContentType;
  color?: string;
}

export function CourseContent({ course, color = "#0070f3" }: CourseContentProps) {
  return (
    <div className="space-y-8">
      {course.sections.map((section, i) => (
        <CourseSection key={i} section={section} index={i} />
      ))}
      <KeyPoints points={course.keyPoints} color={color} />
    </div>
  );
}
