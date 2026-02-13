"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { GamificationEvent, UserStats } from "@/types";
import { XPToast } from "./XPToast";
import { LevelUpOverlay } from "./LevelUpOverlay";

interface GamificationContextValue {
  stats: UserStats | null;
  setStats: (stats: UserStats | null) => void;
  triggerEvent: (event: GamificationEvent) => void;
  triggerEvents: (events: GamificationEvent[]) => void;
}

const GamificationContext = createContext<GamificationContextValue>({
  stats: null,
  setStats: () => {},
  triggerEvent: () => {},
  triggerEvents: () => {},
});

interface QueuedEvent {
  id: number;
  event: GamificationEvent;
}

let eventIdCounter = 0;

export function GamificationProvider({
  children,
  initialStats,
}: {
  children: ReactNode;
  initialStats: UserStats | null;
}) {
  const [stats, setStats] = useState<UserStats | null>(initialStats);
  const [toastQueue, setToastQueue] = useState<QueuedEvent[]>([]);
  const [levelUp, setLevelUp] = useState<{
    level: number;
    title: string;
  } | null>(null);

  const triggerEvent = useCallback((event: GamificationEvent) => {
    if (event.type === "level_up" && event.new_level && event.new_title) {
      setLevelUp({ level: event.new_level, title: event.new_title });
    } else {
      setToastQueue((prev) => [
        ...prev,
        { id: ++eventIdCounter, event },
      ]);
    }
  }, []);

  const triggerEvents = useCallback(
    (events: GamificationEvent[]) => {
      for (const event of events) {
        triggerEvent(event);
      }
    },
    [triggerEvent]
  );

  const removeToast = useCallback((id: number) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <GamificationContext.Provider
      value={{ stats, setStats, triggerEvent, triggerEvents }}
    >
      {children}

      {/* Toast stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toastQueue.slice(0, 3).map((item) => (
          <XPToast
            key={item.id}
            event={item.event}
            onDone={() => removeToast(item.id)}
          />
        ))}
      </div>

      {/* Level up overlay */}
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          title={levelUp.title}
          onClose={() => setLevelUp(null)}
        />
      )}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextValue {
  return useContext(GamificationContext);
}
