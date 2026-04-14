"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeSelector } from "@/components/mode-selector";
import { SettingsDialog } from "@/components/settings-dialog";
import { InterviewPanel } from "@/components/interview-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { EditChat } from "@/components/edit-chat";
import { useSessionStore, useCanAssemble } from "@/lib/store";
import { assemble } from "@/lib/assemble";
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
  // Text selection → EditChat state
  // ---------------------------------------------------------------------------
  const [pendingSelection, setPendingSelection] = React.useState<string | null>(null);
  const [showEditPrompt, setShowEditPrompt] = React.useState(false);
  const [selectedParagraph, setSelectedParagraph] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleMouseUp() {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 3) {
        const anchor = selection.anchorNode;
        if (anchor instanceof Text || anchor instanceof Element) {
          const paragraph = (anchor instanceof Text
            ? anchor.parentElement
            : anchor
          )?.closest(".prose-output p");
          if (paragraph) {
            setPendingSelection(paragraph.textContent ?? null);
            setShowEditPrompt(true);
            return;
          }
        }
      }
      setShowEditPrompt(false);
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // ---------------------------------------------------------------------------
  // Assemble handler
  // ---------------------------------------------------------------------------
  const cancelRef = React.useRef<(() => void) | null>(null);

  function handleAssemble() {
    if (!apiKey || !mode) return;

    const rawInterview = useSessionStore.getState().interview.rawTranscript;

    // Cancel any in-flight stream
    cancelRef.current?.();

    setGenerating(true);
    setOutput("");
    setVRScore(null);

    const { cancel } = assemble({
      apiKey,
      rawInterview,
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
  // Regenerate handler — called from PreviewPanel when user clicks
  // "Regenerate avoiding these" in DiagnosticPills.
  //
  // Per the 2026-04-14 strip-to-band-35 commit, the assembly call no longer
  // accepts a bannedPatterns parameter — every layer added to the assembly
  // prompt costs VR. Regen is now just a fresh re-assemble against the same
  // raw interview; the AI-ism diagnostic stays as informational signal.
  // ---------------------------------------------------------------------------
  function handleRegenerate(_matches: AIIsmMatch[]): void {
    if (!apiKey || !mode) return;

    const rawInterview = useSessionStore.getState().interview.rawTranscript;

    cancelRef.current?.();

    setGenerating(true);
    setOutput("");
    setVRScore(null);

    const { cancel } = assemble({
      apiKey,
      rawInterview,
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
  const editChatActive = selectedParagraph !== null;

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

        {/* Center: mode selector */}
        <div className="w-[220px]">
          <ModeSelector />
        </div>

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

          {/* Assemble button — docked at bottom of left column */}
          <div className="shrink-0 px-5 py-3 border-t border-r border-border bg-card">
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
            RIGHT PANEL — Preview + EditChat (55%)
            ------------------------------------------------------------------ */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 relative">
          {/* Preview area — fills space; shrinks when EditChat is active */}
          <div
            className={cn(
              "flex-1 min-h-0 overflow-y-auto px-6 py-5",
              editChatActive && "shrink"
            )}
          >
            <PreviewPanel onRegenerate={handleRegenerate} />

            {/* "Edit paragraph" float button — appears on valid selection */}
            {showEditPrompt && pendingSelection && !editChatActive && (
              <div className="sticky bottom-4 flex justify-end mt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-mono text-xs uppercase tracking-wider shadow-sm"
                  onClick={() => {
                    setSelectedParagraph(pendingSelection);
                    setShowEditPrompt(false);
                  }}
                >
                  Edit paragraph
                </Button>
              </div>
            )}
          </div>

          {/* EditChat — stacked below preview when active */}
          {editChatActive && (
            <div className="shrink-0 border-t border-border min-h-[280px] max-h-[40vh] overflow-y-auto">
              <EditChat
                selectedParagraph={selectedParagraph}
                onClose={() => {
                  setSelectedParagraph(null);
                  setShowEditPrompt(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================
          SETTINGS DIALOG (controlled)
          ====================================================================== */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
