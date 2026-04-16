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
