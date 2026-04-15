import { describe, it, expect } from "vitest";
import {
  parseModelResponse,
  stripInterviewQuestions,
  type TurnResult,
} from "@/lib/coverage";
import type { InterviewTurn } from "@/lib/store";

// ---------------------------------------------------------------------------
// parseModelResponse — adaptive-interviewer shape (2026-04-15)
// ---------------------------------------------------------------------------

const validTurnResult: TurnResult = {
  question: "What is your relevant experience?",
  priorAssessment: {
    level: "sufficient",
    reasoning: "User provided a concrete example.",
  },
  readyToAssemble: false,
};

const validJSON = JSON.stringify({
  question: "What is your relevant experience?",
  prior_assessment: {
    level: "sufficient",
    reasoning: "User provided a concrete example.",
  },
  ready_to_assemble: false,
});

describe("parseModelResponse", () => {
  it("parses a valid JSON response", () => {
    const result = parseModelResponse(validJSON);
    expect(result).not.toBeNull();
    expect(result?.question).toBe("What is your relevant experience?");
    expect(result?.priorAssessment?.level).toBe("sufficient");
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
      question: "Tell me about the project.",
      prior_assessment: null,
      ready_to_assemble: false,
    });
    const result = parseModelResponse(turn0);
    expect(result).not.toBeNull();
    expect(result?.priorAssessment).toBeNull();
  });

  it("maps snake_case API shape to camelCase TurnResult", () => {
    const result = parseModelResponse(validJSON);
    expect(result).toHaveProperty("readyToAssemble");
    expect(result).toHaveProperty("priorAssessment");
    expect(result).not.toHaveProperty("rubricItemsAddressedThisTurn");
    expect(result).not.toHaveProperty("coverageScore");
  });

  it("sets readyToAssemble true when model signals it", () => {
    const json = JSON.stringify({
      question: "I think we have enough — anything else, or hit Assemble?",
      prior_assessment: { level: "sufficient", reasoning: "Done." },
      ready_to_assemble: true,
    });
    const result = parseModelResponse(json);
    expect(result?.readyToAssemble).toBe(true);
  });

  it("ignores legacy coverage_score / rubric_items_addressed_this_turn fields if present", () => {
    // Defensive: model may include legacy fields during transition. Parser
    // should silently ignore them and not throw.
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: null,
      ready_to_assemble: false,
      coverage_score: 0.42,
      rubric_items_addressed_this_turn: ["foo", "bar"],
    });
    const result = parseModelResponse(json);
    expect(result).not.toBeNull();
    expect(result?.question).toBe("Q?");
    expect(result).not.toHaveProperty("coverageScore");
  });

  // --- prior_assessment.level validation ---

  it("normalizes prior_assessment.level 'weird-value' to null", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "weird-value", reasoning: "hmm" },
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBeNull();
  });

  it("preserves prior_assessment.level 'sufficient'", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "sufficient", reasoning: "Good." },
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBe("sufficient");
  });

  it("preserves prior_assessment.level 'partial'", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "partial", reasoning: "Needs more." },
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBe("partial");
  });

  it("preserves prior_assessment.level 'insufficient'", () => {
    const json = JSON.stringify({
      question: "Q?",
      prior_assessment: { level: "insufficient", reasoning: "Vague." },
      ready_to_assemble: false,
    });
    const result = parseModelResponse(json);
    expect(result?.priorAssessment?.level).toBe("insufficient");
  });
});

// ---------------------------------------------------------------------------
// stripInterviewQuestions
// ---------------------------------------------------------------------------

describe("stripInterviewQuestions", () => {
  it("returns empty string for empty turns array", () => {
    expect(stripInterviewQuestions([])).toBe("");
  });

  it("filters to user turns only", () => {
    const turns: InterviewTurn[] = [
      { role: "assistant", content: "What is your topic?" },
      { role: "user", content: "Cover letter for CrowdStrike" },
      { role: "assistant", content: "Tell me more" },
      { role: "user", content: "I want the AI security role" },
    ];
    expect(stripInterviewQuestions(turns)).toBe(
      "Cover letter for CrowdStrike\n\nI want the AI security role"
    );
  });

  it("trims each user answer", () => {
    const turns: InterviewTurn[] = [
      { role: "user", content: "  spaces around  " },
      { role: "user", content: "\nnewlines too\n" },
    ];
    expect(stripInterviewQuestions(turns)).toBe("spaces around\n\nnewlines too");
  });

  it("drops empty user answers", () => {
    const turns: InterviewTurn[] = [
      { role: "user", content: "first" },
      { role: "user", content: "   " },
      { role: "user", content: "third" },
    ];
    expect(stripInterviewQuestions(turns)).toBe("first\n\nthird");
  });

  it("returns empty string when only assistant turns exist", () => {
    const turns: InterviewTurn[] = [
      { role: "assistant", content: "Q1" },
      { role: "assistant", content: "Q2" },
    ];
    expect(stripInterviewQuestions(turns)).toBe("");
  });
});
