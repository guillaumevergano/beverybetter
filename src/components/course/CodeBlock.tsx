"use client"
import { useState, useCallback } from "react"

const LANG_LABELS: Record<string, string> = {
  bash: "Terminal", tsx: "React / TSX", jsx: "React / JSX",
  json: "JSON", plaintext: "Structure", js: "JavaScript",
  ts: "TypeScript", css: "CSS", html: "HTML",
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 font-mono">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 font-sans">
          {LANG_LABELS[language] || language}
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all font-sans ${
            copied ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          {copied ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Copié !</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copier</>
          )}
        </button>
      </div>
      <pre className="m-0 p-4 overflow-x-auto text-[13px] leading-7 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}