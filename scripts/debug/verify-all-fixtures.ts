/**
 * Verify the post-strip + 350-word assembly prompt against all 5 cl-assembly
 * fixtures. Per consultant: "Re-run the eval on the cl-assembly fixtures
 * (k=3 per fixture if you have budget, k=1 if not) to confirm the fix holds
 * across fixtures, not just the one the agent tested on."
 *
 * k=1 default. Pass --k=3 for triple reps. Uses Agent SDK with
 * settingSources:[] + tools:[] (matches OAuth proxy at
 * app/api/v1/messages/route.ts). Pins the exact SYSTEM_PROMPT exported
 * from lib/assemble.ts so production and verify stay in lockstep.
 *
 * Run: npx tsx scripts/debug/verify-all-fixtures.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { computeVR } from "../../lib/verbatim-ratio.js";
import { SYSTEM_PROMPT } from "../../lib/assemble.js";

const FIXTURES = [
  "cent-capital",
  "devry-university",
  "opencall-ai",
  "shulman-fleming",
  "yo-it-consulting",
];

const FIXTURE_ROOT =
  "/home/pn/projects/human-writer-pro/eval/regression-fixtures/cl-assembly";

const K = parseInt(process.argv.find((a) => a.startsWith("--k="))?.split("=")[1] ?? "1", 10);

async function generateOnce(systemPrompt: string, userPrompt: string): Promise<string> {
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
  const outDir = path.join(
    "/home/pn/projects/human-writer-pro",
    "scratch",
    `verify-all-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`
  );
  await mkdir(outDir, { recursive: true });

  console.log("=== Verify across all 5 cl-assembly fixtures ===");
  console.log(`k=${K} per fixture (${FIXTURES.length * K} total Agent SDK calls)`);
  console.log(`Outputs → ${outDir}`);
  console.log("");

  type Result = { fixture: string; vrs: number[]; outputs: string[]; words: number[] };
  const results: Result[] = [];

  for (const fixture of FIXTURES) {
    console.log(`--- ${fixture} ---`);
    const interviewPath = path.join(FIXTURE_ROOT, fixture, "interview.md");
    const rawInterview = await readFile(interviewPath, "utf8");

    const vrs: number[] = [];
    const outputs: string[] = [];
    const words: number[] = [];

    for (let k = 1; k <= K; k++) {
      process.stdout.write(`  rep ${k}/${K}... `);
      const t0 = Date.now();
      const output = await generateOnce(SYSTEM_PROMPT, rawInterview.trim());
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const vr = computeVR(rawInterview, output);
      const wordCount = output.trim().split(/\s+/).length;
      vrs.push(vr.fiveGram);
      outputs.push(output);
      words.push(wordCount);

      const repPath = path.join(outDir, `${fixture}-rep-${k}.md`);
      await writeFile(repPath, output, "utf8");
      console.log(`${elapsed}s, ${wordCount} words, VR ${(vr.fiveGram * 100).toFixed(1)}%`);
    }
    console.log("");
    results.push({ fixture, vrs, outputs, words });
  }

  // Summary table
  console.log("\n=== Summary ===");
  console.log("| Fixture            | Words (mean) | VR per rep              | VR mean |");
  console.log("|--------------------|-------------|-------------------------|---------|");
  for (const r of results) {
    const meanWords = Math.round(r.words.reduce((a, b) => a + b, 0) / r.words.length);
    const meanVR = r.vrs.reduce((a, b) => a + b, 0) / r.vrs.length;
    const repCells = r.vrs.map((v) => (v * 100).toFixed(1) + "%").join(", ").padEnd(23);
    console.log(`| ${r.fixture.padEnd(18)} | ${String(meanWords).padStart(11)} | ${repCells} | ${(meanVR * 100).toFixed(1).padStart(5)}% |`);
  }
  const overallMeanVR = results.reduce((acc, r) => acc + r.vrs.reduce((a, b) => a + b, 0) / r.vrs.length, 0) / results.length;
  console.log(`\nOverall mean VR across fixtures: ${(overallMeanVR * 100).toFixed(1)}%`);
  const passing = results.filter((r) => r.vrs.reduce((a, b) => a + b, 0) / r.vrs.length >= 0.20).length;
  console.log(`Fixtures ≥20% VR (rough human-pass threshold): ${passing}/${results.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
