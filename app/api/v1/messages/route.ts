import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";

/**
 * OAuth-proxy route for local development.
 *
 * Purpose: lets the browser-side @anthropic-ai/sdk client (configured with
 * `baseURL: '/api'`) hit a same-origin endpoint that fans out through the
 * Agent SDK using the user's Claude Max OAuth credentials (auto-discovered
 * from ~/.claude/.credentials.json). Avoids burning real API key budget while
 * iterating on prompts locally.
 *
 * Disabled unless USE_LOCAL_OAUTH=1 — in any other env this returns 403 so the
 * route can never accidentally serve traffic in production.
 *
 * Shape: accepts the Anthropic Messages API request body
 * ({ model, messages, system, max_tokens }) and returns a Messages-API-compatible
 * response so existing callers don't need to change their parsing.
 */

type IncomingMessage = {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string }>;
};

type IncomingBody = {
  model?: string;
  messages?: IncomingMessage[];
  system?: string;
  max_tokens?: number;
};

function extractText(content: IncomingMessage["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part?.type === "text" && typeof part.text === "string" ? part.text : ""))
    .join("");
}

export async function POST(req: NextRequest) {
  if (process.env.USE_LOCAL_OAUTH !== "1") {
    return NextResponse.json({ error: "Local OAuth disabled" }, { status: 403 });
  }

  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid JSON body: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  const { model, messages = [], system = "" } = body;

  // Agent SDK's query() takes a single string `prompt`, but interview-engine
  // passes a multi-turn history (user ↔ assistant back-and-forth). Collapse
  // the full conversation into a transcript so the model sees prior turns
  // instead of only the last user message (which would silently break the
  // Socratic interview). For the paste-and-assemble flow the history is a
  // single user turn anyway, so this is a no-op in that case.
  const hasHistory = messages.length > 1;
  let prompt: string;
  if (hasHistory) {
    const transcript = messages
      .map((m) => `[${m.role.toUpperCase()}]: ${extractText(m.content)}`)
      .join("\n\n");
    const header = system ? `${system}\n\n---\n\n` : "";
    prompt = `${header}Conversation so far:\n\n${transcript}\n\nRespond as the next assistant turn.`;
  } else {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUser ? extractText(lastUser.content) : "";
    prompt = system ? `${system}\n\n---\n\n${userText}` : userText;
  }

  if (!prompt.trim()) {
    return NextResponse.json(
      { error: "Empty prompt — need at least a system or user message" },
      { status: 400 }
    );
  }

  let accumulated = "";
  try {
    const q = query({
      prompt,
      options: {
        ...(model ? { model } : {}),
        // Don't load the user's project settings/CLAUDE.md/skills — we want a
        // clean Claude conversation, not the local Claude Code agent context.
        settingSources: [],
        // No tools needed — pure text generation.
        tools: [],
      },
    });

    for await (const msg of q) {
      if (msg.type !== "assistant") continue;
      const content = msg.message?.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (block?.type === "text" && typeof block.text === "string") {
          accumulated += block.text;
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Agent SDK error: ${message}` },
      { status: 500 }
    );
  }

  const responseBody = {
    id: `msg_oauth_${Date.now()}`,
    type: "message" as const,
    role: "assistant" as const,
    model: model ?? "claude-oauth-local",
    content: [{ type: "text" as const, text: accumulated }],
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
