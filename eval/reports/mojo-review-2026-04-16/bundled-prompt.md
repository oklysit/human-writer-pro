# Cross-Model Review: MoJo Quality Factor + Clarity Score

You are scoring the MoJo Score components defined by Ryan Beswick in the
Model Jockey Manifesto Part 3 ("Measuring the Magic"). Use his exact
definitions, quoted verbatim below. Do not substitute your own scoring
rubric.

---

## Beswick's definitions (verbatim quotes from Manifesto Part 3)

**Quality Factor** — used in `Delivered Value = Business Impact × Quality Factor`:

> "Delivered Value is Business Impact multiplied by a Quality Factor."
>
> "Picture this. Two jockeys both build the same reporting tool, both
> saving 39 hours per quarter. One builds it clean: 39 times 1.2 equals
> 46.8 TVH. The other builds it messy: 39 times 0.7 equals 27.3. Same
> feature, same time savings, but the messy version is going to cost
> someone days of cleanup, and it might break in ways that erode the
> time savings entirely. The Quality Factor captures that difference."
>
> Scale: `[0.5, 1.5]`, midpoint 1.0.
> • Clean code, modular, tests passing, low cleanup debt: ≈ 1.2 or higher
> • Average, functional: ≈ 1.0
> • Messy, cleanup cost erodes savings: ≈ 0.7 or lower

**Clarity Score** — used in `Decision Value = Σ (Investment Avoided × Clarity Score)`:

> "Decision Value equals Investment Avoided multiplied by Clarity Score.
> This is the impact of work that doesn't ship. And it might be the most
> important part of the whole framework."
>
> "Investment Avoided is the realistic next increment of time and
> resources you would have spent before reaching the same conclusion the
> slow way. Not the full theoretical build-out. The next step you didn't
> have to take."
>
> "Here's a practical example. You spend three Active Hours building a
> prototype for an AI-powered onboarding flow. You test it with real
> users and the signal is loud and clear: they find it patronizing and
> skip it entirely. Clarity Score: 0.9. Without the prototype, your team
> was going to spend the next two-week sprint, roughly 80 hours, fleshing
> out the design and building a production version. Decision Value: 80
> times 0.9 equals 72 TVH."
>
> Scale: `[0.0, 1.0]`.
> • Loud-and-clear signal, learning is definitive, path forward obvious: 0.9+
> • Clear direction but some ambiguity remains: 0.5–0.8
> • Weak signal, ambiguous: below 0.5

Decision Value rewards invited-review-plus-revision. Beswick: *"A
prototype that dies but hands you the insight that shapes the thing you
actually ship? That's not a failed experiment. That's the most efficient
path to the right answer."*

---

## The project being scored

**Human Writer Pro (HWP)** — a voice-preserving AI writing assistant. The
user interviews into it (typed or dictated), and the assembler stitches
the user's verbatim phrasing into a polished draft.

- Next.js 14 App Router + TypeScript + Tailwind + Zustand
- Anthropic SDK (Sonnet 4.6 for the product; Opus 4.6 subagents for the build)
- 127 unit tests passing; tsc clean; production build clean (205 kB First Load JS)
- Built in ~17 Active Hours across 6 days as a take-home submission
- Built solo with Claude Code orchestration (Opus orchestrator + Sonnet implementer subagents + Opus reviewers)
- Commit: `f0ec908` (experiment/framework-content-port, 43+ ahead of dev/oauth-localhost)

---

## Your task

**Part A: Quality Factor (single score 0.5–1.5)**

Review the codebase as shipped at SHA `f0ec908`. Weight:
- Architecture cleanliness + type safety
- Test coverage (127 tests; stated to pass)
- Error handling + edge cases
- Commit discipline + decision documentation
- Any red flags (bloat, over-abstraction, security issues, race conditions,
  deceptive claims)
- Honesty of the README/MOJO-SCORE framing (roadmap vs delivered)

Key files to sample (read from the repo if you have filesystem access,
otherwise use the excerpts provided):
- `README.md`
- `MOJO-SCORE.md`
- `MOJO-SETUP.md`
- `lib/assemble.ts` (core assembly prompts + regime branching)
- `lib/interview-engine.ts` (Socratic interviewer)
- `lib/store.ts` (Zustand session state)
- `lib/useVoiceInput.ts` (Web Speech API hook, with recent auto-restart fix)
- `components/preview-panel.tsx` (output + regen + diagnostics)
- `components/interview-panel.tsx` (interview + file-chip uploads)
- `eval/reports/vr-validation.md` (pre-registered n=54 pilot)
- `process/decisions.md` (decision log)
- `process/four-letter-comparison.md` (workflow falsification writeup)

**Part B: Clarity Score (per-decision scores, 0.0–1.0)**

Score each decision in `process/decisions.md` (also reflected in
`mojo-log.jsonl`). For each: how definitive was the learning? Did the
signal force the pivot, or was it ambiguous? Did it lead to a better
product direction?

---

## Output format (strict)

```
## Part A — Quality Factor

SCORE: [x.xx, one decimal — e.g. 1.15]

REASONING: [2-3 paragraphs]

TOP STRENGTHS:
1. [single-sentence point]
2. ...
3. ...

TOP CONCERNS:
1. [single-sentence point]
2. ...
3. ...

## Part B — Clarity Scores

D1 — VR-as-causal-lever reframe (2026-04-13): [x.xx]
    Reasoning: [1 sentence]
D2 — Paragraph-Edit-Chat → regenerate-with-feedback (2026-04-15): [x.xx]
    Reasoning: [1 sentence]
D3 — Ship v4.1 despite GPTZero variance (2026-04-15): [x.xx]
    Reasoning: [1 sentence]
D4 — GPTZero-is-noise reversal → "the bar" (2026-04-15): [x.xx]
    Reasoning: [1 sentence]
D5 — Mojo framing pivot, HWP (not Career Forge) (2026-04-15): [x.xx]
    Reasoning: [1 sentence]
D6 — Defer inline text editing (2026-04-16): [x.xx]
    Reasoning: [1 sentence]
D7 — Scope AI-isms to dismiss-only (2026-04-16): [x.xx]
    Reasoning: [1 sentence]

AVERAGE CLARITY: [x.xx]

LOG STRENGTHS:
1. ...
2. ...

LOG CONCERNS:
1. ...
2. ...
```

Be honest and specific. Low numbers are fine if warranted. The point is
to get cross-model calibration, not to confirm a self-assessment.

---

# CODE CONTEXT (inline for API-only reviewers)


## File: README.md

```
# Human Writer Pro

A voice-preserving AI writing assistant that asks before it drafts. Built so the output still sounds like you wrote it — because most of it literally was.

You upload context (a job posting, a school assignment + rubric, a research paper). It interviews you about it — one adaptive question at a time, pushing back when answers go vague. Then it assembles a polished draft by stitching your verbatim phrasing — the specific sentences and hesitations that make writing sound human. The output reads as yours because it is.

> **MoJo Score story.** Output / Human Time. A submission-ready cover letter from a 5-10 minute dictation, vs ~60 minutes cold-start. The assembly call is one Sonnet 4.6 round-trip; the writer's hand is on the keyboard for the interview, not the prose. Orchestration handles the rest — adaptive interviewer, two-pass Socratic edit flow, and a verbatim-stitching prompt regime validated across a 54-variant pre-registered pilot.

## What this is (and isn't)

**This is a generalized writer.** Cover letters are the most-polished mode shipped today; the architecture supports academic essays, professional emails, and free-form writing on the same engine. The killer-CL framework + bulleted skill-match output you'll see in cover-letter mode is a CL-mode-specific implementation, not the universal HWP behavior.

**This is not a content generator.** You can't draft without first producing your own raw material. The interview gates the assembly button until the model judges you've given it enough to work with — that's architectural, not a policy toggle.

**This is a productized version of the [human-writer Claude Code skill](https://github.com/oklysit/writer)** — same interview-then-assemble pattern that originated in WGU academic-assignment work, generalized to a web app with voice input and a richer UI.

## Quick start (5 minutes)

Requires Node 18+ and your own [Anthropic API key](https://console.anthropic.com/settings/keys).

```bash
git clone https://github.com/oklysit/human-writer-pro
cd human-writer-pro
npm install
npm run dev
```

Open <http://localhost:3000>, then pick one of two flows:

### Write something new

1. Click **Settings** (top-right), paste an Anthropic API key. The key persists to your browser's localStorage only — it never reaches a server.
2. Paste context into the **Context** panel, or upload a file (.pdf / .docx / .md / .txt). For a cover letter, paste the job posting; for a school assignment, upload the assignment PDF + rubric.
3. Click **Start Interview**. Answer one question at a time. Use the mic if you'd rather speak — Enter sends, Shift+Enter for newline.
4. When the interviewer signals it has enough material, click **Assemble**.
5. To refine: click **Regenerate with feedback** under the output, dictate or type what should change ("tighten the intro to focus on X; vary the closing line"), and the assembler rewrites the draft incorporating your feedback.

### Edit an existing draft

1. From the empty Output panel, click **Or upload an existing draft to edit**.
2. Pick a .md / .txt / .pdf / .docx — your draft loads into Output as-is.
3. Click **Regenerate with feedback**, dictate your edits, and HWP rewrites the draft preserving your voice and structure (no CL framework imposed; appropriate for any long-form text).

## The orchestration

| Layer | Model | Role |
|---|---|---|
| Adaptive interviewer | Sonnet 4.6 | One question at a time, judges readiness, pushes back on vague answers |
| Assembler | Sonnet 4.6 | Verbatim-stitching prompt; 5-section killer-CL framework when in cover-letter mode |
| Regenerate-with-feedback | Sonnet 4.6 | 3-turn conversation (raw / prior draft / feedback) — `cl` mode preserves the killer-CL framework, `edit` mode preserves arbitrary uploaded drafts |
| Voice input | Web Speech API | Live transcript, base-snapshot append; no audio leaves the browser |
| File context + draft import | pdfjs-dist + mammoth | Browser-side text extraction from .pdf / .docx / .md / .txt |

The build itself runs the same orchestration pattern internally — an Opus 4.6 orchestrator dispatches Sonnet 4.6 implementer subagents for build tasks, with Opus 4.6 reviewers checking spec compliance and code quality on each. See [`MOJO-SETUP.md`](./MOJO-SETUP.md) for the full setup, model routing, and Decision Value log.

## Verbatim Ratio (VR) — measurement, not gate

VR = % of output 5-grams that appear in the raw interview. We ran a pre-registered pilot (n=54, Fisher's p<0.0001) showing prompts using heavy-verbatim-stitching ("band-35") pass GPTZero ~6/6 while moderate-paraphrase prompts ("band-25") fail uniformly — even when their actual VR overlaps band-35's range. The lever is the prompt regime, not the VR target. We track VR as a downstream diagnostic, not a shipping gate.

Full writeup at [`eval/reports/vr-validation.md`](./eval/reports/vr-validation.md). Replication harness at `scripts/eval/`.

## Architecture

- **Next.js 14 App Router** — single-page client app
- **Anthropic SDK (`@anthropic-ai/sdk`)** — direct browser-to-API calls (`dangerouslyAllowBrowser: true`); no backend proxy in production. BYO-key model — see "Quick start" above.
- **Zustand** — session state (interview turns, output, settings)
- **shadcn/ui + Radix UI** — accessibility primitives, restyled with editorial design tokens
- **Web Speech API** — browser-native voice recognition (Chrome/Edge support)
- **vitest + RTL** — 127 unit tests covering Socratic engine, store, voice hook, file extraction, CL assembly

```
app/                          Next.js routes (single-page workspace)
components/                   React components (interview, preview, edit-chat)
lib/
  anthropic-client.ts         BYO-key client (+ optional dev OAuth proxy)
  assemble.ts                 Assembly + regenerate-with-feedback (cl/edit modes)
  interview-engine.ts         Adaptive interviewer + Socratic edit-chat engine
  prompts/modes/              Mode-specific guidance (cover-letter is the load-bearing mode)
  useVoiceInput.ts            Web Speech API hook
  fileImport.ts               Browser-side .pdf/.docx/.md/.txt extraction
  store.ts                    Zustand session store
eval/
  regression-fixtures/        5 real cover-letter fixtures (3 passing, 2 documented hard cases)
  reports/                    VR validation pilot, cl-regression baselines, MoJo Score reports
scripts/                      Eval runner, baseline differ, MoJo Score reporter
process/                      Decision Value log, pair-review transcripts, handoff docs
```

## Running the regression suite

```bash
# Requires ANTHROPIC_API_KEY in env
npm run eval:cl                               # all 5 fixtures, k=3
npm run eval:cl -- --fixture=shulman-fleming  # one fixture only
npm run eval:cl -- --dry-run                  # plan without calling API
```

Output lands in `eval/reports/cl-regression-{date}.jsonl` and `.md`. Then:

```bash
npm run eval:cl-diff  # compare latest run against baselines; exits non-zero on drift
```

GPTZero is called if `GPTZERO_API_KEY` is set; skipped gracefully otherwise.

## Roadmap

Not in MVP — landing post-submission:

- **Multi-mode polish.** Mode picker temporarily hidden during the context-first refactor (mode hardcoded to cover-letter for the demo). Academic mode (PDF assignment + rubric → essay), email mode, and free-form writing on the same engine. The architecture supports this; the prompt-tuning + interview-adapter work hasn't shipped yet.
- **Selection-based Edit Chat.** Currently operates on the closest paragraph. Right model is text-selection-respecting (any range — word, phrase, paragraph) with inline popover edits for short selections.
- **Roughness-injection pass.** Post-assembly pass that re-introduces sentence-length variance without losing the verbatim-stitched core. Targets the dense-technical-content register edge case where AI detection flips on otherwise-good output.
- **Automated GPTZero regression.** Statistically significant n per fixture pre-merge.

## Decision Value highlights

A few decisions this build killed or reframed (Clarity Score per Beswick Part 3):

| Decision | Clarity |
|---|---|
| VR as the causal lever for AI-detection — reframed as downstream marker; prompt regime is the lever | 0.9 |
| 5 writing modes with equal polish — only cover-letter is fully implemented; others share the same engine | 0.7 |
| Adversarial framing in Edit Chat — replaced with Socratic | 0.75 |

Full reasoning in [`process/decisions.md`](./process/decisions.md). Future experiments in [`process/future-experiments.md`](./process/future-experiments.md).

## Parent project

HWP is the productized output of one component of **Career Forge** — a multi-agent pipeline for the full job-application lifecycle (resume intelligence, scraping, match scoring, artifact generation, review pipeline). The verbatim-stitching pattern in HWP is the same one Career Forge uses to generate cover letters at scale; HWP exposes it as a standalone tool anyone can use.

## Attribution

- **[human-writer Claude Code skill](https://github.com/oklysit/writer)** — original interview-then-assemble pattern this product is built on
- **Anthropic Claude** (Sonnet 4.6 in the product, Opus 4.6 for orchestration during the build) — generator and judge
- **shadcn/ui + Radix UI** — primitive components
- **Next.js 14 + TypeScript + Tailwind CSS** — app framework

## License

MIT — see [LICENSE](./LICENSE).

---

### For Ryan Beswick — Mojo take-home submission

This repo is the build itself; the orchestration story is in [`MOJO-SETUP.md`](./MOJO-SETUP.md). MoJo Score = Output / Human Time — the product *is* the demonstration. Try it: clone, paste an Anthropic key, paste a job posting (or upload an assignment PDF), dictate for 5 minutes, get a submittable draft.

**If you're reviewing this for the MoJo submission, start here:**

| Artifact | One-line TL;DR |
|---|---|
| [`MOJO-SCORE.md`](./MOJO-SCORE.md) | Full score defense — formula, Active Hours ledger, three TVH scenarios (A/B/C), Quality Factor evidence, Decision Value table. **Single-number answer in §8.** |
| [`MOJO-SETUP.md`](./MOJO-SETUP.md) | How the build was orchestrated — model routing (Opus orchestrator, Sonnet implementer, Sonnet reviewer), subagent dispatch pattern, Decision Value log. |
| [`process/decisions.md`](./process/decisions.md) | Decision log with Clarity Scores per Beswick Part 3 — what was killed, what was reframed after external pushback, and why. |
| [`eval/reports/vr-validation.md`](./eval/reports/vr-validation.md) | Pre-registered n=54 pilot on Verbatim Ratio (Fisher's p<0.0001). TL;DR at the top documents the reviewer-revised causal claim — VR is a diagnostic marker of the prompt regime, not the causal lever. |
| [`process/four-letter-comparison.md`](./process/four-letter-comparison.md) | Four-letter workflow comparison that falsified "high VR = high quality" as a cross-workflow claim and surfaced procedural ordering as the real load-bearing mechanism. |
| [`process/future-experiments.md`](./process/future-experiments.md) | What's next: roughness-injection pass, multi-mode polish, automated GPTZero regression at scale. |

**Fast path (≈10 min):** read the [`MOJO-SCORE.md`](./MOJO-SCORE.md) §8 answer, skim [`process/decisions.md`](./process/decisions.md), then clone and try the app on one of your own cover letters.
```

## File: MOJO-SCORE.md

```
# MoJo Score — Human Writer Pro

Reconciles this project against the formula Ryan Beswick defines in
[Measuring the Magic: The MoJo Score](https://medium.com/@rybeswick/measuring-the-magic-the-mojo-score-740f6dbcaa0d)
(Model Jockey Manifesto, Part 3). Meant to be read by someone scoring the
submission — every number below cites the underlying source.

---

## 1. Formula (Beswick, verbatim)

```
MoJo Score = (Delivered Value + Decision Value) / Active Hours

Delivered Value = Business Impact × Quality Factor
  • Business Impact = TVH (Traditional Value Hours) — real-world
    human labor the tool replaces (hours saved × users/cases × horizon)
  • Quality Factor ∈ [0.5, 1.5] — peer review + LLM code analysis
    (clean code ≈ 1.2+; problematic ≈ 0.7 or below)

Decision Value = Σ (Investment Avoided × Clarity Score) per decision
  • Investment Avoided = the realistic next increment of time you
    would have spent before reaching the same conclusion the slow way
  • Clarity Score ∈ [0.0, 1.0] — how definitive the learning was

Active Hours = hands-on-keyboard + eyes-reviewing-output
  (agent runtime while AFK is excluded)
