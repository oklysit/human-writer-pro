# Human Writer Pro

<!-- OPENING PARAGRAPH: reserved for Day 4 meta-move.
     User dictates through HWP's own interview flow, assembles with band-35,
     copies output here. Leave this placeholder in place until then.
     See Task 23 §3 in docs/refactor-2026-04-13.md. -->
A voice-preserving AI writing assistant that asks before it drafts.
Web app built for writers who want the output to still sound like theirs —
specifically for ADHD and executive-function-offload contexts where the
hardest part of writing is getting started, not the words themselves.
Productized version of the author's [human-writer Claude Code skill](https://github.com/oklysit/writer),
generalized beyond WGU assignments with a web UI and voice-first input.

## Vision

Two-stage pipeline:

1. **Socratic interview** — one question at a time. Three-state assessment
   (sufficient / partial / insufficient). The tool pushes back on vague
   answers and tracks rubric coverage per writing mode. Assembly is locked
   until the user has produced enough of their own thinking.

2. **Assembly** — band-35 prompt regime: heavy verbatim stitching, minimal
   paraphrase. The prompt regime was validated across a 54-variant
   pre-registered pilot. Output passes GPTZero human-detection when the raw
   interview carries enough material; degrades honestly when it does not.

One-line description: it interrogates first, then writes.

## Ethical defense

The assembly button is disabled until the raw interview contains at least
150 words and a coverage score of 0.6 or higher across the mode's rubric.
This gate is architectural, not a policy toggle. You cannot draft without
demonstrably providing your own thinking first.

The gate reflects the core UX claim: this tool produces your writing, not
writing on your behalf. The distinction matters in academic and professional
contexts where the source of the thinking is what counts.

See `eval/reports/vr-validation.md` (TODO: to land) for the pre-registered
pilot that established Verbatim Ratio as a downstream diagnostic, not a
causal lever.

## Running locally

Requires Node 18+ and your own Anthropic API key.

```bash
git clone https://github.com/oklysit/human-writer-pro
cd human-writer-pro
npm install
npm run dev
```

Open `http://localhost:3000`. Paste your API key into the Settings dialog.
The key persists to your browser's localStorage only; it is never sent to
a server.

### BYO-key architecture

This is a client-side single-page app. It calls Anthropic directly from
the browser using `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`.
The trade-off is straightforward: your key is stored in this browser's
localStorage, which means it is only as secure as the machine you ran
this on. We chose this to keep the product fully serverless and to avoid
ever holding user credentials. A thin backend proxy is the conventional
path for production — this is a deliberate v1 choice, not a permanent
architecture.

## Project structure

- `app/` — Next.js 14 App Router workspace (two-panel editor)
- `components/` — React components (shadcn/ui primitives rewritten for
  Tailwind v3 semantic tokens, plus editorial overrides and product
  components)
- `lib/` — engine (Socratic interview, assembly, edit chat), pure helpers
  (VR computation, coverage score, AI-ism detector), Zustand store
- `lib/prompts/` — mode-specific prompts with GOLDEN_DATASET rules ported
  from the upstream human-writer skill
- `eval/regression-fixtures/cl-assembly/` — 5 real cover-letter fixtures
  (3 passing, 2 documented hard-case failures) used by the regression
  pipeline
- `scripts/eval/` — regression runner (k=3, LLM judge, optional GPTZero)
  and baseline comparator
- `process/` — Decision Value exhibit: pair-review transcript, decisions
  log with Clarity Scores, future-experiments backlog
- `design-system/human-writer-pro/MASTER.md` — editorial design system
  (Playfair Display + Source Serif 4 + JetBrains Mono, gold accent, 2px
  sharp corners)

## Running the regression suite

```bash
# Requires ANTHROPIC_API_KEY in env
npm run eval:cl                               # all 5 fixtures, k=3
npm run eval:cl -- --fixture=shulman-fleming  # one fixture only
npm run eval:cl -- --dry-run                  # plan without calling API
```

Output lands in `eval/reports/cl-regression-{date}.jsonl` and `.md`. Then:

```bash
npm run eval:cl-diff  # compare latest run against baselines
                      # exits non-zero on drift
```

GPTZero is called if `GPTZERO_API_KEY` is set; skipped gracefully otherwise.

## Development operations

See [`MOJO-SETUP.md`](./MOJO-SETUP.md) for ActivityWatch setup, model
routing strategy, git discipline, and the Decision Value log.

## Attribution

- **human-writer Claude Code skill** — original interview and voice
  preservation pattern this product is built on
- **Claude API (Anthropic)** — Sonnet 4.6 generator and judge
- **shadcn/ui + Radix UI** — primitive components (rewritten for Tailwind
  v3 semantic tokens)
- **Next.js 14 + TypeScript + Tailwind CSS** — app framework

## License

MIT — see [LICENSE](./LICENSE).
