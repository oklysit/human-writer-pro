import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VRResult } from "./verbatim-ratio";
import type { AssessmentLevel } from "./coverage";

export type Mode = "essay" | "email" | "blog" | "cover-letter" | "free-form";

export type InterviewTurn = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

export type EditTurn = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type LastAssessment = {
  level: AssessmentLevel;
  reasoning: string;
} | null;

export type AppState = {
  apiKey: string | null;
  mode: Mode | null;
  interview: {
    turns: InterviewTurn[];
    rawTranscript: string;
    status: "idle" | "asking" | "ready-to-assemble";
    coverageScore: number;
    rubricItemsAddressed: string[];
    lastAssessment: LastAssessment;
  };
  output: string;
  vrScore: VRResult | null;
  edits: EditTurn[];
  isGenerating: boolean;
  error: string | null;
};

type AppActions = {
  setApiKey: (key: string | null) => void;
  setMode: (mode: Mode) => void;
  addInterviewTurn: (turn: InterviewTurn) => void;
  setInterviewStatus: (status: AppState["interview"]["status"]) => void;
  setCoverageScore: (score: number) => void;
  setRubricItemsAddressed: (items: string[]) => void;
  addRubricItemsAddressed: (items: string[]) => void;
  setLastAssessment: (assessment: LastAssessment) => void;
  setOutput: (output: string) => void;
  setVRScore: (score: VRResult | null) => void;
  addEdit: (turn: EditTurn) => void;
  setGenerating: (isGen: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState: AppState = {
  apiKey: null,
  mode: null,
  interview: {
    turns: [],
    rawTranscript: "",
    status: "idle",
    coverageScore: 0,
    rubricItemsAddressed: [],
    lastAssessment: null,
  },
  output: "",
  vrScore: null,
  edits: [],
  isGenerating: false,
  error: null,
};

export const useSessionStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setApiKey: (key) => set({ apiKey: key }),

      setMode: (mode) =>
        set({
          mode,
          interview: { ...initialState.interview },
          output: "",
          vrScore: null,
          edits: [],
          error: null,
        }),

      addInterviewTurn: (turn) =>
        set((state) => ({
          interview: {
            ...state.interview,
            turns: [...state.interview.turns, turn],
            rawTranscript: state.interview.turns
              .concat(turn)
              .filter((t) => t.role === "user")
              .map((t) => t.content)
              .join("\n\n"),
          },
        })),

      setInterviewStatus: (status) =>
        set((state) => ({ interview: { ...state.interview, status } })),

      setCoverageScore: (score) =>
        set((state) => ({
          interview: {
            ...state.interview,
            coverageScore: Math.max(0, Math.min(1, score)),
          },
        })),

      setRubricItemsAddressed: (rubricItemsAddressed) =>
        set((state) => ({ interview: { ...state.interview, rubricItemsAddressed } })),

      addRubricItemsAddressed: (items) =>
        set((state) => {
          const existing = new Set(state.interview.rubricItemsAddressed.map((s) => s.toLowerCase().trim()));
          const toAdd = items.filter((item) => !existing.has(item.toLowerCase().trim()));
          if (toAdd.length === 0) return state;
          return {
            interview: {
              ...state.interview,
              rubricItemsAddressed: [...state.interview.rubricItemsAddressed, ...toAdd],
            },
          };
        }),

      setLastAssessment: (lastAssessment) =>
        set((state) => ({ interview: { ...state.interview, lastAssessment } })),

      setOutput: (output) => set({ output, vrScore: null }),

      setVRScore: (score) => set({ vrScore: score }),

      addEdit: (turn) =>
        set((state) => ({ edits: [...state.edits, turn] })),

      setGenerating: (isGen) => set({ isGenerating: isGen }),

      setError: (error) => set({ error }),

      reset: () =>
        set((state) => ({
          ...initialState,
          apiKey: state.apiKey,
          mode: state.mode,
        })),
    }),
    {
      name: "human-writer-pro-session",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({} as Storage))),
      partialize: (state) => ({ apiKey: state.apiKey }), // only persist API key, not session state
    }
  )
);

// Helper for tests
(useSessionStore as any).getInitialState = () => initialState;

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

import { canAssemble, countUserWords } from "./coverage";

/**
 * Returns true when the user has provided enough thinking to assemble:
 * - raw interview word count >= 150
 * - coverage score >= 0.6
 * Defense-in-depth gate independent of engine-emitted "ready-to-assemble" status.
 */
export function useCanAssemble(): boolean {
  return useSessionStore((s) => {
    const words = countUserWords(s.interview.turns);
    return canAssemble(s.interview.coverageScore, words);
  });
}
