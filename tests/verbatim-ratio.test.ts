import { describe, it, expect } from "vitest";
import { computeVR, tokenize, buildNgrams } from "@/lib/verbatim-ratio";

describe("tokenize", () => {
  it("lowercases and strips punctuation", () => {
    expect(tokenize("Hello, World! It's great.")).toEqual([
      "hello", "world", "its", "great"
    ]);
  });

  it("strips markdown headers (lines starting with #)", () => {
    const input = "# Heading\nthis is body\n## Another\nmore body";
    expect(tokenize(input)).toEqual(["this", "is", "body", "more", "body"]);
  });

  it("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("buildNgrams", () => {
  it("builds 5-grams from token list", () => {
    const tokens = ["the", "quick", "brown", "fox", "jumps", "over", "lazy"];
    const ngrams = buildNgrams(tokens, 5);
    expect(ngrams).toEqual([
      "the quick brown fox jumps",
      "quick brown fox jumps over",
      "brown fox jumps over lazy",
    ]);
  });

  it("returns empty array if tokens fewer than n", () => {
    expect(buildNgrams(["a", "b", "c"], 5)).toEqual([]);
  });
});

describe("computeVR", () => {
  it("returns 100% when output is entirely from raw", () => {
    const raw = "the quick brown fox jumps over the lazy dog today";
    const output = "the quick brown fox jumps over the lazy dog today";
    const result = computeVR(raw, output);
    expect(result.fiveGram).toBeCloseTo(1.0, 2);
  });

  it("returns 0% when output shares no 5-grams with raw", () => {
    const raw = "alpha beta gamma delta epsilon zeta eta theta";
    const output = "xray yankee zulu papa quebec romeo sierra tango";
    const result = computeVR(raw, output);
    expect(result.fiveGram).toBe(0);
  });

  it("computes partial overlap correctly", () => {
    const raw = "I want to write about the future of AI in education";
    const output = "I want to write about the changing landscape of technology";
    const result = computeVR(raw, output);
    expect(result.fiveGram).toBeGreaterThan(0);
    expect(result.fiveGram).toBeLessThan(1);
  });

  it("returns 3-gram, 5-gram, 7-gram triple", () => {
    const raw = "the quick brown fox jumps over the lazy dog every morning";
    const output = "the quick brown fox was running quickly across the yard";
    const result = computeVR(raw, output);
    expect(result).toHaveProperty("threeGram");
    expect(result).toHaveProperty("fiveGram");
    expect(result).toHaveProperty("sevenGram");
    expect(result.threeGram).toBeGreaterThanOrEqual(result.fiveGram);
  });

  it("handles empty output", () => {
    const result = computeVR("some raw text here", "");
    expect(result.fiveGram).toBe(0);
    expect(result.outputWordCount).toBe(0);
  });

  it("handles empty raw", () => {
    const result = computeVR("", "some output text here");
    expect(result.fiveGram).toBe(0);
  });
});
