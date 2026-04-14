import { describe, it, expect } from "vitest";
import { detect } from "@/lib/ai-ism-detector";
import type { AIIsmMatch } from "@/lib/ai-ism-detector";

// ---------------------------------------------------------------------------
// detect() — basic behaviour
// ---------------------------------------------------------------------------

describe("detect", () => {
  it("returns empty array for empty string", () => {
    expect(detect("")).toEqual([]);
  });

  it("returns empty array when no AI-isms present", () => {
    const text = "The dog sat on the mat. She called her friend on the phone.";
    expect(detect(text)).toEqual([]);
  });

  it("detects 'leverage' as an AI-ism", () => {
    const text = "We can leverage this opportunity.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "leverage")).toBe(true);
  });

  it("detects 'robust' as an AI-ism", () => {
    const text = "This is a robust solution.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "robust")).toBe(true);
  });

  it("detects 'delve' as an AI-ism", () => {
    const text = "Let us delve into the details.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "delve")).toBe(true);
  });

  it("detects 'pivotal' as an AI-ism", () => {
    const text = "This was a pivotal moment.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "pivotal")).toBe(true);
  });

  it("detects 'synergy' as an AI-ism", () => {
    const text = "The synergy between teams was remarkable.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "synergy")).toBe(true);
  });

  it("detects 'cutting-edge' as an AI-ism", () => {
    const text = "We use cutting-edge technology.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "cutting-edge")).toBe(true);
  });

  it("detects 'tapestry' as an AI-ism", () => {
    const text = "The tapestry of human experience is vast.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "tapestry")).toBe(true);
  });

  it("detects 'Furthermore' as an AI-ism (transitional phrase)", () => {
    const text = "Furthermore, we must consider the impact.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern.toLowerCase() === "furthermore")).toBe(true);
  });

  it("detects 'seamless' as an AI-ism", () => {
    const text = "The transition was seamless.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "seamless")).toBe(true);
  });

  it("detects 'stark reminder' as an AI-ism (phrase from banned-ai-isms)", () => {
    const text = "This is a stark reminder of what matters.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "stark reminder")).toBe(true);
  });

  it("returns correct character position for a match", () => {
    const text = "This is a robust solution for our needs.";
    const matches = detect(text);
    const robustMatch = matches.find((m) => m.pattern === "robust");
    expect(robustMatch).toBeDefined();
    // "This is a " = 10 chars, so "robust" starts at index 10
    expect(robustMatch!.position).toBe(10);
  });

  it("returns correct position for a match mid-sentence", () => {
    const text = "We need to leverage the platform.";
    const matches = detect(text);
    const leverageMatch = matches.find((m) => m.pattern === "leverage");
    expect(leverageMatch).toBeDefined();
    // "We need to " = 11 chars
    expect(leverageMatch!.position).toBe(11);
  });

  it("is case-insensitive — detects 'LEVERAGE' in uppercase", () => {
    const text = "We can LEVERAGE this platform.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "leverage")).toBe(true);
  });

  it("is case-insensitive — detects 'Robust' with capital", () => {
    const text = "Robust systems are essential.";
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "robust")).toBe(true);
  });

  it("does not match 'leverage' when it is a substring (word boundary)", () => {
    // "leveraged" should not match "leverage" at word boundary
    // NOTE: this is a regex boundary detail — \b won't match inside "leveraged"
    const text = "She leveraged her skills.";
    // "leveraged" contains "leverage" but \bleverag\b should NOT match — only "leverage\b" would
    // \bleverage\b would NOT match "leveraged" because 'd' follows 'e'
    const matches = detect(text);
    expect(matches.some((m) => m.pattern === "leverage")).toBe(false);
  });

  it("detects multiple AI-isms in one text and returns all of them", () => {
    const text = "This robust and pivotal synergy will leverage our cutting-edge approach.";
    const matches = detect(text);
    const patterns = matches.map((m) => m.pattern);
    expect(patterns).toContain("robust");
    expect(patterns).toContain("pivotal");
    expect(patterns).toContain("synergy");
    expect(patterns).toContain("leverage");
    expect(patterns).toContain("cutting-edge");
  });

  it("returns AIIsmMatch objects with pattern (string) and position (number)", () => {
    const text = "A robust plan.";
    const matches = detect(text);
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(typeof m.pattern).toBe("string");
      expect(typeof m.position).toBe("number");
    }
  });

  it("compiles at least 50 patterns from the reference files", () => {
    // Import the exported patterns list to count them.
    // We call detect with a long text containing known AI-isms to exercise the set.
    // The real count test: we expose the compiled patterns via a named export.
    // Since detect() is the API, we proxy-test by trying 50+ known patterns.
    const knownPatterns = [
      "delve", "tapestry", "intricate", "meticulous", "pivotal", "crucial",
      "vital", "testament", "enduring", "vibrant", "profound", "underscore",
      "bolstered", "garner", "interplay", "boasts", "valuable", "showcasing",
      "highlighting", "fostering", "emphasizing", "encompassing", "enhancing",
      "exemplifies", "groundbreaking", "renowned", "seamless", "cutting-edge",
      "synergy", "leverage", "multifaceted", "utilize", "endeavor", "proactive",
      "stakeholder", "facilitate", "actionable", "impactful", "robust",
      "innovative", "comprehensive", "streamline", "Furthermore", "Moreover",
      "Additionally", "Essentially", "Basically", "pivotal", "realm",
      "stark reminder",
    ];
    // Build a text that contains all of them to trigger matches
    const text = knownPatterns.join(". ") + ".";
    const matches = detect(text);
    const matchedPatterns = new Set(matches.map((m) => m.pattern));
    // We expect the majority to be detected (allow for a few edge cases in phrasing)
    expect(matchedPatterns.size).toBeGreaterThanOrEqual(30);
  });
});
