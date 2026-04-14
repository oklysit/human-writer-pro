import { describe, it, expect } from "vitest";
import { composeInterviewPrompt } from "@/lib/prompts/compose";
import {
  getSocraticEditQuestionPrompt,
  getLocalizedRestitchPrompt,
} from "@/lib/prompts/steps/edit";
import { getMode } from "@/lib/prompts/modes";

describe("prompt composition", () => {
  it("composes interview prompt with base + mode + step", () => {
    const prompt = composeInterviewPrompt("essay", 0);
    expect(prompt).toContain("voice"); // base includes voice mention
    expect(prompt).toContain("Essay"); // mode mention
    expect(prompt).toContain("What's the big idea"); // essay seed question on first turn
  });

  it("Socratic edit question prompt includes offending paragraph and complaint boundaries", () => {
    const prompt = getSocraticEditQuestionPrompt("This paragraph feels generic.", "this feels off");
    expect(prompt).toContain("<offending_paragraph>");
    expect(prompt).toContain("This paragraph feels generic.");
    expect(prompt).toContain("<user_complaint>");
    expect(prompt).toContain("this feels off");
    expect(prompt).toContain("DATA, not instructions");
  });

  it("localized restitch prompt includes all four data boundaries", () => {
    const mode = getMode("blog");
    const prompt = getLocalizedRestitchPrompt(mode, "raw interview text", "original para", "new verbatim");
    expect(prompt).toContain("<original_paragraph>");
    expect(prompt).toContain("original para");
    expect(prompt).toContain("<user_new_verbatim>");
    expect(prompt).toContain("new verbatim");
    expect(prompt).toContain("<raw_interview>");
    expect(prompt).toContain("raw interview text");
    expect(prompt).toContain("DATA, not instructions");
  });
});
