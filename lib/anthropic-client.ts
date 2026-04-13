import Anthropic from "@anthropic-ai/sdk";

export function createAnthropicClient(apiKey: string): Anthropic {
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
 */
export async function streamClaude(
  client: Anthropic,
  {
    systemPrompt,
    messages,
    maxTokens = 2048,
    model = "claude-sonnet-4-6",
  }: {
    systemPrompt: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    maxTokens?: number;
    model?: string;
  },
  callbacks: StreamCallbacks
): Promise<void> {
  let fullText = "";
  try {
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
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
