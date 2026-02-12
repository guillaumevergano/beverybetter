"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group rounded-[12px] overflow-hidden bg-[#0f172a] my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e293b]">
        <span className="text-xs text-[#64748b] font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-[#64748b] hover:text-white transition-colors"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[#e2e8f0]">{code}</code>
      </pre>
    </div>
  );
}
