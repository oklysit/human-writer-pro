"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Paperclip, RotateCw, X } from "lucide-react";
import { useSessionStore } from "@/lib/store";
import { computeVR } from "@/lib/verbatim-ratio";
import { detect, highlightSegments } from "@/lib/ai-ism-detector";
import type { AIIsmMatch } from "@/lib/ai-ism-detector";
import { extractText, isSupported } from "@/lib/fileImport";
import { useVoiceInput } from "@/lib/useVoiceInput";
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
  /**
   * Called when the user submits voice/text feedback for a whole-output
   * regenerate. Parent fires the assembleWithFeedback call; preview-panel
   * just collects the feedback string.
   */
  onRegenerateWithFeedback?: (feedback: string) => void;
};

export function PreviewPanel({
  className,
  onRegenerate,
  onRegenerateWithFeedback,
}: PreviewPanelProps): JSX.Element {
  const output = useSessionStore((s) => s.output);
  const isGenerating = useSessionStore((s) => s.isGenerating);
  const vrScore = useSessionStore((s) => s.vrScore);
  const setVRScore = useSessionStore((s) => s.setVRScore);
  const mode = useSessionStore((s) => s.mode);
  const outputSource = useSessionStore((s) => s.outputSource);
  const setUploadedDraft = useSessionStore((s) => s.setUploadedDraft);
  const setError = useSessionStore((s) => s.setError);

  const [aiIsmMatches, setAiIsmMatches] = useState<AIIsmMatch[]>([]);

  // ---- Upload-to-output state ----
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Regenerate-with-feedback state ----
  const [regenOpen, setRegenOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const feedbackTextareaRef = useRef<HTMLTextAreaElement>(null);
  const baseFeedbackRef = useRef("");

  const voice = useVoiceInput({
    onError: (msg) => setError(msg),
  });

  // Snapshot textarea on recording start
  const prevRecording = useRef(false);
  useEffect(() => {
    if (voice.recording && !prevRecording.current) {
      baseFeedbackRef.current = feedback;
    }
    prevRecording.current = voice.recording;
  });

  // Live preview during recording
  useEffect(() => {
    if (!voice.recording) return;
    const base = baseFeedbackRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voice.finalTranscript + voice.interimTranscript;
    if (preview) {
      setFeedback(base + separator + preview);
    }
  }, [voice.recording, voice.finalTranscript, voice.interimTranscript]);

  // Commit on stop
  useEffect(() => {
    if (!voice.recording && voice.finalTranscript) {
      const base = baseFeedbackRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setFeedback(base + separator + voice.finalTranscript);
      baseFeedbackRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.recording]);

  // Autoscroll feedback textarea while dictating
  useEffect(() => {
    if (voice.recording && feedbackTextareaRef.current) {
      feedbackTextareaRef.current.scrollTop = feedbackTextareaRef.current.scrollHeight;
    }
  }, [voice.recording, feedback]);

  const { toast } = useToast();

  // Compute VR score and run AI-ism detection once streaming completes.
  // For upload-sourced output, VR is computed against the upload (the
  // material the user is iterating from), not the empty interview
  // transcript — otherwise it would always read 0% and confuse.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isGenerating && output.length > 0 && vrScore === null) {
      const state = useSessionStore.getState();
      const rawSource =
        state.outputSource === "upload" && state.uploadedDraftContent
          ? state.uploadedDraftContent
          : state.interview.rawTranscript;
      const result = computeVR(rawSource, output);
      setVRScore(result);
      // Run the AI-ism detector on the completed output.
      setAiIsmMatches(detect(output));
    }
  }, [isGenerating, output, vrScore, setVRScore]);

  // Clear AI-ism matches + close regen panel when output is cleared
  useEffect(() => {
    if (output.length === 0) {
      setAiIsmMatches([]);
      setRegenOpen(false);
      setFeedback("");
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

  // ---- Upload-to-output ----
  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!isSupported(file.name)) {
      setUploadError(`Unsupported: ${file.name}. Use .md / .txt / .pdf / .docx.`);
      return;
    }
    setUploading(file.name);
    try {
      const text = await extractText(file);
      if (!text) {
        setUploadError(`No text extracted from ${file.name}.`);
        return;
      }
      setUploadedDraft(text);
      toast({ title: "Draft loaded", description: `${file.name} ready to edit.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to read ${file.name}`;
      setUploadError(msg);
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ---- Regenerate-with-feedback handlers ----
  function handleSendFeedback(): void {
    const trimmed = feedback.trim();
    if (!trimmed || !onRegenerateWithFeedback) return;
    voice.stop();
    voice.reset();
    onRegenerateWithFeedback(trimmed);
    setFeedback("");
    setRegenOpen(false);
  }

  function handleCancelFeedback(): void {
    voice.stop();
    voice.reset();
    setFeedback("");
    setRegenOpen(false);
  }

  function handleFeedbackKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendFeedback();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelFeedback();
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header row */}
      <div className="flex items-baseline justify-between">
        <span className="label-caps text-foreground">
          Output
          {output.length > 0 && outputSource === "upload" && (
            <span className="ml-2 font-mono text-[0.625rem] tracking-wider text-accent">
              · editing uploaded draft
            </span>
          )}
          {output.length > 0 && outputSource === "interview" && (
            <span className="ml-2 font-mono text-[0.625rem] tracking-wider text-muted-foreground">
              · from interview
            </span>
          )}
        </span>
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
            <>
              <p className="font-body text-sm text-muted-foreground">
                Your assembled piece will appear here.
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading !== null}
                  className={cn(
                    "self-start flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider",
                    "text-muted-foreground hover:text-foreground transition-colors",
                    uploading !== null && "opacity-50 cursor-not-allowed"
                  )}
                  title="Upload an existing draft (.md / .txt / .pdf / .docx) to refine it with voice/text feedback."
                >
                  <Paperclip className="h-3 w-3" aria-hidden />
                  {uploading !== null ? `Reading ${uploading}…` : "Or upload an existing draft to edit"}
                </button>
                {uploadError && (
                  <p className="font-mono text-xs text-destructive">{uploadError}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => void handleUploadFile(e)}
                />
              </div>
            </>
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

          {/* Diagnostics + actions (only when not actively streaming) */}
          {!isGenerating && (
            <>
              <DiagnosticPills
                vrResult={vrScore}
                aiIsmMatches={aiIsmMatches}
                onRegenerate={() => onRegenerate?.(aiIsmMatches)}
              />

              {/* Footer actions */}
              <div className="flex items-center gap-2 flex-wrap">
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
                {onRegenerateWithFeedback && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setRegenOpen((o) => !o)}
                    className="font-mono text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden />
                    Regenerate with feedback
                  </Button>
                )}
              </div>

              {/* Regenerate panel — expanded on demand */}
              {regenOpen && (
                <div className="flex flex-col gap-3 border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-foreground">What should change?</span>
                    <button
                      type="button"
                      onClick={handleCancelFeedback}
                      aria-label="Cancel feedback (Esc)"
                      title="Cancel (Esc)"
                      className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-sm",
                        "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      )}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <textarea
                    ref={feedbackTextareaRef}
                    className="min-h-[88px] w-full resize-none border border-border bg-background p-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="e.g. tighten the intro to focus on the AI agents moment; remove the WGU course mention; vary the closing line..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    onKeyDown={handleFeedbackKeyDown}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      Enter to send · Shift+Enter for newline · Esc to cancel
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Mic */}
                      {voice.supported ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (voice.recording) {
                              voice.stop();
                              // Return focus to the textarea so Enter submits
                              // instead of retoggling the mic button.
                              feedbackTextareaRef.current?.focus();
                            } else {
                              voice.start();
                            }
                          }}
                          aria-label={voice.recording ? "Stop voice input" : "Start voice input"}
                          title={voice.recording ? "Stop recording" : "Start voice input"}
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                            voice.recording
                              ? "text-accent border-accent animate-pulse"
                              : "text-muted-foreground hover:text-foreground hover:border-foreground"
                          )}
                        >
                          {voice.recording ? (
                            <MicOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Mic className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-label="Voice input unavailable"
                          title="Voice input not supported in this browser. Chrome or Edge recommended."
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-sm border border-border",
                            "text-muted-foreground cursor-not-allowed opacity-40"
                          )}
                        >
                          <Mic className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleSendFeedback}
                        disabled={!feedback.trim()}
                        className="font-mono text-xs uppercase tracking-wider"
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
