/**
 * TDD tests for the LLM judge prompt composer.
 *
 * These tests exercise composeJudgePrompt() only — no API calls.
 * The judge() function itself makes network calls and is not tested here.
 */

import { describe, it, expect } from "vitest";
import { composeJudgePrompt } from "../scripts/eval/llm-judge";

const SAMPLE_GENERATED = "I worked on security tooling and built a RAG pipeline for alerting.";
const SAMPLE_APPROVED = "Security is in my DNA. I grew up around it and I built things that mattered.";
const SAMPLE_RUBRIC = "Dense technical cybersec register. Hard case.";

describe("composeJudgePrompt", () => {
  it("returns an object with system and user fields", () => {
    const result = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("system prompt contains the 1-5 scale rubric for voiceMatch", () => {
    const { system } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    // The line reads: "voiceMatch: On a 1-5 scale, ..."
    expect(system).toMatch(/voiceMatch.*1-5/i);
    expect(system).toMatch(/5\s*=.*indistinguishable/i);
    expect(system).toMatch(/1\s*=.*wildly different tone/i);
  });

  it("system prompt contains the 1-5 scale rubric for contentFidelity", () => {
    const { system } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    // The line reads: "contentFidelity: On a 1-5 scale, ..."
    expect(system).toMatch(/contentFidelity.*1-5/i);
    expect(system).toMatch(/5\s*=.*perfect fidelit/i);
    expect(system).toMatch(/1\s*=.*significant hallucination/i);
  });

  it("system prompt contains the 1-5 scale rubric for aiIsmSeverity", () => {
    const { system } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    // "5 = human, 1 = machine"
    expect(system).toMatch(/5\s*=.*human/i);
    expect(system).toMatch(/1\s*=.*machine/i);
  });

  it("system prompt instructs JSON-only output", () => {
    const { system } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(system).toMatch(/json/i);
    expect(system).toMatch(/ONLY/);
  });

  it("user prompt contains the approved reference text", () => {
    const { user } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(user).toContain(SAMPLE_APPROVED);
  });

  it("user prompt contains the generated output text", () => {
    const { user } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(user).toContain(SAMPLE_GENERATED);
  });

  it("user prompt contains the rubric notes", () => {
    const { user } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(user).toContain(SAMPLE_RUBRIC);
  });

  it("user prompt instructs JSON output", () => {
    const { user } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(user).toMatch(/json/i);
  });

  it("system prompt names all three score fields", () => {
    const { system } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(system).toContain("voiceMatch");
    expect(system).toContain("contentFidelity");
    expect(system).toContain("aiIsmSeverity");
    expect(system).toContain("reasoning");
  });

  it("different inputs produce different user prompts", () => {
    const a = composeJudgePrompt({
      generatedOutput: "output A",
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    const b = composeJudgePrompt({
      generatedOutput: "output B",
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: SAMPLE_RUBRIC,
    });
    expect(a.user).not.toBe(b.user);
    expect(a.system).toBe(b.system); // system is fixed
  });

  it("empty rubric notes still produces valid prompts", () => {
    const { system, user } = composeJudgePrompt({
      generatedOutput: SAMPLE_GENERATED,
      approvedReference: SAMPLE_APPROVED,
      rubricNotes: "",
    });
    expect(system.length).toBeGreaterThan(50);
    expect(user.length).toBeGreaterThan(10);
  });
});
