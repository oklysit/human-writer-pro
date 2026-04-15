import type { InterviewTurn } from "./store";

/**
 * Parse a pasted interview transcript into structured turns.
 *
 * Used by the "Seed from prior transcript" dev utility — lets the user
 * skip re-doing an interview when iterating on assembly prompts or UI.
 *
 * Supports common transcript formats:
 *
 *   [USER]: ...
 *   [ASSISTANT]: ...
 *
 *   User: ...
 *   Assistant: ...
 *
 *   **You:** ...
 *   **Interviewer:** ...
 *
 *   Q: ...
 *   A: ...
 *
 * The first matched marker style anchors parsing. Lines without a marker
 * are appended to the most recent turn's content (preserves multi-line
 * answers). Empty lines are kept as paragraph breaks within a turn.
 *
 * If no markers are found at all, the whole input becomes a single user
 * turn (graceful fallback).
 */

type MarkerSet = {
  user: RegExp;
  assistant: RegExp;
};

const MARKER_SETS: MarkerSet[] = [
  // [USER]: / [ASSISTANT]: — what the OAuth-proxy collapse uses
  { user: /^\[USER\]:\s*/i, assistant: /^\[ASSISTANT\]:\s*/i },
  // User: / Assistant: — common LLM transcript style
  { user: /^User:\s*/, assistant: /^Assistant:\s*/ },
  // **You:** / **Interviewer:** — markdown-flavored conversation
  { user: /^\*\*You:\*\*\s*/i, assistant: /^\*\*(Interviewer|Assistant|HWP|Model):\*\*\s*/i },
  // Q: / A: — Q&A style (Q = assistant question, A = user answer)
  { user: /^A:\s*/, assistant: /^Q:\s*/ },
];

export type ParseResult =
  | { ok: true; turns: InterviewTurn[]; markerStyle: string }
  | { ok: false; error: string };

export function parseTranscript(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Transcript is empty." };
  }

  // Try each marker set; pick the one with the most matches
  type Best = { set: MarkerSet; matches: number; styleName: string };
  let best: Best | null = null;
  const styleNames = ["[USER]/[ASSISTANT]", "User/Assistant", "**You**/**Interviewer**", "Q/A"];
  MARKER_SETS.forEach((set, i) => {
    const matches = trimmed.split(/\n/).filter((line) => set.user.test(line) || set.assistant.test(line)).length;
    const current: Best | null = best;
    if (matches > 0 && (!current || matches > current.matches)) {
      best = { set, matches, styleName: styleNames[i] };
    }
  });

  if (!best) {
    // Fallback: whole input as a single user turn
    return {
      ok: true,
      turns: [
        {
          role: "user",
          content: trimmed,
          timestamp: new Date().toISOString(),
        },
      ],
      markerStyle: "fallback (no markers found — treating as one user turn)",
    };
  }

  // best is non-null here (the !best branch returned above), but the
  // closure inside .forEach hides that from the narrower — assert.
  const bestNonNull: Best = best as Best;
  const { set, styleName } = bestNonNull;
  const lines = trimmed.split(/\n/);
  const turns: InterviewTurn[] = [];
  let currentRole: "user" | "assistant" | null = null;
  let buffer: string[] = [];

  function commit() {
    if (currentRole && buffer.length > 0) {
      const content = buffer.join("\n").trim();
      if (content.length > 0) {
        turns.push({
          role: currentRole,
          content,
          timestamp: new Date().toISOString(),
        });
      }
    }
    buffer = [];
  }

  for (const line of lines) {
    if (set.user.test(line)) {
      commit();
      currentRole = "user";
      buffer.push(line.replace(set.user, ""));
    } else if (set.assistant.test(line)) {
      commit();
      currentRole = "assistant";
      buffer.push(line.replace(set.assistant, ""));
    } else {
      // Continuation of current turn (or pre-marker preamble; skip if no role yet)
      if (currentRole) buffer.push(line);
    }
  }
  commit();

  if (turns.length === 0) {
    return { ok: false, error: `Detected ${styleName} markers but produced no turns. Check the transcript format.` };
  }

  return { ok: true, turns, markerStyle: styleName };
}
