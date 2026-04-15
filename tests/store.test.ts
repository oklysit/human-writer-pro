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

  // New Socratic engine state (post 2026-04-15 adaptive-interviewer rewrite:
  // coverageScore + rubricItemsAddressed dropped; the model judges its own
  // readiness in conversational form, no per-turn coverage tracking).

  it("has null lastAssessment by default", () => {
    const state = useSessionStore.getState();
    expect(state.interview.lastAssessment).toBeNull();
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

  it("setMode resets lastAssessment", () => {
    useSessionStore.getState().setLastAssessment({ level: "sufficient", reasoning: "OK." });
    useSessionStore.getState().setMode("blog");
    const state = useSessionStore.getState();
    expect(state.interview.lastAssessment).toBeNull();
  });
});