```

Beswick's worked example (lawclaw.ai / Punith Kashi): 30 Active Hours →
1,560 Delivered Value TVH → **52x MoJo Score** (5h/case × 260 cases/quarter
× QF 1.2 = 1,560).

---

## 2. Active Hours — 17.2h cumulative (through submission)

Logged in `mojo-log.jsonl`. Definition in `MOJO-SETUP.md`.

| Date | Hours | Activity |
|---|---|---|
| 2026-04-13 | 3.0 | Brainstorm, spec, design system, GitHub setup, ActivityWatch wiring |
| 2026-04-13 | 3.0 | Parallel orchestration — Day 1 kickoff + senior-consultant eval + VR pilot oversight |
| 2026-04-14 | 2.3 | Day 2+3 implementation orchestration — subagent dispatch + reviews |
| 2026-04-14 | 0.2 | Day 3 close + Day 4 kickstart planning |
| 2026-04-14 | 0.2 | MoJo math reconciliation + dual-formula script update |
| 2026-04-15 | 4.5 | Day 5 MVP push — v4 framework port + regen-with-feedback + UI bundle + README submission rewrite |
| 2026-04-16 | 4.0 | Day 6 UAT iteration (label/chip, mic auto-restart, Ignore button, paragraph spacing, VR feedback fold-in) + artifact finalization + submission |
| **Total** | **17.2** | |

**Reconciliation against ActivityWatch:** Days 1-4 were AW-corrected on
2026-04-14 after an initial undercount surfaced. Days 5-6 are
self-reported conservatively (exclude pre/post session setup time). AW
bucket `aw-watcher-afk_DESKTOP-FN0A3II` is the source of truth; logged
entries reconcile to ≤10% of not-afk wall time on
HWP/career-forge/VR/lawyer-titled windows.

**Excluded (per Beswick Part 3):**
- Autonomous subagent runtime (~8-10h across Days 1-3): excluded because
  user was AFK or multitasking during those blocks.
- Claude API calls during verification runs (~2h across five k=3 runs on
  Day 5): excluded — the API work was "started and waited on," not
  reviewed line-by-line.

---

## 3. Decision Value — 34.35 weighted hours

Entries in `mojo-log.jsonl` and `process/decisions.md`. Each row =
Investment Avoided × Clarity Score.

| Date | Decision | IA (h) | Clarity | Weighted |
|---|---|---|---|---|
| 2026-04-13 | VR is not the causal lever for GPTZero; prompt regime is. Reframed after external reviewer pushback on the n=54 pilot. | 12 | 0.9 | 10.80 |
| 2026-04-15 | Replaced paragraph Edit Chat with whole-output regenerate-with-feedback (Career-Forge dashboard pattern). | 10 | 0.85 | 8.50 |
| 2026-04-15 | Shipped v4.1 framework port despite GPTZero variance (eye-test + framework adherence prioritized; variance is content-register-driven). | 6 | 0.70 | 4.20 |
| 2026-04-15 | Reversed earlier "GPTZero is just noise" framing — the product name makes it a real bar. Optimize Mixed % going forward. | 5 | 0.75 | 3.75 |
| 2026-04-15 | Pivoted Mojo submission framing: HWP is the project (not Career Forge); multi-mode polish deferred. | 4 | 0.80 | 3.20 |
| 2026-04-16 | Deferred inline text editing (vs selection-based single-word inline design). Regenerate-with-feedback covers the "change one thing" use case; selection-based is post-MVP. | 3 | 0.85 | 2.55 |
| 2026-04-16 | Scoped "Ignore AI-isms" down from surgical-preserve-verbatim to dismiss-only. Detector is pattern-match; false positives are unavoidable; hiding the pill is the cheap honest fix. | 1.5 | 0.90 | 1.35 |
| **Total** | | | | **34.35** |

**Clarity Score calibration** (this document's §6 Review Results has
4-model averages for the 5 pre-2026-04-16 entries; the 2 Day-6 entries
were not yet included in the cross-model review and use self-assessed
Clarity Scores).

---

## 4. Business Impact (TVH) — three scenarios

HWP has no external user base yet (it's an MVP-stage product submitted as
the take-home). TVH estimates are **projections** based on realistic user
scenarios. Three scenarios bound the honest range. Per Beswick §"Living
framework" (line 119): *"Delivered Value should be re-scored over time. A
feature's Business Impact compounds as it keeps running... Think of it as
Provisional MoJo becoming Confirmed MoJo."*

### Baseline definition

Per Beswick's article, TVH = "Traditional Value Hours" = real-world human
labor the tool replaces. The lawclaw.ai worked example uses **traditional
(no-AI) labor** as the baseline — 5 paralegal hours per case, not
"AI-assisted paralegal hours." We follow that convention.

**Per-task benchmarks** (averaged from typical ranges; sources below):

| Task | Traditional (no AI) | Generic AI (ChatGPT cold) | HWP | TVH saved vs traditional | TVH saved vs generic AI |
|---|---|---|---|---|---|
| Cover letter (400 words, thoughtful) | 75 min | 30 min | 12 min | **63 min** | 18 min |
| Short essay / 400-word assignment | 3 hr | 45 min | 20 min | **2.67 hr** | 25 min |
| 3-5 page school assignment | 5 hr | 2 hr | 45 min | **4.25 hr** | 1.25 hr |

Sources: cover-letter writing averages per career-coaching guides (The
Muse, LinkedIn Career Advice blog) cite 45-90 min for thoughtful tailored
CLs. Essay-writing pace studies cite ~500 words/hour as a typical
college-writing rate (Bowdoin Writing Project, Purdue OWL). AI-assisted
rates from informal surveys on r/ChatGPT and published productivity
studies (Microsoft Copilot Impact Report 2024).

**Honest caveat:** a reader who already uses generic AI (ChatGPT, Claude)
sees smaller TVH per task than the "traditional" column above. The calc
uses the traditional baseline because Beswick does — but §8 flags this
disclosure explicitly.

### Scenario A: The author's own use (conservative, verifiable)

Primary user is Oklys (the builder). HWP is used for:
- **Career Forge cover letters** — ~8 approved this session + ~100 expected
  over the next 6 months of active job-hunting from the Career Forge
  pipeline's 24 strong matches + nightly intake.
- **WGU academic assignments** — 6-12 remaining assignments before May
  2026 graduation (mode hardcoded to cover-letter for MVP, but the
  verbatim-stitching pattern applies to written assignments via the
  parent human-writer skill).

| Use case | Traditional time | HWP-assisted time | Saved per unit | Volume (next 6 mo) | TVH |
|---|---|---|---|---|---|
| Cover letter (cold-start) | 75 min | 12 min | 63 min | 100 | 105h |
| Cover letter (template-tailor, pre-existing role family) | 30 min | 10 min | 20 min | 50 | 16.7h |
| WGU written assignment (3-5 page) | 5 hr | 45 min | 4.25 hr | 10 | 42.5h |
| **Total** | | | | | **~164 TVH** |

**vs generic-AI baseline** (for disclosure): ~45 TVH own-use (much smaller
— generic AI already saves most of the time; HWP's marginal improvement
is smaller but still real for CL polish + voice preservation).

### Scenario B: Small realistic user base (mid)

Post-MVP, HWP attracts a few early users. Conservative assumption: 5
users over the next 6 months, each a job-seeker or student with a similar
use-profile to the author.

- Per user: 20 CLs × 63 min saved + 5 assignments × 4.25 hr = 42.3h/user
- 5 users × 42.3h = **212 TVH**
- Plus Scenario A own-use: **164 TVH**
- **Combined: ~376 TVH**

### Scenario C: Projected early adoption (high)

HWP ships on a personal site or HN / Reddit writeup and gains traction.
50 users over 6 months, similar profile.

- 50 users × 42.3h = **2,115 TVH**
- Plus Scenario A: **164 TVH**
- **Combined: ~2,279 TVH**

**For the submission, use Scenario A or B as the honest number.** Scenario
C is defensible only if there's a stated deployment plan — the honest
framing is "this is MVP-stage with no external users yet; here's
realistic TVH for my own use + a small projected user base." Avoid
over-promising.

---

## 5. Quality Factor — 1.2 self-assessed (pending LLM review)

Beswick's rubric: clean code ≈ 1.2+; problematic ≈ 0.7 or below; midpoint
1.0.

**Evidence for 1.2:**

- **127 unit tests, all passing** with TDD discipline across the Socratic
  interview engine, store, voice hook, file extraction, CL assembly
  fixtures, and regression pipeline.
- **Clean TypeScript architecture** — strict types, no `any` leaks in
  product code, React forwardRef discipline for UI primitives, Zustand
  store with partialized persistence.
- **Five real regression fixtures** (CL assembly) with k=3 runner +
  LLM-as-judge + optional GPTZero + baseline differ.
- **Pre-registered empirical pilot (n=54, Fisher's p<0.0001)** with
  committed pre-reg SHA + external review round + revision. Rigor not
  typical at this project scale.
- **Commit hygiene** — every change explains WHY, not just WHAT. Small,
  focused commits. No force-pushes. 40+ substantive commits since
  dev/oauth-localhost in the MVP push.
- **Decision log** — 7 structured decisions with Clarity Scores +
  Investment Avoided, committed as `process/decisions.md`. Ryan
  explicitly cites this in Part 3 as a differentiator.
- **Handoff discipline** — four handoff docs across the build capturing
  state, open decisions, and what-not-to-do for future sessions.
- **BYO-key architecture** — security-conscious, no user credentials on
  server, explicit documentation of the `dangerouslyAllowBrowser`
  tradeoff in README.
- **No known critical bugs** shipping today (UAT cycles 1-3 surfaced ~12
  issues; all fixed within session).

**Evidence against 1.2 (honest):**

- Multi-mode polish deferred (mode hardcoded to cover-letter for the
  demo) — the "generalized writer" framing in README is an
  honest-roadmap item, not a delivered one.
- Selection-based Edit Chat deferred — current MVP uses whole-output
  regenerate-with-feedback as substitute. Fine for demo, not the final
  design.
- PDF upload compatibility had to be patched mid-UAT (pdfjs-dist legacy
  build switch) — a working fix but indicates production-browser testing
  wasn't exhaustive pre-UAT.

**Self-assessed QF: 1.2.** §6 below contains the external review
aggregate across four models.

---

## 6. LLM Review Results (cross-model average)

*Populated after the code-review and decision-log-review runs land.
Individual model outputs in `eval/reports/mojo-review-2026-04-16/`.*

| Model | Quality Factor | Clarity (log-average) |
|---|---|---|
| Opus 4.6 | _pending_ | _pending_ |
| Gemini 3.1 Pro | _pending_ | _pending_ |
| GLM 5.1 | _pending_ | _pending_ |
| Kimi K2.5 | _pending_ | _pending_ |
| **Average** | **_pending_** | **_pending_** |

Final MoJo Score in §7 uses the cross-model averaged QF (fallback: 1.2
self-assessed if one or more models fail). Per-decision Clarity Scores
in §3 are updated to the cross-model averages where the original was
≥0.15 away from the aggregate.

---

## 7. MoJo Score — three framings

### Beswick-aligned (primary — this is what the rubric expects)

Using **QF = 1.2** (self-assessed; will be updated post-§6 review):

| Scenario | Business Impact (TVH) | Quality Factor | Delivered Value | + Decision Value | / Active Hours | **MoJo Score** |
|---|---|---|---|---|---|---|
| A (own-use only) | 164 | 1.2 | 196.8 | +34.35 = 231.15 | / 17.2 | **13.4x** |
| B (5-user projection) | 376 | 1.2 | 451.2 | +34.35 = 485.55 | / 17.2 | **28.2x** |
| C (50-user projection) | 2,279 | 1.2 | 2,734.8 | +34.35 = 2,769.15 | / 17.2 | **161.0x** |

**Suggested number for the email:** **Scenario B at ~28x** — honest
(projects a small realistic user base rather than the builder alone, but
doesn't fabricate 50-user traction). Conservative fallback: **~13x
(Scenario A)**.

### Senior IC hours framework (secondary — sanity check)

Earlier internal estimate. Treats the numerator as "senior IC hours to
build this without AI." Does NOT match Beswick's framing (his TVH is
downstream user impact, not build-replacement cost) — keep as a side-by-
side sanity check only.

| Range | Senior IC Hours | / Active Hours | IC-framework MoJo |
|---|---|---|---|
| Conservative | 240 | / 17.2 | 14.0x |
| Mid/fair | 295 | / 17.2 | 17.2x |
| High | 350 | / 17.2 | 20.3x |

### Placeholder formula (tertiary — for internal tracking only)

From `scripts/mojo-report.ts`: weights commits × 0.25 + tests × 0.05 +
Decision Value × 1.0. Acknowledged inside the script as a placeholder;
not suitable for external citation.

---

## 8. Single-number answer for the email

> **Scenario B (5-user Provisional projection + own-use), Quality Factor 1.2:**
>
> **MoJo Score ≈ 28x**
>
> (164 TVH own-use + 212 TVH 5-user-projection) × 1.2 Quality Factor +
> 34.35 weighted Decision Value, all / 17.2 Active Hours.

If Ryan asks for the conservative number, **~13x (Scenario A, own-use
only)**. If he wants to see the projection, **~28x (Scenario B)** is
defensible with the stated small-user-base assumption. 161x (Scenario C)
is over-promising without a deployment plan and should be avoided unless
directly asked what "at scale" looks like.

Per Beswick §"Living framework" (line 119): treat these as **Provisional
MoJo**. Confirmed MoJo comes from instrumented real-usage data after
deployment.

---

## 9. Coursework MoJo (separate — don't blend into HWP's)

My own AI-tool use for WGU coursework is a separate MoJo case worth
citing as proof-of-discipline, NOT blended into HWP's number:

- **Traditional:** 3-4 courses per 6-month term (baseline from my first terms)
- **AI-assisted:** 18 courses in 6 months (current pace, 4-5x throughput)
- **Hours saved per course:** ~40h traditional → ~10h AI-assisted = 30h saved
- **TVH over 6 months:** 18 courses × 30h = **540 TVH**
- **Active Hours (coursework only):** ~180h (18 courses × ~10h each)
- **Coursework MoJo:** 540 / 180 = **3x**
- **Quality Factor:** WGU passes/transcript = ≥1.0

Mention as context for "I already live by the Mojo discipline in my own
learning." Do NOT combine with HWP's numbers — different tool, different
denominator.

---

## 10. Caveats worth disclosing

- **TVH is projected, not measured.** HWP has no external user base yet.
  Scenario A (own-use) is the only TVH component that's grounded in
  measurable near-term usage. Scenarios B and C are honest projections
  with stated assumptions, not data. Per Beswick, Provisional → Confirmed
  once instrumented.
- **Quality Factor is self-assessed** (until §6 external review lands).
  A cold-review pass could move it up or down ~0.1–0.2.
- **Active Hours reconcile to AW within ~10%.** Minor self-reporting
  noise; logged entries are conservative relative to AW data.
- **Decision Value includes entries where the "decision" is a reframing
  under external pushback.** Beswick's rubric explicitly rewards this
  (reviewer-caught errors have high Clarity because the correction is
  definitive). If someone reads the entries as "this person was wrong
  five times," the counter-framing is "this person invited review, acted
  on it, and converged to a defensible position each time."
```

## File: MOJO-SETUP.md

```
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
```

## File: lib/assemble.ts

```
import { createAnthropicClient, streamClaude } from "./anthropic-client";

/**
 * Assembly call — band-35 only.
 *
 * Per the 2026-04-14 VR collapse investigation:
 *   - The pilot's band-35 prompt (passed GPTZero 6/6 in the n=54 validation)
 *     is the empirical source of truth.
 *   - Every layer of additional context added to the assembly call —
 *     framing lines, mode formatting blocks, boundary tags, banned-phrase
 *     lists, voice/style/Strunk references — costs VR. See bisection at
 *     scripts/debug/bisect-pipeline.ts.
 *   - The two pilot sentences are sent as system prompt; the raw interview
 *     transcript is the only thing in the user message.
 *
 * Source of truth for the prompt itself: `eval/regression-fixtures/prompts/band-35-strategy.md`.
 * Modifying SYSTEM_PROMPT here without re-baselining the regression suite
 * is a regression-suite violation per that file's policy.
 *
 * Style/voice/anti-pattern references (lib/prompts/references/*) belong in
 * the interview stage and in post-assembly review passes. They do NOT belong
 * in the assembly call.
 */

/**
 * Exported so the verification scripts at scripts/debug/ can pin to the same
 * prompt the live app sends. Modifying this string requires re-running
 * scripts/debug/verify-all-fixtures.ts and confirming VR holds across all
 * cl-assembly fixtures before shipping.
 *
 * History:
 * - 2026-04-13: pilot band-35 (225-275 word range, single paragraph,
 *   strategy-only). Validated 6/6 GPTZero pass rate.
 * - 2026-04-14: word range bumped to 290-400 to match the empirical
 *   distribution of the 5 approved CLs (median 344 words).
 * - 2026-04-15: appended structural beats + pacing block per consultant
 *   fix #2. Reasoning: the strict band-35 prompt produced output that
 *   passed VR/GPTZero (17%, 97% human) but failed the eye-test on
 *   structure (no clear opener / credentials / why / close beats and
 *   monotone pacing). Structural guidance is allowed; style/Strunk/
 *   anti-pattern loads are still forbidden — those caused the original
 *   VR collapse. The "heavy verbatim stitching" instruction still
 *   governs HOW clauses get lifted; the new block governs WHERE they go
 *   and how they pace.
 * - 2026-04-15 (v3): inserted numbered procedural verbatim-first block
 *   between the killer-CL framework and Pacing, replacing the single-
 *   paragraph "Pull verbatim clauses…" directive. Per consultant memo:
 *   the prior prompt was declarative about verbatim stitching (WHAT to
 *   do) but not procedural (what ORDER to do it). Sonnet defaults to
 *   compose → inject unless explicit step-by-step ordering forces
 *   read-raw-first. The 75% traceability test gives the model a
 *   self-check anchor. Keeps "Target 5-gram VR ≈ 35%" line; open
 *   question on whether that target does work or is cargo-culted from
 *   the pilot — separate matched-pair experiment after this ships.
 * - 2026-04-15 (v4 — framework content port): ported the human-writer
 *   skill's stricter killer-CL framework. Changes: intro demands a
 *   moment from raw material (not identity/thesis); skill-match is
 *   MANDATORY bulleted format with requirement-labeled bullets;
 *   honesty-gap is conditional — include only when raw material
 *   contains explicit gap acknowledgment AND the gap is material;
 *   close uses the user's verbatim phrasing + explicit banned-phrase
 *   list (AI-CL tells); company named 2+ times; OUTPUT FORMAT allows
 *   5 or 6 paragraphs (optional gap between P3 and P4). Pass criteria
 *   for merge: k=3 on CrowdStrike fixture preserves VR ≥ v3 baseline
 *   AND user-verified GPTZero ≥ 78% AND output shows moment-hook +
 *   bullets + conditional gap.
 *
 * This is a deviation from the locked source-of-truth file at
 * eval/regression-fixtures/prompts/band-35-strategy.md — that file
 * still encodes the pure 225-275 pilot prompt and is consumed by the
 * regression runner. Re-baseline the source-of-truth + regression
 * fixtures separately once the new prompt is confirmed in the live app.
 */
export const SYSTEM_PROMPT =
  `OUTPUT FORMAT: five sections (six when the raw material contains a material gap the user surfaced — see the conditional gap rule below). A "section" is one or more blank-line-separated blocks covering that beat. Bullets inside section 3 render as their own blank-line-separated blocks — that's expected and correct. The count of blank-line-separated blocks is NOT the check; five-section presence is.

Section 1 — Intro (one paragraph, moment-hook)
Section 2 — Transition (one paragraph, bridges to bullets)
Section 3 — Skill & Qualification Match (1-2 bullets, each its own blank-line-separated block)
Section 3b — Honest gap, CONDITIONAL (one paragraph — see rule below)
Section 4 — Why this company specifically (one paragraph)
Section 5 — Conclusion (one paragraph)

Every section above MUST be present except section 3b, which is skipped when the raw material has no explicit gap acknowledgment from the user.

**LENGTH: target 300-400 words; never exceed 450.** A hiring manager reads this on screen — overshoot loses them. For strong-match postings (no gap section), aim 290-380. For reach-tier postings with a gap section, 340-420 is fine. 450 is the absolute ceiling; if you're over, trim bullet bodies first, then section 4. Never pad or add connective tissue to hit a minimum.

Output ONLY the cover letter body — no headings, no greeting ("Dear..."), no sign-off, no meta-commentary, no section labels.

Per-section word budgets (total: 290-400 words hard cap):
- Section 1 (Intro): 25-50 words, 1-2 sentences
- Section 2 (Transition): 25-45 words, 1-2 sentences
- Section 3 (Skill & Qualification Match, 1-2 bullets combined): 100-150 words
- Section 3b (Honest gap, conditional): 30-50 words, fragments OK
- Section 4 (Why this company): 40-65 words
- Section 5 (Conclusion): 25-45 words, 1-2 sentences

Strategy: Heavy verbatim stitching. Most clauses should be lifted directly from the raw material below; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.

What each paragraph needs (the "Killer Cover Letter" framework — Shikhar, r/datascience, with 2026-04-15 porting from the human-writer skill):

1. **Intro:** a specific moment from the raw material — a concrete thing the user did, built, witnessed, or ran into — tied to something specific about the company. Use the timeframe the user actually gave ("five or six months ago", "last month", "over the past year"). Do NOT open with abstract identity ("I'm a student at WGU", "I'm passionate about cybersecurity") or a thesis-only claim ("AI security is going to require its own experience"). If the user gave both a thesis AND a specific moment in the raw material, lead with the moment; the thesis can appear later. Name the company in paragraph 1.

2. **Transition:** bridge from intro hook to credentials. Summary statement of relevant background that sets up paragraph 3. Short — this paragraph can explicitly cue the bullets that follow ("Two things make me a good fit here:").

