"use client";

import * as React from "react";
import { Mic, MicOff, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/lib/store";
import { askNextQuestion } from "@/lib/interview-engine";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { extractText, isSupported } from "@/lib/fileImport";

export function InterviewPanel() {
  // ---------------------------------------------------------------------------
  // Store bindings
  // ---------------------------------------------------------------------------
  const apiKey = useSessionStore((s) => s.apiKey);
  const mode = useSessionStore((s) => s.mode);
  const contextNotes = useSessionStore((s) => s.contextNotes);
  const turns = useSessionStore((s) => s.interview.turns);
  const lastAssessment = useSessionStore((s) => s.interview.lastAssessment);

  const setContextNotes = useSessionStore((s) => s.setContextNotes);
  const addInterviewTurn = useSessionStore((s) => s.addInterviewTurn);
  const setLastAssessment = useSessionStore((s) => s.setLastAssessment);
  const setInterviewStatus = useSessionStore((s) => s.setInterviewStatus);
  const setError = useSessionStore((s) => s.setError);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Ref for scroll-to-bottom on new turns
  const historyEndRef = React.useRef<HTMLDivElement>(null);
  // Ref for the input textarea — used to auto-scroll while voice dictation
  // overflows the visible region (Loom-credibility fix; see post-mvp-backlog.md #2)
  const inputTextareaRef = React.useRef<HTMLTextAreaElement>(null);

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

  // Auto-scroll the input textarea to the bottom while voice dictation is
  // appending content — without this, voice transcripts that overflow the
  // 3-row visible area land out of view (post-mvp-backlog #2). Only fires
  // while recording so normal typing UX is unaffected.
  React.useEffect(() => {
    if (voice.recording && inputTextareaRef.current) {
      inputTextareaRef.current.scrollTop = inputTextareaRef.current.scrollHeight;
    }
  }, [voice.recording, inputValue]);

  // ---------------------------------------------------------------------------
  // Voice input — Context textarea (pre-interview only)
  // ---------------------------------------------------------------------------
  // Separate instance from the answer-stage voice hook so a user who dictated
  // their context and then mic'd an answer doesn't have their prior context
  // leak into the answer buffer. Same base-snapshot + live-preview + commit-
  // on-stop + autoscroll pattern.
  const contextTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const baseContextRef = React.useRef("");
  const voiceContext = useVoiceInput({
    onError: (msg) => setError(msg),
  });
  const prevContextRecordingRef = React.useRef(false);
  React.useEffect(() => {
    if (voiceContext.recording && !prevContextRecordingRef.current) {
      baseContextRef.current = contextNotes;
    }
    prevContextRecordingRef.current = voiceContext.recording;
  });
  React.useEffect(() => {
    if (!voiceContext.recording) return;
    const base = baseContextRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voiceContext.finalTranscript + voiceContext.interimTranscript;
    if (preview) {
      setContextNotes(base + separator + preview);
    }
  }, [voiceContext.recording, voiceContext.finalTranscript, voiceContext.interimTranscript]);
  React.useEffect(() => {
    if (!voiceContext.recording && voiceContext.finalTranscript) {
      const base = baseContextRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setContextNotes(base + separator + voiceContext.finalTranscript);
      baseContextRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceContext.recording]);
  React.useEffect(() => {
    if (voiceContext.recording && contextTextareaRef.current) {
      contextTextareaRef.current.scrollTop = contextTextareaRef.current.scrollHeight;
    }
  }, [voiceContext.recording, contextNotes]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  // (userTurnCount / wordCount / coveragePct / isReady dropped 2026-04-15 —
  // coverage-driven UI removed in favour of the adaptive-interviewer model's
  // conversational readiness signal.)

  // ---------------------------------------------------------------------------
  // Auto-scroll on new turns
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // ---------------------------------------------------------------------------
  // Kickoff — user-triggered (not auto on mode change)
  // ---------------------------------------------------------------------------
  // Per user 2026-04-15: mode selection alone should NOT trigger the first
  // question. Workflow is now context-first — user fills the Context panel
  // (recommended), then explicitly clicks "Start Interview" to fire the
  // model's first question. Without this, the model defaults to generic
  // "what are you applying for?" openers even when the context already
  // tells it.
  async function kickoff() {
    if (!mode || !apiKey || turns.length > 0 || loading) return;
    if (!contextNotes.trim()) return;
    setLoading(true);
    try {
      const result = await askNextQuestion({
        mode,
        apiKey,
        history: [],
        contextNotes,
      });
      setLastAssessment(result.priorAssessment);
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
      const msg = err instanceof Error ? err.message : "Failed to start interview.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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
    // Halt the active recording session and clear its transcript buffer so
    // the next turn starts from a clean slate. voice.stop() also nulls the
    // onresult callback so any in-flight speech chunks (last few words still
    // being processed when the user hits submit) can't leak into the next
    // turn's textbox. voice.reset() clears the buffered transcript state.
    // See 2026-04-15 consultant reports — Scenario B state corruption +
    // recognition-pipeline lag.
    voice.stop();
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

  // Enter to send; Shift+Enter for newline. Standard chat-app convention.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------
  // Uploaded files are read in the browser, text-extracted (.md/.txt via
  // FileReader, .pdf via pdfjs-dist, .docx via mammoth), and appended to
  // `contextNotes`. The appended text reaches ONLY the interview stage —
  // never the assembly call (see lib/store.ts contextNotes comment).
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    for (const file of Array.from(files)) {
      if (!isSupported(file.name)) {
        setUploadError(`Unsupported: ${file.name}. Use .md / .txt / .pdf / .docx.`);
        continue;
      }
      setUploading(file.name);
      try {
        const text = await extractText(file);
        if (!text) {
          setUploadError(`No text extracted from ${file.name}.`);
          continue;
        }
        const current = useSessionStore.getState().contextNotes;
        const separator = current.trim().length > 0 ? "\n\n" : "";
        setContextNotes(
          `${current}${separator}--- From: ${file.name} ---\n\n${text}`
        );
        // Mid-interview feedback: confirm the upload landed. During
        // pre-interview the char-count next to the paperclip does the
        // same job; the toast matters most once the interview has
        // started and the user can't see contextNotes directly.
        toast({
          title: "Context added",
          description:
            turns.length > 0
              ? `${file.name} — the interviewer will reference it in the next question.`
              : `${file.name}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Failed to read ${file.name}`;
        setUploadError(msg);
      } finally {
        setUploading(null);
      }
    }

    // Clear the input so selecting the same file again re-fires change.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  // No mode-gate render: mode defaults to "cover-letter" in the store
  // (2026-04-15 Writing-Mode-dropdown removal). Context gates the flow.

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Single always-rendered file input shared by both dock paperclips
          (pre-interview Context dock + answer dock). Lives here so
          fileInputRef.current is valid regardless of dock state. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.pdf,.docx"
        multiple
        className="hidden"
        onChange={(e) => void handleFileSelect(e)}
      />

      {/* Header removed 2026-04-15 — "Interview" label was redundant with
          the app's whole purpose. 2026-04-15 UAT: Context panel moved
          from the top of the pane into the bottom input dock, so the
          pre-interview state reads as "greeting above + context input
          below", structurally matching the interview state ("questions
          above + answer input below"). One consolidated chat metaphor
          across both states. */}

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
      {/* ------------------------------------------------------------------ */}
      {/* 4 + 5. Turn history (scrollable) + current question                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
        {/* Pre-interview greeting — single concise assistant-style message.
            The Context input + Start button live in the bottom dock (below)
            so this pane reads as a chat thread: greeting above, input below,
            matching the interview state's layout. */}
        {turns.length === 0 && !loading && (
          <div className="pl-3 py-1 border-l-2 border-warning/40">
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Welcome to Human Writer Pro. Paste or upload your context below — a job posting, an assignment, a reference doc, anything I should read before asking questions — then hit <strong className="text-foreground font-semibold">Start Interview</strong>. Your answers become the raw material I stitch the draft from, so the more specific you get, the more of your voice lands in the output.
            </p>
          </div>
        )}

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

        {/* Loading indicator — chat-style "Thinking…" with pulsing bar.
            Previously just a thin animated bar, too subtle during longer
            question-generation calls; user couldn't tell if stuck or
            working (UAT 2026-04-15). Now pairs explicit text with the bar. */}
        {loading && (
          <div className="pl-3 py-1 border-l-2 border-warning/40 flex flex-col gap-1.5">
            <p className="font-body text-sm text-muted-foreground italic animate-pulse">
              Thinking&hellip;
            </p>
            <div className="h-1 w-24 bg-muted rounded-sm overflow-hidden">
              <div className="h-full bg-warning/50 rounded-sm animate-pulse w-full" />
            </div>
          </div>
        )}

        <div ref={historyEndRef} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6 + 7. Pre-interview Start button OR active input area              */}
      {/* ------------------------------------------------------------------ */}
      {turns.length === 0 ? (
        // Pre-interview: Context input dock — textarea + upload + Start
        // Interview. Structurally mirrors the interview's answer dock
        // (textarea + mic + Next), so the pane reads as a chat thread
        // across both states. Context is a "first user message" the user
        // provides before the interview begins; Start Interview is the
        // "send" equivalent.
        <div className="px-5 py-3 border-t border-border shrink-0 flex flex-col gap-2">
          {uploadError && (
            <p className="font-mono text-xs text-destructive">{uploadError}</p>
          )}
          <label htmlFor="context-input" className="sr-only">
            Context
          </label>
          <Textarea
            id="context-input"
            ref={contextTextareaRef}
            value={contextNotes}
            onChange={(e) => setContextNotes(e.target.value)}
            placeholder="Paste a job posting, assignment + rubric, reference doc, or dictate: 'I'm writing an essay on WWII, attaching the rubric'. This reaches only the interviewer — never the final draft."
            rows={5}
            className="resize-none font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            {/* Upload (file-as-context) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading !== null}
              aria-label="Upload context file"
              title="Upload .md, .txt, .pdf, or .docx. Text is extracted in the browser and appended to the context."
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                "text-muted-foreground hover:text-foreground hover:border-foreground",
                uploading !== null && "opacity-50 cursor-not-allowed"
              )}
            >
              <Paperclip className="h-4 w-4" aria-hidden />
            </button>

            {/* Mic (dictate context) */}
            {voiceContext.supported ? (
              <button
                type="button"
                onClick={() => {
                  if (voiceContext.recording) {
                    voiceContext.stop();
                    contextTextareaRef.current?.focus();
                  } else {
                    voiceContext.start();
                  }
                }}
                aria-label={voiceContext.recording ? "Stop voice input" : "Start voice input"}
                title={voiceContext.recording ? "Stop recording" : "Dictate context"}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                  voiceContext.recording
                    ? "text-accent border-accent animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:border-foreground"
                )}
              >
                {voiceContext.recording ? (
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

            {uploading !== null && (
              <span className="font-mono text-xs text-muted-foreground">
                Reading {uploading}…
              </span>
            )}
            {contextNotes.trim() && uploading === null && (
              <span className="font-mono text-xs text-muted-foreground">
                {contextNotes.trim().length} chars
              </span>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => void kickoff()}
              disabled={loading || !apiKey || !contextNotes.trim()}
              className="ml-auto font-mono uppercase tracking-wider"
            >
              {loading ? "Starting…" : "Start Interview →"}
            </Button>
          </div>
          {!apiKey && (
            <p className="font-mono text-xs text-destructive">
              Add your API key in Settings to begin.
            </p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-border shrink-0 flex flex-col gap-2">
        {/* Inline API key error */}
        {inlineError && (
          <p className="font-mono text-xs text-destructive">{inlineError}</p>
        )}

        <label htmlFor="interview-input" className="sr-only">
          Your answer
        </label>

        <Textarea
          id="interview-input"
          ref={inputTextareaRef}
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
          {/* Upload additional context mid-interview — clicks the same
              hidden file input as the pre-interview dock; handleFileSelect
              fires a toast so the user sees confirmation that the
              interviewer now has the new material. */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading !== null}
            aria-label="Add context file"
            title="Add more context (.md / .txt / .pdf / .docx). The interviewer will reference it in the next question."
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
              "text-muted-foreground hover:text-foreground hover:border-foreground",
              (loading || uploading !== null) && "opacity-40 cursor-not-allowed"
            )}
          >
            <Paperclip className="h-4 w-4" aria-hidden />
          </button>

          {/* Voice input button */}
          {voice.supported ? (
            <button
              type="button"
              onClick={() => {
                if (voice.recording) {
                  voice.stop();
                  // Return focus to the textarea so the next Enter submits
                  // instead of retoggling the mic button (the last clicked
                  // element keeps focus by default — surprising UX after
                  // dictation).
                  inputTextareaRef.current?.focus();
                } else {
                  voice.start();
                }
              }}
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

          {uploading !== null && (
            <span className="font-mono text-xs text-muted-foreground">
              Reading {uploading}…
            </span>
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
        {uploadError && (
          <p className="font-mono text-xs text-destructive">{uploadError}</p>
        )}

        </div>
      )}
    </div>
  );
}
