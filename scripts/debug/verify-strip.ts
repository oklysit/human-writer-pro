/**
 * Verify the post-strip assembly path against the cent-capital fixture.
 *
 * Mirrors what lib/assemble.ts now sends after the 2026-04-14 strip:
 *   - System: the 2 pilot sentences (band-35 base + strategy)
 *   - User: raw interview text
 *   - max_tokens: 1024
 *   - model: claude-sonnet-4-6
 *
 * Calls Agent SDK with settingSources:[] + tools:[] — same as the OAuth
 * proxy at app/api/v1/messages/route.ts, so this measures what the live
 * app will produce post-refactor.
 *
 * Pass criteria per consultant: VR jumps from 6-9% (pre-strip) to 15-40%.
 *
 * Run: npx tsx scripts/debug/verify-strip.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { computeVR } from "../../lib/verbatim-ratio.js";

const INTERVIEW_PATH =
  "/home/pn/projects/human-writer-pro/eval/regression-fixtures/cl-assembly/cent-capital/interview.md";

const SYSTEM_PROMPT = `Write a single paragraph of approximately 250 words (strict range: 225–275) that answers the interview question below. Output ONLY the paragraph — no headings, no quotes, no meta-commentary.

Strategy: Heavy verbatim stitching. Most clauses should be lifted directly; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers where they break the paragraph, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.`;

const K = 3;

async function generateOnce(systemPrompt: string, userPrompt: string): Promise<string> {
  // Mirror the OAuth proxy's collapse: system + "---" + user (route.ts:75).
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  let accumulated = "";
  for await (const msg of query({
    prompt: fullPrompt,
    options: {
      model: "claude-sonnet-4-6",
      settingSources: [],
      tools: [],
    },
  })) {
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
  const rawInterview = await readFile(INTERVIEW_PATH, "utf8");

  // Write outputs to scratch/ so we can score them on GPTZero / read them.
  const outDir = path.join(
    "/home/pn/projects/human-writer-pro",
    "scratch",
    `verify-strip-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`
  );
  await mkdir(outDir, { recursive: true });

  console.log("=== Verify strip on cent-capital ===");
  console.log("Pre-strip live app:           6-9% VR");
  console.log("Bisect V5 (≈ pre-strip prod): 42.5% mean (topic 2)");
  console.log("Pilot band-35:                30-45% range");
  console.log(`Target post-strip:            ≥15-30% to call the strip a win`);
  console.log(`Outputs → ${outDir}`);
  console.log("");

  const vrs: number[] = [];
  for (let k = 1; k <= K; k++) {
    process.stdout.write(`Rep ${k}/${K}... `);
    const t0 = Date.now();
    const output = await generateOnce(SYSTEM_PROMPT, rawInterview.trim());
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const vr = computeVR(rawInterview, output);
    vrs.push(vr.fiveGram);
    console.log(`${elapsed}s, ${output.length} chars, 5-gram VR: ${(vr.fiveGram * 100).toFixed(1)}%`);

    const outPath = path.join(outDir, `rep-${k}.md`);
    await writeFile(outPath, output, "utf8");
    console.log(`  saved: ${outPath}`);
    console.log("");
  }

  const meanVR = vrs.reduce((a, b) => a + b, 0) / vrs.length;
  console.log("=== Result ===");
  console.log(`5-gram VR per rep: ${vrs.map((v) => (v * 100).toFixed(1) + "%").join(", ")}`);
  console.log(`Mean: ${(meanVR * 100).toFixed(1)}%`);
  if (meanVR >= 0.15) {
    console.log(`✓ PASS — strip restored VR above 15% threshold`);
  } else {
    console.log(`✗ FAIL — VR still low; bisect: system vs user slot, temperature, max_tokens, model string`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