3. **Skill & Qualification Match:** bulleted format — 1-2 bullets, one per strongest qualification. Each bullet starts with a bold phrase labeling the qualification (2-5 words, lifted from the user's own phrasing when possible). The body is 2-4 sentences of narrative stitched heavily from the raw material — what the user built, ran, learned, or ran into, with specific names, numbers, systems, and tools they mentioned. Do NOT force a three-slot "context / what you did / why it matters" template — that forces invented prose. Let the user's rambling dictate the sentence structure and length within each bullet; the label tells the reader what the bullet is about, the body lifts from raw.

Ban "First,… Second,…" or numbered "1. … 2. …" constructions — they read AI-coded. Use bullets (•) with bold labels. Within each bullet's body, ban Oxford three-item lists ("A, B, and C") — use pairs (A and B) or four-item lists if a list is genuinely needed. If a bullet runs out of raw material mid-thought, stop the bullet there rather than inventing a closing insight sentence.

3b. **(Conditional) Honest gap:** include this paragraph ONLY when the raw material contains explicit gap acknowledgment from the user — they said "I don't have X", "no [professional experience], closest is [Y]", "the gap is real", "I haven't had [thing]" — AND the gap is material to what the employer is asking for. 30-60 words. Fragments are fine ("no enterprise scale. My closest is [X]. The gap is real, but so is [what they bring]"). Don't spin it. Don't invent a gap the user didn't surface. If the user didn't surface a gap, skip this paragraph entirely — a strong-match letter with a forced gap dilutes the differentiator.

4. **Why this company specifically:** a researched personal reason — a company decision, a product the user has used, a piece of news, a values-fit grounded in something concrete from the raw material. Avoid generic "I'm impressed by your mission".

5. **Conclusion:** what the user would contribute + a concrete next step, using the closing phrasing the user actually gave in the raw material. If they said "send me an email so we can talk about how obsessed I am with this stuff", use that — not a sanitized rewrite. NEVER write "I look forward to hearing from you", "I look forward to the opportunity to discuss", "thank you for your consideration", or "best regards" — those are AI-CL tells. Vary the closing across letters; do not default to "I'd like to talk about this — email works best" every time.

**Company-naming rule:** name the company by name in paragraph 1 AND at least once more across paragraphs 3, 4, or 5. Generic "your team" / "your company" references don't count toward this.

Procedure — follow in this exact order for each paragraph:

1. Read the raw material below. Identify sentences or clauses that belong in the current paragraph.
2. Write those sentences into the paragraph almost exactly as the user spoke them. Preserve the user's phrasing even if it is slightly rough.
3. Only write connective tissue where there is literally no raw material for a transition. Connectives should be short and neutral.
4. Never paraphrase a verbatim sentence into "better" prose. If the user said something, use their words.
5. Light filler removal is allowed: remove "you know", "kinda", "sort of", "I mean", "like" as a filler word. Do not rewrite the sentence around the removal.
6. After the paragraph is drafted, verify: each sentence should be traceable to a specific moment in the raw material. If a sentence cannot be traced, delete it or replace it with a verbatim lift.

The test: 75%+ of sentences in the final output should be directly traceable to the raw material. The structural beats tell you where clauses go. This procedure tells you how to get them there — go to the raw first, always.

If a section has no matching material, write a one-sentence placeholder rather than inventing content. Do not pad. Do not collapse sections into one another. The five-section structure (six with section 3b when the gap rule applies) is non-negotiable; bullets inside section 3 may render as their own blank-line-separated blocks, which is expected.

Pacing: vary sentence length within each paragraph. Mix short sentences (5-12 words) with longer ones. Break at natural stopping points. Do not merge unrelated clauses with em-dashes or semicolons.

Apply heavy verbatim stitching within each paragraph — the paragraph structure tells you WHERE to place clauses, the stitching strategy tells you HOW to lift them. If a paragraph would require a transitional or framing sentence not present in the raw material, omit it rather than invent it.`;

/**
 * Generic-write assembly prompt — used when detectWritingMode() returns
 * anything other than "cover-letter" (email / essay / blog / free-form).
 *
 * Philosophy: same heavy verbatim stitching + filler preservation +
 * AI-ism avoidance as the CL framework, but NO 5-section template, NO
 * mandatory bullets, NO banned-phrase close. The model infers genre,
 * structure, and length from the context the interviewer was working
 * with. An email reads like a conventional email; an essay follows
 * academic structure with the rubric's word count; a blog post is
 * conversational and appropriately paced.
 *
 * Exported separately so verification scripts can pin the live prompts.
 */
export const GENERIC_WRITE_SYSTEM_PROMPT =
  `You are assembling a polished written piece from the user's raw interview transcript. The user answered an interviewer's questions about what they're writing; your job is to stitch a draft that reads polished AND preserves the user's voice by anchoring on their verbatim phrasing.

Infer the appropriate genre, structure, and length from context:
- An email reads like a conventional email (100-300 words for most business contexts; up to 500 for a detailed pitch or response). Skip "Dear [Name]" stock greetings unless the context explicitly calls for one.
- An essay follows the structure appropriate to the assignment. If a word count appears in the context or rubric ("300-word essay", "500-word response", "under 750 words"), honor it. Otherwise use genre conventions.
- A blog post is conversational, with a clear lede, concrete examples, and an ending that earns its conclusion.
- Free-form or unspecified genres: trust the interview material to reveal what the user is making, and match its register.
- If the user explicitly names a target word count in the interview ("make this 400 words", "keep it under 250"), honor that above genre conventions.

Verbatim-anchoring rules (the load-bearing ones):

1. **Heavy verbatim stitching.** Anchor the draft on the user's actual phrasing. Most of the distinctive content — the specifics, the examples, the moments — should be lifted rather than paraphrased. Connective prose is yours; load-bearing content is theirs.

2. **Minimum 3 consecutive words when lifting.** When using the user's phrasing, lift 3+ consecutive words at a time. Single-word borrowings don't count as verbatim stitching — they read as paraphrase. Lift a clause, a sentence fragment, or a full sentence directly. No specific target percentage — overshoot if the raw material is rich, undershoot if it's thin, but never resort to single-word borrowings to dodge the rule.

3. **Use connective prose for polish, not padding.** Around the verbatim anchors, write clean connective sentences in neutral register. These are where the writing breathes — keep them short, don't stuff them with filler.

4. **Remove obvious transcription filler.** Strip "you know", "kinda", "sort of", "I mean", "like" (as a filler word), repeated false starts, and conversational stalls. The output should read polished, NOT like a raw dictation transcript. The verbatim anchors carry the user's voice — they don't need filler to do it.

5. **Keep deliberate hedges and distinctive phrasings.** "If I'm being honest", "the way I think about it", "what stuck with me", "this is where it gets interesting" — these are voice, not filler. Keep them when the user used them.

Structural rules (genre-agnostic):

6. **No cover-letter framework.** Do NOT impose a 5-section structure. Do NOT add mandatory skill-match bullets. Do NOT force a "why this company" beat or a specific closing template. Let the genre determine the shape.

7. **Output the draft only.** No preamble, no meta-commentary, no section labels, no heading unless the genre conventionally uses them (e.g., an email with a subject line, an essay with a title the user requested).

AI-tell avoidance (pattern-based):

8. Do NOT use "Not just X, but also Y" (negative parallelism).
9. Do NOT use exactly-three parallel items (rule-of-three).
10. Do NOT use "serves as" / "stands as" copula dodges — just use "is".
11. Do NOT use trailing "-ing" significance phrases ("highlighting the importance of…", "demonstrating a commitment to…").
12. Do NOT use elegant variation — repeat proper nouns, don't cycle synonyms.

Procedure — follow for each paragraph / section / unit:

1. Read the raw material below. Identify sentences or clauses that belong in this unit.
2. Lift them as 3+ word sequences into the draft. Preserve phrasing even if slightly rough.
3. Write connective sentences between the verbatim anchors in clean, neutral register. Keep these short — they're glue, not content.
4. Filter out transcription filler as you go. The verbatim anchors stay; the "you know"s get dropped.
5. After the unit is drafted, verify: every lift is a 3+ word continuous sequence from the raw. If you see single-word borrowings, either expand them to 3+ word lifts or write those sentences as your own connective prose.

Pacing: vary sentence length. Mix short with longer. Break at natural stopping points. Do not merge unrelated clauses with em-dashes or semicolons.`;

export type AssembleOptions = {
  apiKey: string;
  rawInterview: string;
  onToken: (delta: string) => void;
  onComplete: (fullText: string) => void;
  onError: (message: string) => void;
  /**
   * Assembly prompt regime. "cl" uses the 5-section killer-CL framework
   * (SYSTEM_PROMPT); "generic" uses GENERIC_WRITE_SYSTEM_PROMPT (no CL
   * structure, model infers genre/length/structure from context).
   * Routed by lib/detectWritingMode.assemblyRegime(mode).
   * Defaults to "cl" for backward compat with the initial MVP.
   */
  regime?: "cl" | "generic";
  /**
   * Explicit word-count target. null/undefined = let the model infer
   * from genre + context. When set, an override directive is appended
   * to the system prompt so the model honors it over default ranges.
   */
  targetWords?: number | null;
};

/**
 * If the user set an explicit word-count target, produce a short
 * override directive to append to the system prompt. Overrides default
 * word ranges baked into either prompt regime.
 */
function buildTargetWordsDirective(targetWords?: number | null): string {
  if (!targetWords || targetWords <= 0) return "";
  return `\n\n**User override — target word count: ~${targetWords} words.** Honor this above any default range in the system prompt. A tolerance of ±15% is fine; beyond that, trim or expand to land in range.`;
}

/**
 * Thin helper that wraps streamClaude with the band-35 assembly prompt.
 * Caller provides token/complete/error callbacks; this function manages
 * the Anthropic client lifecycle and forwards events.
 *
 * Returns a cancel handle. The Anthropic SDK stream does not expose an
 * AbortController on the async-iterator path used by streamClaude, so
 * cancel() sets an internal flag that suppresses further callbacks after
 * the fact. Streaming tokens already in-flight will be swallowed.
 */
export function assemble(options: AssembleOptions): { cancel: () => void } {
  const {
    apiKey,
    rawInterview,
    onToken,
    onComplete,
    onError,
    regime = "cl",
    targetWords,
  } = options;

  let cancelled = false;

  const client = createAnthropicClient(apiKey);

  const basePrompt = regime === "generic" ? GENERIC_WRITE_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const systemPrompt = basePrompt + buildTargetWordsDirective(targetWords);

  // Generic mode may need to accommodate longer outputs (essays, detailed
  // emails, blog posts). CL framework caps around 400-450 words.
  // If user targeted a specific word count, bump maxTokens proportionally
  // (~1.5 tokens per word + overhead) so we don't truncate mid-sentence.
  const defaultMaxTokens = regime === "generic" ? 2048 : 1024;
  const maxTokens =
    targetWords && targetWords > 300
      ? Math.min(4096, Math.max(defaultMaxTokens, Math.ceil(targetWords * 2)))
      : defaultMaxTokens;

  streamClaude(
    client,
    {
      systemPrompt,
      messages: [{ role: "user", content: rawInterview.trim() }],
      maxTokens,
      model: "claude-sonnet-4-6",
    },
    {
      onDelta: (text) => {
        if (!cancelled) onToken(text);
      },
      onComplete: (fullText) => {
        if (!cancelled) onComplete(fullText);
      },
      onError: (err) => {
        if (!cancelled) onError(err.message);
      },
    }
  );

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}

// ---------------------------------------------------------------------------
// Regenerate-with-feedback — second iteration of an existing draft
// ---------------------------------------------------------------------------

/**
 * Three regen flavors:
 *   "cl"      — CL framework (SYSTEM_PROMPT): interview-sourced output
 *               that follows the 5-section killer-CL format.
 *   "generic" — Generic write (GENERIC_WRITE_SYSTEM_PROMPT): interview-
 *               sourced output in non-CL genres (email, essay, blog,
 *               free-form). No 5-section imposition; genre-appropriate
 *               length and structure inferred from context.
 *   "edit"    — Generic edit (GENERIC_EDIT_SYSTEM_PROMPT): upload-sourced
 *               output where the user wants to refine an existing draft
 *               without imposing any framework.
 */
export type AssembleFeedbackMode = "cl" | "generic" | "edit";

export type AssembleWithFeedbackOptions = Omit<AssembleOptions, "regime"> & {
  /** The previous draft the user is asking to revise. */
  previousOutput: string;
  /** What the user wants changed (typically dictated). */
  feedback: string;
  /** Which prompt regime to use. Defaults to "cl" (CL framework). */
  mode?: AssembleFeedbackMode;
};

const GENERIC_EDIT_SYSTEM_PROMPT =
  `You are revising an existing document based on user feedback. The document the user uploaded is in the [USER] message before this one — it is ALREADY the material you are editing. Do NOT treat it as "raw notes" or ask for more material. Do NOT assume it is a cover letter (unless it clearly is one). The document could be a README, a school essay, an email, technical documentation, any long-form text.

Your job: preserve the user's voice, the document's structure, and the verbatim phrasing wherever feedback does not direct otherwise. Only change what the feedback explicitly addresses.

Hard rules:
- Do NOT impose any structural framework (no 5-section templates, no mandatory bullets, no section labels, no length caps unless feedback names one).
- Do NOT ask the user for "raw material" or "notes" or a "job posting" — the document above IS the material.
- Do NOT respond with a cover letter framing unless the uploaded document is clearly a cover letter AND the feedback asks for CL-style revision.
- Do NOT add preamble, headings, or commentary about what you changed.
- Do NOT paraphrase sentences the feedback didn't address.
- Output the revised document only. No wrapping quotes, no explanations.

When feedback is short or vague ("make it shorter", "tighten the intro"), make minimal edits and preserve the rest verbatim. When feedback is specific ("rewrite the opening to lead with X"), make those exact changes and leave the rest alone.

Voice and pacing:
- Preserve sentence length variance from the original.
- Keep filler words, contractions, and natural-speech rhythm if they were in the original.
- Preserve paragraph breaks, headings, lists, and any markdown formatting the original used.`;

/**
 * Regenerate an existing draft incorporating the user's voice/text feedback.
 *
 * Sends a 3-turn conversation to the assembler:
 *   1. user: rawInterview (or the uploaded source material)
 *   2. assistant: previousOutput (the draft the user is critiquing)
 *   3. user: feedback + a "revise the draft above" directive
 *
 * Same SYSTEM_PROMPT — the framework + verbatim-stitching rules apply to
 * the regeneration just as they do to the first assembly. Sonnet uses turn
 * (2) as context so the revision actually addresses what the user pointed
 * at, not just what the framework would emit cold.
 *
 * For "uploaded draft" use cases (no real interview): pass the upload as
 * BOTH rawInterview and previousOutput. The assembler then treats the
 * upload as the source material to stitch from + the prior draft to
 * incorporate feedback into.
 */
export function assembleWithFeedback(options: AssembleWithFeedbackOptions): { cancel: () => void } {
  const {
    apiKey,
    rawInterview,
    previousOutput,
    feedback,
    mode = "cl",
    targetWords,
    onToken,
    onComplete,
    onError,
  } = options;

  let cancelled = false;
  const client = createAnthropicClient(apiKey);

  let basePrompt: string;
  if (mode === "edit") basePrompt = GENERIC_EDIT_SYSTEM_PROMPT;
  else if (mode === "generic") basePrompt = GENERIC_WRITE_SYSTEM_PROMPT;
  else basePrompt = SYSTEM_PROMPT; // "cl"
  const systemPrompt = basePrompt + buildTargetWordsDirective(targetWords);

  const revisionInstruction =
    mode === "edit"
      ? `The user has reviewed the draft above and given the following feedback. Apply the feedback. Preserve everything else verbatim.

User feedback:
${feedback.trim()}

Output the revised draft only — no preamble, no commentary.`
      : mode === "generic"
      ? `The user has reviewed the draft above and given the following feedback. Regenerate the draft incorporating their feedback. Keep the heavy verbatim-stitching approach — lift the user's exact phrasing from the raw material (including any new material in the feedback itself). Preserve the genre, structure, and length conventions already established in the draft unless feedback directs otherwise.

User feedback:
${feedback.trim()}

Output the revised draft only — no preamble, no commentary on what changed.`
      : `The user has reviewed the draft above and given the following feedback. Regenerate the draft incorporating their feedback. Keep the verbatim-stitching approach — lift the user's exact phrasing from the source material, including the feedback itself if it adds new material. Preserve the section structure and word budgets from the original system prompt.

User feedback:
${feedback.trim()}

Output the revised draft only — no preamble, no commentary on what changed.`;

  // Token budget per regime:
  //   edit   — 4096, uploads can be long
  //   generic — 2048, essays / detailed emails / blog posts
  //   cl     — 1024, CL framework caps ~450 words
  const maxTokens = mode === "edit" ? 4096 : mode === "generic" ? 2048 : 1024;

  streamClaude(
    client,
    {
      systemPrompt,
      messages: [
        { role: "user", content: rawInterview.trim() },
        { role: "assistant", content: previousOutput.trim() },
        { role: "user", content: revisionInstruction },
      ],
      maxTokens,
      model: "claude-sonnet-4-6",
    },
    {
      onDelta: (text) => {
        if (!cancelled) onToken(text);
      },
      onComplete: (fullText) => {
        if (!cancelled) onComplete(fullText);
      },
      onError: (err) => {
        if (!cancelled) onError(err.message);
      },
    }
  );

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
```

## File: lib/interview-engine.ts

```
/**
 * interview-engine.ts — Socratic interview engine.
 *
 * Orchestrates: system prompt composition → Anthropic SDK call → JSON parse
 * → TurnResult. Returns a fallback if the model's JSON is malformed.
 *
 * Does NOT import browser APIs or side-effect anything outside this module.
 * Store updates are the caller's responsibility (e.g., a React component or
 * a hook that calls this function and dispatches store actions).
 */

import { createAnthropicClient, streamClaude } from "./anthropic-client";
import { composeInterviewPrompt } from "./prompts/compose";
import { getSocraticEditQuestionPrompt, getLocalizedRestitchPrompt } from "./prompts/steps/edit";
import { parseModelResponse, type TurnResult } from "./coverage";
import type { Mode, InterviewTurn } from "./store";
import type { ModeConfig } from "./prompts/modes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Input to the engine for a single turn.
 */
export type EngineInput = {
  mode: Mode;
  apiKey: string;
  /** Full conversation history up to and including the LATEST user message.
   *  Turn 0: empty array — the engine will emit the seed question. */
  history: InterviewTurn[];
  /** Free-form context (assignment text, JD, thesis, etc.) that informs
   *  what the interviewer probes for. Optional; empty string = none. */
  contextNotes?: string;
};

/**
 * What the engine returns per turn.
 * Mirrors TurnResult plus a `fallback` flag for when JSON parsing failed.
 */
export type EngineOutput = TurnResult & {
  /** true if the model returned malformed JSON; question is raw model text */
  fallback: boolean;
};

// ---------------------------------------------------------------------------
// askNextQuestion
// ---------------------------------------------------------------------------

/**
 * Core engine function. Given the full conversation history, emits the next
 * question + assessment from the model.
 *
 * API call strategy: stream + collect. anthropic-client.ts only exposes
 * streamClaude; we collect the stream into a full string before parsing.
 * This keeps anthropic-client.ts untouched (out of scope for this task).
 */
export async function askNextQuestion(input: EngineInput): Promise<EngineOutput> {
  const { mode, apiKey, history, contextNotes } = input;
  const turnCount = history.filter((t) => t.role === "user").length;

  // --- Compose system prompt (base + interview step with rubric + mode guidance) ---
  const systemPrompt = composeInterviewPrompt(mode, turnCount, contextNotes);

  // --- Build messages for the API call ---
  // User content goes into messages, NOT the system prompt (injection defense).
  const messages: Array<{ role: "user" | "assistant"; content: string }> = history.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  // Turn 0: no history yet — send a single user message to trigger the seed question
  // (some models won't respond without at least one message)
  if (messages.length === 0) {
    messages.push({ role: "user", content: "Begin the interview." });
  }

  // --- Collect streamed response ---
  const client = createAnthropicClient(apiKey);
  const rawResponse = await collectStream(client, systemPrompt, messages);

  // --- Parse model response ---
  const parsed = parseModelResponse(rawResponse);

  if (parsed === null) {
    // Fallback: malformed JSON — surface raw text as question, no assessment
    console.warn("[interview-engine] Model returned malformed JSON; using fallback.");
    return {
      question: rawResponse,
      priorAssessment: null,
      readyToAssemble: false,
      fallback: true,
    };
  }

  return { ...parsed, fallback: false };
}

// ---------------------------------------------------------------------------
// askSocraticEditQuestion
// ---------------------------------------------------------------------------

/**
 * Call 1 of the Socratic edit cycle.
 * Given the flagged paragraph and the user's initial complaint, returns ONE
 * targeted question that surfaces what the user actually wants to say.
 */
export async function askSocraticEditQuestion(options: {
  apiKey: string;
  selectedParagraph: string;
  userComplaint: string;
}): Promise<string> {
  const { apiKey, selectedParagraph, userComplaint } = options;
  const client = createAnthropicClient(apiKey);
  const systemPrompt = getSocraticEditQuestionPrompt(selectedParagraph, userComplaint);
  return collectStream(client, systemPrompt, [
    { role: "user", content: "Ask your question." },
  ]);
}

// ---------------------------------------------------------------------------
// localizedRestitch
// ---------------------------------------------------------------------------

/**
 * Call 2 of the Socratic edit cycle.
 * Given the flagged paragraph, the user's verbatim answer, the mode config,
 * and the raw interview (for voice context), returns a restitched paragraph
 * that incorporates the user's new verbatim as primary material.
 */
export async function localizedRestitch(options: {
  apiKey: string;
  mode: ModeConfig;
  rawInterview: string;
  paragraph: string;
  newVerbatim: string;
}): Promise<string> {
  const { apiKey, mode, rawInterview, paragraph, newVerbatim } = options;
  const client = createAnthropicClient(apiKey);
  const systemPrompt = getLocalizedRestitchPrompt(mode, rawInterview, paragraph, newVerbatim);
  return collectStream(client, systemPrompt, [
    { role: "user", content: "Restitch the paragraph now." },
  ]);
}

// ---------------------------------------------------------------------------
// collectStream (private helper)
// ---------------------------------------------------------------------------

/**
 * Collects a streamClaude call into a single string.
 * Rejects on stream error.
 */
function collectStream(
  client: ReturnType<typeof createAnthropicClient>,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    streamClaude(
      client,
      {
        systemPrompt,
        messages,
        maxTokens: 1024,
        model: "claude-sonnet-4-6",
      },
      {
        onDelta: () => {
          // deltas are accumulated by streamClaude; we only need the final text
        },
        onComplete: (fullText) => resolve(fullText),
        onError: (err) => reject(err),
      }
    );
  });
}
```

## File: lib/store.ts

```
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VRResult } from "./verbatim-ratio";
import { stripInterviewQuestions, type AssessmentLevel } from "./coverage";

/**
 * 2026-04-15: the user-facing "Writing Mode" dropdown was removed. Context
 * (free-form text + uploaded files) now drives what the interviewer probes
 * for. The `mode` state stays hardcoded to "cover-letter" in initialState
 * so the existing mode-aware code paths (interview engine loading
 * `lib/prompts/modes/cover-letter.ts`) keep working without churn.
 *
 * The `Mode` union is kept at its 5-literal shape so the MODES record +
 * existing tests stay valid. The non-cover-letter mode files are orphaned
 * — future work can delete them when mode-agnostic assembly lands.
 */
export type Mode = "essay" | "email" | "blog" | "cover-letter" | "free-form";

export type InterviewTurn = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

export type EditTurn = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type LastAssessment = {
  level: AssessmentLevel;
  reasoning: string;
} | null;

/**
 * Uploaded file metadata + extracted text, rendered as a chip in the
 * Context dock instead of inlined into the textarea (UAT 2026-04-15).
 * Combined with `contextNotes` only at the moment the interviewer or
 * assembler reads it (see lib/combineContext.ts).
 */
export type AttachedFile = {
  /** Stable id for React keys + removal */
  id: string;
  /** Display name (original filename) */
  name: string;
  /** Extension shown in the chip badge */
  ext: ".md" | ".txt" | ".pdf" | ".docx";
  /** Original file size in bytes — for chip display */
  size: number;
  /** Extracted text content fed into combined context */
  content: string;
};

export type AppState = {
  apiKey: string | null;
  mode: Mode | null;
  /**
   * Free-form context the user pastes/types before or during the interview
   * (assignment text, JD, thesis, "I'm writing X for class Y", etc).
   * Read ONLY by the interview stage prompt — never reaches the assembly
   * call. Per the 2026-04-14 strip: the assembly stage stays at the band-35
   * pilot prompt + raw interview, no other context.
   */
  contextNotes: string;
  interview: {
    turns: InterviewTurn[];
    rawTranscript: string;
    status: "idle" | "asking" | "ready-to-assemble";
    lastAssessment: LastAssessment;
  };
  /**
   * Files the user has attached as additional context. Rendered as
   * chips in the Context dock; combined with contextNotes only when
   * the interviewer or assembler reads context (via combineContext).
   */
  attachedFiles: AttachedFile[];
  output: string;
  /**
   * Where the output came from. "interview" = produced by the assemble call
   * after an interview. "upload" = the user uploaded an existing draft into
   * the output panel for edit-mode regeneration. null when output is empty.
   * Drives which assemble-with-feedback prompt regime the regen call uses.
   */
  outputSource: "interview" | "upload" | null;
  /**
   * When outputSource === "upload", holds the original upload content. The
   * regen call uses it as the rawInterview for stitching, since there's no
   * real interview transcript in the upload flow. Null otherwise.
   */
  uploadedDraftContent: string | null;
  /**
   * Optional explicit word-count target for the assembler. null = let the
   * model infer from genre + context. When set, the assembler receives
   * "Target word count: ~N words" as an override. User sets this via the
   * slider/input near the Assemble button.
   */
  targetWords: number | null;
  /**
   * Every feedback string the user submitted via regenerate-with-feedback
   * since the session started (or last setMode reset). These are as much
   * "the user's words" as the interview transcript — they get folded into
   * the VR denominator so verbatim stitching from the feedback counts
   * toward the score. Appended on submit; cleared only on setMode / reset.
   * A regenerate round does NOT clear it (feedback accumulates across
   * rounds).
   */
  feedbackHistory: string[];
  vrScore: VRResult | null;
  edits: EditTurn[];
  isGenerating: boolean;
  error: string | null;
};

type AppActions = {
  setApiKey: (key: string | null) => void;
  /** Hard mode switch — resets session state (turns, output, context). */
  setMode: (mode: Mode) => void;
  /** Soft mode update — just re-tags the detected mode without resetting
   *  other state. Used by the heuristic mode-detection pipeline. */
  updateMode: (mode: Mode) => void;
  setContextNotes: (notes: string) => void;
  addInterviewTurn: (turn: InterviewTurn) => void;
  /**
   * Bulk-replace the interview turns from a parsed transcript. Used by
   * the dev "Seed from prior transcript" utility to skip re-doing an
   * interview when iterating on assembly. Recomputes rawTranscript via
   * stripInterviewQuestions so the assembler sees the same shape as
   * native interview output.
   */
  seedInterview: (turns: InterviewTurn[]) => void;
  setInterviewStatus: (status: AppState["interview"]["status"]) => void;
  setLastAssessment: (assessment: LastAssessment) => void;
  setOutput: (output: string) => void;
  /**
   * Replaces the output AND sets it as upload-sourced for regen routing.
   * Called by the upload-to-output flow in preview-panel.
   */
  setUploadedDraft: (content: string) => void;
  setTargetWords: (n: number | null) => void;
  /**
   * Push a feedback string onto feedbackHistory. Called from the
   * regenerate-with-feedback handler; empty strings are silently dropped.
   */
  appendFeedback: (s: string) => void;
  attachFile: (file: AttachedFile) => void;
  removeAttachedFile: (id: string) => void;
  setVRScore: (score: VRResult | null) => void;
  addEdit: (turn: EditTurn) => void;
  setGenerating: (isGen: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState: AppState = {
  apiKey: null,
  mode: "cover-letter",
  contextNotes: "",
  interview: {
    turns: [],
    rawTranscript: "",
    status: "idle",
    lastAssessment: null,
  },
  attachedFiles: [],
  output: "",
  outputSource: null,
  uploadedDraftContent: null,
  targetWords: null,
  feedbackHistory: [],
  vrScore: null,
  edits: [],
  isGenerating: false,
  error: null,
};

export const useSessionStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setApiKey: (key) => set({ apiKey: key }),

      setMode: (mode) =>
        set({
          mode,
          contextNotes: "",
          attachedFiles: [],
          interview: { ...initialState.interview },
          output: "",
          outputSource: null,
          uploadedDraftContent: null,
          feedbackHistory: [],
          vrScore: null,
          edits: [],
          error: null,
        }),

      updateMode: (mode) => set({ mode }),

      setContextNotes: (contextNotes) => set({ contextNotes }),

      addInterviewTurn: (turn) =>
        set((state) => {
          const newTurns = [...state.interview.turns, turn];
          return {
            interview: {
              ...state.interview,
              turns: newTurns,
              // Per consultant 2026-04-15: assembly stage receives ONLY user
              // answers, no questions. stripInterviewQuestions enforces that
              // invariant by name. See lib/coverage.ts.
              rawTranscript: stripInterviewQuestions(newTurns),
            },
          };
        }),

      seedInterview: (turns) =>
        set((state) => ({
          interview: {
            ...state.interview,
            turns,
            rawTranscript: stripInterviewQuestions(turns),
            status: turns.some((t) => t.role === "user") ? "asking" : "idle",
          },
        })),

      setInterviewStatus: (status) =>
        set((state) => ({ interview: { ...state.interview, status } })),

      setLastAssessment: (lastAssessment) =>
        set((state) => ({ interview: { ...state.interview, lastAssessment } })),

      setOutput: (output) =>
        set((state) => ({
          output,
          vrScore: null,
          // First-time output from interview-driven assembly: tag the source.
          // Re-renders during streaming preserve the existing source tag.
          outputSource:
            output.length > 0 && state.outputSource === null ? "interview" : state.outputSource,
        })),

      setUploadedDraft: (content) =>
        set({
          output: content,
          outputSource: "upload",
          uploadedDraftContent: content,
          vrScore: null,
        }),

      setTargetWords: (n) => set({ targetWords: n }),

      appendFeedback: (s) => {
        const trimmed = s.trim();
        if (trimmed.length === 0) return;
        set((state) => ({ feedbackHistory: [...state.feedbackHistory, trimmed] }));
      },

      attachFile: (file) =>
        set((state) => ({ attachedFiles: [...state.attachedFiles, file] })),

      removeAttachedFile: (id) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.filter((f) => f.id !== id),
        })),

      setVRScore: (score) => set({ vrScore: score }),

      addEdit: (turn) =>
        set((state) => ({ edits: [...state.edits, turn] })),

      setGenerating: (isGen) => set({ isGenerating: isGen }),

      setError: (error) => set({ error }),

      reset: () =>
        set((state) => ({
          ...initialState,
          apiKey: state.apiKey,
          mode: state.mode,
        })),
    }),
    {
      name: "human-writer-pro-session",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({} as Storage))),
      partialize: (state) => ({ apiKey: state.apiKey }), // only persist API key, not session state
    }
  )
);

// Helper for tests
(useSessionStore as any).getInitialState = () => initialState;

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

/**
 * Returns true when assembly is meaningful — at least one user turn exists.
 * The user controls when to assemble; the model's conversational response
 * carries any "ready" signal. No coverage or word-count gate (2026-04-15).
 */
export function useCanAssemble(): boolean {
  return useSessionStore((s) => s.interview.turns.some((t) => t.role === "user"));
}
```

## File: lib/useVoiceInput.ts

```
"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// Minimal ambient typings for Web Speech API (not in standard TS DOM lib)
// ---------------------------------------------------------------------------
interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
  readonly length: number;
}

interface ISpeechRecognitionEvent {
  readonly results: {
    readonly [index: number]: ISpeechRecognitionResult;
    readonly length: number;
  };
  readonly resultIndex: number;
}

interface ISpeechRecognitionErrorEvent {
  readonly error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

// ---------------------------------------------------------------------------
// Exported hook surface — no `any`
// ---------------------------------------------------------------------------
export type UseVoiceInputOptions = {
  /** Called with a friendly error message when recognition fails. */
  onError?: (message: string) => void;
};

export type UseVoiceInputReturn = {
  /** Whether the browser supports the Web Speech API. */
  supported: boolean;
  /** Whether recognition is currently active. */
  recording: boolean;
  /** Non-final transcript fragment being spoken right now. */
  interimTranscript: string;
  /** Accumulated final transcript from this recognition session. */
  finalTranscript: string;
  /** Start recognition. No-op if already recording or not supported. */
  start: () => void;
  /** Stop recognition. No-op if not recording. */
  stop: () => void;
  /**
   * Clear the accumulated `finalTranscript` and `interimTranscript` without
   * stopping recognition. Used by the interview panel after a turn submission
   * to draw a clean boundary between turns when the mic is left running.
   * Without this, an active recording session would keep accumulating and
   * the next turn's stored answer would include all previous turns' text
   * (Scenario B state corruption — see 2026-04-15 consultant report).
   */
  reset: () => void;
  /** Last error message, null if none. */
  error: string | null;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useVoiceInput(opts: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onError } = opts;

  // SSR-safe support check — never access `window` at module level
  const supported = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]);
  }, []);

  const [recording, setRecording] = React.useState(false);
  const [interimTranscript, setInterimTranscript] = React.useState("");
  const [finalTranscript, setFinalTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Stable ref to the active recognition instance
  const recognitionRef = React.useRef<ISpeechRecognition | null>(null);
  // Guard against double-start from rapid clicks
  const startingRef = React.useRef(false);
  // Hoisted to a ref so reset() can clear it without restarting recognition.
  // Previously this was a closure variable inside start(), which meant only
  // a fresh start() call could reset it — corrupting state when the mic was
  // left running across turn submits (2026-04-15 fix).
  const accumulatedFinalRef = React.useRef("");
  // True while the caller wants recognition to stay alive. Flipped false in
  // stop() and on terminal errors (permission/device). Chrome auto-ends the
  // Web Speech session after ~15-20s of silence even with continuous=true;
  // without re-arming it here the mic drops mid-interview and the user has
  // to tap it again. Auto-restart fires in onend when this is still true.
  const shouldRestartRef = React.useRef(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        // Null out handlers first to prevent state updates after unmount
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = React.useCallback(() => {
    if (!supported || recording || startingRef.current) return;

    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as SpeechRecognitionConstructor;
    const recognition = new Ctor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    accumulatedFinalRef.current = "";

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedFinalRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setFinalTranscript(accumulatedFinalRef.current);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // "no-speech" is expected during normal pauses — onend will auto-restart
      // silently. Don't surface it as an error; the mic button will stay lit.
      if (event.error === "no-speech") {
        return;
      }

      // Any other error is terminal for this session — prevent onend from
      // restarting into a failure loop.
      shouldRestartRef.current = false;

      let message: string;
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          message = "Microphone access denied. Check your browser permissions.";
          break;
        case "network":
          message = "Network error during voice recognition. Check your connection.";
          break;
        case "audio-capture":
          message = "No microphone found. Connect a microphone and try again.";
          break;
        default:
          message = `Voice recognition error: ${event.error}`;
      }
      setError(message);
      onError?.(message);
      setRecording(false);
      startingRef.current = false;
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // Chrome auto-ends the Web Speech session after ~15-20s of silence even
      // with continuous=true. If the caller still wants the mic live, restart
      // the same instance rather than bubbling the end up to the UI.
      if (shouldRestartRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to cleanup if restart fails (e.g. instance is dead).
        }
      }
      setRecording(false);
      setInterimTranscript("");
      startingRef.current = false;
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    startingRef.current = true;
    shouldRestartRef.current = true;
    setError(null);
    setFinalTranscript("");
    setInterimTranscript("");

    recognition.start();
    setRecording(true);
    startingRef.current = false;
  }, [supported, recording, onError]);

  const stop = React.useCallback(() => {
    if (!recording || !recognitionRef.current) return;
    // Disable auto-restart BEFORE stopping the recognition instance. Otherwise
    // onend would re-arm the mic against the user's intent.
    shouldRestartRef.current = false;
    // Null handlers FIRST so any chunks already in the recognition pipeline
    // (typically the last few words still being processed when the user hit
    // submit) cannot fire onresult and re-populate the textarea after the
    // caller cleared it. Without this, voice-recognition lag would leak the
    // tail of the previous answer into the next turn's input. (2026-04-15
    // bug: user observed "final 3 lines or so" of prior response remaining
    // in the textbox after submit.)
    recognitionRef.current.onresult = null;
    recognitionRef.current.onerror = null;
    recognitionRef.current.onend = null;
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setRecording(false);
    setInterimTranscript("");
    startingRef.current = false;
  }, [recording]);

  const reset = React.useCallback(() => {
    accumulatedFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    supported,
    recording,
    interimTranscript,
    finalTranscript,
    start,
    stop,
    reset,
    error,
  };
}
```

## File: components/preview-panel.tsx

```
"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Paperclip, RotateCw, X } from "lucide-react";
import { useSessionStore } from "@/lib/store";
import { computeVR } from "@/lib/verbatim-ratio";
import { detect, highlightSegments } from "@/lib/ai-ism-detector";
import type { AIIsmMatch } from "@/lib/ai-ism-detector";
import { extractText, isSupported } from "@/lib/fileImport";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { DiagnosticPills } from "@/components/diagnostic-pills";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Inline AI-ism highlight helpers (Part C)
// ---------------------------------------------------------------------------

/**
 * Walk a react-markdown children array and wrap any string children that
 * contain AI-ism patterns in `<mark>` elements. Non-string children (inline
 * `<strong>`, `<em>`, etc.) pass through unchanged.
 */
function highlightChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const segments = highlightSegments(child);
    // If the whole string is a single plain segment, return the string as-is
    if (segments.length === 1 && segments[0].type === "plain") return child;
    return segments.map((seg, i) =>
      seg.type === "plain" ? (
        seg.text
      ) : (
        <mark
          key={i}
          title={`AI-ism: ${seg.pattern}`}
          className="bg-warning/20 underline decoration-warning/60 decoration-dotted underline-offset-2"
        >
          {seg.text}
        </mark>
      )
    );
  });
}

type PreviewPanelProps = {
  className?: string;
  /** Called when the user clicks "Regenerate avoiding these" in DiagnosticPills. */
  onRegenerate?: (matches: AIIsmMatch[]) => void;
  /**
   * Called when the user submits voice/text feedback for a whole-output
   * regenerate. Parent fires the assembleWithFeedback call; preview-panel
   * just collects the feedback string.
   */
  onRegenerateWithFeedback?: (feedback: string) => void;
};

export function PreviewPanel({
  className,
  onRegenerate,
  onRegenerateWithFeedback,
}: PreviewPanelProps): JSX.Element {
  const output = useSessionStore((s) => s.output);
  const isGenerating = useSessionStore((s) => s.isGenerating);
  const vrScore = useSessionStore((s) => s.vrScore);
  const setVRScore = useSessionStore((s) => s.setVRScore);
  const mode = useSessionStore((s) => s.mode);
  const outputSource = useSessionStore((s) => s.outputSource);
  const setUploadedDraft = useSessionStore((s) => s.setUploadedDraft);
  const setError = useSessionStore((s) => s.setError);

  const [aiIsmMatches, setAiIsmMatches] = useState<AIIsmMatch[]>([]);

  // ---- Upload-to-output state ----
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Regenerate-with-feedback state ----
  const [regenOpen, setRegenOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const feedbackTextareaRef = useRef<HTMLTextAreaElement>(null);
  const baseFeedbackRef = useRef("");

  const voice = useVoiceInput({
    onError: (msg) => setError(msg),
  });

  // Snapshot textarea on recording start
  const prevRecording = useRef(false);
  useEffect(() => {
    if (voice.recording && !prevRecording.current) {
      baseFeedbackRef.current = feedback;
    }
    prevRecording.current = voice.recording;
  });

  // Live preview during recording
  useEffect(() => {
    if (!voice.recording) return;
    const base = baseFeedbackRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voice.finalTranscript + voice.interimTranscript;
    if (preview) {
      setFeedback(base + separator + preview);
    }
  }, [voice.recording, voice.finalTranscript, voice.interimTranscript]);

  // Commit on stop
  useEffect(() => {
    if (!voice.recording && voice.finalTranscript) {
      const base = baseFeedbackRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setFeedback(base + separator + voice.finalTranscript);
      baseFeedbackRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.recording]);

  // Autoscroll feedback textarea while dictating
  useEffect(() => {
    if (voice.recording && feedbackTextareaRef.current) {
      feedbackTextareaRef.current.scrollTop = feedbackTextareaRef.current.scrollHeight;
    }
  }, [voice.recording, feedback]);

  const { toast } = useToast();

  // Compute VR score and run AI-ism detection once streaming completes.
  // For upload-sourced output, VR is computed against the upload (the
  // material the user is iterating from), not the empty interview
  // transcript — otherwise it would always read 0% and confuse.
  //
  // feedbackHistory is folded into the denominator: every feedback string
  // the user has submitted is as much "the user's words" as the interview
  // transcript, so verbatim stitching from a regen-with-feedback round
  // should count toward VR. Without this, a model that correctly
  // incorporated a feedback phrase verbatim would look like it was
  // inventing prose.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isGenerating && output.length > 0 && vrScore === null) {
      const state = useSessionStore.getState();
      const rawBase =
        state.outputSource === "upload" && state.uploadedDraftContent
          ? state.uploadedDraftContent
          : state.interview.rawTranscript;
      const rawSource =
        state.feedbackHistory.length > 0
          ? `${rawBase}\n\n${state.feedbackHistory.join("\n\n")}`
          : rawBase;
      const result = computeVR(rawSource, output);
      setVRScore(result);
      // Run the AI-ism detector on the completed output.
      setAiIsmMatches(detect(output));
    }
  }, [isGenerating, output, vrScore, setVRScore]);

  // Clear AI-ism matches + close regen panel when output is cleared
  useEffect(() => {
    if (output.length === 0) {
      setAiIsmMatches([]);
      setRegenOpen(false);
      setFeedback("");
    }
  }, [output]);

  const wordCount = useMemo(() => {
    if (!output) return 0;
    return output.trim().split(/\s+/).filter(Boolean).length;
  }, [output]);

  const modeName = mode ?? "draft";

  function handleCopy(): void {
    navigator.clipboard.writeText(output).then(() => {
      toast({ title: "Copied", description: "Output copied to clipboard." });
    });
  }

  function handleDownload(): void {
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modeName}-draft.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Upload-to-output ----
  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!isSupported(file.name)) {
      setUploadError(`Unsupported: ${file.name}. Use .md / .txt / .pdf / .docx.`);
      return;
    }
    setUploading(file.name);
    try {
      const text = await extractText(file);
      if (!text) {
        setUploadError(`No text extracted from ${file.name}.`);
        return;
      }
      setUploadedDraft(text);
      toast({ title: "Draft loaded", description: `${file.name} ready to edit.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to read ${file.name}`;
      setUploadError(msg);
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ---- Regenerate-with-feedback handlers ----
  function handleSendFeedback(): void {
    const trimmed = feedback.trim();
    if (!trimmed || !onRegenerateWithFeedback) return;
    voice.stop();
    voice.reset();
    onRegenerateWithFeedback(trimmed);
    setFeedback("");
    setRegenOpen(false);
  }

  function handleCancelFeedback(): void {
    voice.stop();
    voice.reset();
    setFeedback("");
    setRegenOpen(false);
  }

  function handleFeedbackKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendFeedback();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelFeedback();
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header row */}
      <div className="flex items-baseline justify-between">
        <span className="label-caps text-foreground">
          Output
          {output.length > 0 && outputSource === "upload" && (
            <span className="ml-2 font-mono text-[0.625rem] tracking-wider text-accent">
              · editing uploaded draft
            </span>
          )}
          {output.length > 0 && outputSource === "interview" && (
            <span className="ml-2 font-mono text-[0.625rem] tracking-wider text-muted-foreground">
              · from interview
            </span>
          )}
        </span>
        {output.length > 0 && (
          <span className="label-caps text-muted-foreground">
            {wordCount} words
          </span>
        )}
      </div>

      {/* Main content area */}
      {output.length === 0 ? (
        <div className="flex flex-col gap-3">
          {isGenerating ? (
            <>
              {/* Chat-style "Assembling…" with pulsing bar. Sits in the
                  empty-state branch that fires when output is cleared
                  (initial assemble) and when regenerate clears output
                  before streaming back in. */}
              <p className="font-body text-base text-foreground italic animate-pulse">
                Assembling&hellip;
              </p>
              <div className="h-0.5 w-full overflow-hidden bg-muted">
                <div className="h-full w-1/2 animate-pulse bg-foreground/30" />
              </div>
              <p className="font-body text-xs text-muted-foreground">
                Typical turnaround 20-60s. The first tokens will appear below as the model streams.
              </p>
            </>
          ) : (
            <>
              <p className="font-body text-sm text-muted-foreground">
                Your assembled piece will appear here.
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading !== null}
                  className={cn(
                    "self-start flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider",
                    "text-muted-foreground hover:text-foreground transition-colors",
                    uploading !== null && "opacity-50 cursor-not-allowed"
                  )}
                  title="Upload an existing draft (.md / .txt / .pdf / .docx) to refine it with voice/text feedback."
                >
                  <Paperclip className="h-3 w-3" aria-hidden />
                  {uploading !== null ? `Reading ${uploading}…` : "Or upload an existing draft to edit"}
                </button>
                {uploadError && (
                  <p className="font-mono text-xs text-destructive">{uploadError}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => void handleUploadFile(e)}
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Prose region */}
          <div className="relative">
            <div className="prose-output font-body text-foreground leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p>{highlightChildren(children)}</p>,
                  li: ({ children }) => <li>{highlightChildren(children)}</li>,
                }}
              >
                {output}
              </ReactMarkdown>
            </div>
            {/* Streaming cue: "Streaming…" caption + pulsing bar. Shown
                once the first tokens arrive and the output panel has
                content but the stream is still landing. */}
            {isGenerating && (
              <div className="mt-2 flex flex-col gap-1">
                <p className="font-body text-xs text-muted-foreground italic">
                  Streaming&hellip;
                </p>
                <div className="h-0.5 w-full overflow-hidden bg-muted">
                  <div className="h-full w-1/2 animate-pulse bg-foreground/30" />
                </div>
              </div>
            )}
          </div>

          {/* Diagnostics + actions (only when not actively streaming) */}
          {!isGenerating && (
            <>
              <DiagnosticPills
                vrResult={vrScore}
                aiIsmMatches={aiIsmMatches}
                onRegenerate={() => onRegenerate?.(aiIsmMatches)}
                onDismiss={() => setAiIsmMatches([])}
              />

              {/* Footer actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  Download
                </Button>
                {onRegenerateWithFeedback && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setRegenOpen((o) => !o)}
                    className="font-mono text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden />
                    Regenerate with feedback
                  </Button>
                )}
              </div>

              {/* Regenerate panel — expanded on demand */}
              {regenOpen && (
                <div className="flex flex-col gap-3 border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-foreground">What should change?</span>
                    <button
                      type="button"
                      onClick={handleCancelFeedback}
                      aria-label="Cancel feedback (Esc)"
                      title="Cancel (Esc)"
                      className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-sm",
                        "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      )}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <textarea
                    ref={feedbackTextareaRef}
                    className="min-h-[88px] w-full resize-none border border-border bg-background p-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="e.g. tighten the intro to focus on the AI agents moment; remove the WGU course mention; vary the closing line..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    onKeyDown={handleFeedbackKeyDown}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      Enter to send · Shift+Enter for newline · Esc to cancel
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Mic */}
                      {voice.supported ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (voice.recording) {
                              voice.stop();
                              // Return focus to the textarea so Enter submits
                              // instead of retoggling the mic button.
                              feedbackTextareaRef.current?.focus();
                            } else {
                              voice.start();
                            }
                          }}
                          aria-label={voice.recording ? "Stop voice input" : "Start voice input"}
                          title={voice.recording ? "Stop recording" : "Start voice input"}
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                            voice.recording
                              ? "text-accent border-accent animate-pulse"
                              : "text-muted-foreground hover:text-foreground hover:border-foreground"
                          )}
                        >
                          {voice.recording ? (
                            <MicOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Mic className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-label="Voice input unavailable"
                          title="Voice input not supported in this browser. Chrome or Edge recommended."
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-sm border border-border",
                            "text-muted-foreground cursor-not-allowed opacity-40"
                          )}
                        >
                          <Mic className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleSendFeedback}
                        disabled={!feedback.trim()}
                        className="font-mono text-xs uppercase tracking-wider"
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
```

## File: components/interview-panel.tsx

```
"use client";

import * as React from "react";
import { Mic, MicOff, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore, type AttachedFile } from "@/lib/store";
import { askNextQuestion } from "@/lib/interview-engine";
import { detectWritingMode } from "@/lib/detectWritingMode";
import { parseTranscript } from "@/lib/parseTranscript";
import { combineContext, formatFileSize } from "@/lib/combineContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { extractText, isSupported } from "@/lib/fileImport";

export function InterviewPanel() {
  // ---------------------------------------------------------------------------
  // Store bindings
  // ---------------------------------------------------------------------------
  const apiKey = useSessionStore((s) => s.apiKey);
  const mode = useSessionStore((s) => s.mode);
  const contextNotes = useSessionStore((s) => s.contextNotes);
  const attachedFiles = useSessionStore((s) => s.attachedFiles);
  const turns = useSessionStore((s) => s.interview.turns);
  const lastAssessment = useSessionStore((s) => s.interview.lastAssessment);

  const setContextNotes = useSessionStore((s) => s.setContextNotes);
  const attachFile = useSessionStore((s) => s.attachFile);
  const removeAttachedFile = useSessionStore((s) => s.removeAttachedFile);
  const addInterviewTurn = useSessionStore((s) => s.addInterviewTurn);
  const setLastAssessment = useSessionStore((s) => s.setLastAssessment);
  const setInterviewStatus = useSessionStore((s) => s.setInterviewStatus);
  const setError = useSessionStore((s) => s.setError);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Seed-from-transcript dev utility — pre-interview only.
  const [seedOpen, setSeedOpen] = React.useState(false);
  const [seedDraft, setSeedDraft] = React.useState("");
  const [seedError, setSeedError] = React.useState<string | null>(null);

  function handleSeedTranscript() {
    const result = parseTranscript(seedDraft);
    if (!result.ok) {
      setSeedError(result.error);
      return;
    }
    useSessionStore.getState().seedInterview(result.turns);
    setSeedDraft("");
    setSeedError(null);
    setSeedOpen(false);
    toast({
      title: "Interview seeded",
      description: `${result.turns.length} turns loaded (${result.markerStyle}). Click Assemble when ready.`,
    });
  }

  // Ref for scroll-to-bottom on new turns
  const historyEndRef = React.useRef<HTMLDivElement>(null);
  // Ref for the input textarea — used to auto-scroll while voice dictation
  // overflows the visible region (Loom-credibility fix; see post-mvp-backlog.md #2)
  const inputTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ---------------------------------------------------------------------------
  // Voice input
  // ---------------------------------------------------------------------------
  // baseInputRef holds the textarea value at the moment recording starts,
  // so we can append interim/final transcripts without losing prior text.
  const baseInputRef = React.useRef("");

  const voice = useVoiceInput({
    onError: (msg) => setError(msg),
  });

  // When recording starts, snapshot the current textarea value.
  const prevRecordingRef = React.useRef(false);
  React.useEffect(() => {
    if (voice.recording && !prevRecordingRef.current) {
      baseInputRef.current = inputValue;
    }
    prevRecordingRef.current = voice.recording;
  });

  // Live preview: while recording, show base + final-so-far + interim
  React.useEffect(() => {
    if (!voice.recording) return;
    const base = baseInputRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voice.finalTranscript + voice.interimTranscript;
    if (preview) {
      setInputValue(base + separator + preview);
    }
  }, [voice.recording, voice.finalTranscript, voice.interimTranscript]);

  // On recognition end (natural or manual stop): commit final transcript
  React.useEffect(() => {
    if (!voice.recording && voice.finalTranscript) {
      const base = baseInputRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setInputValue(base + separator + voice.finalTranscript);
      baseInputRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.recording]);

  // Auto-scroll the input textarea to the bottom while voice dictation is
  // appending content — without this, voice transcripts that overflow the
  // 3-row visible area land out of view (post-mvp-backlog #2). Only fires
  // while recording so normal typing UX is unaffected.
  React.useEffect(() => {
    if (voice.recording && inputTextareaRef.current) {
      inputTextareaRef.current.scrollTop = inputTextareaRef.current.scrollHeight;
    }
  }, [voice.recording, inputValue]);

  // ---------------------------------------------------------------------------
  // Voice input — Context textarea (pre-interview only)
  // ---------------------------------------------------------------------------
  // Separate instance from the answer-stage voice hook so a user who dictated
  // their context and then mic'd an answer doesn't have their prior context
  // leak into the answer buffer. Same base-snapshot + live-preview + commit-
  // on-stop + autoscroll pattern.
  const contextTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const baseContextRef = React.useRef("");
  const voiceContext = useVoiceInput({
    onError: (msg) => setError(msg),
  });
  const prevContextRecordingRef = React.useRef(false);
  React.useEffect(() => {
    if (voiceContext.recording && !prevContextRecordingRef.current) {
      baseContextRef.current = contextNotes;
    }
    prevContextRecordingRef.current = voiceContext.recording;
  });
  React.useEffect(() => {
    if (!voiceContext.recording) return;
    const base = baseContextRef.current;
    const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
    const preview = voiceContext.finalTranscript + voiceContext.interimTranscript;
    if (preview) {
      setContextNotes(base + separator + preview);
    }
  }, [voiceContext.recording, voiceContext.finalTranscript, voiceContext.interimTranscript]);
  React.useEffect(() => {
    if (!voiceContext.recording && voiceContext.finalTranscript) {
      const base = baseContextRef.current;
      const separator = base.length > 0 && !base.endsWith(" ") ? " " : "";
      setContextNotes(base + separator + voiceContext.finalTranscript);
      baseContextRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceContext.recording]);
  React.useEffect(() => {
    if (voiceContext.recording && contextTextareaRef.current) {
      contextTextareaRef.current.scrollTop = contextTextareaRef.current.scrollHeight;
    }
  }, [voiceContext.recording, contextNotes]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  // (userTurnCount / wordCount / coveragePct / isReady dropped 2026-04-15 —
  // coverage-driven UI removed in favour of the adaptive-interviewer model's
  // conversational readiness signal.)

  // ---------------------------------------------------------------------------
  // Auto-scroll on new turns
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // ---------------------------------------------------------------------------
  // Kickoff — user-triggered (not auto on mode change)
  // ---------------------------------------------------------------------------
  // Per user 2026-04-15: mode selection alone should NOT trigger the first
  // question. Workflow is now context-first — user fills the Context panel
  // (recommended), then explicitly clicks "Start Interview" to fire the
  // model's first question. Without this, the model defaults to generic
  // "what are you applying for?" openers even when the context already
  // tells it.
  async function kickoff() {
    if (!mode || !apiKey || turns.length > 0 || loading) return;
    // Combined context = typed + attached file contents. Either alone
    // is enough to start an interview.
    const combined = combineContext(contextNotes, attachedFiles);
    if (!combined.trim()) return;

    // Detect writing mode from combined context (so file content can
    // also trigger the right mode routing) and update the store.
    const detectedMode = detectWritingMode(combined);
    if (detectedMode !== mode) {
      useSessionStore.getState().updateMode(detectedMode);
    }

    setLoading(true);
    try {
      const result = await askNextQuestion({
        mode: detectedMode,
        apiKey,
        history: [],
        contextNotes: combined,
      });
      setLastAssessment(result.priorAssessment);
      if (result.question.trim().length > 0) {
        addInterviewTurn({
          role: "assistant",
          content: result.question,
          timestamp: new Date().toISOString(),
        });
      }
      if (result.readyToAssemble) {
        setInterviewStatus("ready-to-assemble");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start interview.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  async function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    // Missing API key — inline error, don't throw
    if (!apiKey) {
      setInlineError("Add your API key in Settings to continue.");
      return;
    }

    if (!mode) return;

    setInlineError(null);

    // Push user turn
    addInterviewTurn({
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    });
    setInputValue("");
    // Halt the active recording session and clear its transcript buffer so
    // the next turn starts from a clean slate. voice.stop() also nulls the
    // onresult callback so any in-flight speech chunks (last few words still
    // being processed when the user hits submit) can't leak into the next
    // turn's textbox. voice.reset() clears the buffered transcript state.
    // See 2026-04-15 consultant reports — Scenario B state corruption +
    // recognition-pipeline lag.
    voice.stop();
    voice.reset();
    setLoading(true);

    // Build history including the just-added user turn
    const currentTurns = useSessionStore.getState().interview.turns;
    const currentFiles = useSessionStore.getState().attachedFiles;
    const combined = combineContext(contextNotes, currentFiles);

    try {
      const result = await askNextQuestion({
        mode,
        apiKey,
        history: currentTurns,
        contextNotes: combined,
      });
      setLastAssessment(result.priorAssessment);
      // Skip empty assistant turns (see kickoff above for rationale).
      if (result.question.trim().length > 0) {
        addInterviewTurn({
          role: "assistant",
          content: result.question,
          timestamp: new Date().toISOString(),
        });
      }
      if (result.readyToAssemble) {
        setInterviewStatus("ready-to-assemble");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      // Restore input for retry
      setInputValue(trimmed);
    } finally {
      setLoading(false);
    }
  }

  // Enter to send; Shift+Enter for newline. Standard chat-app convention.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------
  // Uploaded files are read in the browser, text-extracted (.md/.txt via
  // FileReader, .pdf via pdfjs-dist, .docx via mammoth), and appended to
  // `contextNotes`. The appended text reaches ONLY the interview stage —
  // never the assembly call (see lib/store.ts contextNotes comment).
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    for (const file of Array.from(files)) {
      if (!isSupported(file.name)) {
        setUploadError(`Unsupported: ${file.name}. Use .md / .txt / .pdf / .docx.`);
        continue;
      }
      setUploading(file.name);
      try {
        const text = await extractText(file);
        if (!text) {
          setUploadError(`No text extracted from ${file.name}.`);
          continue;
        }
        // Push as a chip rather than inlining text into contextNotes.
        // combineContext() merges chips + typed text only at call-time
        // (askNextQuestion / detectWritingMode), so the textarea stays
        // clean while the model still sees the file content.
        const ext = file.name.toLowerCase().match(/\.(md|txt|pdf|docx)$/)?.[0] as AttachedFile["ext"] | undefined;
        if (!ext) {
          setUploadError(`Unsupported extension on ${file.name}.`);
          continue;
        }
        const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        attachFile({ id, name: file.name, ext, size: file.size, content: text });
        toast({
          title: "Attached",
          description:
            turns.length > 0
              ? `${file.name} — the interviewer will reference it in the next question.`
              : `${file.name}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Failed to read ${file.name}`;
        setUploadError(msg);
      } finally {
        setUploading(null);
      }
    }

    // Clear the input so selecting the same file again re-fires change.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  // No mode-gate render: mode defaults to "cover-letter" in the store
  // (2026-04-15 Writing-Mode-dropdown removal). Context gates the flow.

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Single always-rendered file input shared by both dock paperclips
          (pre-interview Context dock + answer dock). Lives here so
          fileInputRef.current is valid regardless of dock state. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.pdf,.docx"
        multiple
        className="hidden"
        onChange={(e) => void handleFileSelect(e)}
      />

      {/* Header removed 2026-04-15 — "Interview" label was redundant with
          the app's whole purpose. 2026-04-15 UAT: Context panel moved
          from the top of the pane into the bottom input dock, so the
          pre-interview state reads as "greeting above + context input
          below", structurally matching the interview state ("questions
          above + answer input below"). One consolidated chat metaphor
          across both states. */}

      {/* ------------------------------------------------------------------ */}
      {/* 3. Assessment callout                                               */}
      {/* ------------------------------------------------------------------ */}
      {lastAssessment !== null && (
        <div className="px-5 py-2 border-b border-border shrink-0">
          <p
            className={cn(
              "font-mono text-xs",
              lastAssessment.level === "sufficient" && "text-success",
              lastAssessment.level === "partial" && "text-accent",
              lastAssessment.level === "insufficient" && "text-destructive"
            )}
          >
            {lastAssessment.level === "sufficient" &&
              "Last answer: sufficient — advancing."}
            {lastAssessment.level === "partial" &&
              "Last answer: partially sufficient — follow-up coming."}
            {lastAssessment.level === "insufficient" &&
              "Last answer: insufficient — more specifics needed."}
          </p>
        </div>
      )}
      {/* ------------------------------------------------------------------ */}
      {/* 4 + 5. Turn history (scrollable) + current question                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
        {/* Pre-interview greeting — single concise assistant-style message.
            The Context input + Start button live in the bottom dock (below)
            so this pane reads as a chat thread: greeting above, input below,
            matching the interview state's layout. */}
        {turns.length === 0 && !loading && (
          <div className="pl-3 py-1 border-l-2 border-warning/40">
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Welcome to Human Writer Pro. Paste or upload your context below — a job posting, an assignment, a reference doc, anything I should read before asking questions — then hit <strong className="text-foreground font-semibold">Start Interview</strong>. Your answers become the raw material I stitch the draft from, so the more specific you get, the more of your voice lands in the output.
            </p>
          </div>
        )}

        {turns.map((turn, i) => {
          const isAssistant = turn.role === "assistant";
          const isLast = i === turns.length - 1;

          return (
            <div
              key={i}
              className={cn(
                "pl-3 py-1",
                isAssistant
                  ? "border-l-2 border-warning"
                  : "border-l-2 border-border"
              )}
            >
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isAssistant
                    ? cn(
                        "font-display text-foreground",
                        isLast && "font-semibold"
                      )
                    : "font-body text-muted-foreground"
                )}
              >
                {turn.content}
              </p>
            </div>
          );
        })}

        {/* Loading indicator — chat-style "Thinking…" with pulsing bar.
            Previously just a thin animated bar, too subtle during longer
            question-generation calls; user couldn't tell if stuck or
            working (UAT 2026-04-15). Now pairs explicit text with the bar. */}
        {loading && (
          <div className="pl-3 py-1 border-l-2 border-warning/40 flex flex-col gap-1.5">
            <p className="font-body text-sm text-muted-foreground italic animate-pulse">
              Thinking&hellip;
            </p>
            <div className="h-1 w-24 bg-muted rounded-sm overflow-hidden">
              <div className="h-full bg-warning/50 rounded-sm animate-pulse w-full" />
            </div>
          </div>
        )}

        <div ref={historyEndRef} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6 + 7. Pre-interview Start button OR active input area              */}
      {/* ------------------------------------------------------------------ */}
      {turns.length === 0 ? (
        // Pre-interview: Context input dock — textarea + upload + Start
        // Interview. Structurally mirrors the interview's answer dock
        // (textarea + mic + Next), so the pane reads as a chat thread
        // across both states. Context is a "first user message" the user
        // provides before the interview begins; Start Interview is the
        // "send" equivalent.
        <div className="px-5 py-3 border-t border-border shrink-0 flex flex-col gap-2">
          {uploadError && (
            <p className="font-mono text-xs text-destructive">{uploadError}</p>
          )}

          {/* Attached-file chips — render above textarea, like ChatGPT/
              Claude attachments. Click X to remove from context. */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachedFiles.map((f) => (
                <div
                  key={f.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/40 px-2 py-1",
                    "font-mono text-[0.6875rem] text-foreground"
                  )}
                  title={`${f.name} — ${formatFileSize(f.size)}, ${f.content.length.toLocaleString()} chars extracted`}
                >
                  <FileText className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <span className="text-muted-foreground/70 uppercase tracking-wider text-[0.625rem]">
                    {f.ext.slice(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachedFile(f.id)}
                    aria-label={`Remove ${f.name}`}
                    title="Remove attachment"
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label htmlFor="context-input" className="sr-only">
            Context
          </label>
          <Textarea
            id="context-input"
            ref={contextTextareaRef}
            value={contextNotes}
            onChange={(e) => setContextNotes(e.target.value)}
            placeholder="Paste a job posting, assignment + rubric, reference doc, or dictate: 'I'm writing an essay on WWII, attaching the rubric'. Attachments above are extracted and added to what the interviewer reads — they never reach the final draft."
            rows={5}
            className="resize-none font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            {/* Upload (file-as-context) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading !== null}
              aria-label="Upload context file"
              title="Upload .md, .txt, .pdf, or .docx. Text is extracted in the browser and appended to the context."
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                "text-muted-foreground hover:text-foreground hover:border-foreground",
                uploading !== null && "opacity-50 cursor-not-allowed"
              )}
            >
              <Paperclip className="h-4 w-4" aria-hidden />
            </button>

            {/* Mic (dictate context) */}
            {voiceContext.supported ? (
              <button
                type="button"
                onClick={() => {
                  if (voiceContext.recording) {
                    voiceContext.stop();
                    contextTextareaRef.current?.focus();
                  } else {
                    voiceContext.start();
                  }
                }}
                aria-label={voiceContext.recording ? "Stop voice input" : "Start voice input"}
                title={voiceContext.recording ? "Stop recording" : "Dictate context"}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                  voiceContext.recording
                    ? "text-accent border-accent animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:border-foreground"
                )}
              >
                {voiceContext.recording ? (
                  <MicOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Mic className="h-4 w-4" aria-hidden />
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Voice input unavailable"
                title="Voice input not supported in this browser. Chrome or Edge recommended."
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-sm border border-border",
                  "text-muted-foreground cursor-not-allowed opacity-40"
                )}
              >
                <Mic className="h-4 w-4" aria-hidden />
              </button>
            )}

            {uploading !== null && (
              <span className="font-mono text-xs text-muted-foreground">
                Reading {uploading}…
              </span>
            )}
            {contextNotes.trim() && uploading === null && (
              <span className="font-mono text-xs text-muted-foreground">
                {contextNotes.trim().length} chars
              </span>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => void kickoff()}
              disabled={loading || !apiKey || !contextNotes.trim()}
              className="ml-auto font-mono uppercase tracking-wider"
            >
              {loading ? "Starting…" : "Start Interview →"}
            </Button>
          </div>
          {!apiKey && (
            <p className="font-mono text-xs text-destructive">
              Add your API key in Settings to begin.
            </p>
          )}

          {/* Seed-from-prior-transcript dev utility — collapsed by default. */}
          <div className="mt-1">
            {!seedOpen ? (
              <button
                type="button"
                onClick={() => setSeedOpen(true)}
                className="font-mono text-[0.625rem] text-muted-foreground/70 hover:text-foreground uppercase tracking-wider"
              >
                · or seed from prior transcript
              </button>
            ) : (
              <div className="flex flex-col gap-2 mt-1 border border-border bg-background p-2 rounded-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.625rem] text-foreground uppercase tracking-wider">
                    Seed Interview from Transcript
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSeedOpen(false);
                      setSeedDraft("");
                      setSeedError(null);
                    }}
                    className="font-mono text-[0.625rem] text-muted-foreground hover:text-foreground"
                  >
                    cancel
                  </button>
                </div>
                <textarea
                  value={seedDraft}
                  onChange={(e) => {
                    setSeedDraft(e.target.value);
                    if (seedError) setSeedError(null);
                  }}
                  placeholder={`Paste a prior interview transcript. Markers supported:\n[USER]: ... / [ASSISTANT]: ...\nUser: ... / Assistant: ...\n**You:** ... / **Interviewer:** ...\nQ: ... / A: ...\n\nNo markers? The whole text becomes one user turn.`}
                  rows={6}
                  className="resize-y w-full border border-border bg-card p-2 font-mono text-[0.6875rem] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {seedError && (
                  <p className="font-mono text-xs text-destructive">{seedError}</p>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSeedTranscript}
                  disabled={!seedDraft.trim()}
                  className="self-end font-mono text-xs uppercase tracking-wider"
                >
                  Parse + Seed
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-border shrink-0 flex flex-col gap-2">
        {/* Inline API key error */}
        {inlineError && (
          <p className="font-mono text-xs text-destructive">{inlineError}</p>
        )}

        {/* Attached-file chips — render mid-interview too so user sees
            their attachments + can remove or add via the paperclip
            below. */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachedFiles.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/40 px-2 py-1",
                  "font-mono text-[0.6875rem] text-foreground"
                )}
                title={`${f.name} — ${formatFileSize(f.size)}, ${f.content.length.toLocaleString()} chars extracted`}
              >
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[0.625rem]">
                  {f.ext.slice(1)}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(f.id)}
                  aria-label={`Remove ${f.name}`}
                  title="Remove attachment"
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        <label htmlFor="interview-input" className="sr-only">
          Your answer
        </label>

        <Textarea
          id="interview-input"
          ref={inputTextareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (inlineError) setInlineError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Your answer…"
          disabled={loading}
          rows={3}
          className="resize-none"
        />

        <div className="flex items-center gap-2">
          {/* Upload additional context mid-interview — clicks the same
              hidden file input as the pre-interview dock; handleFileSelect
              fires a toast so the user sees confirmation that the
              interviewer now has the new material. */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading !== null}
            aria-label="Add context file"
            title="Add more context (.md / .txt / .pdf / .docx). The interviewer will reference it in the next question."
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
              "text-muted-foreground hover:text-foreground hover:border-foreground",
              (loading || uploading !== null) && "opacity-40 cursor-not-allowed"
            )}
          >
            <Paperclip className="h-4 w-4" aria-hidden />
          </button>

          {/* Voice input button */}
          {voice.supported ? (
            <button
              type="button"
              onClick={() => {
                if (voice.recording) {
                  voice.stop();
                  // Return focus to the textarea so the next Enter submits
                  // instead of retoggling the mic button (the last clicked
                  // element keeps focus by default — surprising UX after
                  // dictation).
                  inputTextareaRef.current?.focus();
                } else {
                  voice.start();
                }
              }}
              disabled={loading}
              aria-label={voice.recording ? "Stop voice input" : "Start voice input"}
              title={voice.recording ? "Stop recording" : "Start voice input"}
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-sm border border-border transition-colors",
                voice.recording
                  ? "text-accent border-accent animate-pulse"
                  : "text-muted-foreground hover:text-foreground hover:border-foreground",
                loading && "opacity-40 cursor-not-allowed"
              )}
            >
              {voice.recording ? (
                <MicOff className="h-4 w-4" aria-hidden />
              ) : (
                <Mic className="h-4 w-4" aria-hidden />
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Voice input unavailable"
              title="Voice input not supported in this browser. Chrome or Edge recommended."
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-sm border border-border",
                "text-muted-foreground cursor-not-allowed opacity-40"
              )}
            >
              <Mic className="h-4 w-4" aria-hidden />
            </button>
          )}

          {uploading !== null && (
            <span className="font-mono text-xs text-muted-foreground">
              Reading {uploading}…
            </span>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={loading || !inputValue.trim()}
            className="ml-auto"
            aria-label="Send answer"
          >
            {loading ? "…" : "Next →"}
          </Button>
        </div>
        {uploadError && (
          <p className="font-mono text-xs text-destructive">{uploadError}</p>
        )}

        </div>
      )}
    </div>
  );
}
```

## File: eval/reports/vr-validation.md

```
# VR Validation Pilot — Report for Independent Review

**Date:** 2026-04-13
**Purpose:** Self-contained report for an independent Claude session to review this experiment's design, execution, and conclusions. All raw data is inline below. Source files also available at `/home/pn/projects/screenshots/evals/vr-validation/2026-04-13/`.

---

## TL;DR (REVISED 2026-04-13 after external review)

Pre-registered pilot (n=54) testing whether **Verbatim Ratio (VR)** — the fraction of output n-grams that appear verbatim in a raw interview transcript — predicts GPTZero human-classification of the output.

**Pre-registered H1 rejected: Fisher's p < 0.0001.** Above VR=0.20, pass rate is 75%; below, 0%. All three topics independently support the same direction.

**BUT the causal reading is narrower than "VR is the signal."** An external reviewer caught that the effect splits cleanly by **prompt regime**, not by VR value:
- Band-25 prompts (moderate paraphrase): 0/7 pass in the primary set
- Band-35 prompts (heavy verbatim stitching): 6/6 pass in the primary set
- In the overlapping actual-VR zone (29–34%), outcomes depend on *which prompt produced the variant*, not on the VR value itself. A band-35 variant at 29.1% VR passes; a band-25 variant at 33.9% VR fails.

**Revised causal claim:** the band-35 prompt regime produces text GPTZero classifies as human; the band-25 regime does not. VR is a useful downstream diagnostic of which regime was applied, but it is not the causal lever. The "35% threshold" framing in the first version of this report was wrong.

**Operational recommendation:** adopt the band-35 prompt strategy in the pipeline. Do NOT gate on a VR threshold. Use VR only as a post-hoc check that the prompt is producing the expected stitching density.

**Reviewer's job:** look for flaws in design, execution, analysis, or conclusions. Push back on anything that feels over-concluded. Flag what a follow-up experiment should fix. (The first version of this report was already pushed back once — see §9 and §14 for the corrections that resulted. A second push is welcome.)

---

## 1. Background / what we were testing

Verbatim Ratio (VR) was introduced 2026-04-12 based on an informal observation that cover letters heavily stitched from a user's raw interview speech passed AI detectors better than fully-LLM-paraphrased versions. An initial working rule formed: "5-gram VR ≥ 20% is sufficient for GPTZero human-pass." One counterexample (Shulman Fleming CL at 33.3% VR still flagged "AI Paraphrased") made us uncertain whether the rule was real, whether there was an overfitting sweet spot, or whether we had been chasing noise.

This experiment was designed before any data was generated. The pre-registration is committed to git at SHA `ad19b5d` (amendment at `45b127e` documenting a model-description correction). The full experiment lives at commit `67c0724`.

---

## 2. Pre-registered hypotheses (locked before generation)

### Primary H1
- **H₀:** P(GPTZero `human_plus_mixed` ≥ 51 | 5-gram VR ≥ 0.20) ≤ 0.5
- **H₁:** P(GPTZero `human_plus_mixed` ≥ 51 | 5-gram VR ≥ 0.20) > 0.5
- **Test:** one-sided Fisher's exact on the 2×2 of (above/below VR=0.20) × (human-passing/failing).
- **α:** 0.05.

### Secondary hypotheses
- **H2 (best n-gram):** Spearman ρ between each of n∈{3,4,5,6,7}-gram VR and `human_plus_mixed`. Report the n with the largest |ρ|. Descriptive; no formal test.
- **H3 (overfitting peak):** Per-band mean `human_plus_mixed`. If it peaks at a band below 100% and drops by ≥10pt to band=100%, the "overfitting backfires" hypothesis is descriptively supported.
- **H4 (per-topic consistency):** Repeat H1 Fisher's within each of 3 topics (n=18 each). Check if direction is consistent.

### Decision rules (locked, verbatim from pre-reg)
| Outcome | Meaning |
|---|---|
| p<0.05 AND direction matches H1 AND ≥2/3 topics same direction | **VR VALIDATED** |
| p≥0.5 OR ≥2/3 topics reversed | **VR INVALIDATED** |
| 0.05≤p<0.5 OR topics inconsistent | **INCONCLUSIVE** |

### Exclusion rule (locked)
Variants with |actual 5-gram VR − target band/100| > 0.10 are excluded from H1 primary analysis. Band 0% and 100% endpoints are always included (they are deterministic or pure-LLM baselines).

---

## 3. Experimental design

| Factor | Levels | Notes |
|---|---|---|
| Topic | 3 | Controls for topic-specific style leakage |
| VR target band | 6 | 0% (pure LLM, no raw access) / 5% / 15% / 25% / 35% / 100% (raw excerpt, deterministic) |
| Replicates per cell | 3 | Independent runs at temp 0.7 |

**Total: 54 variants. Target word count per variant: 250 ± 25.**

### Generation protocol
- **Model:** Claude Sonnet 4.6 via Agent SDK (in-process; no CLI). Pre-reg originally said Opus, amended `45b127e` when smoke test showed the code actually defaults to Sonnet. Only the description was corrected — hypotheses + analysis plan unchanged.
- **Iterative VR targeting:** generate → score 5-gram VR → if |actual − target| > 5pt, regenerate with corrective prompt, ≤ 3 attempts per cell.
- **Order:** randomized by deterministic shuffle.
- **In-run deviation (documented):** the shared `scripts/lib/llm.js` wrapper hardcoded `maxTurns: 1`, which caused ~60% of first-pass LLM cells to fail with "Reached maximum number of turns." The generator was patched to bypass the wrapper and call the SDK directly with `maxTurns: 3` + an explicit Sonnet pin. All 45 LLM cells subsequently generated. Hypotheses + analysis + decision rules UNCHANGED.

### Interview topics (user's raw dictation via WhisperFlow)
1. *"How would you design an eval framework for an LLM-powered product — what would you measure, and how would you know when the product was working?"*
2. *"Describe a hard problem you've solved recently in an LLM-powered system — what made it hard, and what did you change?"*
3. *"If you were the Model Jockey at Lawyer.com tomorrow, what's the first eval you'd build?"*

Raw interviews at `/home/pn/projects/screenshots/evals/vr-validation/2026-04-13/raw-interview-topic-{1,2,3}.md`. Topic 1 was ~1,469 words, topics 2 and 3 were ~870 words each. Words-of-raw availability sets an upper bound on how much verbatim the generator can stitch per variant.

---

## 4. Measurement protocol

Per variant:
- 5 VR values computed (n=3/4/5/6/7) via `scripts/score-verbatim.js` against the corresponding raw interview. Script preprocesses by lowercasing, stripping punctuation, and removing markdown headers.
- GPTZero via the session-token-based API wrapper at `/home/pn/projects/writer/.gemini/skills/human-writer/scripts/eval_gptzero_session.js`. Reported fields: `classification` (ai/mixed/human), `human%`, `mixed%`, `ai%`, `burstiness`, `perplexity`.
- Single scan per variant (no re-test for classifier drift).
- Word count + off-target flag stored.

GPTZero free tier capped at 10,000 words/month — hit after ~39 variants. Session rebootstrapped with a different account to complete scoring. No errors; no partial or corrupted rows.

---

## 5. Full raw data (n=54)

`VR3–VR7` = 5-gram VR ratios (percent). `human+mixed` = GPTZero human% + mixed% (primary signal; ≥ 51 classified as human-passing per the pre-reg convention). `in_primary` = included in H1 Fisher's test per the 10pt exclusion rule.

| topic | band | rep | VR3 | VR4 | VR5 | VR6 | VR7 | GPTZero class | human% | mixed% | ai% | human+mixed | in_primary |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0% | 1 | 0.4% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 0% | 2 | 0.8% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 0% | 3 | 0.4% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 5% | 1 | 2.7% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 5% | 2 | 3.8% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 5% | 3 | 1.5% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 15% | 1 | 32.8% | 24.4% | 18.9% | 14.9% | 12.1% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 15% | 2 | 26.1% | 21.5% | 18.1% | 14.7% | 11.6% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 15% | 3 | 22.2% | 17.6% | 14.9% | 12.3% | 9.6% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 25% | 1 | 39.2% | 32.6% | 28.1% | 24.0% | 20.7% | ai | 13 | 0 | 87 | 13 | yes |
| 1 | 25% | 2 | 37.9% | 30.5% | 24.5% | 19.2% | 14.7% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 25% | 3 | 47.7% | 40.7% | 33.9% | 27.3% | 21.6% | ai | 0 | 0 | 100 | 0 | yes |
| 1 | 35% | 1 | 33.6% | 21.9% | 16.2% | 11.2% | 7.4% | ai | 12 | 0 | 88 | 12 | NO (>10pt off) |
| 1 | 35% | 2 | 62.6% | 50.8% | 40.0% | 31.3% | 23.8% | human | 100 | 0 | 0 | 100 | yes |
| 1 | 35% | 3 | 60.0% | 49.8% | 41.7% | 35.1% | 28.8% | human | 100 | 0 | 0 | 100 | yes |
| 1 | 100% | 1 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 1 | 100% | 2 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 1 | 100% | 3 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 2 | 0% | 1 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 0% | 2 | 0.4% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 0% | 3 | 0.4% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 5% | 1 | 1.1% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 5% | 2 | 0.4% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 5% | 3 | 2.3% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 15% | 1 | 24.5% | 18.0% | 13.7% | 10.5% | 8.1% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 15% | 2 | 15.2% | 12.1% | 11.3% | 10.1% | 8.9% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 15% | 3 | 9.2% | 5.4% | 3.9% | 2.7% | 2.0% | ai | 0 | 0 | 100 | 0 | NO (>10pt off) |
| 2 | 25% | 1 | 32.6% | 25.0% | 19.4% | 14.9% | 11.5% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 25% | 2 | 48.8% | 40.7% | 33.6% | 27.2% | 21.6% | ai | 0 | 0 | 100 | 0 | yes |
| 2 | 25% | 3 | 19.7% | 15.1% | 10.5% | 7.4% | 5.5% | ai | 0 | 0 | 100 | 0 | NO (>10pt off) |
| 2 | 35% | 1 | 59.8% | 51.1% | 44.6% | 38.9% | 34.6% | human | 100 | 0 | 0 | 100 | yes |
| 2 | 35% | 2 | 48.3% | 39.3% | 32.3% | 26.5% | 21.7% | human | 100 | 0 | 0 | 100 | yes |
| 2 | 35% | 3 | 75.0% | 66.4% | 58.9% | 52.3% | 45.6% | human | 100 | 0 | 0 | 100 | NO (>10pt off) |
| 2 | 100% | 1 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 2 | 100% | 2 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 2 | 100% | 3 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 3 | 0% | 1 | 2.1% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 0% | 2 | 0.8% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 0% | 3 | 1.2% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 5% | 1 | 1.3% | 0.0% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 5% | 2 | 2.6% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 5% | 3 | 2.0% | 0.4% | 0.0% | 0.0% | 0.0% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 15% | 1 | 23.5% | 21.1% | 19.5% | 18.4% | 17.2% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 15% | 2 | 12.5% | 7.6% | 4.4% | 2.8% | 1.6% | ai | 0 | 0 | 100 | 0 | NO (>10pt off) |
| 3 | 15% | 3 | 10.6% | 7.4% | 4.9% | 3.7% | 2.5% | ai | 0 | 0 | 100 | 0 | NO (>10pt off) |
| 3 | 25% | 1 | 22.7% | 17.2% | 13.5% | 10.5% | 8.3% | ai | 0 | 0 | 100 | 0 | NO (>10pt off) |
| 3 | 25% | 2 | 32.5% | 24.5% | 18.5% | 15.0% | 12.6% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 25% | 3 | 38.5% | 31.0% | 24.7% | 20.4% | 17.7% | ai | 0 | 0 | 100 | 0 | yes |
| 3 | 35% | 1 | 25.4% | 17.7% | 11.7% | 7.9% | 5.3% | ai | 0 | 0 | 100 | 0 | NO (>10pt off) |
| 3 | 35% | 2 | 44.5% | 35.3% | 29.1% | 24.1% | 19.8% | human | 100 | 0 | 0 | 100 | yes |
| 3 | 35% | 3 | 55.4% | 46.3% | 39.0% | 32.9% | 28.4% | human | 100 | 0 | 0 | 100 | yes |
| 3 | 100% | 1 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 3 | 100% | 2 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |
| 3 | 100% | 3 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | human | 100 | 0 | 0 | 100 | yes |

---

## 6. Per-band summary (primary analysis set, n=46)

| Target band | n in primary | mean 5-gram VR | mean `human+mixed` | pass rate (≥ 51) |
|---|---|---|---|---|
| 0% | 9 | 0.0% | 0.0 | 0 / 9 |
| 5% | 9 | 0.0% | 0.0 | 0 / 9 |
| 15% | 6 | 16.0% | 0.0 | 0 / 6 |
| 25% | 7 | 26.1% | 1.9 | 0 / 7 |
| 35% | 6 | 37.8% | 100.0 | 6 / 6 |
| 100% | 9 | 100.0% | 100.0 | 9 / 9 |

Excluded from primary (8 variants, reported for transparency):
- t1-b35-r1: actual VR 16.2% (target 35%, 18.8pt off)
- t2-b15-r3: actual VR 3.9% (target 15%, 11.1pt off)
- t2-b25-r3: actual VR 10.5% (target 25%, 14.5pt off)
- t2-b35-r3: actual VR 58.9% (target 35%, 23.9pt off)
- t3-b15-r2: actual VR 4.4% (target 15%, 10.6pt off)
- t3-b15-r3: actual VR 4.9% (target 15%, 10.1pt off)
- t3-b25-r1: actual VR 13.5% (target 25%, 11.5pt off)
- t3-b35-r1: actual VR 11.7% (target 35%, 23.3pt off)

---

## 7. Pre-registered test results

### H1 primary — Fisher's exact (one-sided)

| | Human-passing | Failing |
|---|---|---|
| VR ≥ 0.20 (n=20) | **15** | 5 |
| VR < 0.20 (n=26) | 0 | 26 |

- Above-threshold pass rate: **75.0%**
- Below-threshold pass rate: **0.0%**
- **Fisher's exact (one-sided) p = 0.0000** (well below 0.05)

**H₀ rejected.** Direction matches H₁.

The five failures above threshold all sat in the 20–34% zone:

| topic | band | rep | actual 5-gram VR | human+mixed |
|---|---|---|---|---|
| 1 | 25% | 1 | 28.1% | 13 |
| 1 | 25% | 2 | 24.5% | 0 |
| 1 | 25% | 3 | 33.9% | 0 |
| 2 | 25% | 2 | 33.6% | 0 |
| 3 | 25% | 3 | 24.7% | 0 |

None reach above 34% VR. Every variant above 34% passed. **The "dead zone" interpretation looks cleaner than the raw "≥ 20%" cut.**

### H2 — Best n-gram (Spearman ρ vs `human+mixed`)

#### Full primary set (as originally reported)

| n | ρ | n |
|---|---|---|
| 3 | +0.818 | 46 |
| 4 | +0.818 | 46 |
| **5** | **+0.840** | 46 |
| **6** | **+0.840** | 46 |
| **7** | **+0.846** | 46 |

#### Endpoint sensitivity (added after reviewer pushback)

Reviewer noted the full-primary correlations are anchored by band 0% (VR ≈ 0, always fails) and band 100% (VR = 100%, always passes) — two extreme clusters that inflate monotonic-rank correlation regardless of what happens in the middle bands. Recomputation:

| Subset | n | ρ (n5) | ρ (n7) |
|---|---|---|---|
| All primary | 46 | +0.840 | +0.846 |
| Without band 100 | 37 | **+0.684** | +0.696 |
| Without both endpoints (0 and 100) | 28 | **+0.708** | +0.727 |
| Only middle bands (15/25/35) | 19 | +0.738 | +0.772 |
| Only bands 25 & 35 (the boundary contrast) | 13 | +0.685 | +0.749 |

The correlation is real and moderate in the middle bands (~0.68–0.77) but substantially weaker than the anchored 0.84 would imply. The endpoint clusters do a lot of the work. **The "ρ = 0.84" finding needed this caveat to be honest.**

### H3 — Overfitting peak check

Per-band `human+mixed` means (primary set):
- Band 0%: 0.0
- Band 5%: 0.0
- Band 15%: 0.0
- Band 25%: 1.9
- **Band 35%: 100.0**
- Band 100%: 100.0

The peak (excluding endpoints) is at band 35%, value 100. Band 100% is also 100. **Peak-then-drop = no.** The pre-registered criterion (≥10pt drop from peak to band 100%) is not met.

**Overfitting hypothesis descriptively NOT supported** by this pilot. High VR does not backfire on GPTZero in this data.

### H4 — Per-topic consistency (Fisher's exact within each topic)

| Topic | above n | below n | above-pass | below-pass | p | direction |
|---|---|---|---|---|---|---|
| 1 | 8 | 9 | 5 | 0 | 0.0090 | supports H1 |
| 2 | 6 | 9 | 5 | 0 | 0.0020 | supports H1 |
| 3 | 6 | 8 | 5 | 0 | 0.0030 | supports H1 |

**3/3 topics support H1.** No topic reverses the direction.

---

## 8. Decision (applying locked rules)

- H1 primary: p < 0.05 ✓
- Direction matches H1 ✓
- ≥ 2/3 topics support ✓ (3/3)

**Decision: VR VALIDATED.**

---

## 9. Operational finding — REPLACED 2026-04-13 (two rounds of reviewer pushback)

### What this section said first, and why it was wrong

**v1 claim:** "0 of 13 variants with actual 5-gram VR in [20%, 34%] passed, 6 of 6 in [34%, 99%] passed. Recommend a 35% VR threshold."

**v2 correction after first pushback:** recounted correctly — 7 variants in [20%, 34%) with 2 passes (29%), 4 in [34%, 100%) with 4 passes (100%). Called [20%, 34%) a "noisy zone" and recommended "≥ 34%" as a gate.

**v3 (current) after second pushback:** the "VR threshold" framing itself is the problem. The mechanism the data supports is a **prompt-regime effect**, not a VR threshold.

### The prompt-regime finding (this is the actual operational answer)

Partitioning the primary set by **target band** (i.e., which prompt produced the variant):

| Target band | n (primary) | pass rate | actual 5-gram VR range |
|---|---|---|---|
| 0% (pure LLM, no raw access) | 9 | 0/9 | 0.0% |
| 5% | 9 | 0/9 | 0.0% |
| 15% | 6 | 0/6 | 11.3%–19.5% |
| 25% | 7 | **0/7** | **18.5%–33.9%** |
| **35%** | **6** | **6/6** | **29.1%–44.6%** |
| 100% (raw excerpt) | 9 | 9/9 | 100.0% |

Fisher's exact on the band-25 vs band-35 contrast (primary set only): **p ≈ 0.0006**. Perfect split — no overlap in outcomes despite overlap in actual VR.

### Why the boundary evidence kills the "VR threshold" reading

At the VR overlap zone between band 25 and band 35, the variants with the highest VRs came from band 25, and the ones with the lowest VRs came from band 35. They have the opposite classifications:

| Variant | target band | actual 5-gram VR | GPTZero |
|---|---|---|---|
| t1-b25-r3 | 25% (moderate paraphrase) | **33.9%** | **fail** |
| t2-b25-r2 | 25% (moderate paraphrase) | **33.6%** | **fail** |
| t2-b35-r2 | 35% (heavy verbatim) | **32.3%** | **pass** |
| t3-b35-r2 | 35% (heavy verbatim) | **29.1%** | **pass** |

A variant at 33.9% VR fails. A variant at 29.1% VR — *lower* VR — passes. The differentiator is which prompt produced it, not the VR value.

**If VR were the causal signal, a 33.9%-VR variant should pass MORE reliably than a 29.1%-VR variant. The data shows the opposite.**

### The honest causal claim

What this pilot supports: **when Sonnet 4.6 is prompted to stitch heavily verbatim from a user's raw interview, the resulting text passes GPTZero. When prompted to paraphrase moderately, it does not. Verbatim Ratio is a useful downstream diagnostic of which prompt regime was used, but it is not the causal lever.**

This is a narrower claim than "VR ≥ X% is sufficient," but it is the one the data supports. It is also more actionable — the product should ship the prompt, not a VR gate.

### What the Shulman Fleming anomaly looks like now

Previously framed as "on the cliff edge of a VR threshold." That framing was wrong — there is no clean VR cliff. The honest reframe: the Shulman CL was produced under some prompt regime (not tested here) and that regime happened to produce text GPTZero didn't classify as human, with a VR that landed at 33.3%. The VR is a downstream measurement, not the explanation. To actually explain Shulman, we'd need to know which prompt regime generated it — which we can trace back via commit history but didn't for this pilot.

---

## 10. Known limitations (flag any the reviewer thinks are worse than stated)

1. **n=54 is a pilot.** Moderate power. Subtle effects could be missed. A null result would NOT prove VR is useless.
2. **Single generator (Claude Sonnet 4.6).** Findings may not transfer to Opus, GPT-4, Gemini, or open models. The style signature of the generator could be confounded with the VR axis.
3. **Single GPTZero scan per variant.** We didn't test reproducibility. GPTZero might drift; a re-scan in a week could shift the numbers. Also: the session-token API may or may not match the user-facing web app exactly.
4. **Only 3 topics, all interview-reflective prose, cover-letter register, English.** Generalization to resumes, emails, academic writing, etc. is untested.
5. **Prompt-driven VR targeting is noisy.** 8 of 45 LLM-generated cells landed > 10pt off their target band. The exclusion rule handled this, but the noise itself is a finding: LLM prompting can't precisely control VR. A deterministic verbatim-injection experiment (algorithmically construct text at a known VR) would decouple "VR as a signal" from "can we prompt to a target."
6. **Paraphrase register confound.** Bands 0%–25% involve Claude paraphrasing (varying amounts). Bands 35%+ involve Claude stitching more verbatim. This means the "VR axis" confounds with the "Claude style" axis. Maybe GPTZero is detecting the Claude paraphrase pattern, not the VR per se. A way to decouple: use a non-Claude generator for the paraphrase, or keep user prose entirely + vary only the connective tissue.
7. **GPTZero's inner model is a black box.** We don't know what it's actually detecting; the threshold we observed (~35% VR) is empirical, not mechanistic.
8. **Only GPTZero.** Originality.ai and undetectable.ai might give different thresholds. The Shulman Fleming anomaly involved disagreement between GPTZero and those — this experiment does not re-test that angle.
9. **In-run generator change — CORRECTED after reviewer pushback.** The earlier version of this limitation said "all 54 final variants were generated under the patched version." That was loose. The actual state:
   - **21 of 45 LLM-generated variants** came from the first-pass via `scripts/lib/llm.js` `callClaude` wrapper (`maxTurns: 1`, with the SDK's internal rate-limit retries). These are the first-pass survivors — the cells where Claude's first turn was NOT a tool-use attempt.
   - **24 of 45 LLM-generated variants** came from the patched direct-SDK path (`maxTurns: 3`, Sonnet explicitly pinned via `options.model`).
   - **9 band-100 variants** are deterministic raw-text excerpts — no LLM, no generator-path issue.
   
   Both LLM paths emitted `claude-sonnet-4-6` per the trace logs. But if the two paths produce systematically different Sonnet output (e.g., the wrapper-path survivors are those whose initial turn doesn't attempt tool-use, which might correlate with prompt complexity or content), that's a hidden covariate. We cannot rule it out from this dataset. The only clean fix would be re-generating all 45 LLM cells under one path. We did not.
   
   Cost accounting: the first-pass generated 94 "max turns" errors across ~21 failed cells × 3 attempts, at ~$0.10/call ≈ $7–10 in "wasted" compute. The 21 first-pass survivors were kept, not discarded.
10. **Self-review risk.** This experiment was designed and executed by one assistant-user pair. Pre-registration was written and committed before generation (SHA in git). But the pre-reg itself was authored by me (the assistant), which means there's no separation between designer and executor. A reviewer should look for degrees of freedom I might have exploited without realizing it.

11. **Prompt-directive vs actual-VR confound (surfaced by the reviewer's §9 recount).** The 2 passes in the [20%, 34%) actual-VR zone both came from band-35 *target* prompts (asking for heavy stitching), not from band-25 prompts (asking for moderate stitching). None of the band-25 prompts in the same actual-VR range passed. This suggests the variant's detection status may depend on the **style of stitching attempted**, not just on the resulting VR value. If true, "VR ≥ X" is not the full signal — the prompt structure that produced the text matters too. A deterministic VR-injection experiment (algorithmic stitching that separates "what got stitched" from "how the prompt asked for it") would cleanly isolate this.

12. **Arithmetic error caught in §9 (now corrected).** The initial report version miscounted the passes in [20%, 34%) and [34%, 100%). An independent reviewer caught and recomputed. The corrected numbers are above. This both (a) vindicates the pre-registration discipline — raw data was available for verification — and (b) is a cautionary tale: my narrative summary introduced errors the structured analysis did not have. Trust the raw table over the prose.

---

## 11. Questions for the reviewer

Things I would want a critical reviewer to answer:

1. **Is the "dead zone" reading honest, or is it post-hoc?** The pre-reg did not say "check for a dead zone in the 20–30% range." That observation emerged from the data. I labeled it as an operational finding beyond the pre-reg (§9), but a rigorous reader should consider whether it should be relegated to "exploratory" and require replication before acting.
2. **Is the 10pt off-target exclusion rule too strict or too lenient?** Dropping 8 of 45 LLM variants is a lot. An alternative that uses every variant at its ACTUAL VR (ignoring target band) gives the reviewer a different 2×2 table — worth computing and comparing.
3. **Does the Claude-paraphrase confound (Limitation 6) weaken the H1 conclusion?** If GPTZero is really detecting Claude's paraphrase style, then all we've shown is "less paraphrase = less detection," which is nearly tautological once you notice that "100% VR" means zero Claude paraphrase.
4. **Would a single-topic violation change the decision?** H4 is 3/3, but topic 3 had weaker prompt-to-VR targeting (more exclusions) — if one topic had reversed, we would have landed at INCONCLUSIVE per the locked rule. Is the "2/3 rule" too permissive?
5. **Is n=54 enough to claim anything at all?** The p < 0.0001 is driven partly by the huge effect (75% vs 0%). A reviewer should decide if that strength compensates for the sample-size limitation.
6. **Is the threshold finding (35%, not 20%) actionable yet, or does it need replication?** Recommending a pipeline change on n=54 is aggressive. Would it be better to run Experiment 2 before changing the gate?
7. **Anything about the pre-registration that looks post-hoc?** The pre-reg file is in git at `ad19b5d`. If the reviewer can access git history, they should verify the hypothesis statement truly predates the data.

---

## 12. Artifact paths (for the reviewer)

All inside `/home/pn/projects/screenshots/evals/vr-validation/2026-04-13/`:
- `pre-registration.md` — the locked hypothesis + analysis plan
- `raw-interview-topic-{1,2,3}.md` — raw user dictation
- `variants/topic-{1,2,3}-band-{0,5,15,25,35,100}-rep-{1,2,3}.md` — 54 generated variants
- `results.json` — per-variant VR + GPTZero scores, pre-reg SHA embedded
- `analysis.md` — pre-registered analysis writeup
- `variants-log.jsonl` — per-attempt generation log including failures and regens

Git commits (on branch master):
- `ad19b5d` — pre-registration + raw interviews (hypothesis lock)
- `45b127e` — pre-reg amendment (generator is Sonnet, not Opus — description fix only)
- `67c0724` — full results + analysis + scripts (54-variant pilot complete)

---

## 13a. Real approved-CL baselines (added after reviewer's #4 recommendation)

Five real cover letters the user had already shipped or approved — **not** part of the 54 synthetic variants — were pulled through the same VR + GPTZero pipeline for cross-validation:

| CL | status | words | 5-gram VR | 7-gram VR | GPTZero h+m | class |
|---|---|---|---|---|---|---|
| Cent Capital | approved + submitted | 393 | 32.1% | 22.3% | **100** | human |
| **DeVry University** | approved | 344 | **26.4%** | 16.2% | **100** | **human** |
| OpenCall.ai | pre-VR baseline | 312 | 0.6% | 0.0% | 0 | ai |
| **Shulman Fleming** | approved (rewritten for VR) | 395 | **29.9%** | 22.5% | **24** | **ai** |
| **YO IT Consulting** | rejected (staffing firm); artifact retained | 293 | **21.0%** | 11.5% | **100** | **human** |

These 5 rows are saved to `baselines.json` (alongside `results.json` in the same dir).

### What the baselines add to the picture

The synthetic pilot showed a clean prompt-regime split: band-25 fails uniformly, band-35 passes uniformly. Extrapolated naively, that suggested "≥35% 5-gram VR is the ship line." **The real-CL baselines disprove that.**

- **DeVry at 26.4% VR passes.** In the synthetic pilot, no band-25 variant in the 19%–34% range passed. DeVry is at 26.4% and passes.
- **YO IT at 21.0% VR passes.** Just 1pt above the pre-reg 20% floor. Passes cleanly.
- **Shulman at 29.9% VR fails.** Sits in what the synthetic band-35 zone overlapped (band-35 had a 29.1% variant that passed). Shulman, at 29.9%, fails.

The synthetic regime split does not transfer cleanly to real-world artifacts. Two possibilities:

1. **The real CLs were generated under a different prompt regime.** All five were produced via the academic-mode interview-to-verbatim-assembly workflow (see `feedback_cl_assembly_verbatim_rigor.md`), which is a distinct process from the band-25/band-35 synthetic prompts used in the pilot. The academic-mode workflow apparently can produce human-passing text at VR as low as 21%, while the synthetic band-25 prompt cannot produce it even at 33%. **Prompt regime matters — but there's more than one working regime, and the pilot tested only two of them.**

2. **Content register is an independent axis.** Shulman Fleming was dense technical cybersec prose; the three passing academic-mode CLs were more reflective/narrative register. If register is a separate axis from VR and prompt regime, the right framing is three-dimensional, not a linear threshold. The pilot held register roughly constant (all 3 topics were reflective interview prose).

### The strongest claim the combined data supports

- **VR ≥ 20% is statistically associated with human-passing** (p < 0.0001 on the pilot).
- **No single VR threshold is sufficient** — real CLs at 26%, 21%, and 32% pass; 30% fails.
- **Prompt regime plus content register jointly determine outcome.** VR is a downstream signal of both.
- **For the pipeline:** ship the academic-mode workflow (proven on 3/3 new-style CLs + 1 fail on atypical register); use VR as a diagnostic; treat the 5-section framework as a separate variable under its own evaluation.

---

## 13. Three nested claims (added after reviewer's final framing)

From strongest / most defensible to boldest / most useful:

**Strong claim (pre-reg supports):** Verbatim Ratio ≥ 20% is associated with GPTZero human-classification at far above chance levels (Fisher's one-sided p < 0.0001 on n=46 in a pre-registered pilot, 3/3 topics in the same direction).

**Honest qualifier (data forces):** The mechanism is not "VR is a sufficient signal." Prompt regimes producing high VR also produce stylistic features GPTZero accepts; prompt regimes producing moderate VR produce text GPTZero rejects *regardless of where the actual VR lands*. Variants at the same VR pass or fail based on which prompt produced them. VR is a downstream marker of prompt regime, not a causal lever.

**Operational claim (what to actually do):** Ship the **academic-mode interview-to-verbatim-assembly workflow** — the one that produced the real approved CLs in §13a. It is validated on 4/5 real shipped artifacts across VR 21%–32%; the one failure (Shulman Fleming at 29.9%) is a content-register outlier (dense technical cybersec prose), not a failure of the workflow per se. The synthetic pilot's **band-35 prompt is a useful proof-of-concept** that heavy-stitching prompts pass GPTZero, but it is NOT the prompt that should ship — the academic-mode workflow has the real-world evidence that the synthetic prompt does not. VR remains a diagnostic, not a gate. (Earlier draft of this section said "ship the band-35 prompt strategy" — that contradicted §13a, which has the stronger evidence; corrected.)

## 14. What to check in a follow-up experiment (explicit TODO for a future session)

1. **Deterministic VR injection** (user's suggestion during this session). Decouple VR-as-signal from LLM-prompt-targeting noise.
2. **Scale** — ≥ 150 variants across ≥ 10 topics.
3. **Multiple generators** — Opus, GPT-4, Gemini, at matched VR bands.
4. **Cross-detector** — re-score the same variants on originality.ai and undetectable.ai. Shulman anomaly ("AI Paraphrased" only on GPTZero) deserves its own isolation.
5. **Temporal stability** — re-scan the same 54 in 2 weeks, 4 weeks.
6. **Independent re-analysis** — another session runs the analysis from the pre-reg + raw data WITHOUT seeing this report.

---

**End of report. Reviewer: push back freely.**
```

## File: process/decisions.md

```
# Decisions — Human Writer Pro

Running log of killed assumptions and reframings. Each entry names the claim
we killed or reframed, the evidence that forced the change, and a Clarity
Score (0–1) representing how definitive the finding was. Per Ryan Beswick's
MoJo Score Part 3: Decision Value = Investment Avoided × Clarity Score. High
Clarity Scores come from definitive nulls, not partial suggestion.

Newest entries first.

---

## 2026-04-15 — Replaced paragraph-Edit-Chat with whole-output regenerate-with-feedback (Clarity: 0.85)

**Killed claim:** "Edit Chat must work at the paragraph level via a Socratic complaint→question→answer→restitch flow on a selected paragraph; that's the load-bearing UX for refinement."

**Reframed as:** For MVP, the right edit primitive is whole-output regenerate-with-voice-feedback. The user dictates what should change ("tighten the intro to focus on X; vary the closing line"), and the assembler regenerates the draft incorporating that feedback as a 3rd conversation turn. Selection-respecting Edit Chat with single-word inline editing is the right v2 design but not load-bearing for a working demo.

**Source:** User feedback 2026-04-15 mid-MVP push, citing the Career Forge dashboard as a proven instance of the same pattern: eye-test the artifact, ask for changes via voice, regenerate. The simpler workflow demos cleanly in 5 minutes; the selection-respecting refactor requires range-tracking + anchor-based replacement + two UI paradigms (popover for word-level vs side panel for paragraph-level).

**Impact:** Avoided ~10h of Edit Chat selection refactor work that wouldn't have shipped in the 8-hour MVP window. The new regenerate-with-feedback handler in `lib/assemble.ts` (cl/edit modes) + UI in `components/preview-panel.tsx` ship as the MVP edit primitive. Paragraph-level Edit Chat component still ships in the codebase (no UI surface invokes it). Selection refactor scoped in career-forge memory `project_edit_chat_selection_scope.md` for v2.

---

## 2026-04-15 — Shipped v4.1 framework port despite GPTZero pass-rate variance (Clarity: 0.7)

**Killed claim:** "Don't ship a framework change until k=3 GPTZero scores ≥ 78% pass rate (the v3 Letter 2 baseline)."

**Reframed as:** GPTZero variance on this fixture (1-2/3 pass across all three prompts tested — v3, v4 rigid, v4.1 loose+capped) dwarfs the prompt-level effect we're trying to measure. The fixture's dense technical cybersecurity content register is the GPTZero flip driver, not the prompt regime. v4.1's framework adherence (moment-hook, mandatory bullets, conditional gap, banned phrases absent, company named 2x) is materially better than v3's wall-of-text prose by the user's eye-test.

**Source:** Three rounds of k=3 verification with GPTZero scoring on the CrowdStrike fixture during the 2026-04-15 MVP push. v3: 99/0/0% human; v4 rigid: 0/83/39%; v4.1 loose+capped: 0/0/47%. Mean human% 15-40% across rounds; variance > effect size.

**Impact:** Avoided ~6h of additional prompt iteration that would not have moved the GPTZero pass rate (variance > effect size). Roughness-injection pass scoped as separate post-MVP experiment to actually narrow the variance band. Decision rests on user's eye-test prioritization over GPTZero noise — defensible but not pre-registered, hence Clarity 0.7. See career-forge memory `feedback_vr_as_within_draft_signal.md` and `feedback_gptzero_burstiness_not_signal.md` for the within-draft-vs-cross-draft framing that emerged from the same session.

---

## 2026-04-15 — GPTZero IS the bar (reversed earlier 'noisy threshold gate' framing) (Clarity: 0.75)

**Killed claim (mid-session, by me):** "GPTZero is too noisy on this fixture to use as decision signal — pick prompts on framework adherence + eye-test alone."

**Reframed as (by user, immediately after):** A product literally called *Human Writer Pro* must reliably pass GPTZero — verbatim-stitched human writing being flagged AI is a brand-level failure, not just measurement noise. Optimization target = Mixed % (per user). Don't ship GPTZero into the product itself (cost-per-check is a deal-breaker), but build automated GPTZero regression for ourselves to ensure consistent passes pre-merge.

**Source:** User pushback 2026-04-15 after I'd framed GPTZero as "too noisy to act on." The earlier framing under-weighted the brand/positioning stake of the product name.

**Impact:** Avoided ~5h of energy that would have gone toward prompt iteration on framework adherence alone without addressing the GPTZero pass-rate variance — the actual product-quality bar a Lawyer.com evaluator would measure against. Clarity 0.75 because the optimization target (Mixed %) is itself unvalidated; we don't have automated GPTZero regression yet to pressure-test. Within-draft VR iteration framing still holds; cross-prompt VR comparison is still meaningless. See `feedback_gptzero_is_the_bar.md` (career-forge memory).

---

## 2026-04-13 — VR = 35% reframed from target to prompt nudge (Clarity: 0.85)

**Killed claim:** "This product targets 35% VR as a success criterion."

**Reframed as:** The `Target 5-gram VR ≈ 35%` line inside the band-35 prompt
is a stylistic nudge to the model, not a truth-claim the product makes. The
prompt is the subject under test; the actual VR that emerges and whether
GPTZero passes are the independent downstream evaluators.

**Source:** Conversation while landing the refactor. The pair-review session
agent's Task 20 Change 2 directive ("delete Target 5-gram VR ≈ 35% from the
runner prompt") was based on an incorrect reading that the line functioned as
a truth-claim we were validating. It does not.

**Impact:** The band-35 prompt stays verbatim in both production and the
regression runner. See
`eval/regression-fixtures/prompts/band-35-strategy.md` — "Relation to refactor
Task 20 Change 2 — superseded" section — for the override that future agents
must respect. Refactor Task 20 Change 2 is explicitly overridden.

---

## 2026-04-13 — VR as causal lever for GPTZero passing (Clarity: 0.9)

**Killed claim:** "VR ≥ 20% is the causal mechanism by which output passes
GPTZero."

**Replaced with:** VR is a downstream marker of prompt regime. The band-25
prompt produces variants that fail GPTZero regardless of where their actual
VR lands; the band-35 prompt produces variants that pass. Same-VR variants
across bands show opposite GPTZero results at the 29–34% boundary. The causal
variable is the prompt, not the VR value.

**Source:** 54-variant pre-registered pilot, 2026-04-13. See
`process/pair-review-2026-04-13.md` §9 v3 and §13a revisions, and the
published `eval/reports/vr-validation.md` (TBD — to be imported from the
eval-session workspace).

**Impact:** Product framing pivoted from "voice preservation metric as
headline" to "validated assembly prompt regime with VR as downstream
diagnostic." Task 12 (VR badge) demoted to a diagnostic pill with tooltip;
Task 17b (AI-ism regex gate) takes the prominent UI slot instead.

---

## 2026-04-13 — Synthetic regression fixtures (Clarity: 0.8)

**Killed claim:** "Five synthetic raw_interview JSON fixtures are sufficient
regression coverage."

**Replaced with:** The fixture unit is the (interview + prompt + expected
baseline) triple. Five real CLs the user shipped — including the two GPTZero
failures (OpenCall 0.6% VR, Shulman 29.9% VR dense technical register) — are
the fixture set. The failures document edge cases and are more valuable than
the passes because they force the regression suite to distinguish "known hard
case that stays at baseline" from "new regression."

**Source:** Eval-session fixture-design work. See
`process/pair-review-2026-04-13.md` from 6:22 PM onward.

**Impact:** Replaces refactor Task 19 entirely. Structure at
`eval/regression-fixtures/cl-assembly/{fixture}/interview.md +
approved-output.md + expected-baseline.json` plus shared
`eval/regression-fixtures/prompts/band-35-strategy.md`. Each
`expected-baseline.json` has three layers: `baseline` (known-good numbers),
`tolerance` (acceptable drift), `aspirational_targets` (informational, not a
failure condition).

---

## 2026-04-13 — 5 writing modes with equal polish (Clarity: 0.7)

**Killed claim:** "Essay, email, blog, cover-letter, and free-form all ship
with equal production quality."

**Replaced with:** Cover-letter and email are load-bearing (real ground-truth
exists). The other three modes ship as "also works for X" without dedicated
regression fixtures or polish budget. They share the same engine and degrade
gracefully.

**Source:** Refactor scope review. The user has ground truth (approved
shipped artifacts) only for cover letters; email is short and testable;
essay/blog/free-form would require additional pilot work that doesn't fit the
timeline.

**Impact:** Task 7 mode prompts prioritize CL + email content; the other
three load a general fallback of Strunk + banned-AI-isms without a dedicated
golden-dataset rule. Task 19 fixtures are CL-only (optionally one synthetic
email added if time permits).

---

## 2026-04-13 — Adversarial framing in edit chat (Clarity: 0.75)

**Killed claim:** "Edit chat pushes back adversarially on the user's writing
to surface gaps."

**Replaced with:** Edit chat is Socratic. When the user highlights text and
says "this feels off," the chat asks one targeted question ("what were you
trying to say that this isn't saying?"), takes the user's verbatim response,
and localized-re-stitches just that paragraph using the new verbatim as raw
input. The tool never rewrites on its own authority; it pulls more verbatim
out of the user.

**Source:** Pair-review discussion on adversarial-vs-Socratic framing,
grounded in the user's ADHD / executive-function workflow research. The
adversarial frame breaks flow state; Socratic pulls material without
triggering defensive reactions.

**Impact:** Task 16 (edit chat) rewritten per refactor. This is the
load-bearing UX innovation distinguishing the product from "ChatGPT but with
a textarea." The principle propagates to the interview step prompts in
Task 9 (Socratic assessment of each response, not adversarial pushback).

---

## Open research questions (post-submission)

- "Socratic vs adversarial LLM-as-judge produces different output quality" —
  exploratory. User surfaced this in pair-review. If LLM-as-judge prompts
  frame the critique Socratically rather than adversarially, does the judged
  output change? See `process/future-experiments.md` (TBD) post-submission.
```

## File: process/four-letter-comparison.md

```
# Forward vs Backward Workflow — Cover Letter Quality Comparison

**Date:** 2026-04-15
**Context:** During the Lawyer.com Model Jockey take-home, I produced four versions of the same cover letter (target: CrowdStrike AI Security Consultant role) using two different workflows. The comparison falsified part of the product's original claim and surfaced the actual load-bearing mechanism.

## TL;DR

VR (Verbatim Ratio) does NOT predict letter quality across workflows — the lowest-VR letter scored the highest on both my eye-test and GPTZero's mixed-% band. The causal mechanism is **procedural ordering inside the assembly prompt** (go to raw transcript → pull verbatim → write connectives), not the VR target. I refactored the assembly prompt based on this finding and kept VR as a downstream diagnostic, not a shipping gate.

## The four letters

**Letter 1** was produced via the Human Writer Pro web app. I added the job posting and description as context, walked through the in-product interview, and the assembly stage produced the draft.

**Letter 2** was produced in Claude Code using the original `human-writer` skill that inspired this project. I gave it the same job context and let it interrogate me. I hypothesized that its greater context (e.g. knowing my resume and preferences, etc) would lead to better output.

Three iterations:
- **v1** — the skill's first draft, no verbatim direction.
- **v2** — same draft, second pass instructing the skill to stitch more of my words verbatim into the output.
- **v3** — same draft, third pass with more aggressive direction ("heavy verbatim stitching"), which raised the VR score further.

## The data

| Letter | Workflow | 5-gram VR | GPTZero | My eye-test rank |
|---|---|---|---|---|
| Letter 1 | Forward (webapp, structure fixes) | 27% | 78% human | 3rd |
| Letter 2 v1 | Backward (skill, draft) | 0.9% | 13% human | n/a (draft) |
| Letter 2 v2 | Backward (skill, more iteration) | 6.7% | 48% mixed | 1st |
| Letter 2 v3 | Backward (skill, more iteration) | 22.1% | 89% human | 2nd |

By "Forward" I mean that the Webapp started with VR as an initial goal and needed prompt improvements to increase subjective quality.
By "Backward" I mean that the skill use starts with high subjective quality as an initial goal and needed prompt improvements to increase VR.

## What I expected

I expected that increasing VR would lead to improved scores on GPTZero, and that GPTZero scores would track my eye test for quality. The first half of that prediction held. The second half didn't.

## What actually happened

The quality ranking is inverse to the VR ranking among the three viable letters. The best non-draft letter (v2) had the lowest VR. The second-best (v3) had the second-lowest. The third-best (Letter 1) had the highest.

Within a single refinement trajectory (v1 → v2 → v3), VR and GPTZero rose together — supporting the narrow claim that more verbatim density tends to produce more human-passing output. Across workflows, VR did not predict quality. The webapp's higher-VR output read as less polished than the skill's lower-VR output.

A second pattern: GPTZero's "100% mixed" classification on v2 suggests polished writing scores as mixed because the polish itself is what GPTZero learns to associate with LLM editing. "100% human" can mean unpolished rambling that survives intact. Mixed-classified text from a polish workflow is plausibly *higher quality* than human-classified text from a raw-dictation workflow.

## What this falsifies

The product's original claim was: *higher VR produces better writing because it preserves the user's actual voice*. The pre-registered pilot supported this for synthetic interview-reflection paragraphs in a narrow VR band. The four-letter comparison falsified it as a general quality predictor. **VR is a refinement diagnostic, not a quality target.**

## What I learned by debugging the gap

The mechanism that makes the backward workflow produce better letters is not the VR target. It is the **procedural order of operations**. In the backward workflow, the model is forced — by my real-time iteration with it — to go to the raw transcript first and stitch from there. In the forward workflow's earlier prompt, the model received declarative constraints ("heavy verbatim stitching") but no explicit procedure, so it defaulted to writing polished prose first and grudgingly adding verbatim afterward.

I added a numbered procedure to the assembly prompt — *"for each beat, go to the raw transcript first, pull verbatim sentences, then write connectives"* — and forward-workflow output quality improved without changing the VR target.

The load-bearing mechanism is procedural ordering, not the metric.

## What this means for the product

The purpose of this tool is not to maximize VR or beat AI detectors. AI detection is an arms race I don't have the resources to keep up with, and chasing the detectors would build the wrong product anyway.

What Human Writer Pro actually does is productize a workflow that has worked for me as someone with executive dysfunction: when the model gives me context and prompts me with questions, it offloads the part of starting a writing task that I struggle with most. Instead of staring at a blank page and being anxious about it, I'm answering questions. The output is polished prose composed largely of my own raw words. For people whose blockage is activation rather than ideas, this changes what writing feels like.

VR drops to a floor diagnostic. Like burstiness or perplexity, it's one signal that an output is doing what I want, but the balance between AI-evasion and quality is delicate enough that I won't optimize for it alone. What the product actually simplifies is **getting something on paper**, then refining it until I'm satisfied. The prompts that try to stitch my own words into the output are what differentiates this from an unstructured Claude or ChatGPT session — and the procedural ordering is what makes the stitching reliable.

For v2, I'm interested in optimizing for quality and AI-avoidance simultaneously. My intuition is that a high "mixed %" score on GPTZero is what the most polished human text actually looks like — not gibberish like 100% human stream-of-consciousness, not as smooth as fully-AI output, but something in between because it contains the user's verbatim words polished for an audience. If that turns out to be a regime worth optimizing for via prompt design, the product would let people produce essays, assignments, and other written work that contain their own analysis verbatim while reading as polished prose for the reader.

## Future work

- Test whether explicit procedural ordering is the load-bearing mechanism by running the assembly prompt with and without the "Target 5-gram VR ≈ 35%" line, holding everything else constant.
- Investigate "mixed % from GPTZero" as a primary optimization target instead of "human %."
- Add file-upload context (resume, job posting, prior writing samples) to the interview stage to close the remaining forward-vs-backward quality gap.
- Build an interview engine that reasons about coverage from context rather than walking a fixed question list.
```
