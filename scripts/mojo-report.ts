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

  const mojoScore =
    totalActiveHours > 0
      ? (deliveredValue / totalActiveHours).toFixed(2)
      : "N/A (no active hours recorded)";

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
- **Active Hours:** ${totalActiveHours.toFixed(1)} (engaged time only; agent runtime excluded per Beswick Part 3)
- **Commits on main:** ${commits}
- **Tests green:** ${testsDisplay}
- **Decision Value total:** ${dvSumDisplay}
- **MoJo Score:** ${mojoScore} (Delivered Value / Active Hours)

## Active Hours Log
| Date | Hours | Activity |
|---|---|---|
${ahRows || "| — | — | No active entries found |"}

## Decision Value Entries
${dvItems || "No decision entries found."}

## Delivered Value Breakdown
> **Note — weights are placeholders.** The formula below is a first-pass heuristic; the correct weighting of commits vs tests vs decisions is a subjective calibration that the user should revisit after ~4 weeks of real use.

- Commits × 0.25 = ${commitsContribDisplay}
- Tests × 0.05 = ${testsContribDisplay}
- Decision Value × 1.0 = ${dvContribDisplay}
- **TOTAL Delivered Value: ${totalDisplay}**

## Notes
- Active Hours ≠ wall-clock session time. Agent runtime while AFK is excluded (Beswick Part 3).
- Decision Value = investment_avoided_hours × clarity_score per entry.
- Delivered Value weights are placeholders; revisit when the user calibrates what "one unit of delivered value" means in this project.
- To record tests automatically, run: \`npm run mojo:report -- --tests=$(npm test 2>&1 | grep -oP '\\d+ passed' | grep -oP '\\d+')\`
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
