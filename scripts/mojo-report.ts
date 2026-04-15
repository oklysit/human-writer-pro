/**
 * MoJo Score Reporter — Task 22
 *
 * Aggregates mojo-log.jsonl into a summary report per Ryan Beswick's
 * Part 1-3 framework (Active Hours, Delivered Value, Decision Value).
 *
 * Usage:
 *   npm run mojo:report
 *   npm run mojo:report -- --tests=138
 *
 * Output:
 *   stdout — markdown report
 *   eval/reports/mojo-score-{ISO-date}.md
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const LOG_PATH = path.join(REPO_ROOT, "mojo-log.jsonl");
const REPORTS_DIR = path.join(REPO_ROOT, "eval", "reports");

// ── Types ────────────────────────────────────────────────────────────────────

interface ActiveHoursEntry {
  kind: "active";
  timestamp: string;
  date: string;
  hours: number;
  activity: string;
  session?: string;
  notes?: string;
}

interface DecisionValueEntry {
  kind: "decision";
  timestamp: string;
  type: "decision";
  date: string;
  description: string;
  investment_avoided_hours: number;
  clarity_score: number;
  notes?: string;
}

type LogEntry = ActiveHoursEntry | DecisionValueEntry;

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseEntry(raw: unknown): LogEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  // Schema header lines have no `hours` and no `type: "decision"` — skip
  if (obj["type"] === "decision") {
    const date = typeof obj["date"] === "string" ? obj["date"] : "";
    const description =
      typeof obj["description"] === "string" ? obj["description"] : "";
    const investment_avoided_hours =
      typeof obj["investment_avoided_hours"] === "number"
        ? obj["investment_avoided_hours"]
        : 0;
    const clarity_score =
      typeof obj["clarity_score"] === "number" ? obj["clarity_score"] : 0;
    const timestamp =
      typeof obj["timestamp"] === "string" ? obj["timestamp"] : "";
    const notes = typeof obj["notes"] === "string" ? obj["notes"] : undefined;

    if (!date || !description) return null;
    return {
      kind: "decision",
      type: "decision",
      timestamp,
      date,
      description,
      investment_avoided_hours,
      clarity_score,
      notes,
    };
  }

  // Active Hours entries have a numeric `hours` field
  if (typeof obj["hours"] === "number") {
    const date = typeof obj["date"] === "string" ? obj["date"] : "";
    const activity =
      typeof obj["activity"] === "string" ? obj["activity"] : "";
    const timestamp =
      typeof obj["timestamp"] === "string" ? obj["timestamp"] : "";
    const session =
      typeof obj["session"] === "string" ? obj["session"] : undefined;
    const notes = typeof obj["notes"] === "string" ? obj["notes"] : undefined;

    if (!date) return null;
    return {
      kind: "active",
      timestamp,
      date,
      hours: obj["hours"] as number,
      activity,
      session,
      notes,
    };
  }

  // Schema header or unrecognised shape — skip silently
  return null;
}

// ── Git helpers ───────────────────────────────────────────────────────────────

function countCommits(): number {
  try {
    const result = execSync("git log --oneline", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    return result.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs(): { testsGreen: number | null } {
  const testsArg = process.argv.find((a) => a.startsWith("--tests="));
  if (testsArg) {
    const n = parseInt(testsArg.split("=")[1] ?? "", 10);
    return { testsGreen: isNaN(n) ? null : n };
  }
  return { testsGreen: null };
}

// ---------------------------------------------------------------------------
// Senior IC hours equivalent — project-specific calibration
// ---------------------------------------------------------------------------
//
// Beswick's MoJo Score framework: "equivalent senior engineering hours to
// deliver this work traditionally / your Active Hours." Numerator is
// subjective but grounded in industry intuition about what a senior IC
// (without AI assistance) would need for each deliverable.
//
// Breakdown for human-writer-pro (Lawyer.com Model Jockey submission):
// - Next.js 14 SPA with 10+ components, Socratic interview engine, voice
//   input, Socratic edit chat, streaming assembly, min-input gate, AI-ism
//   regex gate, inline highlights, diagnostic pills, settings dialog: 80h
// - Editorial design system (triple-stack fonts, semantic tokens, primitives
//   rewritten for Tailwind v3): 25h
// - Regression pipeline (5 real fixtures, k=3 runner, Sonnet judge, baseline
//   comparator, GPTZero client, Node-side AI-ism extraction): 40h
// - 127 tests with TDD discipline: 25h (writing + verifying + fixing)
// - Written exhibits (README, MOJO-SETUP, decisions log, pair-review,
//   future-experiments, VR validation pilot): 15h
// - Build + infra (CSP, error boundaries, NODE_ENV harness fix, tsx setup,
//   gitignore tuning): 10h
// - MoJo tracking infra (schema, report script, AW reconciliation): 5h
// - Prompt engineering (GOLDEN_DATASET port + 5 mode prompts + Socratic
//   interview prompt + assembly prompt + edit prompts): 20h
// - VR validation pilot (54-variant pre-registered experiment): 30h
// - Day 5 (2026-04-15) additions for MVP submission:
//   * v4 framework content port + v4.1 calibration (cover-letter + assembler
//     prompts; k=3 verification + GPTZero pass-rate analysis): 8h
//   * Regenerate-with-voice-feedback workflow (3-turn assemble + cl/edit
//     mode routing + store outputSource tracking + UI panel with mic): 15h
//   * Upload-to-edit flow (preview empty-state + fileImport reuse + setter
//     + VR-uses-upload-source fix): 5h
//   * Edit Chat polish (cancel X + Escape + voice on both textareas): 6h
//   * UI bundle (Enter-to-send + voice autoscroll + drop cap removal +
//     inline API key validation): 6h
//   * README submission rewrite + MOJO-SETUP cross-reference: 8h
//
// Total: ~298h senior IC equivalent.
//
// Ranges (adjust if project scope changes):
const SENIOR_IC_HOURS = {
  low: 240,   // conservative — excludes pilot work + over-counts AI speedup
  mid: 295,   // midpoint — fair professional estimate
  high: 350,  // generous — counts team-equivalent hours (designer + FE + ML + QA + writer)
};

// ── Report builder ────────────────────────────────────────────────────────────

function buildReport(params: {
  activeEntries: ActiveHoursEntry[];
  decisionEntries: DecisionValueEntry[];
  commits: number;
  testsGreen: number | null;
  reportDate: string;
}): string {
  const { activeEntries, decisionEntries, commits, testsGreen, reportDate } =
    params;

  const totalActiveHours = activeEntries.reduce((s, e) => s + e.hours, 0);
  const decisionValueSum = decisionEntries.reduce(
    (s, e) => s + e.investment_avoided_hours * e.clarity_score,
    0
  );
  const tests = testsGreen ?? 0;

  // Delivered Value = commits × 0.25 + tests × 0.05 + decision_value_sum × 1.0
  const commitsContrib = commits * 0.25;
  const testsContrib = tests * 0.05;
  const dvContrib = decisionValueSum * 1.0;
  const deliveredValue = commitsContrib + testsContrib + dvContrib;

  // Placeholder MoJo Score (proxy formula)
  const mojoScorePlaceholder =
    totalActiveHours > 0
      ? (deliveredValue / totalActiveHours).toFixed(2)
      : "N/A";

  // Senior IC hours MoJo Scores (Beswick's actual framework)
  const icScores =
    totalActiveHours > 0
      ? {
          low: (SENIOR_IC_HOURS.low / totalActiveHours).toFixed(1),
          mid: (SENIOR_IC_HOURS.mid / totalActiveHours).toFixed(1),
          high: (SENIOR_IC_HOURS.high / totalActiveHours).toFixed(1),
        }
      : { low: "N/A", mid: "N/A", high: "N/A" };

  const testsDisplay = testsGreen !== null ? String(testsGreen) : "unknown (pass --tests=N to set)";

  // Active Hours table
  const ahRows = activeEntries
    .map(
      (e) =>
        `| ${e.date} | ${e.hours.toFixed(1)} | ${e.activity.replace(/\|/g, "\\|")} |`
    )
    .join("\n");

  // Decision Value list
  const dvItems = decisionEntries
    .map(
      (e) =>
        `- **${e.date} — ${truncate(e.description, 60)}** — Clarity ${e.clarity_score}, Investment Avoided ${e.investment_avoided_hours}h${e.notes ? ` — ${truncate(e.notes, 100)}` : ""}`
    )
    .join("\n");

  const dvSumDisplay = decisionValueSum.toFixed(2);
  const commitsContribDisplay = `${commits} × 0.25 = ${commitsContrib.toFixed(2)}`;
  const testsContribDisplay =
    testsGreen !== null
      ? `${tests} × 0.05 = ${testsContrib.toFixed(2)}`
      : `unknown × 0.05 = 0.00 (pass --tests=N)`;
  const dvContribDisplay = `${dvSumDisplay} × 1.0 = ${dvContrib.toFixed(2)}`;
  const totalDisplay =
    (commitsContrib + testsContrib + dvContrib).toFixed(2);

  return `# MoJo Score Report — ${reportDate}

## Summary

| Metric | Value |
|---|---|
| Active Hours | ${totalActiveHours.toFixed(1)} (engaged time only; agent runtime excluded) |
| Commits on main | ${commits} (total) |
| Tests green | ${testsDisplay} |
| Decision Value total | ${dvSumDisplay} |

### MoJo Score — dual formula

| Framework | Delivered Value | MoJo Score |
|---|---|---|
| Placeholder (commit/test proxy) | ${deliveredValue.toFixed(2)} | ${mojoScorePlaceholder} |
| Senior IC hours (low/conservative) | ${SENIOR_IC_HOURS.low}h | **${icScores.low}x** |
| Senior IC hours (mid/fair) | ${SENIOR_IC_HOURS.mid}h | **${icScores.mid}x** |
| Senior IC hours (high/generous) | ${SENIOR_IC_HOURS.high}h | **${icScores.high}x** |

**The senior-IC-hours framework is what Beswick's Part 1 describes**
and what the Lawyer.com Model Jockey role evaluates against. Citing
10–50x is common in that framework. The placeholder formula is a
development-time proxy the script computed before calibrating against
real senior-IC-hours estimates; it will diverge from the IC-hours
framework as the project scope grows.

## Active Hours Log
| Date | Hours | Activity |
|---|---|---|
${ahRows || "| — | — | No active entries found |"}

## Decision Value Entries
${dvItems || "No decision entries found."}

## Delivered Value Breakdown
> **Note — weights are placeholders.** The formula below is a first-pass heuristic; the correct weighting of commits vs tests vs decisions is a subjective calibration that the user should revisit after ~4 weeks of real use. For external citations (e.g., Lawyer.com MoJo submission), use the **Senior IC hours framework** in the Summary table above — that is what Beswick's Part 1 describes and what evaluators expect.

- Commits × 0.25 = ${commitsContribDisplay}
- Tests × 0.05 = ${testsContribDisplay}
- Decision Value × 1.0 = ${dvContribDisplay}
- **TOTAL Delivered Value: ${totalDisplay}**

## Notes
- Active Hours ≠ wall-clock session time. Agent runtime while AFK is excluded (Beswick Part 3).
- Decision Value = investment_avoided_hours × clarity_score per entry.
- Delivered Value weights are placeholders; revisit when the user calibrates what "one unit of delivered value" means in this project.
- To record tests automatically, run: \`npm run mojo:report -- --tests=$(npm test 2>&1 | grep -oP '\\d+ passed' | grep -oP '\\d+')\`

## Calibration notes

The senior-IC-hours numerator is a **one-time calibration** based on
what each deliverable would take a senior IC to build from scratch
without AI assistance. Revise \`SENIOR_IC_HOURS\` in \`scripts/mojo-report.ts\`
if the scope changes materially — adding or removing a deliverable
(e.g., a new mode, a new eval pipeline component) should shift the
constants accordingly.

Keep both formulas reported side-by-side to surface divergence. If
the placeholder score drifts far from the IC-hours score over time,
that's a signal to revisit the placeholder weights or retire the
placeholder entirely.
`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { testsGreen } = parseArgs();

  // Read + parse log
  const raw = await readFile(LOG_PATH, "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  const entries: LogEntry[] = [];
  for (const line of lines) {
    try {
      const obj: unknown = JSON.parse(line);
      const entry = parseEntry(obj);
      if (entry) entries.push(entry);
    } catch {
      // malformed line — skip
    }
  }

  const activeEntries = entries.filter(
    (e): e is ActiveHoursEntry => e.kind === "active"
  );
  const decisionEntries = entries.filter(
    (e): e is DecisionValueEntry => e.kind === "decision"
  );

  const commits = countCommits();
  const reportDate = new Date().toISOString().slice(0, 10);

  const report = buildReport({
    activeEntries,
    decisionEntries,
    commits,
    testsGreen,
    reportDate,
  });

  // Write to stdout
  process.stdout.write(report);

  // Write to file
  await mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `mojo-score-${reportDate}.md`);
  await writeFile(reportPath, report, "utf8");
  process.stderr.write(`\nReport written to: ${reportPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`mojo-report error: ${String(err)}\n`);
  process.exit(1);
});
