import { createAnthropicClient, streamClaude } from "./anthropic-client";

/**
 * Assembly call — band-35 only.
 *
 * Per the 2026-04-14 VR collapse investigation:
 *   - The pilot's band-35 prompt (passed GPTZero 6/6 in the n=54 validation)
 *     is the empirical source of truth.
 *   - Every layer of additional context added to the assembly call —
 *     framing lines, mode formatting blocks, boundary tags, banned-phrase
 *     lists, voice/style/Strunk references — costs VR. See bisection at
 *     scripts/debug/bisect-pipeline.ts.
 *   - The two pilot sentences are sent as system prompt; the raw interview
 *     transcript is the only thing in the user message.
 *
 * Source of truth for the prompt itself: `eval/regression-fixtures/prompts/band-35-strategy.md`.
 * Modifying SYSTEM_PROMPT here without re-baselining the regression suite
 * is a regression-suite violation per that file's policy.
 *
 * Style/voice/anti-pattern references (lib/prompts/references/*) belong in
 * the interview stage and in post-assembly review passes. They do NOT belong
 * in the assembly call.
 */

const SYSTEM_PROMPT =
  `Write a single paragraph of approximately 250 words (strict range: 225–275) that answers the interview question below. Output ONLY the paragraph — no headings, no quotes, no meta-commentary.

Strategy: Heavy verbatim stitching. Most clauses should be lifted directly; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers where they break the paragraph, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.`;

export type AssembleOptions = {
  apiKey: string;
  rawInterview: string;
  onToken: (delta: string) => void;
  onComplete: (fullText: string) => void;
  onError: (message: string) => void;
};

/**
 * Thin helper that wraps streamClaude with the band-35 assembly prompt.
 * Caller provides token/complete/error callbacks; this function manages
 * the Anthropic client lifecycle and forwards events.
 *
 * Returns a cancel handle. The Anthropic SDK stream does not expose an
 * AbortController on the async-iterator path used by streamClaude, so
 * cancel() sets an internal flag that suppresses further callbacks after
 * the fact. Streaming tokens already in-flight will be swallowed.
 */
export function assemble(options: AssembleOptions): { cancel: () => void } {
  const { apiKey, rawInterview, onToken, onComplete, onError } = options;

  let cancelled = false;

  const client = createAnthropicClient(apiKey);

  streamClaude(
    client,
    {
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawInterview.trim() }],
      maxTokens: 1024,
      model: "claude-sonnet-4-6",
    },
    {
      onDelta: (text) => {
        if (!cancelled) onToken(text);
      },
      onComplete: (fullText) => {
        if (!cancelled) onComplete(fullText);
      },
      onError: (err) => {
        if (!cancelled) onError(err.message);
      },
    }
  );

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
