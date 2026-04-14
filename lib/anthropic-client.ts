import Anthropic from "@anthropic-ai/sdk";

/**
 * Local OAuth dev mode (NEXT_PUBLIC_USE_LOCAL_OAUTH=1) routes Anthropic SDK
 * calls through /api/v1/messages instead of api.anthropic.com. The proxy
 * route uses the user's Claude Max OAuth credentials via the Agent SDK,
 * letting prompt iteration happen without burning API key budget.
 *
 * In dev mode the apiKey can be any non-empty string — the proxy ignores it.
 * The sk-ant- prefix check is skipped accordingly.
 */
// Next.js substitutes `process.env.NEXT_PUBLIC_*` at build time with a literal
// string value (or the expression becomes `undefined` if the var isn't set).
// A `typeof process !== "undefined"` guard blocks that substitution and breaks
// the flag in the browser — `process` is not defined in client bundles.
const useLocalOAuth = process.env.NEXT_PUBLIC_USE_LOCAL_OAUTH === "1";

export function createAnthropicClient(apiKey: string): Anthropic {
  if (useLocalOAuth) {
    if (!apiKey) {
      throw new Error("API key field cannot be empty (any value works in local OAuth mode)");
    }
    // Anthropic SDK builds requests with `new URL(baseURL + path)`, which throws
    // on a relative baseURL like "/api". Resolve against the page origin so the
    // proxy route receives a fully-qualified same-origin URL.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return new Anthropic({
      apiKey,
      baseURL: `${origin}/api`,
      dangerouslyAllowBrowser: true,
    });
  }
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    throw new Error("Invalid Anthropic API key — must start with 'sk-ant-'");
  }
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // explicit BYO-key architecture
  });
}

export type StreamCallbacks = {
  onDelta: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (err: Error) => void;
};

/**
 * Stream a Claude response. Writes incremental chunks via onDelta, final via onComplete.
 *
 * In local OAuth dev mode (NEXT_PUBLIC_USE_LOCAL_OAUTH=1), streaming is
 * sacrificed: the JSON proxy route at /api/v1/messages does not implement
 * SSE, so we fall back to a single non-streaming messages.create() call and
 * synthesize one onDelta with the full text followed by onComplete. Tradeoff:
 * the typing-effect UX disappears in dev, but we keep the same callsite shape
 * so callers don't need a branch.
 */
export async function streamClaude(
  client: Anthropic,
  {
    systemPrompt,
    messages,
    maxTokens = 2048,
    model = "claude-sonnet-4-6",
  }: {
    /** Omit to send no system field at all — the band-35 assembly path
     *  relies on this to match the pilot's user-message-only regime. */
    systemPrompt?: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    maxTokens?: number;
    model?: string;
  },
  callbacks: StreamCallbacks
): Promise<void> {
  if (useLocalOAuth) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages,
      });
      const firstBlock = response.content[0];
      const fullText =
        firstBlock && firstBlock.type === "text" ? firstBlock.text : "";
      callbacks.onDelta(fullText);
      callbacks.onComplete(fullText);
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
    return;
  }

  let fullText = "";
  try {
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
        callbacks.onDelta(event.delta.text);
      }
    }

    callbacks.onComplete(fullText);
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
