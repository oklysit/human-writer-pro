/**
 * CL Regression Runner — Task 20
 *
 * Regenerates cover letter output from each regression fixture using the
 * band-35 prompt (loaded verbatim from eval/regression-fixtures/prompts/band-35-strategy.md)
 * and scores it with:
 *   - VR5 (5-gram verbatim ratio, deterministic)
 *   - AI-ism detector (node-side, no webpack deps)
 *   - LLM judge (Claude Sonnet 4.6, separate call from generator)
 *   - GPTZero (optional, gated on GPTZERO_API_KEY env var)
 *
 * Usage:
 *   npm run eval:cl
 *   npm run eval:cl -- --fixture=shulman-fleming
 *   npm run eval:cl -- --dry-run
 *
 * Output:
 *   eval/reports/cl-regression-{ISO-date}.jsonl
 *   eval/reports/cl-regression-{ISO-date}.md
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { computeVR } from "../../lib/verbatim-ratio.js";
import { loadPatterns, detect } from "./ai-isms-node.js";
import { judge, JudgeParseError } from "./llm-judge.js";
import { scoreGPTZero, GPTZeroError } from "./gptzero.js";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const FIXTURES_DIR = path.join(REPO_ROOT, "eval/regression-fixtures/cl-assembly");
const PROMPT_FILE = path.join(
  REPO_ROOT,
  "eval/regression-fixtures/prompts/band-35-strategy.md"
);
const REPORTS_DIR = path.join(REPO_ROOT, "eval/reports");

const ALL_FIXTURES = [
  "cent-capital",
  "devry-university",
  "opencall-ai",
  "shulman-fleming",
  "yo-it-consulting",
];

const K = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RunRecord = {
  k: number;
  output: string;
  vr5: number;
  ai_ism_count: number;
  judge_voice_match: number | null;
  judge_content_fidelity: number | null;
  judge_ai_ism_severity: number | null;
  judge_reasoning: string | null;
  judge_error: string | null;
  gptzero_human_plus_mixed: number | null;
  gptzero_skipped: boolean;
  gptzero_error: string | null;
};

type FixtureResult = {
  fixture: string;
  prompt_sha: string;
  baseline_vr5: number;
  runs: RunRecord[];
  mean_vr5: number;
  std_vr5: number;
  mean_judge_voice: number | null;
  std_judge_voice: number | null;
  mean_judge_fidelity: number | null;
  std_judge_fidelity: number | null;
  mean_judge_ai_ism: number | null;
  std_judge_ai_ism: number | null;
  ai_ism_count_total: number;
  gptzero_human_plus_mixed: number | null;
};

type ExpectedBaseline = {
  fixture: string;
  baseline: {
    vr5_mean: number;
    gptzero_human_plus_mixed: number | null;
    ai_ism_count: number | null;
    judge_voice_match: number | null;
    judge_content_fidelity: number | null;
  };
  notes: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length);
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function nullableMean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return round4(mean(valid));
}

function nullableStd(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return round4(std(valid));
}

/**
 * Get git SHA of a file via `git hash-object <path>`.
 */
