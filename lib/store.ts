import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VRResult } from "./verbatim-ratio";
import { stripInterviewQuestions, type AssessmentLevel } from "./coverage";

/**
 * 2026-04-15: the user-facing "Writing Mode" dropdown was removed. Context
 * (free-form text + uploaded files) now drives what the interviewer probes
 * for. The `mode` state stays hardcoded to "cover-letter" in initialState
 * so the existing mode-aware code paths (interview engine loading
 * `lib/prompts/modes/cover-letter.ts`) keep working without churn.
 *
 * The `Mode` union is kept at its 5-literal shape so the MODES record +
 * existing tests stay valid. The non-cover-letter mode files are orphaned
 * — future work can delete them when mode-agnostic assembly lands.
 */
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

/**
 * Uploaded file metadata + extracted text, rendered as a chip in the
 * Context dock instead of inlined into the textarea (UAT 2026-04-15).
 * Combined with `contextNotes` only at the moment the interviewer or
 * assembler reads it (see lib/combineContext.ts).
 */
export type AttachedFile = {
  /** Stable id for React keys + removal */
  id: string;
  /** Display name (original filename) */
  name: string;
  /** Extension shown in the chip badge */
  ext: ".md" | ".txt" | ".pdf" | ".docx";
  /** Original file size in bytes — for chip display */
  size: number;
  /** Extracted text content fed into combined context */
  content: string;
};

export type AppState = {
  apiKey: string | null;
  mode: Mode | null;
  /**
   * Free-form context the user pastes/types before or during the interview
   * (assignment text, JD, thesis, "I'm writing X for class Y", etc).
   * Read ONLY by the interview stage prompt — never reaches the assembly
   * call. Per the 2026-04-14 strip: the assembly stage stays at the band-35
   * pilot prompt + raw interview, no other context.
   */
  contextNotes: string;
  interview: {
    turns: InterviewTurn[];
    rawTranscript: string;
    status: "idle" | "asking" | "ready-to-assemble";
    lastAssessment: LastAssessment;
  };
  /**
   * Files the user has attached as additional context. Rendered as
   * chips in the Context dock; combined with contextNotes only when
   * the interviewer or assembler reads context (via combineContext).
   */
  attachedFiles: AttachedFile[];
  output: string;
  /**
   * Where the output came from. "interview" = produced by the assemble call
   * after an interview. "upload" = the user uploaded an existing draft into
   * the output panel for edit-mode regeneration. null when output is empty.
   * Drives which assemble-with-feedback prompt regime the regen call uses.
   */
  outputSource: "interview" | "upload" | null;
  /**
   * When outputSource === "upload", holds the original upload content. The
   * regen call uses it as the rawInterview for stitching, since there's no
   * real interview transcript in the upload flow. Null otherwise.
   */
  uploadedDraftContent: string | null;
  /**
   * Optional explicit word-count target for the assembler. null = let the
   * model infer from genre + context. When set, the assembler receives
   * "Target word count: ~N words" as an override. User sets this via the
   * slider/input near the Assemble button.
   */
  targetWords: number | null;
  vrScore: VRResult | null;
  edits: EditTurn[];
  isGenerating: boolean;
  error: string | null;
};

type AppActions = {
  setApiKey: (key: string | null) => void;
  /** Hard mode switch — resets session state (turns, output, context). */
  setMode: (mode: Mode) => void;
  /** Soft mode update — just re-tags the detected mode without resetting
   *  other state. Used by the heuristic mode-detection pipeline. */
  updateMode: (mode: Mode) => void;
  setContextNotes: (notes: string) => void;
  addInterviewTurn: (turn: InterviewTurn) => void;
  /**
   * Bulk-replace the interview turns from a parsed transcript. Used by
   * the dev "Seed from prior transcript" utility to skip re-doing an
   * interview when iterating on assembly. Recomputes rawTranscript via
   * stripInterviewQuestions so the assembler sees the same shape as
   * native interview output.
   */
  seedInterview: (turns: InterviewTurn[]) => void;
  setInterviewStatus: (status: AppState["interview"]["status"]) => void;
  setLastAssessment: (assessment: LastAssessment) => void;
  setOutput: (output: string) => void;
  /**
   * Replaces the output AND sets it as upload-sourced for regen routing.
   * Called by the upload-to-output flow in preview-panel.
   */
  setUploadedDraft: (content: string) => void;
  setTargetWords: (n: number | null) => void;
  attachFile: (file: AttachedFile) => void;
  removeAttachedFile: (id: string) => void;
  setVRScore: (score: VRResult | null) => void;
  addEdit: (turn: EditTurn) => void;
  setGenerating: (isGen: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState: AppState = {
  apiKey: null,
  mode: "cover-letter",
  contextNotes: "",
  interview: {
    turns: [],
    rawTranscript: "",
    status: "idle",
    lastAssessment: null,
  },
  attachedFiles: [],
  output: "",
  outputSource: null,
  uploadedDraftContent: null,
  targetWords: null,
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
          contextNotes: "",
          attachedFiles: [],
          interview: { ...initialState.interview },
          output: "",
          outputSource: null,
          uploadedDraftContent: null,
          vrScore: null,
          edits: [],
          error: null,
        }),

      updateMode: (mode) => set({ mode }),

      setContextNotes: (contextNotes) => set({ contextNotes }),

      addInterviewTurn: (turn) =>
        set((state) => {
          const newTurns = [...state.interview.turns, turn];
          return {
            interview: {
              ...state.interview,
              turns: newTurns,
              // Per consultant 2026-04-15: assembly stage receives ONLY user
              // answers, no questions. stripInterviewQuestions enforces that
              // invariant by name. See lib/coverage.ts.
              rawTranscript: stripInterviewQuestions(newTurns),
            },
          };
        }),

      seedInterview: (turns) =>
        set((state) => ({
          interview: {
            ...state.interview,
            turns,
            rawTranscript: stripInterviewQuestions(turns),
            status: turns.some((t) => t.role === "user") ? "asking" : "idle",
          },
        })),

      setInterviewStatus: (status) =>
        set((state) => ({ interview: { ...state.interview, status } })),

      setLastAssessment: (lastAssessment) =>
        set((state) => ({ interview: { ...state.interview, lastAssessment } })),

      setOutput: (output) =>
        set((state) => ({
          output,
          vrScore: null,
          // First-time output from interview-driven assembly: tag the source.
          // Re-renders during streaming preserve the existing source tag.
          outputSource:
            output.length > 0 && state.outputSource === null ? "interview" : state.outputSource,
        })),

      setUploadedDraft: (content) =>
        set({
          output: content,
          outputSource: "upload",
          uploadedDraftContent: content,
          vrScore: null,
        }),

      setTargetWords: (n) => set({ targetWords: n }),

      attachFile: (file) =>
        set((state) => ({ attachedFiles: [...state.attachedFiles, file] })),

      removeAttachedFile: (id) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.filter((f) => f.id !== id),
        })),

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

/**
 * Returns true when assembly is meaningful — at least one user turn exists.
 * The user controls when to assemble; the model's conversational response
 * carries any "ready" signal. No coverage or word-count gate (2026-04-15).
 */
export function useCanAssemble(): boolean {
  return useSessionStore((s) => s.interview.turns.some((t) => t.role === "user"));
}
