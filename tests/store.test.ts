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
});
