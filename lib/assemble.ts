import { createAnthropicClient, streamClaude } from "./anthropic-client";
import { getAssemblySystemPrompt } from "./prompts/steps/assembly";
import type { ModeConfig } from "./prompts/modes/index";

export type AssembleOptions = {
  mode: ModeConfig;
  apiKey: string;
  rawInterview: string;
  onToken: (delta: string) => void;
  onComplete: (fullText: string) => void;
  onError: (message: string) => void;
};

/**
 * Thin helper that wraps streamClaude with the assembly prompt.
 * Caller provides token/complete/error callbacks; this function manages
 * the Anthropic client lifecycle and forwards events.
 *
 * Returns a cancel handle. The Anthropic SDK stream does not expose an
 * AbortController on the async-iterator path used by streamClaude, so
 * cancel() sets an internal flag that suppresses further callbacks after
 * the fact. Streaming tokens already in-flight will be swallowed.
 */
export function assemble(options: AssembleOptions): { cancel: () => void } {
  const { mode, apiKey, rawInterview, onToken, onComplete, onError } = options;

  let cancelled = false;

  const client = createAnthropicClient(apiKey);
  const systemPrompt = getAssemblySystemPrompt(mode, rawInterview);

  streamClaude(
    client,
    {
      systemPrompt,
      messages: [{ role: "user", content: "Assemble the piece now." }],
      maxTokens: 4096,
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
