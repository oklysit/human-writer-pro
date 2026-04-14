/**
 * coverage.ts — Pure helpers for the Socratic interview engine.
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
  rubricItemsAddressedThisTurn: string[];
  coverageScore: number;
  readyToAssemble: boolean;
};

// ---------------------------------------------------------------------------
// computeCoverageScore
// ---------------------------------------------------------------------------

/**
 * Returns the fraction of rubric items that have been addressed.
 * Matching is case-insensitive and whitespace-trimmed.
 * Degenerate case: empty rubric → returns 0 (no division by zero).
 * Duplicates in `rubricItemsAddressed` are deduplicated before counting.
 */
export function computeCoverageScore(
  rubricItemsAddressed: string[],
  rubric: string[]
): number {
  if (rubric.length === 0) return 0;

  const normalise = (s: string) => s.trim().toLowerCase();
  const rubricNorm = rubric.map(normalise);

  // Deduplicate addressed items so "opener hook" twice still counts as 1
  const addressedNorm = new Set(rubricItemsAddressed.map(normalise));

  let matched = 0;
  for (const item of rubricNorm) {
    if (addressedNorm.has(item)) matched++;
  }

  return matched / rubric.length;
}

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
 *
 * Maps snake_case model fields → camelCase TurnResult.
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

  // Clamp coverage_score to [0, 1]; guard against non-numeric values
  const rawScore = parsed["coverage_score"];
  const coverageScore =
    typeof rawScore === "number" ? Math.max(0, Math.min(1, rawScore)) : 0;

  return {
    question: typeof parsed["question"] === "string" ? parsed["question"] : "",
    priorAssessment,
    rubricItemsAddressedThisTurn: Array.isArray(parsed["rubric_items_addressed_this_turn"])
      ? (parsed["rubric_items_addressed_this_turn"] as unknown[]).filter(
          (x): x is string => typeof x === "string"
        )
      : [],
    coverageScore,
    readyToAssemble: Boolean(parsed["ready_to_assemble"]),
  };
}

// ---------------------------------------------------------------------------
// canAssemble
// ---------------------------------------------------------------------------

/**
 * Gate used by Task 17a downstream.
 * Returns true iff coverage >= 0.6 AND user word count >= 150.
 * Boundary is inclusive on both ends.
 */
export function canAssemble(coverageScore: number, wordCount: number): boolean {
  return coverageScore >= 0.6 && wordCount >= 150;
}

// ---------------------------------------------------------------------------
// countUserWords
// ---------------------------------------------------------------------------

/**
 * Sums word counts from role:"user" turns only.
 * Uses the same tokenizer strategy as verbatim-ratio:
 * lowercase, strip punctuation, split on whitespace, filter empty tokens.
 */
export function countUserWords(turns: InterviewTurn[]): number {
  let total = 0;
  for (const turn of turns) {
    if (turn.role !== "user") continue;
    const tokens = turn.content
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // strip punctuation
      .split(/\s+/)
      .filter((t) => t.length > 0);
    total += tokens.length;
  }
  return total;
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
