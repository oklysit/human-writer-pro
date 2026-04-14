/**
 * CL Regression Baseline Comparator — Task 21
 *
 * Reads a JSONL run report from the Task 20 runner and compares each
 * fixture's results against its expected-baseline.json.
 *
 * Exit codes:
 *   0 — all fixtures PASS (or INFO-only)
 *   1 — at least one fixture has a FAIL
 *   2 — tooling error (bad file, malformed JSONL, missing baseline)
 *
 * Usage:
 *   npm run eval:cl-diff
 *   npm run eval:cl-diff -- --report=eval/reports/cl-regression-2026-04-14.jsonl
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types (exported so tests and callers can import without re-declaring)
// ---------------------------------------------------------------------------

export type RunBlock = {
  fixture: string;
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
  // optional fields present in actual runner output but not required for comparison
  prompt_sha?: string;
  baseline_vr5?: number;
};

export type BaselineFile = {
  fixture: string;
  baseline: {
    vr5_mean: number;
    gptzero_human_plus_mixed: number | null;
    ai_ism_count: number | null;
    judge_voice_match: number | null;
    judge_content_fidelity: number | null;
  };
  tolerance: {
    vr5: number;
    gptzero_human_plus_mixed: number;
    ai_ism_count_max_increase: number;
    judge_score_max_drop: number;
  };
  aspirational_targets: {
    vr5_min?: number;
    gptzero_human_plus_mixed_min?: number;
  };
  notes?: string;
  // allow extra fields like prompt_sha without breaking
  [key: string]: unknown;
};

export type CompareEntry = {
  metric: string;
  message: string;
};

export type FixtureCompareResult = {
  fixture: string;
  status: "pass" | "fail";
  failures: CompareEntry[];
  infos: CompareEntry[];
};

// ---------------------------------------------------------------------------
// Pure comparison logic — no file I/O, fully testable
// ---------------------------------------------------------------------------

export function compareFixture(run: RunBlock, baseline: BaselineFile): FixtureCompareResult {
  const failures: CompareEntry[] = [];
  const infos: CompareEntry[] = [];

  // --- VR5 ---
  const vr5Delta = Math.abs(run.mean_vr5 - baseline.baseline.vr5_mean);
  if (vr5Delta > baseline.tolerance.vr5) {
    const dir = run.mean_vr5 < baseline.baseline.vr5_mean ? "↓" : "↑";
    const signedDelta = run.mean_vr5 - baseline.baseline.vr5_mean;
    failures.push({
      metric: "vr5",
      message:
        `VR5 drift beyond tolerance: baseline=${baseline.baseline.vr5_mean} → ` +
        `run=${run.mean_vr5} (Δ${signedDelta >= 0 ? "+" : ""}${signedDelta.toFixed(3)}, ` +
        `EXCEEDS ±${baseline.tolerance.vr5}) ${dir}`,
    });
  }

  // --- GPTZero ---
  if (baseline.baseline.gptzero_human_plus_mixed === null) {
    // First run — establish baseline
    if (run.gptzero_human_plus_mixed === null) {
      infos.push({
        metric: "gptzero",
        message: "GPTZero: skipped — quota or network",
      });
    } else {
      infos.push({
        metric: "gptzero",
        message: `GPTZero: baseline established at ${run.gptzero_human_plus_mixed}`,
      });
    }
  } else if (run.gptzero_human_plus_mixed === null) {
    // Has established baseline but this run skipped
    infos.push({
      metric: "gptzero",
      message: "GPTZero: skipped — quota or network",
    });
  } else {
    // Both present — compare
    const gptzDelta = Math.abs(run.gptzero_human_plus_mixed - baseline.baseline.gptzero_human_plus_mixed);
    if (gptzDelta > baseline.tolerance.gptzero_human_plus_mixed) {
      failures.push({
        metric: "gptzero",
        message:
          `GPTZero drift beyond tolerance: baseline=${baseline.baseline.gptzero_human_plus_mixed} → ` +
          `run=${run.gptzero_human_plus_mixed} (Δ${(run.gptzero_human_plus_mixed - baseline.baseline.gptzero_human_plus_mixed >= 0 ? "+" : "")}` +
          `${run.gptzero_human_plus_mixed - baseline.baseline.gptzero_human_plus_mixed}, ` +
          `EXCEEDS ±${baseline.tolerance.gptzero_human_plus_mixed})`,
      });
    }
  }

  // --- AI-ism count ---
  if (baseline.baseline.ai_ism_count === null) {
    infos.push({
      metric: "ai_ism",
      message: `AI-ism count: baseline established at ${run.ai_ism_count_total}`,
    });
  } else {
    const increase = run.ai_ism_count_total - baseline.baseline.ai_ism_count;
    if (increase > baseline.tolerance.ai_ism_count_max_increase) {
      failures.push({
        metric: "ai_ism",
        message:
          `AI-ism count increase beyond tolerance: baseline=${baseline.baseline.ai_ism_count} → ` +
          `run=${run.ai_ism_count_total} (+${increase}, EXCEEDS max +${baseline.tolerance.ai_ism_count_max_increase})`,
      });
    }
  }

  // --- Judge scores ---
  const judgeMetrics: Array<{
    key: "judge_voice" | "judge_fidelity" | "judge_ai_ism";
    baselineField: keyof BaselineFile["baseline"];
    runField: keyof RunBlock;
    label: string;
  }> = [
    {
      key: "judge_voice",
      baselineField: "judge_voice_match",
      runField: "mean_judge_voice",
      label: "Judge voice",
    },
    {
      key: "judge_fidelity",
      baselineField: "judge_content_fidelity",
      runField: "mean_judge_fidelity",
      label: "Judge fidelity",
    },
    {
      key: "judge_ai_ism",
      baselineField: "judge_voice_match", // placeholder; handled below via direct index
      runField: "mean_judge_ai_ism",
      label: "Judge AI-ism severity",
    },
  ];

  // judge_ai_ism has no baseline field — treat same as others (null → info)
  const judgeBaselineValues: Record<string, number | null> = {
    judge_voice: baseline.baseline.judge_voice_match,
    judge_fidelity: baseline.baseline.judge_content_fidelity,
    judge_ai_ism: null, // no dedicated baseline field — always first-run
  };

  for (const m of judgeMetrics) {
    const baselineVal = judgeBaselineValues[m.key];
    const runVal = run[m.runField] as number | null;

    if (baselineVal === null) {
      if (runVal !== null) {
        infos.push({
          metric: m.key,
          message: `${m.label}: baseline established at ${runVal}`,
        });
      }
      // If both null: silently skip (no data)
    } else if (runVal !== null) {
      const drop = baselineVal - runVal;
      if (drop > baseline.tolerance.judge_score_max_drop) {
        failures.push({
          metric: m.key,
          message:
            `${m.label} drop beyond tolerance: baseline=${baselineVal} → ` +
            `run=${runVal} (drop=${drop.toFixed(3)}, EXCEEDS ${baseline.tolerance.judge_score_max_drop})`,
        });
      }
    }
    // If baseline set but run is null: skip silently (judge failed for this run)
  }

  // --- Aspirational targets (info only, never fail) ---
  if (
    baseline.aspirational_targets.vr5_min !== undefined &&
    run.mean_vr5 < baseline.aspirational_targets.vr5_min
  ) {
    infos.push({
      metric: "aspirational_vr5",
      message: `Below aspirational VR5 target: run=${run.mean_vr5}, target≥${baseline.aspirational_targets.vr5_min}`,
    });
  }

  if (
    baseline.aspirational_targets.gptzero_human_plus_mixed_min !== undefined &&
    run.gptzero_human_plus_mixed !== null &&
    run.gptzero_human_plus_mixed < baseline.aspirational_targets.gptzero_human_plus_mixed_min
  ) {
    infos.push({
      metric: "aspirational_gptzero",
      message:
        `Below aspirational GPTZero target: run=${run.gptzero_human_plus_mixed}, ` +
        `target≥${baseline.aspirational_targets.gptzero_human_plus_mixed_min}`,
    });
  }

  return {
    fixture: run.fixture,
    status: failures.length > 0 ? "fail" : "pass",
    failures,
    infos,
  };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function formatFixtureSection(
  run: RunBlock,
  baseline: BaselineFile,
  result: FixtureCompareResult
): string {
  const statusLabel = result.status === "fail" ? "FAIL" : "PASS";
  const lines: string[] = [`## ${run.fixture} — ${statusLabel}`];

  // VR5 line
  const vr5Delta = run.mean_vr5 - baseline.baseline.vr5_mean;
  const vr5Sign = vr5Delta >= 0 ? "+" : "";
  const vr5DeltaFormatted = `${vr5Sign}${vr5Delta.toFixed(3)}`;
  const vr5Within = Math.abs(vr5Delta) <= baseline.tolerance.vr5;
  lines.push(
    `Baseline VR5: ${baseline.baseline.vr5_mean}  →  Run mean: ${run.mean_vr5} ± ${run.std_vr5}  ` +
      `(Δ ${vr5DeltaFormatted}, ${vr5Within ? `within ±${baseline.tolerance.vr5}` : `EXCEEDS ±${baseline.tolerance.vr5} tolerance`})`
  );

  // GPTZero line
  if (run.gptzero_human_plus_mixed === null) {
    lines.push("GPTZero: skipped (quota or network)");
  } else if (baseline.baseline.gptzero_human_plus_mixed === null) {
    lines.push(`GPTZero: ${run.gptzero_human_plus_mixed} (baseline established)`);
  } else {
    const gptzDelta = run.gptzero_human_plus_mixed - baseline.baseline.gptzero_human_plus_mixed;
    const gptzSign = gptzDelta >= 0 ? "+" : "";
    const gptzWithin = Math.abs(gptzDelta) <= baseline.tolerance.gptzero_human_plus_mixed;
    lines.push(
      `GPTZero: baseline=${baseline.baseline.gptzero_human_plus_mixed} → run=${run.gptzero_human_plus_mixed} ` +
        `(Δ${gptzSign}${gptzDelta}, ${gptzWithin ? "within tolerance" : "EXCEEDS tolerance"})`
    );
  }

  // AI-ism line
  if (baseline.baseline.ai_ism_count === null) {
    lines.push(`AI-ism count: ${run.ai_ism_count_total} (baseline established)`);
  } else {
    const increase = run.ai_ism_count_total - baseline.baseline.ai_ism_count;
    const within = increase <= baseline.tolerance.ai_ism_count_max_increase;
    lines.push(
      `AI-ism count: baseline=${baseline.baseline.ai_ism_count} → run=${run.ai_ism_count_total} ` +
        `(+${increase}, ${within ? "within tolerance" : "EXCEEDS tolerance"})`
    );
  }

  // Judge scores
  const judgeRows: Array<{ label: string; baseVal: number | null; runVal: number | null; stdVal: number | null }> = [
    { label: "Judge voice", baseVal: baseline.baseline.judge_voice_match, runVal: run.mean_judge_voice, stdVal: run.std_judge_voice },
    { label: "Judge fidelity", baseVal: baseline.baseline.judge_content_fidelity, runVal: run.mean_judge_fidelity, stdVal: run.std_judge_fidelity },
    { label: "Judge AI-ism sev", baseVal: null, runVal: run.mean_judge_ai_ism, stdVal: run.std_judge_ai_ism },
  ];

  for (const jr of judgeRows) {
    if (jr.runVal === null) {
      lines.push(`${jr.label}: n/a (judge failed)`);
    } else if (jr.baseVal === null) {
      lines.push(`${jr.label}: ${jr.runVal} ± ${jr.stdVal ?? "?"} (baseline established)`);
    } else {
      const drop = jr.baseVal - jr.runVal;
      const within = drop <= baseline.tolerance.judge_score_max_drop;
      lines.push(
        `${jr.label}: baseline=${jr.baseVal} → run=${jr.runVal} ± ${jr.stdVal ?? "?"} ` +
          `(drop=${drop.toFixed(3)}, ${within ? "within tolerance" : "EXCEEDS tolerance"})`
      );
    }
  }

  // Failure bullets
  if (result.failures.length > 0) {
    lines.push("");
    for (const f of result.failures) {
      lines.push(`↑ ${f.message}`);
    }
  }

  // Aspirational info bullets
  const aspInfos = result.infos.filter((i) =>
    i.metric.startsWith("aspirational_")
  );
  if (aspInfos.length > 0) {
    lines.push("");
    for (const i of aspInfos) {
      lines.push(`ℹ ${i.message}`);
    }
  }

  return lines.join("\n");
}

function generateDiffReport(
  pairs: Array<{ run: RunBlock; baseline: BaselineFile; result: FixtureCompareResult }>,
  date: string
): string {
  const total = pairs.length;
  const passing = pairs.filter((p) => p.result.status === "pass").length;
  const failing = total - passing;

  const infoOnlyCount = pairs.reduce(
    (acc, p) =>
      acc +
      p.result.infos.filter(
        (i) => i.metric !== "aspirational_vr5" && i.metric !== "aspirational_gptzero"
      ).length,
    0
  );
  const aspirationalCount = pairs.reduce(
    (acc, p) =>
      acc +
      p.result.infos.filter(
        (i) => i.metric === "aspirational_vr5" || i.metric === "aspirational_gptzero"
      ).length,
    0
  );

  const summaryLines = [
    `# Regression Diff — ${date} vs baselines`,
    "",
    "## Summary",
    "",
    `PASS: ${passing} / ${total} fixtures`,
    `FAIL: ${failing} / ${total} fixtures`,
    `INFO: ${infoOnlyCount} first-run establishments, ${aspirationalCount} aspirational gaps`,
  ];

  const sections = pairs.map((p) => formatFixtureSection(p.run, p.baseline, p.result));

  return [...summaryLines, "", ...sections.flatMap((s) => [s, ""])].join("\n");
}

// ---------------------------------------------------------------------------
// CLI main
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const FIXTURES_DIR = path.join(REPO_ROOT, "eval/regression-fixtures/cl-assembly");
const REPORTS_DIR = path.join(REPO_ROOT, "eval/reports");

async function findLatestReport(): Promise<string> {
  let entries: string[];
  try {
    entries = await readdir(REPORTS_DIR);
  } catch {
    throw new Error(`Reports directory not found: ${REPORTS_DIR}`);
  }

  const jsonlFiles = entries
    .filter((e) => /^cl-regression-\d{4}-\d{2}-\d{2}\.jsonl$/.test(e))
    .sort()
    .reverse();

  if (jsonlFiles.length === 0) {
    throw new Error(
      `No cl-regression-*.jsonl files found in ${REPORTS_DIR}.\n` +
        "Run 'npm run eval:cl' first to generate a report."
    );
  }

  return path.join(REPORTS_DIR, jsonlFiles[0]);
}

async function loadRunBlocks(reportPath: string): Promise<RunBlock[]> {
  let content: string;
  try {
    content = await readFile(reportPath, "utf8");
  } catch {
    throw new Error(`Cannot read report file: ${reportPath}`);
  }

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error(`Report file is empty: ${reportPath}`);
  }

  const blocks: RunBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(lines[i]);
    } catch {
      throw new Error(
        `Malformed JSON on line ${i + 1} of ${reportPath}: ${lines[i].slice(0, 80)}`
      );
    }

    if (typeof parsed !== "object" || parsed === null || !("fixture" in parsed)) {
      throw new Error(
        `Line ${i + 1} is not a valid RunBlock (missing 'fixture' field): ${lines[i].slice(0, 80)}`
      );
    }

    blocks.push(parsed as RunBlock);
  }

  return blocks;
}

async function loadBaseline(fixtureName: string): Promise<BaselineFile> {
  const baselinePath = path.join(FIXTURES_DIR, fixtureName, "expected-baseline.json");
  let content: string;
  try {
    content = await readFile(baselinePath, "utf8");
  } catch {
    throw new Error(
      `Baseline not found for fixture "${fixtureName}": ${baselinePath}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Malformed JSON in baseline: ${baselinePath}`);
  }

  return parsed as BaselineFile;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reportArg = args.find((a) => a.startsWith("--report="))?.split("=")[1];

  let reportPath: string;
  try {
    reportPath = reportArg
      ? path.resolve(REPO_ROOT, reportArg)
      : await findLatestReport();
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }

  console.log(`Loading report: ${reportPath}`);

  let runBlocks: RunBlock[];
  try {
    runBlocks = await loadRunBlocks(reportPath);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }

  if (runBlocks.length === 0) {
    console.error("Error: No run blocks found in report.");
    process.exit(2);
  }

  // Compare each fixture
  const pairs: Array<{ run: RunBlock; baseline: BaselineFile; result: FixtureCompareResult }> = [];

  for (const run of runBlocks) {
    let baseline: BaselineFile;
    try {
      baseline = await loadBaseline(run.fixture);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(2);
    }

    const result = compareFixture(run, baseline);
    pairs.push({ run, baseline, result });
  }

  // Generate report
  const reportFileName = path.basename(reportPath, ".jsonl");
  const date = reportFileName.replace("cl-regression-", "");
  const diffReport = generateDiffReport(pairs, date);

  await mkdir(REPORTS_DIR, { recursive: true });
  const diffPath = path.join(REPORTS_DIR, `${reportFileName}-diff.md`);
  await writeFile(diffPath, diffReport, "utf8");

  // Print to stdout
  console.log("\n" + diffReport);
  console.log(`\nDiff report written: ${diffPath}`);

  // Exit code
  const anyFail = pairs.some((p) => p.result.status === "fail");
  if (anyFail) {
    console.log("\nResult: FAIL — one or more fixtures drifted beyond tolerance.");
    process.exit(1);
  } else {
    console.log("\nResult: PASS — all fixtures within tolerance.");
    process.exit(0);
  }
}

// Only run main when executed directly (not when imported by tests)
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main().catch((err) => {
    console.error("Fatal:", err instanceof Error ? err.message : String(err));
    process.exit(2);
  });
}
