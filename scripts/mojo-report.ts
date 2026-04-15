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
// Beswick's actual MoJo Score formula (per the Medium article)
// ---------------------------------------------------------------------------
//
//   MoJo Score = (Delivered Value + Decision Value) / Active Hours
//
//     Delivered Value = Business Impact × Quality Factor
//       • Business Impact = TVH (Traditional Value Hours) — real-world
//         human labor the tool replaces. NOT dev-time-to-build.
//       • Quality Factor ∈ [0.5, 1.5] via peer + LLM code review.
//     Decision Value = Σ(investment_avoided × clarity_score) per entry
//     Active Hours = hands-on-keyboard + eyes-reviewing-output (agent
//       runtime while AFK excluded).
//
// Source: https://medium.com/@rybeswick/measuring-the-magic-the-mojo-score-740f6dbcaa0d
// Worked example in article: lawclaw.ai, 30 Active Hours, 1,560 TVH, MoJo=52x.
//
// Calculation justifications live in /projects/screenshots/hwp-mojo-score-calc.md
// (TVH benchmarks + sources + three scenarios + Quality Factor evidence).

// TVH scenarios for HWP — projected over a 6-month horizon.
// A: author's own use (conservative, verifiable)
// B: 5-user projection on top of A (mid — the "honest ask")
// C: 50-user projection (high — needs a deployment plan to defend)
const BUSINESS_IMPACT_TVH = {
  A: 164,   // own-use only: 100 CLs × 63min + 50 tailored × 20min + 10 assignments × 4.25h
  B: 376,   // A + (5 users × 42.3h each over 6 months)
  C: 2279,  // A + (50 users × 42.3h each over 6 months)
};

// Quality Factor for HWP — self-assessed pending external review.
// 1.2 justified by: 127 tests passing, TDD discipline, pre-registered n=54
// pilot with Fisher's p<0.0001 + external reviewer revision, committed
// decision log with 6 Clarity Scores, commit hygiene (every change
// explains WHY), handoff docs, BYO-key security architecture. See §5 of
// hwp-mojo-score-calc.md for full evidence.
const QUALITY_FACTOR = 1.2;

// ---------------------------------------------------------------------------
// Senior IC hours — SECONDARY SANITY CHECK (not Beswick's TVH formula)
// ---------------------------------------------------------------------------
//
// "Senior IC hours to build this without AI / your Active Hours" —
// useful as a build-replacement ratio but NOT the same as Beswick's
// Business Impact in TVH (which measures downstream user-labor-saved).
// Kept side-by-side so a reader can see both framings.
//
// Breakdown for human-writer-pro:
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

  // Delivered Value (placeholder proxy) = commits × 0.25 + tests × 0.05 + DV × 1.0
  const commitsContrib = commits * 0.25;
  const testsContrib = tests * 0.05;
  const dvContrib = decisionValueSum * 1.0;
  const deliveredValuePlaceholder = commitsContrib + testsContrib + dvContrib;

  // Placeholder MoJo Score (proxy formula — for internal tracking only)
  const mojoScorePlaceholder =
    totalActiveHours > 0
      ? (deliveredValuePlaceholder / totalActiveHours).toFixed(2)
      : "N/A";

  // Beswick-aligned MoJo Score — the formula per the Medium article.
  //   Delivered Value = Business Impact × Quality Factor
  //   MoJo = (Delivered Value + Decision Value sum) / Active Hours
  const beswickDelivered = {
    A: BUSINESS_IMPACT_TVH.A * QUALITY_FACTOR,
    B: BUSINESS_IMPACT_TVH.B * QUALITY_FACTOR,
    C: BUSINESS_IMPACT_TVH.C * QUALITY_FACTOR,
  };
  const beswickScores =
    totalActiveHours > 0
      ? {
          A: ((beswickDelivered.A + decisionValueSum) / totalActiveHours).toFixed(1),
          B: ((beswickDelivered.B + decisionValueSum) / totalActiveHours).toFixed(1),
          C: ((beswickDelivered.C + decisionValueSum) / totalActiveHours).toFixed(1),
        }
      : { A: "N/A", B: "N/A", C: "N/A" };

  // Senior IC hours MoJo Scores (reference-only, not Beswick's TVH formula)
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
| Decision Value total | ${dvSumDisplay} (Σ investment_avoided × clarity_score) |
| Quality Factor | ${QUALITY_FACTOR} (self-assessed; see hwp-mojo-score-calc.md §5) |

