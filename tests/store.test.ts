import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/lib/store";

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState(useSessionStore.getInitialState());
  });

  it("has sensible defaults", () => {
    const state = useSessionStore.getState();
    expect(state.mode).toBe(null);
    expect(state.apiKey).toBe(null);
    expect(state.interview.turns).toEqual([]);
    expect(state.output).toBe("");
    expect(state.vrScore).toBe(null);
  });

  it("setApiKey updates key and persists", () => {
    useSessionStore.getState().setApiKey("sk-ant-test-1234567890");
    expect(useSessionStore.getState().apiKey).toBe("sk-ant-test-1234567890");
  });

  it("setMode updates mode and resets interview", () => {
    useSessionStore.getState().addInterviewTurn({ role: "user", content: "test answer" });
    useSessionStore.getState().setMode("essay");
    const state = useSessionStore.getState();
    expect(state.mode).toBe("essay");
    expect(state.interview.turns).toEqual([]);
  });

  it("addInterviewTurn appends to turns array", () => {
    useSessionStore.getState().addInterviewTurn({ role: "assistant", content: "What's the topic?" });
    useSessionStore.getState().addInterviewTurn({ role: "user", content: "AI in education" });
    expect(useSessionStore.getState().interview.turns.length).toBe(2);
  });

  it("setOutput updates output and clears VR score (stale)", () => {
    useSessionStore.setState({ vrScore: { fiveGram: 0.3, threeGram: 0.5, sevenGram: 0.2 } as any });
    useSessionStore.getState().setOutput("New output text");
    expect(useSessionStore.getState().output).toBe("New output text");
    expect(useSessionStore.getState().vrScore).toBe(null);
  });

  it("reset clears interview and output, keeps apiKey and mode", () => {
    useSessionStore.getState().setApiKey("sk-test");
    useSessionStore.getState().setMode("essay");
    useSessionStore.getState().addInterviewTurn({ role: "user", content: "x" });
    useSessionStore.getState().setOutput("something");
    useSessionStore.getState().reset();
    const state = useSessionStore.getState();
    expect(state.apiKey).toBe("sk-test");
    expect(state.mode).toBe("essay");
    expect(state.interview.turns).toEqual([]);
    expect(state.output).toBe("");
  });

  // New Socratic engine state

  it("has zero coverageScore, empty rubricItemsAddressed, null lastAssessment by default", () => {
    const state = useSessionStore.getState();
    expect(state.interview.coverageScore).toBe(0);
    expect(state.interview.rubricItemsAddressed).toEqual([]);
    expect(state.interview.lastAssessment).toBeNull();
  });

  it("setCoverageScore updates coverageScore", () => {
    useSessionStore.getState().setCoverageScore(0.6);
    expect(useSessionStore.getState().interview.coverageScore).toBe(0.6);
  });

  it("setRubricItemsAddressed replaces the full list", () => {
    useSessionStore.getState().setRubricItemsAddressed(["opener hook", "credentials"]);
    expect(useSessionStore.getState().interview.rubricItemsAddressed).toEqual(["opener hook", "credentials"]);
  });

  it("addRubricItemsAddressed appends new items, deduplicates", () => {
    useSessionStore.getState().setRubricItemsAddressed(["opener hook"]);
    useSessionStore.getState().addRubricItemsAddressed(["opener hook", "credentials"]); // opener hook is a dup
    expect(useSessionStore.getState().interview.rubricItemsAddressed).toEqual(["opener hook", "credentials"]);
  });

  it("addRubricItemsAddressed is case-insensitive when deduplicating", () => {
    useSessionStore.getState().setRubricItemsAddressed(["Opener Hook"]);
    useSessionStore.getState().addRubricItemsAddressed(["opener hook"]); // same item, different case
    expect(useSessionStore.getState().interview.rubricItemsAddressed).toEqual(["Opener Hook"]);
  });

  it("setLastAssessment stores the assessment", () => {
    useSessionStore.getState().setLastAssessment({ level: "partial", reasoning: "Needs more detail." });
    const { lastAssessment } = useSessionStore.getState().interview;
    expect(lastAssessment?.level).toBe("partial");
    expect(lastAssessment?.reasoning).toBe("Needs more detail.");
  });

  it("setLastAssessment can be set to null", () => {
    useSessionStore.getState().setLastAssessment({ level: "sufficient", reasoning: "Good." });
    useSessionStore.getState().setLastAssessment(null);
    expect(useSessionStore.getState().interview.lastAssessment).toBeNull();
  });

  it("setMode resets coverageScore, rubricItemsAddressed, lastAssessment", () => {
    useSessionStore.getState().setCoverageScore(0.8);
    useSessionStore.getState().setRubricItemsAddressed(["opener hook"]);
    useSessionStore.getState().setLastAssessment({ level: "sufficient", reasoning: "OK." });
    useSessionStore.getState().setMode("blog");
    const state = useSessionStore.getState();
    expect(state.interview.coverageScore).toBe(0);
    expect(state.interview.rubricItemsAddressed).toEqual([]);
    expect(state.interview.lastAssessment).toBeNull();
  });

  // --- setCoverageScore clamping (Fix #1 defense-in-depth) ---

  it("setCoverageScore(1.5) clamps to 1", () => {
    useSessionStore.getState().setCoverageScore(1.5);
    expect(useSessionStore.getState().interview.coverageScore).toBe(1);
  });

  it("setCoverageScore(-0.3) clamps to 0", () => {
    useSessionStore.getState().setCoverageScore(-0.3);
    expect(useSessionStore.getState().interview.coverageScore).toBe(0);
  });
});
