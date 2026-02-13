"use client";

import { useEffect, useRef, useState } from "react";
import { completeCourseAction } from "@/actions/gamification";
import { useGamification } from "@/components/gamification/GamificationProvider";

interface CourseCompletionTrackerProps {
  chapterId: string;
  alreadyCompleted: boolean;
}

export function CourseCompletionTracker({
  chapterId,
  alreadyCompleted,
}: CourseCompletionTrackerProps) {
  const { triggerEvents } = useGamification();
  const [tracked, setTracked] = useState(false);
  const sentRef = useRef(false);

  useEffect(() => {
    if (alreadyCompleted || sentRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !sentRef.current) {
          sentRef.current = true;
          setTracked(true);

          completeCourseAction(chapterId).then((result) => {
            if (result.success && result.events.length > 0) {
              triggerEvents(result.events);
            }
          });
        }
      },
      { threshold: 0.5 }
    );

    const sentinel = document.getElementById("course-completion-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [chapterId, alreadyCompleted, triggerEvents]);

  if (alreadyCompleted || tracked) return null;

  return <div id="course-completion-sentinel" className="h-1" />;
}
