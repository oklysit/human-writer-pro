"use client";

/**
 * EditChat — Socratic edit flow for a highlighted paragraph.
 *
 * State machine:
 *   hidden → intro → asking → awaiting-answer → restitching → diff-preview → applied | rejected
 *
 * Parent (Task 17 layout) passes selectedParagraph down. When it becomes null
 * this component is in "hidden" state and renders nothing. After Accept/Reject/Error
 * onClose() is called so the parent can clear the selection.
 *
 * Shape: self-contained panel, no fixed/absolute positioning — Task 17 decides
 * where to mount it (sidebar, drawer, overlay). The component fills whatever
 * container it is placed in.
 */

import * as React from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useSessionStore } from "@/lib/store";
import { askSocraticEditQuestion, localizedRestitch } from "@/lib/interview-engine";
import { getMode } from "@/lib/prompts/modes";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput, type UseVoiceInputReturn } from "@/lib/useVoiceInput";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EditChatState =
  | "hidden"
  | "intro"
  | "asking"
  | "awaiting-answer"
  | "restitching"
  | "diff-preview"
  | "applied"
  | "rejected";

export type EditChatProps = {
  /** null → hidden state */
  selectedParagraph: string | null;
  /** Called after Accept / Reject / Error so the parent clears the selection */
  onClose: () => void;
  className?: string;
};

// ---------------------------------------------------------------------------
// MicButton — small reusable trigger that mirrors the InterviewPanel mic UI
// ---------------------------------------------------------------------------

