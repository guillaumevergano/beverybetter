"use client";

import { useState, useRef, useEffect } from "react";

interface TeamMemberActionsProps {
  userId: string;
  pseudo: string;
  onKick: (userId: string) => Promise<void>;
  onTransfer: (userId: string) => Promise<void>;
}

export function TeamMemberActions({ userId, pseudo, onKick, onTransfer }: TeamMemberActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<"kick" | "transfer" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirm(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (confirm === "kick") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#991b1b]">Exclure {pseudo} ?</span>
        <button
          onClick={async () => {
            await onKick(userId);
            setConfirm(null);
          }}
          className="px-2 py-1 text-xs font-medium text-white bg-[#ef4444] rounded-[6px] hover:bg-[#dc2626]"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirm(null)}
          className="px-2 py-1 text-xs font-medium text-[#64748b] bg-[#f1f5f9] rounded-[6px] hover:bg-[#e2e8f0]"
        >
          Non
        </button>
      </div>
    );
  }

  if (confirm === "transfer") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#92400e]">Transferer a {pseudo} ?</span>
        <button
          onClick={async () => {
            await onTransfer(userId);
            setConfirm(null);
          }}
          className="px-2 py-1 text-xs font-medium text-white bg-[#f59e0b] rounded-[6px] hover:bg-[#d97706]"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirm(null)}
          className="px-2 py-1 text-xs font-medium text-[#64748b] bg-[#f1f5f9] rounded-[6px] hover:bg-[#e2e8f0]"
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-[6px] hover:bg-[#f1f5f9] transition-colors text-[#94a3b8]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[8px] border border-[#e2e8f0] shadow-lg py-1 z-50">
          <button
            onClick={() => {
              setConfirm("transfer");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            Transferer propriete
          </button>
          <button
            onClick={() => {
              setConfirm("kick");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
          >
            Exclure
          </button>
        </div>
      )}
    </div>
  );
}
