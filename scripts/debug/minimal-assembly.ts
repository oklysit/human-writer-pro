/**
 * Control experiment: reproduce the pilot's band-35 result outside the product.
 *
 * Per the senior consultant's playbook (2026-04-14): if this script hits 30-45% VR
 * on topic 2 (where pilot rep t2-b35-r2 hit 32.3% and passed GPTZero), the band-35
 * prompt still works in isolation and the bug is in the product pipeline.
 * If we get 3-9% like the live app, something has changed in the environment
 * (Sonnet version drift, SDK defaults, Agent-SDK injection, etc.).
 *
 * Throwaway diagnostic. Hardcoded inputs, no flags. Run via:
 *   npx tsx scripts/debug/minimal-assembly.ts
 *
 * Uses Agent SDK with Claude Max OAuth (no ANTHROPIC_API_KEY needed) — same as
 * the pilot, which used Agent SDK with Sonnet pinned.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile } from "node:fs/promises";
import { computeVR } from "../../lib/verbatim-ratio.js";

const RAW_INTERVIEW_PATH =
  "/home/pn/projects/screenshots/evals/vr-validation/2026-04-13/raw-interview-topic-2.md";

const BAND_35_PROMPT_PATH =
  "/home/pn/projects/human-writer-pro/eval/regression-fixtures/prompts/band-35-strategy.md";

const K = 3;

function extractBand35Parts(promptFileMd: string): { base: string; strategy: string } {
  const fenceRegex = /```[^\n]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = fenceRegex.exec(promptFileMd)) !== null) {
    blocks.push(m[1].trim());
  }
  if (blocks.length < 2) {
    throw new Error(`band-35 prompt: expected ≥2 fenced blocks, got ${blocks.length}`);
  }
  return { base: blocks[0], strategy: blocks[1] };
}

async function generateOnce(prompt: string): Promise<string> {
  let accumulated = "";
  const q = query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      settingSources: [],
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
  return accumulated.trim();
}

async function main(): Promise<void> {
  const [rawInterview, promptFileMd] = await Promise.all([
    readFile(RAW_INTERVIEW_PATH, "utf8"),
    readFile(BAND_35_PROMPT_PATH, "utf8"),
  ]);

  const { base, strategy } = extractBand35Parts(promptFileMd);
  const prompt = `${base}\n\n${rawInterview}\n\n${strategy}`;

  console.log("=== Control: pilot band-35 reproduction (Topic 2) ===");
  console.log(`Reference: pilot t2-b35-r2 = 32.3% VR, passed GPTZero`);
  console.log(`k = ${K}`);
  console.log(`Prompt length: ${prompt.length} chars`);
  console.log(`Model: claude-sonnet-4-6 (via Agent SDK, settingSources:[], tools:[])`);
  console.log("");

  const vrs: number[] = [];
  for (let k = 1; k <= K; k++) {
    process.stdout.write(`Run ${k}/${K}... `);
    const t0 = Date.now();
    const output = await generateOnce(prompt);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const vr = computeVR(rawInterview, output);
    vrs.push(vr.fiveGram);
    console.log(`${elapsed}s, ${output.length} chars, 5-gram VR: ${(vr.fiveGram * 100).toFixed(1)}%`);
    console.log(`  preview: ${output.slice(0, 180).replace(/\n/g, " ")}...`);
    console.log("");
  }

  const meanVR = vrs.reduce((a, b) => a + b, 0) / vrs.length;
  console.log("=== Summary ===");
  console.log(`5-gram VR per run: ${vrs.map((v) => (v * 100).toFixed(1) + "%").join(", ")}`);
  console.log(`Mean 5-gram VR:    ${(meanVR * 100).toFixed(1)}%`);
  console.log("");
  console.log("Interpretation:");
  console.log(`  ≥30%: prompt works in isolation → product pipeline is the bug`);
  console.log(`  10-25%: degraded but not broken → likely partial environment drift`);
  console.log(`  ≤9%: matches live-app result → environment changed (model, SDK, Agent-SDK injection)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
