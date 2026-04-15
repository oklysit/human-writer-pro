"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings-dialog";
import { InterviewPanel } from "@/components/interview-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { useSessionStore, useCanAssemble } from "@/lib/store";
import { assemble, assembleWithFeedback } from "@/lib/assemble";
import { detectWritingMode, assemblyRegime } from "@/lib/detectWritingMode";
import { combineContext } from "@/lib/combineContext";
import type { AIIsmMatch } from "@/lib/ai-ism-detector";
import { cn } from "@/lib/utils";

export default function HomePage() {
  // ---------------------------------------------------------------------------
  // Store bindings (read only — all mutations go through setters)
  // ---------------------------------------------------------------------------
  const apiKey = useSessionStore((s) => s.apiKey);
  const mode = useSessionStore((s) => s.mode);
  const isGenerating = useSessionStore((s) => s.isGenerating);
  const canAssemble = useCanAssemble();

  const setOutput = useSessionStore((s) => s.setOutput);
  const setVRScore = useSessionStore((s) => s.setVRScore);
  const setGenerating = useSessionStore((s) => s.setGenerating);
  const setError = useSessionStore((s) => s.setError);

  // ---------------------------------------------------------------------------
  // Settings dialog state
  // ---------------------------------------------------------------------------
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // ---------------------------------------------------------------------------
  // Target-words local draft — the input shows an empty string when the store
  // has null (auto-infer) and a number otherwise. Local draft state avoids
  // forcing the user to see "0" when they clear the field.
  // ---------------------------------------------------------------------------
  const targetWordsStored = useSessionStore((s) => s.targetWords);
  const [targetWordsDraft, setTargetWordsDraft] = React.useState<string>(
    targetWordsStored !== null ? String(targetWordsStored) : ""
  );
  React.useEffect(() => {
    setTargetWordsDraft(targetWordsStored !== null ? String(targetWordsStored) : "");
  }, [targetWordsStored]);

  // ---------------------------------------------------------------------------
  // Detected writing mode — recomputed live from contextNotes so the label
  // next to the Assemble button shows the user which regime will fire.
  // ---------------------------------------------------------------------------
  const contextNotes = useSessionStore((s) => s.contextNotes);
  const attachedFiles = useSessionStore((s) => s.attachedFiles);
  const combinedContext = React.useMemo(
    () => combineContext(contextNotes, attachedFiles),
    [contextNotes, attachedFiles]
  );
  const detectedMode = React.useMemo(
    () => detectWritingMode(combinedContext),
    [combinedContext]
  );
  // Chip surfaces the REGIME that will actually run at assemble-time, not
  // the 5-way detected mode. detectWritingMode() returns
  // cover-letter|email|essay|blog|free-form for future branching, but today
  // assemblyRegime() collapses everything to cl|generic — those are the only
  // two prompts assemble.ts switches on. Showing the fine-grained mode
  // implied behavior differences that don't exist yet.
  const detectedRegime = React.useMemo(
    () => (combinedContext.trim().length > 0 ? assemblyRegime(detectedMode) : null),
    [combinedContext, detectedMode]
  );
  const detectedModeLabel = detectedRegime === null
    ? null
    : `Mode: ${detectedRegime === "cl" ? "Cover Letter" : "Generic Write"}`;

  // ---------------------------------------------------------------------------
  // EditChat trigger removed in MVP. Whole-output regenerate-with-feedback
  // (in PreviewPanel) handles refinement; paragraph-level Edit Chat ships
  // in the codebase but no UI surface invokes it. See
  // project_edit_chat_selection_scope.md (career-forge memory) for the
  // selection-respecting refactor that will land post-MVP.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Assemble handler
  // ---------------------------------------------------------------------------
  const cancelRef = React.useRef<(() => void) | null>(null);

  function handleAssemble() {
    if (!apiKey || !mode) return;

    const state = useSessionStore.getState();
    const rawInterview = state.interview.rawTranscript;
    const detectedMode = detectWritingMode(combineContext(state.contextNotes, state.attachedFiles));
    const regime = assemblyRegime(detectedMode);
    const targetWords = state.targetWords;

    // Cancel any in-flight stream
    cancelRef.current?.();

    setGenerating(true);
    setOutput("");
    setVRScore(null);

    const { cancel } = assemble({
      apiKey,
      rawInterview,
      regime,
      targetWords,
      onToken: (delta) => {
        const current = useSessionStore.getState().output;
        useSessionStore.getState().setOutput(current + delta);
      },
      onComplete: (fullText) => {
        setOutput(fullText);
        setGenerating(false);
      },
      onError: (msg) => {
        setError(msg);
        setGenerating(false);
      },
    });

    cancelRef.current = cancel;
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Regenerate handler — fired from DiagnosticPills "Regenerate avoiding
  // these" button. Fresh re-assemble against the same raw interview; the
  // AI-ism diagnostic stays as informational signal. Per the 2026-04-14
  // strip-to-band-35 commit, the assembly call doesn't accept a
  // bannedPatterns parameter — every layer added to the assembly prompt
  // costs VR.
  // ---------------------------------------------------------------------------
  function handleRegenerate(_matches: AIIsmMatch[]): void {
    if (!apiKey || !mode) return;

    const state = useSessionStore.getState();
    const rawInterview = state.interview.rawTranscript;
    const detectedMode = detectWritingMode(combineContext(state.contextNotes, state.attachedFiles));
    const regime = assemblyRegime(detectedMode);
    const targetWords = state.targetWords;

    cancelRef.current?.();

    setGenerating(true);
    setOutput("");
    setVRScore(null);

    const { cancel } = assemble({
      apiKey,
      rawInterview,
      regime,
      targetWords,
      onToken: (delta) => {
        const current = useSessionStore.getState().output;
        useSessionStore.getState().setOutput(current + delta);
      },
      onComplete: (fullText) => {
        setOutput(fullText);
        setGenerating(false);
      },
      onError: (msg) => {
        setError(msg);
        setGenerating(false);
      },
    });

    cancelRef.current = cancel;
  }

  // ---------------------------------------------------------------------------
  // Regenerate-with-feedback handler — fired from PreviewPanel after the
  // user dictates/types feedback on the current output. Picks the assemble
  // mode based on outputSource:
  //   "interview" → CL framework prompt (preserves 5-section structure)
  //   "upload"    → generic edit prompt (preserves voice + structure of the
  //                 uploaded draft, applies feedback minimally)
  // The "rawInterview" passed to assembleWithFeedback is the upload content
  // for upload-sourced output, otherwise the interview transcript.
  // ---------------------------------------------------------------------------
  function handleRegenerateWithFeedback(feedback: string): void {
    if (!apiKey) return;

    const state = useSessionStore.getState();
    const previousOutput = state.output;
    if (!previousOutput) return;

    const isUpload = state.outputSource === "upload";
    const rawInterview =
      isUpload && state.uploadedDraftContent
        ? state.uploadedDraftContent
        : state.interview.rawTranscript;

    // Route regen flavor:
    //   upload → "edit" (preserve uploaded draft)
    //   interview + CL context → "cl" (preserve 5-section framework)
    //   interview + non-CL context → "generic" (preserve genre inference)
    let feedbackMode: "cl" | "generic" | "edit";
    if (isUpload) {
      feedbackMode = "edit";
    } else {
      const detectedMode = detectWritingMode(combineContext(state.contextNotes, state.attachedFiles));
      feedbackMode = assemblyRegime(detectedMode) === "cl" ? "cl" : "generic";
    }

    cancelRef.current?.();

    // Record this feedback as user-authored text so the next VR compute
    // can fold it into the denominator alongside rawInterview. The
    // assembler already receives `feedback` as a separate param for the
    // edit instruction; this is the diagnostic-side bookkeeping.
    useSessionStore.getState().appendFeedback(feedback);

    setGenerating(true);
    setOutput("");
    setVRScore(null);

    const { cancel } = assembleWithFeedback({
      apiKey,
      rawInterview,
      previousOutput,
      feedback,
      mode: feedbackMode,
      targetWords: state.targetWords,
      onToken: (delta) => {
        const current = useSessionStore.getState().output;
        useSessionStore.getState().setOutput(current + delta);
      },
      onComplete: (fullText) => {
        setOutput(fullText);
        setGenerating(false);
      },
      onError: (msg) => {
        setError(msg);
        setGenerating(false);
      },
    });

    cancelRef.current = cancel;
  }

  // ---------------------------------------------------------------------------
  // Derived flags
  // ---------------------------------------------------------------------------
  const apiKeyMissing = apiKey === null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ======================================================================
          HEADER
          ====================================================================== */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        {/* Left: logo */}
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          Human Writer Pro
        </span>

        {/* Center: reserved (mode picker removed 2026-04-15 — context drives what to write) */}
        <div className="w-[220px]" />

        {/* Right: settings button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          className={cn(
            "flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider",
            apiKeyMissing && "animate-pulse text-accent border border-accent"
          )}
        >
          <Settings className="h-4 w-4" aria-hidden />
          Settings
        </Button>
      </header>

      {/* ======================================================================
          TWO-PANEL WORKSPACE
          ====================================================================== */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ------------------------------------------------------------------
            LEFT PANEL — Interview (45%)
            ------------------------------------------------------------------ */}
        <div className="flex flex-col w-[45%] min-w-0 min-h-0">
          {/* InterviewPanel fills the scrollable flex region */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <InterviewPanel />
          </div>

          {/* Assemble dock — target-words input + button. Target is
              optional; blank/zero lets the model infer from genre +
              context. Passed through handleAssemble and
              handleRegenerateWithFeedback (shared via store.targetWords). */}
          <div className="shrink-0 px-5 py-3 border-t border-r border-border bg-card flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="target-words"
                className="label-caps text-muted-foreground shrink-0"
              >
                Target Word Count
              </label>
              <input
                id="target-words"
                type="number"
                min={50}
                max={5000}
                step={50}
                value={targetWordsDraft}
                placeholder="auto"
                onChange={(e) => {
                  const raw = e.target.value;
                  setTargetWordsDraft(raw);
                  const n = parseInt(raw, 10);
                  useSessionStore.getState().setTargetWords(
                    Number.isFinite(n) && n > 0 ? n : null
                  );
                }}
                className={cn(
                  "w-20 rounded-sm border border-border bg-background px-2 py-1",
                  "font-mono text-xs text-foreground placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
              />
              <span className="font-mono text-[0.625rem] text-muted-foreground/70 uppercase tracking-wider">
                (blank = auto)
              </span>
              {detectedModeLabel && (
                <span
                  className="ml-auto font-mono text-[0.625rem] text-accent uppercase tracking-wider"
                  title="Detected writing mode — edit context to override"
                >
                  {detectedModeLabel}
                </span>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              disabled={!canAssemble || isGenerating}
              onClick={handleAssemble}
              className="w-full font-mono uppercase tracking-wider"
            >
              {isGenerating ? "Assembling…" : "Assemble →"}
            </Button>
            {!canAssemble && !isGenerating && mode !== null && apiKey !== null && (
              <p className="font-body text-sm text-muted-foreground mt-2 text-center">
                Keep going — the tool needs more of your thinking before it can draft.
              </p>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------
            RIGHT PANEL — Preview (55%)
            EditChat trigger hidden in MVP; whole-output regenerate-with-
            feedback in PreviewPanel handles refinement instead.
            ------------------------------------------------------------------ */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 relative">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            <PreviewPanel
              onRegenerate={handleRegenerate}
              onRegenerateWithFeedback={handleRegenerateWithFeedback}
            />
          </div>
        </div>
      </div>

      {/* ======================================================================
          SETTINGS DIALOG (controlled)
          ====================================================================== */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
