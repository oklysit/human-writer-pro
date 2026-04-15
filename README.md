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

Open <http://localhost:3000>, then:

1. Click **Settings** (top-right), paste an Anthropic API key. The key persists to your browser's localStorage only — it never reaches a server.
2. Paste context into the **Context** panel, or upload a file (.pdf / .docx / .md / .txt). For a cover letter, paste the job posting; for a school assignment, upload the assignment PDF + rubric.
3. Click **Start Interview**. Answer one question at a time. Use the mic if you'd rather speak.
4. When the interviewer signals it has enough material, click **Assemble**.
5. Highlight any paragraph that doesn't land and click **Edit paragraph** for a Socratic refine flow.

## The orchestration

| Layer | Model | Role |
|---|---|---|
| Adaptive interviewer | Sonnet 4.6 | One question at a time, judges readiness, pushes back on vague answers |
| Assembler | Sonnet 4.6 | Verbatim-stitching prompt; 5-section killer-CL framework when in cover-letter mode |
| Edit Chat | Sonnet 4.6 (2 calls) | Socratic complaint→question→answer→restitch on selected paragraphs |
| Voice input | Web Speech API | Live transcript, base-snapshot append; no audio leaves the browser |
| File context | pdfjs-dist + mammoth | Browser-side text extraction from .pdf / .docx / .md / .txt |

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
  assemble.ts                 Assembly system prompt (band-35 verbatim stitching)
  interview-engine.ts         Adaptive interviewer + Socratic edit
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
