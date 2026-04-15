"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VRResult } from "@/lib/verbatim-ratio"
import { cn } from "@/lib/utils"

// Exported so Task 17b can conform to this shape when building the detector.
export type AIIsmMatch = {
  pattern: string  // the literal word/phrase matched, or rule name for question-echo
  position: number // character offset into the output where the match begins
  /**
   * Optional category. "question-echo" for the regex-based rules added
   * 2026-04-15 to catch "The single thing I want..." / "In response to..."
   * style answer-prefix tells. Undefined for legacy banned-isms /
   * anti-pattern word matches.
   */
  category?: string
}

type DiagnosticPillsProps = {
  vrResult: VRResult | null
  aiIsmMatches: AIIsmMatch[]
  onRegenerate: () => void
  /**
   * Optional. Fires when the user dismisses the current batch of AI-ism
   * matches — the detector flags patterns that some users' natural voices
   * happen to hit (no-true-positive problem). Parent should clear local
   * aiIsmMatches state so the pill + panel disappear until the next
   * assemble/regenerate triggers a fresh detection.
   */
  onDismiss?: () => void
  className?: string
}

// AI-ism panel uses inline React state (click-to-expand).
// Rationale: no Popover primitive exists in components/ui/. Tooltip is unsuitable
// because the panel contains an interactive Button (Tooltips must not have
// focusable children per ARIA). Inline state avoids adding a new dependency.

export function DiagnosticPills({
  vrResult,
  aiIsmMatches,
  onRegenerate,
  onDismiss,
  className,
}: DiagnosticPillsProps): JSX.Element {
  const [aiIsmOpen, setAiIsmOpen] = React.useState(false)

  const vrLabel =
    vrResult !== null
      ? `VR ${Math.round(vrResult.fiveGram * 100)}%`
      : "VR —"

  const count = aiIsmMatches.length
  const aiIsmLabel = count === 1 ? "1 AI-ism" : `${count} AI-isms`

  // Show at most 10 matches in the expanded panel.
  const visibleMatches = aiIsmMatches.slice(0, 10)

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* Pill row */}
      <div className="flex items-center gap-2">
        {/* VR pill — Tooltip is appropriate here (no interactive children) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center rounded-sm border border-border px-2 py-0.5",
                  "font-mono text-xs text-muted-foreground bg-muted/40",
                  "cursor-default select-none"
                )}
              >
                {vrLabel}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">
              Verbatim Ratio — percentage of 5-word phrases in the output that
              appear in your raw interview. Diagnostic only; the prompt regime
              is the causal driver of detection-evading prose. See{" "}
              <code className="font-mono">eval/reports/vr-validation.md</code>{" "}
              for the 54-variant pilot that established this.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* AI-ism pill — click-to-expand inline panel */}
        <button
          type="button"
          onClick={() => setAiIsmOpen((o) => !o)}
          aria-expanded={aiIsmOpen}
          className={cn(
            "inline-flex items-center rounded-sm border px-2 py-0.5",
            "font-mono text-xs cursor-pointer select-none transition-colors",
            count > 0
              ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
          )}
        >
          {aiIsmLabel}
        </button>
      </div>

      {/* Expanded AI-ism panel — inline, visible only when aiIsmOpen */}
      {aiIsmOpen && (
        <div
          className={cn(
            "rounded-sm border border-border bg-card px-3 py-2.5",
            "flex flex-col gap-2"
          )}
        >
          {count === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              No AI-ism patterns detected.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-0.5">
                {visibleMatches.map((m, i) => (
                  <li
                    key={i}
                    className="font-mono text-xs text-foreground"
                  >
                    <span className="text-destructive">&ldquo;{m.pattern}&rdquo;</span>
                    <span className="text-muted-foreground">
                      {" "}(at position {m.position})
                    </span>
                  </li>
                ))}
                {count > 10 && (
                  <li className="font-mono text-xs text-muted-foreground">
                    +{count - 10} more
                  </li>
                )}
              </ul>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onRegenerate()
                    setAiIsmOpen(false)
                  }}
                  className="font-mono text-xs"
                >
                  Regenerate avoiding these
                </Button>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDismiss()
                      setAiIsmOpen(false)
                    }}
                    className="font-mono text-xs text-muted-foreground"
                    title="Clear this batch of flagged AI-isms. The detector pattern-matches phrases that some users' natural voices legitimately use — dismiss to move on without regenerating."
                  >
                    Ignore
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
