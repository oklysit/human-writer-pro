"use client";

import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/lib/store";
import { askNextQuestion } from "@/lib/interview-engine";
import { countUserWords } from "@/lib/coverage";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/lib/useVoiceInput";

export function InterviewPanel() {
  // ---------------------------------------------------------------------------
  // Store bindings
  // ---------------------------------------------------------------------------
  const apiKey = useSessionStore((s) => s.apiKey);
  const mode = useSessionStore((s) => s.mode);
  const contextNotes = useSessionStore((s) => s.contextNotes);
  const turns = useSessionStore((s) => s.interview.turns);
  const coverageScore = useSessionStore((s) => s.interview.coverageScore);
  const lastAssessment = useSessionStore((s) => s.interview.lastAssessment);
  const rawTranscript = useSessionStore((s) => s.interview.rawTranscript);
  const interviewStatus = useSessionStore((s) => s.interview.status);

  const setContextNotes = useSessionStore((s) => s.setContextNotes);
  const addInterviewTurn = useSessionStore((s) => s.addInterviewTurn);
  const setLastAssessment = useSessionStore((s) => s.setLastAssessment);
  const setCoverageScore = useSessionStore((s) => s.setCoverageScore);
  const addRubricItemsAddressed = useSessionStore((s) => s.addRubricItemsAddressed);
  const setInterviewStatus = useSessionStore((s) => s.setInterviewStatus);
  const setError = useSessionStore((s) => s.setError);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  // Ref for scroll-to-bottom on new turns
  const historyEndRef = React.useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Voice input
  // ---------------------------------------------------------------------------
  // baseInputRef holds the textarea value at the moment recording starts,
  // so we can append interim/final transcripts without losing prior text.
  const baseInputRef = React.useRef("");

  const voice = useVoiceInput({
    onError: (msg) => setError(msg),
  });

  // When recording starts, snapshot the current textarea value.
  const prevRecordingRef = React.useRef(false);
  React.useEffect(() => {
    if (voice.recording && !prevRecordingRef.current) {
      baseInputRef.current = inputValue;
    }
    prevRecordingRef.current = voice.recording;
  });

  // Live preview: while recording, show base + final-so-far + interim
  React.useEffect(() => {
    if (!voice.recording) return;
    const base = baseInputRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voice.finalTranscript + voice.interimTranscript;
    if (preview) {
      setInputValue(base + separator + preview);
    }
  }, [voice.recording, voice.finalTranscript, voice.interimTranscript]);

  // On recognition end (natural or manual stop): commit final transcript
  React.useEffect(() => {
    if (!voice.recording && voice.finalTranscript) {
      const base = baseInputRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setInputValue(base + separator + voice.finalTranscript);
      baseInputRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.recording]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const userTurnCount = turns.filter((t) => t.role === "user").length;
  const wordCount = countUserWords(turns);
  const coveragePct = Math.round(coverageScore * 100);
  const isReady = coverageScore >= 0.6 && wordCount >= 150;

  // ---------------------------------------------------------------------------
  // Auto-scroll on new turns
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // ---------------------------------------------------------------------------
  // Auto-first-question on mount when mode + apiKey present and turns empty
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!mode || !apiKey || turns.length > 0 || loading) return;

    let cancelled = false;

    async function kickoff() {
      if (!mode || !apiKey) return;
      setLoading(true);
      try {
        const result = await askNextQuestion({
          mode,
          apiKey,
          history: [],
          contextNotes,
        });
        if (cancelled) return;
        setLastAssessment(result.priorAssessment);
        setCoverageScore(result.coverageScore);
        addRubricItemsAddressed(result.rubricItemsAddressedThisTurn);
        // Skip empty assistant turns — the model emits "" when it considers
        // the interview ready, and rendering an empty turn shows as blank
        // dead space in the transcript instead of a clear "ready" signal.
        if (result.question.trim().length > 0) {
          addInterviewTurn({
            role: "assistant",
            content: result.question,
            timestamp: new Date().toISOString(),
          });
        }
        if (result.readyToAssemble) {
          setInterviewStatus("ready-to-assemble");
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to start interview.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void kickoff();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, apiKey]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  async function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    // Missing API key — inline error, don't throw
    if (!apiKey) {
      setInlineError("Add your API key in Settings to continue.");
      return;
    }

    if (!mode) return;

    setInlineError(null);

    // Push user turn
    addInterviewTurn({
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    });
    setInputValue("");
    // Clear the voice transcript buffer so the next turn starts from a
    // clean slate. Without this, an active recording session keeps
    // accumulating since the last voice.start() call, and the live-preview
    // effect re-populates the textarea with prior turns' text after
    // setInputValue("") cleared it. See 2026-04-15 consultant report —
    // "Scenario B" state corruption confirmed in the CrowdStrike interview.
    voice.reset();
    setLoading(true);

    // Build history including the just-added user turn
    const currentTurns = useSessionStore.getState().interview.turns;

    try {
      const result = await askNextQuestion({
        mode,
        apiKey,
        history: currentTurns,
        contextNotes,
      });
      setLastAssessment(result.priorAssessment);
      setCoverageScore(result.coverageScore);
      addRubricItemsAddressed(result.rubricItemsAddressedThisTurn);
      // Skip empty assistant turns (see kickoff above for rationale).
      if (result.question.trim().length > 0) {
        addInterviewTurn({
          role: "assistant",
          content: result.question,
          timestamp: new Date().toISOString(),
        });
      }
      if (result.readyToAssemble) {
        setInterviewStatus("ready-to-assemble");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      // Restore input for retry
      setInputValue(trimmed);
    } finally {
      setLoading(false);
    }
  }

  // Cmd/Ctrl+Enter keyboard shortcut
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // No mode selected
  if (!mode) {
    return (
      <div className="flex flex-col h-full bg-card border-r border-border">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border">
          <span className="label-caps text-foreground">Interview</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-5">
          <p className="font-mono text-sm text-muted-foreground">
            Pick a writing mode to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header row                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <span className="label-caps text-foreground">Interview</span>
        <span className="font-mono text-xs text-muted-foreground">
          Question {userTurnCount > 0 ? userTurnCount + 1 : 1} of ~7
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1b. Context (optional, per-interview)                                */}
      {/* Free-form text the interviewer reads to ask better questions.        */}
      {/* Never reaches the assembly call — see lib/store.ts contextNotes.     */}
      {/* ------------------------------------------------------------------ */}
      <details className="border-b border-border shrink-0 group">
        <summary className="px-5 py-2 cursor-pointer label-caps text-muted-foreground hover:text-foreground select-none flex items-center justify-between">
          <span>
            Context {contextNotes.trim() ? `· ${contextNotes.trim().length} chars` : "· optional"}
          </span>
          <span className="font-mono text-xs opacity-50 group-open:opacity-100">▾</span>
        </summary>
        <div className="px-5 pb-3">
          <Textarea
            value={contextNotes}
            onChange={(e) => setContextNotes(e.target.value)}
            placeholder="Paste an assignment, JD, thesis, or a sentence about what you're working on. The interviewer reads this to ask better questions. Never reaches the final draft."
            rows={6}
            className="resize-y font-mono text-xs"
          />
        </div>
      </details>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Coverage progress bar                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Coverage progress"
            aria-valuenow={coveragePct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="flex-1 h-1 bg-muted rounded-sm overflow-hidden"
          >
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-sm",
                isReady ? "bg-accent" : "bg-warning/70"
              )}
              style={{ width: `${coveragePct}%` }}
            />
          </div>
          <span
            className={cn(
              "label-caps shrink-0",
              isReady ? "text-accent" : "text-muted-foreground"
            )}
          >
            Coverage {coveragePct}%
          </span>
        </div>
        {isReady && (
          <p className="font-mono text-xs text-accent mt-1.5">
            Ready to assemble.
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Assessment callout                                               */}
      {/* ------------------------------------------------------------------ */}
      {lastAssessment !== null && (
        <div className="px-5 py-2 border-b border-border shrink-0">
          <p
            className={cn(
              "font-mono text-xs",
              lastAssessment.level === "sufficient" && "text-success",
              lastAssessment.level === "partial" && "text-accent",
              lastAssessment.level === "insufficient" && "text-destructive"
            )}
          >
            {lastAssessment.level === "sufficient" &&
              "Last answer: sufficient — advancing."}
            {lastAssessment.level === "partial" &&
              "Last answer: partially sufficient — follow-up coming."}
            {lastAssessment.level === "insufficient" &&
              "Last answer: insufficient — more specifics needed."}
          </p>
        </div>
      )}
      {lastAssessment === null && turns.length === 0 && !loading && (
        <div className="px-5 py-2 border-b border-border shrink-0">
          <p className="font-mono text-xs text-muted-foreground">
            Interview starting…
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4 + 5. Turn history (scrollable) + current question                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
        {turns.map((turn, i) => {
          const isAssistant = turn.role === "assistant";
          const isLast = i === turns.length - 1;

          return (
            <div
              key={i}
              className={cn(
                "pl-3 py-1",
                isAssistant
                  ? "border-l-2 border-warning"
                  : "border-l-2 border-border"
              )}
            >
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isAssistant
                    ? cn(
                        "font-display text-foreground",
                        isLast && "font-semibold"
                      )
                    : "font-body text-muted-foreground"
                )}
              >
                {turn.content}
              </p>
            </div>
          );
        })}

        {/* Loading indicator — thin editorial progress pulse */}
        {loading && (
          <div className="pl-3 py-1 border-l-2 border-warning/40">
            <div className="h-1 w-24 bg-muted rounded-sm overflow-hidden">
              <div className="h-full bg-warning/50 rounded-sm animate-pulse w-full" />
            </div>
          </div>
        )}

        <div ref={historyEndRef} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6 + 7. Input area + voice placeholder                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-5 py-4 border-t border-border shrink-0 flex flex-col gap-2">
        {/* Ready-to-assemble banner — model has decided it has enough material.
            Shown above the input so it's the first thing the user sees on the
            way to typing more or hitting Assemble. The textarea stays active
            so the user can still add more if they want. */}
        {interviewStatus === "ready-to-assemble" && (
          <div className="rounded-sm border border-accent/40 bg-accent/10 px-3 py-2">
            <p className="font-mono text-xs text-accent">
              Ready to assemble — click <span className="font-semibold">Assemble →</span> below, or add anything else you'd like to mention.
            </p>
          </div>
        )}

        {/* Inline API key error */}
        {inlineError && (
          <p className="font-mono text-xs text-destructive">{inlineError}</p>
        )}

        <label htmlFor="interview-input" className="sr-only">
          Your answer
        </label>

        <Textarea
          id="interview-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (inlineError) setInlineError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Your answer…"
          disabled={loading}
          rows={3}
          className="resize-none"
        />

        <div className="flex items-center gap-2">
          {/* Voice input button */}
          {voice.supported ? (
            <button
              type="button"
              onClick={() => (voice.recording ? voice.stop() : voice.start())}
              disabled={loading}
              aria-label={voice.recording ? "Stop voice input" : "Start voice input"}
              title={voice.recording ? "Stop recording" : "Start voice input"}
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                voice.recording
                  ? "text-accent border-accent animate-pulse"
                  : "text-muted-foreground hover:text-foreground hover:border-foreground",
                loading && "opacity-40 cursor-not-allowed"
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
            variant="default"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={loading || !inputValue.trim()}
            className="ml-auto"
            aria-label="Send answer"
          >
            {loading ? "…" : "Next →"}
          </Button>
        </div>

        <p className="font-mono text-[0.625rem] text-muted-foreground/60 text-right">
          Cmd+Enter to send
        </p>
      </div>
    </div>
  );
}
