import { CodeBlock } from "./CodeBlock"
import { InlineFormat } from "./InlineFormat"

export function RichContent({ content, accentColor = "#0070f3" }: { content: string; accentColor?: string }) {
  const parts = content.split(/(```\w*\n[\s\S]*?```)/g)

  return (
    <div className="text-[15px] leading-7 text-slate-700">
      {parts.map((part, i) => {
        const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/)
        if (codeMatch) {
          return <CodeBlock key={i} language={codeMatch[1] || "plaintext"} code={(codeMatch[2] ?? "").trim()} />
        }

        return part.split("\n\n").map((paragraph, j) => {
          const trimmed = paragraph.trim()
          if (!trimmed) return null

          // Bullet points (• ou -)
          if (trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.includes("\n•") || trimmed.includes("\n- ")) {
            const lines = trimmed.split("\n")
            const intro: string[] = []
            const bullets: string[] = []
            lines.forEach((line) => {
              const l = line.trim()
              if (l.startsWith("•") || l.startsWith("- ")) {
                bullets.push(l.replace(/^[•\-]\s*/, ""))
              } else if (bullets.length === 0 && l) {
                intro.push(l)
              }
            })

            return (
              <div key={`${i}-${j}`} className="my-3">
                {intro.length > 0 && <p className="mb-2"><InlineFormat text={intro.join(" ")} /></p>}
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {bullets.map((bullet, b) => (
                    <li key={b} className="flex gap-2.5 p-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100 items-start">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2.5" style={{ background: accentColor }} />
                      <span className="flex-1"><InlineFormat text={bullet} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }

          // ✅ / ❌ items
          if (/^[✅❌]/.test(trimmed) || trimmed.includes("\n✅") || trimmed.includes("\n❌")) {
            const lines = trimmed.split("\n").filter((l) => l.trim())
            const hasIntro = !/^[✅❌]/.test(lines[0]?.trim() ?? "")
            const introLines = hasIntro && lines[0] ? [lines[0]] : []
            const items = hasIntro ? lines.slice(1) : lines

            return (
              <div key={`${i}-${j}`} className="my-3 flex flex-col gap-1.5">
                {introLines.length > 0 && introLines[0] && <p className="mb-2"><InlineFormat text={introLines[0]} /></p>}
                {items.map((item, idx) => {
                  const text = item.trim()
                  const isPositive = text.startsWith("✅")
                  const isNegative = text.startsWith("❌")
                  const clean = text.replace(/^[✅❌]\s*/, "")
                  return (
                    <div key={idx} className={`flex gap-2.5 p-2.5 px-3.5 rounded-xl items-start border ${
                      isPositive ? "bg-green-50 border-green-100" : isNegative ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                    }`}>
                      <span className="shrink-0 text-sm">{isPositive ? "✅" : "❌"}</span>
                      <span className="flex-1"><InlineFormat text={clean} /></span>
                    </div>
                  )
                })}
              </div>
            )
          }

          return <p key={`${i}-${j}`} className="my-3"><InlineFormat text={trimmed} /></p>
        })
      })}
    </div>
  )
}