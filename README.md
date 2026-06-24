# Human Writer Pro

A voice-preserving AI writing assistant that asks before it drafts. Built so the output still sounds like you wrote it — because most of it literally was.

You upload context (a job posting, a school assignment + rubric, a research paper). It interviews you about it — one adaptive question at a time, pushing back when answers go vague. Then it assembles a polished draft by stitching your verbatim phrasing — the specific sentences and hesitations that make writing sound human. The output reads as yours because it is.

> **Roughly 5-10x faster cover-letter drafting:** a submission-ready draft from 5-10 minutes of dictation vs ~60 minutes cold-start. Output quality and per-decision rationale cross-model-validated across four independent reviewer models (Opus 4.6 / Gemini 3.1 Pro / GLM 5.1 / Kimi K2.5).

## What this is (and isn't)

**This is a generalized writer.** Cover letters are the most-polished mode shipped today; the architecture supports academic essays, professional emails, and free-form writing on the same engine. The killer-CL framework + bulleted skill-match output you'll see in cover-letter mode is a CL-mode-specific implementation, not the universal HWP behavior.

**This is not a content generator.** You can't draft without first producing your own raw material. The interview gates the assembly button until the model judges you've given it enough to work with — that's architectural, not a policy toggle.

**This is a productized version of a personalized Claude Code skill** — same interview-then-assemble pattern that originated in WGU academic-assignment work, generalized to a web app with voice input and a richer UI.

## Quick start (5 minutes)

Requires Node 18+ and your own [Anthropic API key](https://console.anthropic.com/settings/keys) (new accounts get $5 free credit — enough for dozens of generations). Multi-provider support (OpenAI, Gemini, etc.) is on the [roadmap](./process/future-experiments.md).

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

The build itself runs the same orchestration pattern internally — an Opus 4.6 orchestrator dispatches Sonnet 4.6 implementer subagents for build tasks, with Opus 4.6 reviewers checking spec compliance and code quality on each. See [`docs/build-process.md`](./docs/build-process.md) for the model routing and subagent-driven build process.

## Verbatim Ratio (VR) — measurement, not gate

VR = % of output 5-grams that appear in the raw interview. We ran a pre-registered pilot (n=54, Fisher's p<0.0001) showing prompts using heavy-verbatim-stitching ("band-35") pass GPTZero ~6/6 while moderate-paraphrase prompts ("band-25") fail uniformly — even when their actual VR overlaps band-35's range. The lever is the prompt regime, not the VR target. We track VR as a downstream diagnostic, not a shipping gate.

Full writeup at [`eval/reports/vr-validation.md`](./eval/reports/vr-validation.md). Replication harness at `scripts/eval/`.

## Architecture

- **Next.js 14 App Router** — single-page client app
- **Anthropic SDK (`@anthropic-ai/sdk`)** — direct browser-to-API calls (`dangerouslyAllowBrowser: true`); no backend proxy in production. The user's key lives in browser localStorage only and never reaches a server. This is a deliberate MVP tradeoff for shareability — a production deployment would route through a backend proxy with server-side key vaulting (e.g. AWS Secrets Manager, HashiCorp Vault) and rate-limit + audit at the proxy layer. BYO-key model — see "Quick start" above.
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
  reports/                    VR validation + CL-regression baselines
scripts/                      Eval runner, baseline differ
process/                      Design decisions, review transcripts, dev notes
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

Not in MVP — on the roadmap. Full writeups + budget estimates in
[`process/future-experiments.md`](./process/future-experiments.md).

**Next sprint:**
- **Selection-based inline editing.** Single-word replacements without a full assembly round-trip. Component exists; UI trigger deferred for selection-respecting design.
- **Formatting directives.** "Bold the company name," "add bullet points" as regenerate feedback → markdown output. ReactMarkdown already renders it; needs prompt threading.
- **PDF / DOCX export.** One-click export from the output panel to submission-ready formats.

**Short-term:**
- **Multi-mode polish.** Academic essay, email, free-form on the same engine. Architecture supports it; prompt-tuning + interview-adapter work hasn't shipped.
- **GPTZero "Mixed %" validation.** Test the hypothesis that polished voice-preserved output should optimize for Mixed classification, not 100% Human.
- **Roughness-injection pass.** Re-introduce sentence-length variance post-assembly for dense-technical-content registers.

**Medium-term:**
- **Voice profile memory.** Distill recurring speech patterns from accumulated transcripts into a compact profile that the assembly prompt uses automatically. Productizes the manual voice-profile process from the parent skill.

**Research:**
- **Local model fine-tuning from transcripts.** Use interview Q&A pairs to train a small model (LoRA on Llama / SmolLM) whose natural output approximates the user's voice. Hybrid approach: small model for voice texture, frontier model for structure.
- **Multi-provider support.** OpenAI-compatible endpoint adapter so users can BYO any provider key (OpenAI, Gemini, GLM, Kimi, local Ollama). Currently Anthropic-only.
- **Automated GPTZero regression.** Statistically significant n per fixture pre-merge.

## Key build decisions

Decisions this build killed or reframed, cross-model validated across four independent reviewer models (Opus 4.6 / Gemini 3.1 Pro / GLM 5.1 / Kimi K2.5):

| Decision |
|---|
| VR-as-causal-lever reframed to downstream marker; prompt regime is the lever (n=54 pilot, reviewer-revised) |
| AI-isms scoped to dismiss-only (pattern-match false positives unavoidable) |
| Inline text editing deferred (regenerate-with-feedback covers the use case) |
| Paragraph-level Edit Chat replaced with whole-output regenerate-with-feedback |
| "GPTZero is noise" reversed — product name makes it the bar; optimize Mixed % |
| Shipped v4.1 framework port despite GPTZero 1/3 pass-rate variance |

Full reasoning in [`process/decisions.md`](./process/decisions.md). Future experiments in [`process/future-experiments.md`](./process/future-experiments.md).

## Parent project

HWP is the productized output of one component of **Career Forge** — a multi-agent pipeline for the full job-application lifecycle (resume intelligence, scraping, match scoring, artifact generation, review pipeline). The verbatim-stitching pattern in HWP is the same one Career Forge uses to generate cover letters at scale; HWP exposes it as a standalone tool anyone can use.

## Attribution

- **human-writer (personalized Claude Code skill)** — original interview-then-assemble pattern this product is built on
- **Anthropic Claude** (Sonnet 4.6 in the product, Opus 4.6 for orchestration during the build) — generator and judge
- **shadcn/ui + Radix UI** — primitive components
- **Next.js 14 + TypeScript + Tailwind CSS** — app framework

## License

MIT — see [LICENSE](./LICENSE).
