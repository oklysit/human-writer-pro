import { describe, it, expect } from "vitest";
import {
  computeCoverageScore,
  parseModelResponse,
  canAssemble,
  countUserWords,
  type TurnResult,
} from "@/lib/coverage";
import type { InterviewTurn } from "@/lib/store";

// ---------------------------------------------------------------------------
// computeCoverageScore
// ---------------------------------------------------------------------------

describe("computeCoverageScore", () => {
  it("returns 0 when rubric is empty (degenerate — no divide by zero)", () => {
    expect(computeCoverageScore(["opener hook"], [])).toBe(0);
  });

  it("returns 0 when nothing has been addressed", () => {
    expect(
      computeCoverageScore([], ["opener hook", "credentials", "close"])
    ).toBe(0);
  });

  it("returns 1.0 when all rubric items addressed", () => {
    const rubric = ["opener hook", "credentials", "why this company"];
    expect(computeCoverageScore(["opener hook", "credentials", "why this company"], rubric)).toBeCloseTo(1.0, 5);
  });

  it("returns 0.6 when 3 of 5 rubric items addressed", () => {
    const rubric = ["opener hook", "credentials", "why this company", "professional opinion", "close"];
    const addressed = ["opener hook", "credentials", "why this company"];
    expect(computeCoverageScore(addressed, rubric)).toBeCloseTo(0.6, 5);
  });

  it("is case-insensitive", () => {
    const rubric = ["Opener Hook", "Credentials"];
    const addressed = ["opener hook", "CREDENTIALS"];
    expect(computeCoverageScore(addressed, rubric)).toBeCloseTo(1.0, 5);
  });

  it("trims whitespace before matching", () => {
    const rubric = ["opener hook", "credentials"];
    const addressed = ["  opener hook  ", "credentials  "];
    expect(computeCoverageScore(addressed, rubric)).toBeCloseTo(1.0, 5);
  });

  it("does not double-count duplicates in addressed list", () => {
    const rubric = ["opener hook", "credentials"];
    // addressed contains "opener hook" twice — should still count as 1 out of 2
    const addressed = ["opener hook", "opener hook"];
    expect(computeCoverageScore(addressed, rubric)).toBeCloseTo(0.5, 5);
  });

  it("ignores addressed items not in rubric", () => {
    const rubric = ["opener hook", "credentials"];
    const addressed = ["opener hook", "unknown item"];
    // only 1 of 2 rubric items matched
    expect(computeCoverageScore(addressed, rubric)).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// parseModelResponse
// ---------------------------------------------------------------------------

const validTurnResult: TurnResult = {
  question: "What is your relevant experience?",
  priorAssessment: {
    level: "sufficient",
    reasoning: "User provided a concrete example.",
  },
  rubricItemsAddressedThisTurn: ["credentials"],
  coverageScore: 0.4,
  readyToAssemble: false,
};

const validJSON = JSON.stringify({
  question: "What is your relevant experience?",
  prior_assessment: {
    level: "sufficient",
    reasoning: "User provided a concrete example.",
  },
  rubric_items_addressed_this_turn: ["credentials"],
  coverage_score: 0.4,
  ready_to_assemble: false,
});

describe("parseModelResponse", () => {
  it("parses a valid JSON response", () => {
    const result = parseModelResponse(validJSON);
    expect(result).not.toBeNull();
    expect(result?.question).toBe("What is your relevant experience?");
    expect(result?.priorAssessment?.level).toBe("sufficient");
    expect(result?.coverageScore).toBe(0.4);
    expect(result?.readyToAssemble).toBe(false);
  });

  it("strips markdown code fences (```json ... ``` wrapper)", () => {
    const wrapped = "```json\n" + validJSON + "\n```";
    const result = parseModelResponse(wrapped);
    expect(result).not.toBeNull();
    expect(result?.question).toBe("What is your relevant experience?");
  });

  it("strips plain code fences (``` ... ```)", () => {
    const wrapped = "```\n" + validJSON + "\n```";
    const result = parseModelResponse(wrapped);
    expect(result).not.toBeNull();
  });

  it("returns null on malformed JSON", () => {
    const result = parseModelResponse("this is not json { broken");
    expect(result).toBeNull();
  });

  it("returns null on empty string", () => {
    expect(parseModelResponse("")).toBeNull();
  });

  it("handles null prior_assessment (turn 0)", () => {
    const turn0 = JSON.stringify({
      question: "Tell me about the job.",
      prior_assessment: null,
      rubric_items_addressed_this_turn: [],
      coverage_score: 0.0,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(turn0);
    expect(result).not.toBeNull();
    expect(result?.priorAssessment).toBeNull();
  });

  it("maps snake_case API shape to camelCase TurnResult", () => {
    const result = parseModelResponse(validJSON);
    expect(result).toHaveProperty("rubricItemsAddressedThisTurn");
    expect(result).toHaveProperty("coverageScore");
    expect(result).toHaveProperty("readyToAssemble");
    expect(result).toHaveProperty("priorAssessment");
  });

  it("sets readyToAssemble to true when model signals it", () => {
    const assemblyJSON = JSON.stringify({
      question: "",
      prior_assessment: { level: "sufficient", reasoning: "Done." },
      rubric_items_addressed_this_turn: ["close"],
      coverage_score: 0.8,
      ready_to_assemble: true,
    });
    const result = parseModelResponse(assemblyJSON);
    expect(result?.readyToAssemble).toBe(true);
  });

  // --- coverage_score clamping (Fix #1) ---

  it("clamps coverage_score 1.5 to 1.0", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: null,
      rubric_items_addressed_this_turn: [],
      coverage_score: 1.5,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.coverageScore).toBe(1.0);
  });

  it("clamps coverage_score -0.3 to 0.0", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: null,
      rubric_items_addressed_this_turn: [],
      coverage_score: -0.3,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.coverageScore).toBe(0.0);
  });

  it("clamps non-numeric coverage_score to 0", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: null,
      rubric_items_addressed_this_turn: [],
      coverage_score: "not a number",
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.coverageScore).toBe(0);
  });

  // --- prior_assessment.level validation (Fix #2) ---

  it("normalizes prior_assessment.level 'weird-value' to null", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "weird-value", reasoning: "hmm" },
      rubric_items_addressed_this_turn: [],
      coverage_score: 0.5,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBeNull();
  });

  it("preserves prior_assessment.level 'sufficient'", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "sufficient", reasoning: "Good." },
      rubric_items_addressed_this_turn: [],
      coverage_score: 0.5,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBe("sufficient");
  });

  it("preserves prior_assessment.level 'partial'", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "partial", reasoning: "Needs more." },
      rubric_items_addressed_this_turn: [],
      coverage_score: 0.3,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBe("partial");
  });

  it("preserves prior_assessment.level 'insufficient'", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "insufficient", reasoning: "Too sparse." },
      rubric_items_addressed_this_turn: [],
      coverage_score: 0.1,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBe("insufficient");
  });

  it("preserves prior_assessment: null → priorAssessment null (turn 0 invariant)", () => {
    const json = JSON.stringify({
      question: "Tell me about the job.",
      prior_assessment: null,
      rubric_items_addressed_this_turn: [],
      coverage_score: 0.0,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// canAssemble
// ---------------------------------------------------------------------------

describe("canAssemble", () => {
  it("returns false when coverage below 0.6", () => {
    expect(canAssemble(0.5, 200)).toBe(false);
  });

  it("returns false when word count below 150", () => {
    expect(canAssemble(0.7, 149)).toBe(false);
  });

  it("returns true when coverage >= 0.6 AND words >= 150", () => {
    expect(canAssemble(0.6, 150)).toBe(true);
    expect(canAssemble(1.0, 500)).toBe(true);
  });

  it("returns false when both conditions fail", () => {
    expect(canAssemble(0.3, 50)).toBe(false);
  });

  it("is inclusive at the boundary (0.6, 150)", () => {
    expect(canAssemble(0.6, 150)).toBe(true);
  });

  it("returns false for edge case: exactly 0.6 but 149 words", () => {
    expect(canAssemble(0.6, 149)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// countUserWords
// ---------------------------------------------------------------------------

describe("countUserWords", () => {
  it("sums words from user turns only", () => {
    const turns: InterviewTurn[] = [
      { role: "assistant", content: "What is your topic?" },
      { role: "user", content: "I want to write about machine learning" },
    ];
    // "I want to write about machine learning" = 7 words
    expect(countUserWords(turns)).toBe(7);
  });

  it("ignores assistant turns", () => {
    const turns: InterviewTurn[] = [
      { role: "assistant", content: "word one two three four five six seven eight" },
    ];
    expect(countUserWords(turns)).toBe(0);
  });

  it("sums across multiple user turns", () => {
    const turns: InterviewTurn[] = [
      { role: "user", content: "hello world" },          // 2
      { role: "assistant", content: "tell me more" },
      { role: "user", content: "one two three four five" }, // 5
    ];
    expect(countUserWords(turns)).toBe(7);
  });

  it("strips punctuation before counting", () => {
    const turns: InterviewTurn[] = [
      { role: "user", content: "Hello, world! It's great." },
    ];
    // "Hello world It's great" → tokens: hello, world, its, great = 4
    expect(countUserWords(turns)).toBe(4);
  });

  it("returns 0 for empty turns array", () => {
    expect(countUserWords([])).toBe(0);
  });

  it("handles user turn with only whitespace / punctuation", () => {
    const turns: InterviewTurn[] = [
      { role: "user", content: "   ,,, ... " },
    ];
    expect(countUserWords(turns)).toBe(0);
  });
});
