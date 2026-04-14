# MoJo Setup

Operational detail behind the Human Writer Pro build. Written for Ryan
Beswick's MoJo Score Part 2–3 screen.

## Active Hours accounting

Active Hours counts engaged user time only — not autonomous agent runtime.
Agent and subagent execution while the user is AFK does not count toward
the denominator. Beswick's Part 3 defines Active Hours this way: the time
the human spent prompting, reviewing, and correcting. Autonomous pipeline
time is excluded.

Log at [`mojo-log.jsonl`](./mojo-log.jsonl). Two entry types:

- **Active Hours**: `{timestamp, date, hours, activity, session, notes}`
- **Decision Value**: `{timestamp, type: "decision", date, description, investment_avoided_hours, clarity_score, notes}`

Run `npm run mojo:report` to aggregate into a markdown summary.

## ActivityWatch integration

ActivityWatch runs on the host (Windows to WSL2 to Docker container).
The container reaches the AW API via `host.docker.internal:5600`. Active
Hours entries are currently transcribed manually from the AW dashboard.
A future script (`scripts/mojo-activitywatch-import.ts`) could automate
the import; not built yet because manual entry has been accurate enough
for a 3-day build.

## Model routing strategy

| Role | Model |
|------|-------|
| Orchestrator — main session, architectural decisions, reviewing subagent output | Claude Opus 4.6 (1M context) |
| Implementer subagents — Day 1 and Day 2 build tasks | Claude Sonnet 4.6 |
| Reviewer subagents — spec compliance and code quality | Claude Opus 4.6 |
| LLM-as-judge in the regression pipeline | Claude Sonnet 4.6 |

Sonnet handles implementation; Opus handles judgment. They are kept separate
in the pipeline so the generator and the judge are never the same instance.

## Git discipline

- Every change committed with a meaningful SHA before moving on. A change
  without a commit is invisible to future sessions.
- Commit messages explain WHY, not just what. The context a future session
  needs is in the message, not assumed.
- Pre-commit hooks are never skipped without explicit user approval.
- New commits rather than amending. If a hook rejects a commit, amending
  would rewrite the previous commit — the safer path is always a new commit
  after fixing the issue.
- Never push to the remote without user approval. The first push to a public
  repo requires their PAT.

See [`/home/pn/projects/CLAUDE.md`](../CLAUDE.md) for the workspace-wide
git rules this project inherits.

## Subagent-driven development loop

Each implementation task runs through five steps:

1. **Orchestrator** (Opus 4.6) extracts the task spec from the refactor
   doc and original plan.
2. **Implementer subagent** (Sonnet 4.6, fresh context) receives the full
   task text, prohibited-scope rules, and a TDD directive.
3. **Spec compliance reviewer** (Opus 4.6, fresh context) reads the actual
   code and verifies it matches the spec. Does not trust the implementer's
   report.
4. **Code quality reviewer** (Opus 4.6, fresh context) applies the standard
   code review protocol.
5. **Orchestrator** marks the task complete only when both reviews approve.

This is the `superpowers:subagent-driven-development` skill. The pair-review
session that produced the refactor doc is an instance of the same pattern
applied one level up — a senior-engineer sparring session pressure-testing
the Day 0 plan before any code was written.

See [`process/pair-review-2026-04-13.md`](./process/pair-review-2026-04-13.md)
for the full transcript.

## Decision Value log

High-value decisions this project killed or reframed, with Clarity
Scores per Beswick's Part 3 framework. Decision Value = Investment Avoided
× Clarity Score.

| Decision | Clarity |
|----------|---------|
| VR = 35% reframed from target to prompt nudge — the line in the band-35 prompt is a stylistic nudge to the model, not a truth-claim the product validates | 0.85 |
| VR as causal lever for GPTZero — the 54-variant pilot showed VR is a downstream marker of prompt regime, not the driver. Same-VR variants across band-25 and band-35 show opposite GPTZero results | 0.9 |
| Synthetic regression fixtures — replaced with the (interview + prompt + expected baseline) triple using 5 real shipped CLs, including 2 documented failures | 0.8 |
| 5 writing modes with equal polish — only cover-letter and email are load-bearing with real ground truth; the others ship on the same engine without dedicated regression budget | 0.7 |
| Adversarial framing in edit chat — replaced with Socratic. The adversarial frame breaks flow state; Socratic pulls more verbatim material without triggering defensive reactions | 0.75 |

Full reasoning in [`process/decisions.md`](./process/decisions.md).
Future experiments in [`process/future-experiments.md`](./process/future-experiments.md).

## Three-pane orchestration

At submission time, this repo will contain
`process/three-pane-orchestration.png` — a screenshot of the simultaneous
Claude Code panes that produced the Day 1 build (implementation), the Day 2
UI layer (continuation), and the VR validation pilot (eval). Demonstrates
parallel subagent orchestration across three independent workstreams running
concurrently.

Screenshot slot reserved — captured by the user right before submission.
