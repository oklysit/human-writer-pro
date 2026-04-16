# Human Writer Pro

A voice-preserving AI writing assistant that asks before it drafts. Built so the output still sounds like you wrote it — because most of it literally was.

You upload context (a job posting, a school assignment + rubric, a research paper). It interviews you about it — one adaptive question at a time, pushing back when answers go vague. Then it assembles a polished draft by stitching your verbatim phrasing — the specific sentences and hesitations that make writing sound human. The output reads as yours because it is.

> **MoJo Score: ~25x** (Scenario B Provisional). A submission-ready cover letter from a 5-10 minute dictation, vs ~60 minutes cold-start. Quality Factor and per-decision Clarity Scores cross-model-validated across four independent reviewers (Opus 4.6 / Gemini 3.1 Pro / GLM 5.1 / Kimi K2.5); TVH benchmarks and Investment Avoided reviewed in a second pass against Beswick's "realistic next increment" test. Full defense, constraints, and sensitivity analysis in [`MOJO-SCORE.md`](./MOJO-SCORE.md) — TL;DR at the top.

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
  interview-engine.ts         Adaptive interviewer + readiness assessment engine
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
- **Selection-based Edit Chat.** MVP ships whole-output regenerate-with-feedback only; the paragraph-level edit-chat component exists in the codebase but no UI surface invokes it. Right design is text-selection-respecting (any range — word, phrase, paragraph) with inline popover edits for short selections.
- **Roughness-injection pass.** Post-assembly pass that re-introduces sentence-length variance without losing the verbatim-stitched core. Targets the dense-technical-content register edge case where AI detection flips on otherwise-good output.
- **Automated GPTZero regression.** Statistically significant n per fixture pre-merge.

## Decision Value highlights

Seven decisions this build killed or reframed. Clarity Scores are **cross-model averages** from four independent reviewers (Beswick Part 3 definition):

| Decision | Cross-model Clarity |
|---|---|
| VR-as-causal-lever reframed to downstream marker; prompt regime is the lever (n=54 pilot, reviewer-revised) | **0.90** |
| AI-isms scoped to dismiss-only (pattern-match false positives unavoidable) | **0.89** |
| Inline text editing deferred (regenerate-with-feedback covers the use case) | **0.84** |
| Paragraph-level Edit Chat replaced with whole-output regenerate-with-feedback | **0.80** |
| MoJo submission framed as HWP (not Career Forge); multi-mode deferred | **0.80** |
| "GPTZero is noise" reversed — product name makes it the bar; optimize Mixed % | **0.74** |
| Shipped v4.1 framework port despite GPTZero 1/3 pass-rate variance | **0.68** |

Full reasoning + Investment Avoided per entry in [`process/decisions.md`](./process/decisions.md). Cross-model IA + Clarity review in [`MOJO-SCORE.md §6`](./MOJO-SCORE.md). Future experiments in [`process/future-experiments.md`](./process/future-experiments.md).

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
