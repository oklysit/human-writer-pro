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
import { useSessionStore } from "@/lib/store";
import { askSocraticEditQuestion, localizedRestitch } from "@/lib/interview-engine";
import { getMode } from "@/lib/prompts/modes";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

  function handleError(message: string): void {
    setError(message);
    toast({ title: "Edit failed", description: message, variant: "destructive" });
    setChatState("hidden");
    onClose();
  }

  async function handleSendComplaint(): Promise<void> {
    if (!complaint.trim() || !selectedParagraph || !apiKey) return;

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
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
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
            className="min-h-[72px] w-full resize-none border border-border bg-background p-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. this doesn't sound like me, the tone is wrong, it's too vague..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSendComplaint)}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Cmd+Enter to send</span>
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
            className="min-h-[88px] w-full resize-none border border-border bg-background p-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Your answer (your words will be used verbatim)..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSendAnswer)}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Cmd+Enter to send</span>
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