function getFileGitSha(filePath: string): string {
  try {
    return execSync(`git -C "${REPO_ROOT}" hash-object "${filePath}"`, {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * Extract the generation prompt from band-35-strategy.md.
 *
 * The strategy block lives inside ``` code fences in the file. We extract:
 *   1. The base instruction block (first ``` block)
 *   2. The strategy block (second ``` block)
 *
 * Then compose: base + "\n\n" + interviewText + "\n\n" + strategy
 *
 * The prompt is loaded VERBATIM — no line modifications. This is the
 * regression source of truth. The "Target 5-gram VR ≈ 35%" directive stays
 * as-is per process/decisions.md ("VR = 35% reframed from target to prompt nudge").
 */
function extractGenerationParts(promptFileMd: string): {
  base: string;
  strategy: string;
} {
  // Extract all fenced code blocks in order
  const fenceRegex = /```[^\n]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = fenceRegex.exec(promptFileMd)) !== null) {
    blocks.push(m[1].trim());
  }

  if (blocks.length < 2) {
    throw new Error(
      `band-35-strategy.md: expected at least 2 fenced code blocks (base + strategy), found ${blocks.length}`
    );
  }

  return { base: blocks[0], strategy: blocks[1] };
}

function composeGenerationPrompt(
  base: string,
  strategy: string,
  interviewText: string
): string {
  return `${base}\n\n${interviewText}\n\n${strategy}`;
}

// ---------------------------------------------------------------------------
// Core runner
// ---------------------------------------------------------------------------

async function runFixture(
  fixtureName: string,
  promptFileMd: string,
  promptSha: string,
  client: Anthropic,
  resolvedApiKey: string,
  dryRun: boolean
): Promise<FixtureResult> {
  const fixtureDir = path.join(FIXTURES_DIR, fixtureName);
  const [interviewText, approvedOutput, baselineRaw] = await Promise.all([
    readFile(path.join(fixtureDir, "interview.md"), "utf8"),
    readFile(path.join(fixtureDir, "approved-output.md"), "utf8"),
    readFile(path.join(fixtureDir, "expected-baseline.json"), "utf8"),
  ]);

  const baseline = JSON.parse(baselineRaw) as ExpectedBaseline;
  const { base, strategy } = extractGenerationParts(promptFileMd);
  const generationPrompt = composeGenerationPrompt(base, strategy, interviewText);

  if (dryRun) {
    console.log(
      `  [dry-run] fixture=${fixtureName} k=${K} calls planned: ${K} generate + ${K} judge` +
        (process.env.GPTZERO_API_KEY ? ` + ${K} GPTZero` : "")
    );
    // Return stub result
    return {
      fixture: fixtureName,
      prompt_sha: promptSha,
      baseline_vr5: baseline.baseline.vr5_mean,
      runs: [],
      mean_vr5: 0,
      std_vr5: 0,
      mean_judge_voice: null,
      std_judge_voice: null,
      mean_judge_fidelity: null,
      std_judge_fidelity: null,
      mean_judge_ai_ism: null,
      std_judge_ai_ism: null,
      ai_ism_count_total: 0,
      gptzero_human_plus_mixed: null,
    };
  }

  const rubricNotes = baseline.notes ?? "";
  const runs: RunRecord[] = [];

  for (let k = 1; k <= K; k++) {
    console.log(`  [${fixtureName}] run ${k}/${K} — generating...`);

    // --- Generate ---
    const genResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: generationPrompt }],
    });

    const genBlock = genResponse.content.find((b) => b.type === "text");
    const generated = genBlock && genBlock.type === "text" ? genBlock.text.trim() : "";

    // --- VR5 ---
    const vrResult = computeVR(interviewText, generated);
    const vr5 = round4(vrResult.fiveGram);

    // --- AI-ism detector ---
    const aisms = detect(generated);
    const ai_ism_count = aisms.length;

    // --- LLM Judge ---
    let judgeRecord: Pick<
      RunRecord,
      | "judge_voice_match"
      | "judge_content_fidelity"
      | "judge_ai_ism_severity"
      | "judge_reasoning"
      | "judge_error"
    >;

    console.log(`  [${fixtureName}] run ${k}/${K} — judging...`);
    try {
      const judgeResult = await judge({
        apiKey: resolvedApiKey,
        generatedOutput: generated,
        approvedReference: approvedOutput,
        rubricNotes,
      });
      judgeRecord = {
        judge_voice_match: judgeResult.voiceMatch,
        judge_content_fidelity: judgeResult.contentFidelity,
        judge_ai_ism_severity: judgeResult.aiIsmSeverity,
        judge_reasoning: judgeResult.reasoning,
        judge_error: null,
      };
    } catch (err) {
      const msg =
        err instanceof JudgeParseError
          ? `JudgeParseError: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      console.warn(`  [${fixtureName}] run ${k} judge failed: ${msg}`);
      judgeRecord = {
        judge_voice_match: null,
        judge_content_fidelity: null,
        judge_ai_ism_severity: null,
        judge_reasoning: null,
        judge_error: msg,
      };
    }

    // --- GPTZero ---
    let gptzeroRecord: Pick<
      RunRecord,
      "gptzero_human_plus_mixed" | "gptzero_skipped" | "gptzero_error"
    >;

    if (process.env.GPTZERO_API_KEY) {
      try {
        const gz = await scoreGPTZero({
          apiKey: process.env.GPTZERO_API_KEY,
          text: generated,
        });
        gptzeroRecord = {
          gptzero_human_plus_mixed: gz.human_plus_mixed,
          gptzero_skipped: false,
          gptzero_error: null,
        };
      } catch (err) {
        const msg =
          err instanceof GPTZeroError
            ? `GPTZeroError(${err.statusCode}): ${err.message}`
            : err instanceof Error
              ? err.message
              : String(err);
        console.warn(`  [${fixtureName}] run ${k} GPTZero failed: ${msg}`);
        gptzeroRecord = {
          gptzero_human_plus_mixed: null,
          gptzero_skipped: true,
          gptzero_error: msg,
        };
      }
    } else {
      gptzeroRecord = {
        gptzero_human_plus_mixed: null,
        gptzero_skipped: true,
        gptzero_error: null,
      };
    }

    runs.push({
      k,
      output: generated,
      vr5,
      ai_ism_count,
      ...judgeRecord,
      ...gptzeroRecord,
    });
  }

  // --- Aggregate ---
  const vr5Values = runs.map((r) => r.vr5);
  const voiceValues = runs.map((r) => r.judge_voice_match);
  const fidelityValues = runs.map((r) => r.judge_content_fidelity);
  const aiIsmValues = runs.map((r) => r.judge_ai_ism_severity);
  const ai_ism_count_total = runs.reduce((a, r) => a + r.ai_ism_count, 0);

  // GPTZero: use last successful run (or null)
  const gzValues = runs
    .map((r) => r.gptzero_human_plus_mixed)
    .filter((v): v is number => v !== null);
  const gptzero_human_plus_mixed = gzValues.length > 0 ? gzValues[gzValues.length - 1] : null;

  return {
    fixture: fixtureName,
    prompt_sha: promptSha,
    baseline_vr5: baseline.baseline.vr5_mean,
    runs,
    mean_vr5: round4(mean(vr5Values)),
    std_vr5: round4(std(vr5Values)),
    mean_judge_voice: nullableMean(voiceValues),
    std_judge_voice: nullableStd(voiceValues),
    mean_judge_fidelity: nullableMean(fidelityValues),
    std_judge_fidelity: nullableStd(fidelityValues),
    mean_judge_ai_ism: nullableMean(aiIsmValues),
    std_judge_ai_ism: nullableStd(aiIsmValues),
    ai_ism_count_total,
    gptzero_human_plus_mixed,
  };
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function toMarkdownTable(results: FixtureResult[]): string {
  const header = [
    "| Fixture | Baseline VR5 | Mean VR5 | Std VR5 | Voice (mean±std) | Fidelity | AI-ism sev | AI-ism count | GPTZero |",
    "|---------|-------------|---------|--------|-----------------|---------|------------|-------------|---------|",
  ].join("\n");

  const rows = results.map((r) => {
    const voice =
      r.mean_judge_voice !== null
        ? `${r.mean_judge_voice}±${r.std_judge_voice ?? "?"}`
        : "n/a";
    const fidelity = r.mean_judge_fidelity !== null ? String(r.mean_judge_fidelity) : "n/a";
    const aiIsm = r.mean_judge_ai_ism !== null ? String(r.mean_judge_ai_ism) : "n/a";
    const gptz =
      r.gptzero_human_plus_mixed !== null ? String(r.gptzero_human_plus_mixed) : "n/a";
    return `| ${r.fixture} | ${r.baseline_vr5} | ${r.mean_vr5} | ${r.std_vr5} | ${voice} | ${fidelity} | ${aiIsm} | ${r.ai_ism_count_total} | ${gptz} |`;
  });

  return [header, ...rows].join("\n");
}

function generateMarkdownReport(
  results: FixtureResult[],
  date: string,
  promptSha: string,
  dryRun: boolean
): string {
  const title = `# CL Regression Report — ${date}`;
  const meta = [
    `**Prompt SHA:** \`${promptSha}\``,
    `**k:** ${K} runs per fixture`,
    `**Model (generator + judge):** claude-sonnet-4-6`,
    `**GPTZero:** ${process.env.GPTZERO_API_KEY ? "enabled" : "skipped (GPTZERO_API_KEY not set)"}`,
    dryRun ? "**Mode:** DRY RUN (no API calls made)" : "",
  ]
    .filter(Boolean)
    .join("\n");

  const table = dryRun ? "_Dry run — no results_" : toMarkdownTable(results);

  return [title, "", meta, "", "## Results", "", table, ""].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse args
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fixtureArg = args.find((a) => a.startsWith("--fixture="))?.split("=")[1];

  const fixtures = fixtureArg
    ? [fixtureArg]
    : ALL_FIXTURES;

  if (fixtureArg && !ALL_FIXTURES.includes(fixtureArg)) {
    console.error(
      `Unknown fixture: "${fixtureArg}". Valid fixtures: ${ALL_FIXTURES.join(", ")}`
    );
    process.exit(1);
  }

  // API key check
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !dryRun) {
    console.error(
      "Error: ANTHROPIC_API_KEY is not set.\n" +
        "Usage: ANTHROPIC_API_KEY=sk-ant-... npm run eval:cl"
    );
    process.exit(1);
  }

  // Dry-run cost estimate
  if (dryRun) {
    const calls = fixtures.length * K * 2; // generate + judge
    const gzCalls = process.env.GPTZERO_API_KEY ? fixtures.length * K : 0;
    const estimatedTokens = calls * 8000;
    const estimatedCostUSD = estimatedTokens * (3 / 1_000_000); // ~$3/M input tokens Sonnet
    console.log("\n=== DRY RUN ===");
    console.log(`Fixtures: ${fixtures.join(", ")}`);
    console.log(`k=${K} runs per fixture`);
    console.log(`Anthropic calls planned: ${calls} (${fixtures.length} fixtures × ${K} × 2)`);
    if (gzCalls > 0) console.log(`GPTZero calls planned: ${gzCalls}`);
    console.log(
      `Rough token estimate: ~${estimatedTokens.toLocaleString()} tokens (~$${estimatedCostUSD.toFixed(2)} USD)`
    );
    console.log("=== END DRY RUN ===\n");
  }

  // Load the band-35 prompt verbatim
  const promptFileMd = await readFile(PROMPT_FILE, "utf8");
  const promptSha = getFileGitSha(PROMPT_FILE);

  console.log(`Prompt SHA: ${promptSha}`);
  console.log(`Fixtures to run: ${fixtures.join(", ")}`);

  // Load AI-ism patterns (Node side)
  if (!dryRun) {
    await loadPatterns();
    console.log("AI-ism patterns loaded.");
  }

  const resolvedApiKey = apiKey ?? "dry-run-no-key";
  const client = new Anthropic({ apiKey: resolvedApiKey });

  const results: FixtureResult[] = [];
  for (const fixtureName of fixtures) {
    console.log(`\n--- Fixture: ${fixtureName} ---`);
    try {
      const result = await runFixture(
        fixtureName,
        promptFileMd,
        promptSha,
        client,
        resolvedApiKey,
        dryRun
      );
      results.push(result);
      if (!dryRun) {
        console.log(
          `  Done. mean_vr5=${result.mean_vr5} std_vr5=${result.std_vr5} ai_ism_total=${result.ai_ism_count_total}`
        );
      }
    } catch (err) {
      console.error(
        `  ERROR in fixture ${fixtureName}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Write outputs
  const date = new Date().toISOString().slice(0, 10);
  await mkdir(REPORTS_DIR, { recursive: true });

  const jsonlPath = path.join(REPORTS_DIR, `cl-regression-${date}.jsonl`);
  const mdPath = path.join(REPORTS_DIR, `cl-regression-${date}.md`);

  const jsonlContent = results.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await writeFile(jsonlPath, jsonlContent, "utf8");

  const mdContent = generateMarkdownReport(results, date, promptSha, dryRun);
  await writeFile(mdPath, mdContent, "utf8");

  console.log(`\nOutputs written:`);
  console.log(`  JSONL: ${jsonlPath}`);
  console.log(`  MD:    ${mdPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
