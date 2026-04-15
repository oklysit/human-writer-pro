/**
 * Verify the v3 procedural-ordering SYSTEM_PROMPT on the CrowdStrike
 * fixture.
 *
 * Pins to the CURRENT lib/assemble.ts SYSTEM_PROMPT (imported, not copied)
 * so this script tracks whatever the live app sends at import-time.
 *
 * Measurement: k=3 reps on the CrowdStrike raw interview. Reports:
 *   - 5-gram VR per rep + mean
 *   - Paragraph count per rep (blank-line-separated blocks)
 *   - Pass / fail vs Letter 2 floor (27% VR, 5 paragraphs)
 *   - Saves all outputs + Letter 2 reference to scratch/verify-crowdstrike-v3-<ts>/
 *
 * Run: npx tsx scripts/debug/verify-crowdstrike-v3.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { computeVR } from "../../lib/verbatim-ratio.js";
import { SYSTEM_PROMPT } from "../../lib/assemble.js";

const ROOT = "/home/pn/projects/human-writer-pro";
const FIXTURE_DIR = path.join(
  ROOT,
  "eval/regression-fixtures/cl-assembly/crowdstrike-ai-security-consultant"
);
const INTERVIEW_PATH = path.join(FIXTURE_DIR, "interview.md");
const BASELINE_PATH = path.join(FIXTURE_DIR, "reference-output-baseline-webapp.md");

const K = 3;
const VR_FLOOR = 0.27; // Letter 2 baseline
const PARAGRAPH_FLOOR = 5;

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

function countParagraphs(text: string): number {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

async function main(): Promise<void> {
  const rawInterview = await readFile(INTERVIEW_PATH, "utf8");
  const baseline = await readFile(BASELINE_PATH, "utf8");
  const baselineVR = computeVR(rawInterview, baseline).fiveGram;
  const baselineParas = countParagraphs(baseline);

  const outDir = path.join(
    ROOT,
    "scratch",
    `verify-crowdstrike-v3-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`
  );
  await mkdir(outDir, { recursive: true });

  console.log("=== CrowdStrike v3 verification ===");
  console.log(`Baseline (Letter 2, webapp): ${(baselineVR * 100).toFixed(1)}% VR, ${baselineParas} paragraphs`);
  console.log(`Floor:                       ${(VR_FLOOR * 100).toFixed(0)}% VR, ${PARAGRAPH_FLOOR} paragraphs`);
  console.log(`Raw interview:               ${rawInterview.split(/\s+/).filter(Boolean).length} words`);
  console.log(`Outputs →                    ${outDir}`);
  console.log("");

  const vrs: number[] = [];
  const paras: number[] = [];
  const outputs: string[] = [];
  for (let k = 1; k <= K; k++) {
    process.stdout.write(`Rep ${k}/${K}... `);
    const t0 = Date.now();
    const output = await generateOnce(SYSTEM_PROMPT, rawInterview.trim());
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const vr = computeVR(rawInterview, output);
    const p = countParagraphs(output);
    const wc = output.split(/\s+/).filter(Boolean).length;
    vrs.push(vr.fiveGram);
    paras.push(p);
    outputs.push(output);
    console.log(
      `${elapsed}s | ${wc} words | ${p} paragraphs | 5-gram VR: ${(vr.fiveGram * 100).toFixed(1)}%`
    );

    const outPath = path.join(outDir, `rep-${k}.md`);
    await writeFile(outPath, output, "utf8");
  }

  const meanVR = vrs.reduce((a, b) => a + b, 0) / vrs.length;
  const meanParas = paras.reduce((a, b) => a + b, 0) / paras.length;
  const bestIdx = vrs.indexOf(Math.max(...vrs));

  console.log("");
  console.log("=== Summary ===");
  console.log(`VR per rep:   ${vrs.map((v) => (v * 100).toFixed(1) + "%").join(", ")}`);
  console.log(`Paras per rep: ${paras.join(", ")}`);
  console.log(`Mean VR:      ${(meanVR * 100).toFixed(1)}%   (baseline ${(baselineVR * 100).toFixed(1)}%,  Δ ${((meanVR - baselineVR) * 100).toFixed(1)}pp)`);
  console.log(`Mean paras:   ${meanParas.toFixed(1)}`);
  console.log("");

  const vrPass = meanVR >= VR_FLOOR;
  const paraPass = paras.every((p) => p >= PARAGRAPH_FLOOR);
  const pass = vrPass && paraPass;

  if (pass) {
    console.log(`✓ PASS — v3 holds Letter-2 floor.`);
    console.log(`  Best rep: rep-${bestIdx + 1} at ${(vrs[bestIdx] * 100).toFixed(1)}% VR, ${paras[bestIdx]} paragraphs`);
    console.log(`  Next: read ${path.join(outDir, `rep-${bestIdx + 1}.md`)} for eye-test.`);
  } else {
    console.log(`✗ FAIL — v3 regressed.`);
    console.log(`  VR gate:   ${vrPass ? "pass" : "FAIL"} (mean ${(meanVR * 100).toFixed(1)}% vs floor ${(VR_FLOOR * 100).toFixed(0)}%)`);
    console.log(`  Para gate: ${paraPass ? "pass" : "FAIL"} (min ${Math.min(...paras)} vs floor ${PARAGRAPH_FLOOR})`);
    console.log(`  Stop before UI work. Re-plan.`);
  }

  const summaryPath = path.join(outDir, "summary.json");
  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        fixture: "crowdstrike-ai-security-consultant",
        prompt: "v3 (commit 43dd62c + lib/assemble.ts SYSTEM_PROMPT at run time)",
        k: K,
        baseline: {
          label: "Letter 2 (webapp, pre-v3)",
          fiveGramVR: baselineVR,
          paragraphs: baselineParas,
        },
        reps: vrs.map((v, i) => ({
          rep: i + 1,
          fiveGramVR: v,
          paragraphs: paras[i],
          words: outputs[i].split(/\s+/).filter(Boolean).length,
        })),
        summary: {
          meanVR,
          meanParas,
          vrPass,
          paraPass,
          pass,
          bestRep: bestIdx + 1,
        },
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`  summary: ${summaryPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
