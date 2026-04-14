/**
 * interview-engine.ts — Socratic interview engine.
 *
 * Orchestrates: system prompt composition → Anthropic SDK call → JSON parse
 * → TurnResult. Returns a fallback if the model's JSON is malformed.
 *
 * Does NOT import browser APIs or side-effect anything outside this module.
 * Store updates are the caller's responsibility (e.g., a React component or
 * a hook that calls this function and dispatches store actions).
 */

import { createAnthropicClient, streamClaude } from "./anthropic-client";
import { composeInterviewPrompt } from "./prompts/compose";
import { parseModelResponse, canAssemble, type TurnResult } from "./coverage";
import type { Mode, InterviewTurn } from "./store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Input to the engine for a single turn.
 */
export type EngineInput = {
  mode: Mode;
  apiKey: string;
  /** Full conversation history up to and including the LATEST user message.
   *  Turn 0: empty array — the engine will emit the seed question. */
  history: InterviewTurn[];
};

/**
 * What the engine returns per turn.
 * Mirrors TurnResult plus a `fallback` flag for when JSON parsing failed.
 */
export type EngineOutput = TurnResult & {
  /** true if the model returned malformed JSON; question is raw model text */
  fallback: boolean;
};

// ---------------------------------------------------------------------------
// askNextQuestion
// ---------------------------------------------------------------------------

/**
 * Core engine function. Given the full conversation history, emits the next
 * question + assessment from the model.
 *
 * API call strategy: stream + collect. anthropic-client.ts only exposes
 * streamClaude; we collect the stream into a full string before parsing.
 * This keeps anthropic-client.ts untouched (out of scope for this task).
 */
export async function askNextQuestion(input: EngineInput): Promise<EngineOutput> {
  const { mode, apiKey, history } = input;
  const turnCount = history.filter((t) => t.role === "user").length;

  // --- Compose system prompt (base + interview step with rubric + mode guidance) ---
  const systemPrompt = composeInterviewPrompt(mode, turnCount);

  // --- Build messages for the API call ---
  // User content goes into messages, NOT the system prompt (injection defense).
  const messages: Array<{ role: "user" | "assistant"; content: string }> = history.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  // Turn 0: no history yet — send a single user message to trigger the seed question
  // (some models won't respond without at least one message)
  if (messages.length === 0) {
    messages.push({ role: "user", content: "Begin the interview." });
  }

  // --- Collect streamed response ---
  const client = createAnthropicClient(apiKey);
  const rawResponse = await collectStream(client, systemPrompt, messages);

  // --- Parse model response ---
  const parsed = parseModelResponse(rawResponse);

  if (parsed === null) {
    // Fallback: malformed JSON — surface raw text as question, no assessment
    console.warn("[interview-engine] Model returned malformed JSON; using fallback.");
    return {
      question: rawResponse,
      priorAssessment: null,
      rubricItemsAddressedThisTurn: [],
      coverageScore: 0,
      readyToAssemble: false,
      fallback: true,
    };
  }

  return { ...parsed, fallback: false };
}

// ---------------------------------------------------------------------------
// collectStream (private helper)
// ---------------------------------------------------------------------------

/**
 * Collects a streamClaude call into a single string.
 * Rejects on stream error.
 */
function collectStream(
  client: ReturnType<typeof createAnthropicClient>,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    streamClaude(
      client,
      {
        systemPrompt,
        messages,
        maxTokens: 1024,
        model: "claude-sonnet-4-6",
      },
      {
        onDelta: () => {
          // deltas are accumulated by streamClaude; we only need the final text
        },
        onComplete: (fullText) => resolve(fullText),
        onError: (err) => reject(err),
      }
    );
  });
}
