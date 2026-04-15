# Email Response Prep — Lawyer.com Mojo Take-home

Reference card for dogfooding the response email through HWP itself. This
is a scaffolding document — facts and angles you can pull from during the
interview, NOT a draft. Your voice carries the email; this just keeps the
specific numbers and framings within reach.

## Workflow

1. Open HWP at <http://localhost:3000>
2. Paste Ryan's full email into the **Context** panel (the one starting
   "I am following up on your application for the Model Jockey position...").
3. Click **Start Interview**. Answer the questions naturally.
4. When the interviewer signals enough material, click **Assemble**.
5. Refine via **Regenerate with feedback** as needed.
6. Copy → paste into your email client.

## What Ryan asked for

1. Build something real (✅ HWP)
2. Share the output: link / repo / screen recording (✅ repo at
   `github.com/oklysit/human-writer-pro`; Loom optional)
3. Brief description of orchestration: which models, what harnesses,
   workflow for high MoJo Score

## Key talking points (use what fits)

### What HWP is in one sentence

A voice-preserving AI writing assistant that asks before it drafts —
the output sounds like you wrote it because most of it literally was.

### MoJo Score angle (Output / Human Time)

- Cover-letter cold-start time: 60+ minutes if you're being honest
- HWP cold-start time: 5-10 minutes of dictation → submittable draft
- One Sonnet 4.6 round-trip per assembly
- Self-demonstrating: this email was written using HWP

### Orchestration — in-product (5 layers)

| Layer | Model | Role |
|---|---|---|
| Adaptive interviewer | Sonnet 4.6 | One question at a time, judges readiness, pushes back |
| Assembler | Sonnet 4.6 | Verbatim-stitching prompt; killer-CL framework when in CL mode |
| Regenerate-with-feedback | Sonnet 4.6 | 3-turn conversation: raw / draft / feedback |
| Voice input | Web Speech API | Browser-native, audio never leaves the browser |
| File context | pdfjs-dist + mammoth | Browser-side .pdf/.docx/.md/.txt extraction |

### Orchestration — in-build (subagent-driven dev)

- **Opus 4.6** = orchestrator (architectural decisions, reviewing output)
- **Sonnet 4.6** = implementer subagents (focused tasks, fresh context per task)
- **Opus 4.6** = reviewer subagents (spec compliance + code quality, fresh context)
- 5-step loop: spec extraction → implementation → spec review → code review → mark complete
- Documented in `MOJO-SETUP.md` per Beswick Part 1-3

### Concrete numbers (as of 2026-04-15)

- **Repo**: github.com/oklysit/human-writer-pro
- **Tests**: 127 unit tests passing
- **Bundle**: 205 KB First Load JS
- **MoJo Score**: 22.3x (Senior IC hours framework, mid/fair) at 13.2h
  cumulative Active Hours
- **Decision Value log**: 6 entries, 30.45 weighted hours
- **Production build**: clean
- **VR validation pilot**: 54-variant pre-registered experiment
  (Fisher's p<0.0001) — established the band-35 verbatim-stitching
  prompt regime

### Why HWP (not just Career Forge)

- Career Forge = the multi-agent pipeline that runs daily for the
  full job-application lifecycle (orchestration depth)
- HWP = the productized output of one component — the assembly engine
  that stitches verbatim phrasing
- Together: "I built the orchestration. Then productized the load-bearing
  piece for end-users."

### What's deferred (honest scoping)

- Multi-mode polish (academic, email, free-form) — mode hardcoded to
  cover-letter for the MVP demo
- Selection-based Edit Chat with single-word inline editing
- Roughness-injection pass to narrow GPTZero variance
- Automated GPTZero regression at statistically significant n

These are documented in `process/post-mvp-backlog.md` and
`process/future-experiments.md`.

### Closing options (vary across emails)

- "Repo's at github.com/oklysit/human-writer-pro — try it with your
  own key, oklyspimentel@gmail.com if you want to talk."
- "I'd like to walk through the orchestration in a 30-minute call —
  oklyspimentel@gmail.com."
- "Reach me at oklyspimentel@gmail.com."
- Skip the closing — end on the last content sentence.

Avoid: "I look forward to hearing from you", "thank you for your
consideration" — AI-CL tells.

## Suggested email length

200-350 words. Long enough to land the orchestration story, short
enough to respect Ryan's "applications coming in fast and furious"
context.

## After sending

Optionally record the Loom — captures you using HWP to write *this
email*, which is the cleanest possible MoJo demo (the product working
on its own meta-task).
