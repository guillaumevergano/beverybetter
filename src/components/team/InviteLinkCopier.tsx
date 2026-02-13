"use client";

import { useState } from "react";

interface InviteLinkCopierProps {
  inviteCode: string;
}

export function InviteLinkCopier({ inviteCode }: InviteLinkCopierProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 px-3 py-2 bg-[#f1f5f9] rounded-[8px] text-sm text-[#0f172a] font-mono truncate">
        {inviteUrl}
      </div>
      <button
        onClick={handleCopy}
        className="px-4 py-2 rounded-[8px] text-sm font-medium transition-all bg-[#0070f3] text-white hover:bg-[#005bb5]"
      >
        {copied ? "Copie !" : "Copier"}
      </button>
    </div>
  );
}
