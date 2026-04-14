"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSessionStore } from "@/lib/store";
import { computeVR } from "@/lib/verbatim-ratio";
import { detect, highlightSegments } from "@/lib/ai-ism-detector";
import type { AIIsmMatch } from "@/lib/ai-ism-detector";
import { DiagnosticPills } from "@/components/diagnostic-pills";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Inline AI-ism highlight helpers (Part C)
// ---------------------------------------------------------------------------

/**
 * Walk a react-markdown children array and wrap any string children that
 * contain AI-ism patterns in `<mark>` elements. Non-string children (inline
 * `<strong>`, `<em>`, etc.) pass through unchanged.
 */
function highlightChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const segments = highlightSegments(child);
    // If the whole string is a single plain segment, return the string as-is
    if (segments.length === 1 && segments[0].type === "plain") return child;
    return segments.map((seg, i) =>
      seg.type === "plain" ? (
        seg.text
      ) : (
        <mark
          key={i}
          title={`AI-ism: ${seg.pattern}`}
          className="bg-warning/20 underline decoration-warning/60 decoration-dotted underline-offset-2"
        >
          {seg.text}
        </mark>
      )
    );
  });
}

type PreviewPanelProps = {
  className?: string;
  /** Called when the user clicks "Regenerate avoiding these" in DiagnosticPills. */
  onRegenerate?: (matches: AIIsmMatch[]) => void;
};

export function PreviewPanel({ className, onRegenerate }: PreviewPanelProps): JSX.Element {
  const output = useSessionStore((s) => s.output);
  const isGenerating = useSessionStore((s) => s.isGenerating);
  const vrScore = useSessionStore((s) => s.vrScore);
  const setVRScore = useSessionStore((s) => s.setVRScore);
  const mode = useSessionStore((s) => s.mode);

  const [aiIsmMatches, setAiIsmMatches] = useState<AIIsmMatch[]>([]);

  const { toast } = useToast();

  // Compute VR score and run AI-ism detection once streaming completes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isGenerating && output.length > 0 && vrScore === null) {
      const rawInterview = useSessionStore.getState().interview.rawTranscript;
      const result = computeVR(rawInterview, output);
      setVRScore(result);
      // Run the AI-ism detector on the completed output.
      setAiIsmMatches(detect(output));
    }
  }, [isGenerating, output, vrScore, setVRScore]);

  // Clear AI-ism matches when output is cleared (e.g., on a new assemble run).
  useEffect(() => {
    if (output.length === 0) {
      setAiIsmMatches([]);
    }
  }, [output]);

  const wordCount = useMemo(() => {
    if (!output) return 0;
    return output.trim().split(/\s+/).filter(Boolean).length;
  }, [output]);

  const modeName = mode ?? "draft";

  function handleCopy(): void {
    navigator.clipboard.writeText(output).then(() => {
      toast({ title: "Copied", description: "Output copied to clipboard." });
    });
  }

  function handleDownload(): void {
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modeName}-draft.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header row */}
      <div className="flex items-baseline justify-between">
        <span className="label-caps text-foreground">Output</span>
        {output.length > 0 && (
          <span className="label-caps text-muted-foreground">
            {wordCount} words
          </span>
        )}
      </div>

      {/* Main content area */}
      {output.length === 0 ? (
        <div className="flex flex-col gap-3">
          {isGenerating ? (
            <>
              {/* Thin pulsing progress bar */}
              <div className="h-0.5 w-full overflow-hidden bg-muted">
                <div className="h-full w-1/2 animate-pulse bg-foreground/30" />
              </div>
              <p className="font-body text-sm text-muted-foreground italic">
                Assembling&hellip;
              </p>
            </>
          ) : (
            <p className="font-body text-sm text-muted-foreground">
              Your assembled piece will appear here.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Prose region */}
          <div className="relative">
            <div className="prose-output font-body text-foreground leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p>{highlightChildren(children)}</p>,
                  li: ({ children }) => <li>{highlightChildren(children)}</li>,
                }}
              >
                {output}
              </ReactMarkdown>
            </div>
            {/* Streaming cue: pulsing bar at bottom when generating */}
            {isGenerating && (
              <div className="mt-2 h-0.5 w-full overflow-hidden bg-muted">
                <div className="h-full w-1/2 animate-pulse bg-foreground/30" />
              </div>
            )}
          </div>

          {/* Diagnostics */}
          {!isGenerating && (
            <>
              <DiagnosticPills
                vrResult={vrScore}
                aiIsmMatches={aiIsmMatches}
                onRegenerate={() => onRegenerate?.(aiIsmMatches)}
              />

              {/* Footer actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  Download
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