function MicButton({
  voice,
  disabled,
}: {
  voice: UseVoiceInputReturn;
  disabled?: boolean;
}): JSX.Element {
  if (!voice.supported) {
    return (
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
    );
  }
  return (
    <button
      type="button"
      onClick={() => (voice.recording ? voice.stop() : voice.start())}
      disabled={disabled}
      aria-label={voice.recording ? "Stop voice input" : "Start voice input"}
      title={voice.recording ? "Stop recording" : "Start voice input"}
      className={cn(
        "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
        voice.recording
          ? "text-accent border-accent animate-pulse"
          : "text-muted-foreground hover:text-foreground hover:border-foreground",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {voice.recording ? (
        <MicOff className="h-4 w-4" aria-hidden />
      ) : (
        <Mic className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditChat({ selectedParagraph, onClose, className }: EditChatProps): JSX.Element {
  const apiKey = useSessionStore((s) => s.apiKey);
  const mode = useSessionStore((s) => s.mode);
  const output = useSessionStore((s) => s.output);
  const rawInterview = useSessionStore((s) => s.interview.rawTranscript);
  const setOutput = useSessionStore((s) => s.setOutput);
  const setError = useSessionStore((s) => s.setError);

  const { toast } = useToast();

  // ---- Local state ----
  const [chatState, setChatState] = React.useState<EditChatState>("hidden");
  const [complaint, setComplaint] = React.useState("");
  const [socraticQuestion, setSocraticQuestion] = React.useState("");
  const [userAnswer, setUserAnswer] = React.useState("");
  const [restitched, setRestitched] = React.useState("");

  // ---- Voice input — separate instances per textarea ----
  // Two textareas (complaint + answer) live in mutually-exclusive states, but
  // each gets its own voice hook so the recording state, interim transcript,
  // and base snapshot stay independent.
  const voiceComplaint = useVoiceInput({
    onError: (msg) => setError(msg),
  });
  const voiceAnswer = useVoiceInput({
    onError: (msg) => setError(msg),
  });

  // Snapshots — capture textarea value at the moment recording starts so
  // interim/final transcripts can be appended without losing prior text.
  const complaintBaseRef = React.useRef("");
  const answerBaseRef = React.useRef("");

  // Snapshot complaint when its recording starts
  const prevComplaintRecording = React.useRef(false);
  React.useEffect(() => {
    if (voiceComplaint.recording && !prevComplaintRecording.current) {
      complaintBaseRef.current = complaint;
    }
    prevComplaintRecording.current = voiceComplaint.recording;
  });

  // Snapshot answer when its recording starts
  const prevAnswerRecording = React.useRef(false);
  React.useEffect(() => {
    if (voiceAnswer.recording && !prevAnswerRecording.current) {
      answerBaseRef.current = userAnswer;
    }
    prevAnswerRecording.current = voiceAnswer.recording;
  });

  // Live preview — complaint
  React.useEffect(() => {
    if (!voiceComplaint.recording) return;
    const base = complaintBaseRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voiceComplaint.finalTranscript + voiceComplaint.interimTranscript;
    if (preview) {
      setComplaint(base + separator + preview);
    }
  }, [voiceComplaint.recording, voiceComplaint.finalTranscript, voiceComplaint.interimTranscript]);

  // Commit complaint final on stop
  React.useEffect(() => {
    if (!voiceComplaint.recording && voiceComplaint.finalTranscript) {
      const base = complaintBaseRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setComplaint(base + separator + voiceComplaint.finalTranscript);
      complaintBaseRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceComplaint.recording]);

  // Live preview — answer
  React.useEffect(() => {
    if (!voiceAnswer.recording) return;
    const base = answerBaseRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voiceAnswer.finalTranscript + voiceAnswer.interimTranscript;
    if (preview) {
      setUserAnswer(base + separator + preview);
    }
  }, [voiceAnswer.recording, voiceAnswer.finalTranscript, voiceAnswer.interimTranscript]);

  // Commit answer final on stop
  React.useEffect(() => {
    if (!voiceAnswer.recording && voiceAnswer.finalTranscript) {
      const base = answerBaseRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setUserAnswer(base + separator + voiceAnswer.finalTranscript);
      answerBaseRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceAnswer.recording]);

  // Auto-scroll textareas during voice dictation so transcript stays in view
  // as it appends past the visible region. Same Loom-credibility fix as the
  // InterviewPanel input.
  const complaintTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const answerTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (voiceComplaint.recording && complaintTextareaRef.current) {
      complaintTextareaRef.current.scrollTop = complaintTextareaRef.current.scrollHeight;
    }
  }, [voiceComplaint.recording, complaint]);
  React.useEffect(() => {
    if (voiceAnswer.recording && answerTextareaRef.current) {
      answerTextareaRef.current.scrollTop = answerTextareaRef.current.scrollHeight;
    }
  }, [voiceAnswer.recording, userAnswer]);

  // Sync hidden / intro with selectedParagraph prop
  React.useEffect(() => {
    if (selectedParagraph !== null) {
      setChatState("intro");
      setComplaint("");
      setSocraticQuestion("");
      setUserAnswer("");
      setRestitched("");
    } else {
      setChatState("hidden");
    }
  }, [selectedParagraph]);

  // ---- Handlers ----

  function handleCancel(): void {
    // Stop and clear any active voice sessions so they don't leak state into
    // the next time the panel opens (different paragraph).
    voiceComplaint.stop();
    voiceComplaint.reset();
    voiceAnswer.stop();
    voiceAnswer.reset();
    setChatState("hidden");
    onClose();
  }

  // Escape closes the panel from any non-terminal state.
  React.useEffect(() => {
    const isOpen =
      chatState !== "hidden" && chatState !== "applied" && chatState !== "rejected";
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatState]);

  function handleError(message: string): void {
    setError(message);
    toast({ title: "Edit failed", description: message, variant: "destructive" });
    setChatState("hidden");
    onClose();
  }

  async function handleSendComplaint(): Promise<void> {
    if (!complaint.trim() || !selectedParagraph || !apiKey) return;

    voiceComplaint.stop();
    voiceComplaint.reset();
    setChatState("asking");
    try {
      const question = await askSocraticEditQuestion({
        apiKey,
        selectedParagraph,
        userComplaint: complaint.trim(),
      });
      setSocraticQuestion(question);
      setChatState("awaiting-answer");
    } catch (err) {
      handleError(err instanceof Error ? err.message : "Failed to generate question.");
    }
  }

  async function handleSendAnswer(): Promise<void> {
    if (!userAnswer.trim() || !selectedParagraph || !apiKey || !mode) return;

    voiceAnswer.stop();
    voiceAnswer.reset();
    setChatState("restitching");
    const modeConfig = getMode(mode);
    try {
      const result = await localizedRestitch({
        apiKey,
        mode: modeConfig,
        rawInterview,
        paragraph: selectedParagraph,
        newVerbatim: userAnswer.trim(),
      });
      setRestitched(result);
      setChatState("diff-preview");
    } catch (err) {
      handleError(err instanceof Error ? err.message : "Failed to restitch paragraph.");
    }
  }

  function handleAccept(): void {
    if (!selectedParagraph || !restitched) return;
    // Replace first occurrence — plain string, no regex
    const idx = output.indexOf(selectedParagraph);
    if (idx !== -1) {
      const updated = output.slice(0, idx) + restitched + output.slice(idx + selectedParagraph.length);
      setOutput(updated);
    } else {
      // Paragraph not found verbatim (e.g. output changed meanwhile) — append restitched
      setOutput(output + "\n\n" + restitched);
    }
    toast({ title: "Paragraph updated." });
    setChatState("applied");
    onClose();
  }

  function handleReject(): void {
    setChatState("rejected");
    onClose();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    submit: () => void
  ): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  // ---- Render ----

  if (chatState === "hidden" || chatState === "applied" || chatState === "rejected") {
    return <></>;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border border-border bg-card p-4",
        className
      )}
    >
      {/* Header — title + close (X). Always visible while panel is open. */}
      <div className="flex items-center justify-between">
        <span className="label-caps text-foreground">Edit paragraph</span>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Close edit panel (Esc)"
          title="Close (Esc)"
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded-sm",
            "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          )}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Selected paragraph context */}
      {selectedParagraph && (
        <div className="flex flex-col gap-1">
          <span className="label-caps text-muted-foreground">Selected paragraph</span>
          <blockquote className="border-l-2 border-border pl-3 font-body text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {selectedParagraph}
          </blockquote>
        </div>
      )}

      {/* State: intro — ask what feels off */}
      {chatState === "intro" && (
        <div className="flex flex-col gap-3">
          <label className="label-caps text-foreground" htmlFor="edit-complaint">
            What feels off?
          </label>
          <textarea
            id="edit-complaint"
            ref={complaintTextareaRef}
            className="min-h-[72px] w-full resize-none border border-border bg-background p-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. this doesn't sound like me, the tone is wrong, it's too vague..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSendComplaint)}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Enter to send · Shift+Enter for newline</span>
            <div className="flex items-center gap-2">
              <MicButton voice={voiceComplaint} />
              <Button
                size="sm"
                onClick={handleSendComplaint}
                disabled={!complaint.trim()}
                className="font-mono text-xs uppercase tracking-wider"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* State: asking — Call 1 in-flight */}
      {chatState === "asking" && (
        <div className="flex flex-col gap-2">
          <div className="h-0.5 w-full overflow-hidden bg-muted">
            <div className="h-full w-1/2 animate-pulse bg-foreground/30" />
          </div>
          <p className="font-body text-sm text-muted-foreground italic">Thinking of a question&hellip;</p>
        </div>
      )}

      {/* State: awaiting-answer — show Socratic question, collect answer */}
      {chatState === "awaiting-answer" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="label-caps text-muted-foreground">Question</span>
            <p className="font-body text-sm text-foreground leading-relaxed">{socraticQuestion}</p>
          </div>
          <textarea
            ref={answerTextareaRef}
            className="min-h-[88px] w-full resize-none border border-border bg-background p-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Your answer (your words will be used verbatim)..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSendAnswer)}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Enter to send · Shift+Enter for newline</span>
            <div className="flex items-center gap-2">
              <MicButton voice={voiceAnswer} />
              <Button
                size="sm"
                onClick={handleSendAnswer}
                disabled={!userAnswer.trim()}
                className="font-mono text-xs uppercase tracking-wider"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* State: restitching — Call 2 in-flight */}
      {chatState === "restitching" && (
        <div className="flex flex-col gap-2">
          <div className="h-0.5 w-full overflow-hidden bg-muted">
            <div className="h-full w-1/2 animate-pulse bg-foreground/30" />
          </div>
          <p className="font-body text-sm text-muted-foreground italic">Restitching paragraph&hellip;</p>
        </div>
      )}

      {/* State: diff-preview — show original vs restitched */}
      {chatState === "diff-preview" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="label-caps text-muted-foreground">Original</span>
            <p className="font-body text-sm text-foreground leading-relaxed border-l-2 border-border pl-3">
              {selectedParagraph}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="label-caps text-foreground">Restitched</span>
            <p className="font-body text-sm text-foreground leading-relaxed border-l-2 border-ring pl-3">
              {restitched}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              className="font-mono text-xs uppercase tracking-wider"
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReject}
              className="font-mono text-xs uppercase tracking-wider"
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