### MoJo Score — Beswick framework (primary)

Formula: **MoJo = (Delivered Value + Decision Value) / Active Hours**
where Delivered Value = Business Impact (TVH) × Quality Factor.

| Scenario | Business Impact (TVH) | Delivered Value | + Decision Value | / Active Hours | **MoJo Score** |
|---|---|---|---|---|---|
| A — own-use (conservative) | ${BUSINESS_IMPACT_TVH.A} | ${beswickDelivered.A.toFixed(1)} | +${dvSumDisplay} | / ${totalActiveHours.toFixed(1)} | **${beswickScores.A}x** |
| B — 5-user projection (mid) | ${BUSINESS_IMPACT_TVH.B} | ${beswickDelivered.B.toFixed(1)} | +${dvSumDisplay} | / ${totalActiveHours.toFixed(1)} | **${beswickScores.B}x** |
| C — 50-user projection (high) | ${BUSINESS_IMPACT_TVH.C} | ${beswickDelivered.C.toFixed(1)} | +${dvSumDisplay} | / ${totalActiveHours.toFixed(1)} | **${beswickScores.C}x** |

For external citation, **Scenario B (${beswickScores.B}x)** is the honest submission number — own-use + 5-user projection. Scenario C requires a deployment plan to defend. Lawclaw.ai worked example in the article: 52x.

### Secondary — Senior IC hours (build-replacement sanity check)

Not Beswick's formula (his TVH measures downstream user-labor-saved, not dev-time-to-build). Kept side-by-side as a reference ratio.

| Range | Senior IC Hours | MoJo Score |
|---|---|---|
| Conservative | ${SENIOR_IC_HOURS.low}h | ${icScores.low}x |
| Mid/fair | ${SENIOR_IC_HOURS.mid}h | ${icScores.mid}x |
| High/generous | ${SENIOR_IC_HOURS.high}h | ${icScores.high}x |

### Tertiary — Placeholder (internal tracking)

${deliveredValuePlaceholder.toFixed(2)} / ${totalActiveHours.toFixed(1)} = **${mojoScorePlaceholder}x** (commit/test proxy, not suitable for external citation; see Delivered Value Breakdown below).

## Active Hours Log
| Date | Hours | Activity |
|---|---|---|
${ahRows || "| — | — | No active entries found |"}

## Decision Value Entries
${dvItems || "No decision entries found."}

## Placeholder breakdown (tertiary, not for citation)
> **Development-time proxy only.** Use the Beswick framework in the Summary for external citation.

- Commits × 0.25 = ${commitsContribDisplay}
- Tests × 0.05 = ${testsContribDisplay}
- Decision Value × 1.0 = ${dvContribDisplay}
- **TOTAL (placeholder): ${totalDisplay}**

## Notes
- Active Hours ≠ wall-clock session time. Agent runtime while AFK is excluded (Beswick Part 3).
- Decision Value = Σ (investment_avoided_hours × clarity_score) across all decision entries. Per-entry clarity scores are visible in the Decision Value Entries section above.
- Business Impact (TVH) + Quality Factor constants live in scripts/mojo-report.ts (\`BUSINESS_IMPACT_TVH\` and \`QUALITY_FACTOR\`) — revise when HWP's use-profile or projected user base materially changes.
- For external citation (Lawyer.com Mojo take-home), **Scenario B** is the honest submission number. Scenario A is the conservative fallback. Scenario C needs a deployment plan.
- To record tests automatically, run: \`npm run mojo:report -- --tests=$(npm test 2>&1 | grep -oP '\\d+ passed' | grep -oP '\\d+')\`

## Calibration notes

**BUSINESS_IMPACT_TVH** encodes three scenarios based on per-task savings benchmarks (see /projects/screenshots/hwp-mojo-score-calc.md §4). Revise when academic/email modes ship, actual user base grows past the projection, or per-task benchmarks update with real usage data.

**QUALITY_FACTOR** starts at 1.2 based on evidence in hwp-mojo-score-calc.md §5. Revise after external code review or production-user-facing bug discovery.

**SENIOR_IC_HOURS** is a build-replacement ratio kept for "how much dev time AI saved me" framing. NOT Beswick's TVH — TVH measures downstream user-labor-saved, not dev-time-to-build.

All three framings reported side-by-side to surface divergence.
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
