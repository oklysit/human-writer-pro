/**
 * coverage.ts — Pure helpers for the Socratic interview engine.
 *
 * 2026-04-15: rubric/coverage helpers (computeCoverageScore, canAssemble,
 * countUserWords) removed when the adaptive-interviewer rewrite landed.
 * The model now judges its own readiness; the user controls when to
 * assemble; no per-turn coverage_score is computed or scored.
 *
 * What stays:
 *   - parseModelResponse: still parses the per-turn JSON the model emits
 *     (now with a smaller shape — see TurnResult).
 *   - stripInterviewQuestions: builds the assembly-stage user-message
 *     string from interview turns, user-only.
 *
 * No SDK imports. No browser APIs. Fully unit-testable.
 */

import type { InterviewTurn } from "./store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssessmentLevel = "sufficient" | "partial" | "insufficient" | null;

export type PriorAssessment = {
  level: AssessmentLevel;
  reasoning: string;
} | null;

/**
 * The parsed, camelCase form of the model's per-turn JSON response.
 * Snake_case → camelCase mapping is done in parseModelResponse.
 */
export type TurnResult = {
  question: string;
  priorAssessment: PriorAssessment;
  readyToAssemble: boolean;
};

// ---------------------------------------------------------------------------
// parseModelResponse
// ---------------------------------------------------------------------------

/**
 * Parses the structured JSON the interview engine receives from the model.
 *
 * Handles:
 * - Bare JSON strings
 * - JSON wrapped in ```json ... ``` (or plain ``` ... ```) code fences
 *
 * Returns null on any parse error (caller falls back to raw text as question).
 */
export function parseModelResponse(raw: string): TurnResult | null {
  if (!raw || raw.trim() === "") return null;

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  let cleaned = raw.trim();
  const codeFenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (codeFenceMatch) {
    cleaned = codeFenceMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }

  // Validate minimal required shape
  if (typeof parsed !== "object" || parsed === null) return null;

  // Map prior_assessment (can be null for turn 0)
  let priorAssessment: PriorAssessment = null;
  const pa = parsed["prior_assessment"];
  if (pa !== null && typeof pa === "object") {
    const paObj = pa as Record<string, unknown>;
    const validLevels = ["sufficient", "partial", "insufficient"] as const;
    const rawLevel = paObj["level"];
    const level = validLevels.includes(rawLevel as "sufficient" | "partial" | "insufficient")
      ? (rawLevel as AssessmentLevel)
      : null;
    priorAssessment = {
      level,
      reasoning: typeof paObj["reasoning"] === "string" ? paObj["reasoning"] : "",
    };
  }

  return {
    question: typeof parsed["question"] === "string" ? parsed["question"] : "",
    priorAssessment,
    readyToAssemble: Boolean(parsed["ready_to_assemble"]),
  };
}

// ---------------------------------------------------------------------------
// stripInterviewQuestions
// ---------------------------------------------------------------------------

/**
 * Build the assembly-stage user-message string from interview turns.
 *
 * Per the 2026-04-15 consultant fix: ONLY user-answer text reaches the
 * assembly prompt. No questions, no speaker labels, no Q:/A: framing.
 * If the model never sees a question in its input, it can't echo the
 * question's phrasing in its output ("the single thing I want a hiring
 * manager to know is that I'm obsessive" → only emerges when the model
 * sees the question that prompted it). This eliminates the question-echo
 * failure mode at the source.
 *
 * Each user answer is trimmed and joined by a single blank line. Empty
 * answers are dropped. Defensive: even though the store currently builds
 * rawTranscript from user turns only, this named helper makes the
 * invariant explicit and survives any future code path that pipes
 * `turns` directly to assembly.
 */
export function stripInterviewQuestions(turns: InterviewTurn[]): string {
  return turns
    .filter((t) => t.role === "user")
    .map((t) => t.content.trim())
    .filter((s) => s.length > 0)
    .join("\n\n");
}
