# Session Handoff — 2026-04-15 (Context-First Shipped)

Successor to `handoff-2026-04-15-session-close.md` (the earlier 2026-04-15 handoff).
This session reopened on `dev/oauth-localhost` and built the context-first
architecture on top of it.

## TL;DR

End-to-end webapp pipeline now produces real CLs. On a real CrowdStrike AI
Security Consultant posting, with the user's resume-db uploaded as context, the
webapp produced a 333-word, 5-paragraph CL at **45% 5-gram VR / 59% GPTZero
human / 1 AI-ism**. User confirmed quality "sufficient" and submittable.

Branch `feat/context-first-no-mode-v3-prompt` is **5 commits ahead of
`dev/oauth-localhost`**, all stable, 127 unit tests + 12/12 headless UI tests
passing, production build clean.

The webapp is **shippable but not gold-standard** yet. Letter 1 (89% GPTZero,
human-writer skill output) still beats the webapp's output because of a
deferred **framework content port** (hook-as-moment, mandatory bullets,
honesty-clause default, close template). User confirmed that's the
**next-session top priority**.

## What got built (commit chronology)

1. **`f098e8a`** — CrowdStrike fixture. Saved the 9 user turns from the prior
   webapp interview as `eval/regression-fixtures/cl-assembly/crowdstrike-ai-security-consultant/interview.md`,
   plus reference outputs (Letter 2 = webapp baseline; Letter 1 = human-writer
   skill output) + README documenting the fixture's purpose.

2. **`43dd62c`** — v3 procedural prompt. Inserted the consultant-memo's
   numbered procedural block + 75% traceability test between the killer-CL
   framework and Pacing in `lib/assemble.ts` SYSTEM_PROMPT, replacing the
   weaker "Pull verbatim clauses…" directive. Position is intentional —
   procedure precedes pacing because Sonnet weights earlier instructions
   more heavily for procedural framing. Kept "Target 5-gram VR ≈ 35%" line.

3. **`777a92f`** — v3 verification harness. `scripts/debug/verify-crowdstrike-v3.ts`,
   pinned to live SYSTEM_PROMPT, k=3 reps on the CrowdStrike fixture.
   Result: mean 30.2% VR (+3.5pp over baseline 26.8%), 5/5 paragraph
   structure held across all reps, best rep 32.8% VR. PASS.

4. **`5884e9d`** — context-first UI. Removed Writing Mode dropdown from
   header. Made context required (Start Interview disabled until non-empty).
   Added file upload (.md/.txt/.pdf/.docx) with extraction in browser
   (FileReader for text, pdfjs-dist for PDF, mammoth for DOCX). Both heavy
   libs dynamic-imported (main bundle 204kB vs 331kB with top-level imports).
   pdfjs worker shipped at `/public/pdf.worker.min.mjs` (postinstall script
   copies from node_modules; gitignored). Store default mode hardcoded to
   "cover-letter" so existing mode-aware code paths stay working without
   churn.

5. **`26ee0b6`** — pdfjs subpath fix. Bug surfaced during browser test:
   PDF upload failed with "Object.defineProperty called on non-object."
   Root cause: Next.js 14 webpack wraps the bare `await import("pdfjs-dist")`
   in a frozen ESM namespace proxy; pdfjs-dist 5.x internally calls
   Object.defineProperty on its own exports for hooks/registration. Fix:
   import via the explicit `pdfjs-dist/build/pdf.min.mjs` subpath. Added
   `// @ts-expect-error` cast (pdfjs 5.x doesn't ship .d.ts for subpath
   entries) + defensive try/catch with stack-trace preservation around
   getDocument so future regressions surface as actionable errors.

## What's validated

### Headless UI test (12/12)

`/tmp/ui-test.mjs` (using playwright lib at
`/home/pn/projects/screenshots/automation/linkedin_automation/node_modules/playwright`,
chromium at `~/.cache/ms-playwright/chromium-1217`):

| # | Test | Result |
|---|---|---|
| 1 | Mode dropdown removed from header | ✓ |
| 2 | No "Writing Mode" label visible | ✓ |
| 3 | "(required)" badge shown on Context | ✓ |
| 4 | Upload button visible | ✓ |
| 5 | Start Interview disabled when context empty | ✓ |
| 6 | Start Interview enables when context filled (after seeding apiKey in localStorage) | ✓ |
| 7 | Start Interview re-disables when cleared | ✓ |
| 8 | .md upload appends 450 chars with `--- From: ---` header | ✓ |
| 9 | .txt upload appends 685 chars | ✓ |
| 10 | .pdf upload extracts 66,737 chars from a 60-page Chapter8.pdf | ✓ |
| 11 | .docx upload extracts 23,013 chars from c845_draft.docx | ✓ |
| 12 | Start Interview enabled after uploads | ✓ |

Screenshots at `/home/pn/projects/screenshots/human-writer-pro-ui-test-2026-04-15/`
(01 initial, 02 typed, 03 md, 04 pdf, 05 docx, 99 final).

### Live end-to-end (Letter 4)

User uploaded `/home/pn/projects/screenshots/resume-db-2026-04-15.md` to the
context panel, ran the webapp's adaptive interview (8 turns + Wispr Flow
high-polish dictation), assembled, and submitted to GPTZero:

| Metric | Letter 4 (this session) |
|---|---|
| 5-gram VR | 45% |
| GPTZero human | 59% (low confidence) |
| Burstiness | 0 |
| Perplexity | 0.54 |
| AI-isms detected | 1 |
| Words | 333 |
| Paragraphs | 5 |

Wispr Flow's high-polish rewrite turned out to be a confound — it stripped
filler from the input before the assembler saw it, which raised VR but killed
burstiness (uniform sentence lengths → low GPTZero). User decided to revert
to the webapp's native voice input for future tests. See
`feedback_wispr_burstiness_tradeoff.md` memory.

### Cross-letter quality comparison

| | Letter 1 (skill) | Letter 2 (webapp pre-v3) | Letter 3 (Rep 1, v3 no context) | Letter 4 (this session) |
|---|---|---|---|---|
| GPTZero | **89%** | 78% | not measured | 59% |
| 5-gram VR | not measured | 26.8% | 32.8% | **45%** |
| Hook | Concrete moment (agent breaking governance) | Abstract thesis | Same as L2 | Concrete analogy (script kiddies) |
| Skills section | Bulleted, NAMED system (Phoenix Swarm) | Prose, generic | Prose, denser specifics | **Strongest technical depth** (FS guard, lockfiles, scoped permissions, security review sub-agents) |
| Soft-skill credential | Stanford Executives 2013 + Brazil offer | None | None | "diversity of thought" claim — no concrete credential |
| Honest gap | Explicit paragraph | Hedged | Hedged | Mentioned in raw, didn't make output |
| Why CrowdStrike | Charlotte AI integration | Falcon outage only | Same as L2 | **Falcon integrity + AI-hiring observation** (most complete) |

Letter 1 still edges out for risk-averse submission. Letter 4 is the best
webapp output to date and a meaningful step forward.

## Open decisions for next session

In priority order:

### 1. Framework content port (TOP PRIORITY)

Confirmed by user 2026-04-15 testing. Port the human-writer skill's stricter
killer-CL framework into the webapp's interviewer + assembler prompts. See
`project_framework_content_port_priority.md` memory for the full diff table.
Specifically:

- `lib/prompts/modes/cover-letter.ts` — interviewer probes for moment-hook
  (not "obsessive focus / opinion"). For AI/security: "Last month/recently
  I built [X] and [result]". Probe for honesty-clause as default (not
  reach-tier-only).
- `lib/assemble.ts` SYSTEM_PROMPT — Intro = a moment, not "distinctive
  identity". Skills section = MANDATORY bulleted format with specific
  template. Honesty clause = required. Close template + banned phrases.
  Company named 2+ times. Ban Oxford 3-item lists in body. Ban "First/Second…"
  constructions.

What does NOT port (no resume-db in webapp): evidence-level routing, NICE
tags, skill tags.

Branch: `experiment/framework-content-port`. Re-test on the 2026-04-15
CrowdStrike fixture (saved as fixture #6). Pass criteria: GPTZero ≥ 78%
(Letter 2 baseline) AND interview reliably surfaces moment-hook + bullets +
honesty.

### 2. UI/UX implementation pass

Six items captured in `process/ui-ux-feedback-2026-04-15.md`. Bundle in this
order:

1. Enter-to-send + drop the Cmd+Enter hint (5 min)
2. Voice dictation textarea autoscroll fix (15 min)
3. "Thinking" / "analyzing response" progress indicators (30-60 min)
4. File uploads as clickable chips (1-2 hours)
5. Assessment banner: remove or move to inline chat metadata (defer)
6. Chat-paradigm restructure (bundle with Edit Chat / Task 16)

### 3. Edit Chat / Task 16

Per the prior handoff: "consultant identified this as the load-bearing
feature for the 'would I send this' eye-test bar; once landed, the user
iterates on the first draft instead of relying on assembly to nail it in
one shot." User confirmed 2026-04-15: this is how they got the gold-standard
CLs in past projects (web-dashboard iteration). Pairs naturally with the
chat-paradigm UI restructure.

### 4. Backlog (lower priority)

- Pre-strip-fillers experiment (`project_pre_strip_fillers_experiment.md`):
  in-pipeline filler strip aiming to capture polish benefit without the
  burstiness cost. Do AFTER framework port.
- 3-arm measurement experiment (Arm 0 baseline / Arm 1 +procedure / Arm 2
  +procedure+content): isolates whether procedure or content is load-bearing.
  Backlogged due to token constraints in this session.
- Mode file cleanup: delete `lib/prompts/modes/{essay,blog,email,free-form}.ts`
  + `components/mode-selector.tsx` (orphaned by the Writing Mode dropdown
  removal). Cosmetic.
- Merge `feat/context-first-no-mode-v3-prompt` → `dev/oauth-localhost`
  (and eventually `main`). Decide timing.
- Handoff workflow automation (`project_handoff_workflow_skill.md`): build
  a `/handoff` skill + SessionStart hook so the kickstart-prompt-construction
  routine is automated. Worth 1-2 hours when there's a slow session.

## Files of interest

| Path | What |
|---|---|
| `lib/assemble.ts` | Assembler. v3 procedural block now between killer-CL framework and Pacing (lines 100-109). Header comment documents the v3 change. Source-of-truth divergence flag still present. |
| `lib/prompts/steps/interview.ts` | Interviewer prompt — adaptive, model-judged readiness. Loads cover-letter mode guidance unconditionally (since mode is hardcoded to "cover-letter" in store init). |
| `lib/prompts/modes/cover-letter.ts` | Mode-specific interview probes. **This is one of the two files the framework port edits.** |
| `lib/store.ts` | AppState. `mode` defaults to "cover-letter" (not null). Mode union kept at 5-literal shape so MODES record + tests stay valid. |
| `lib/fileImport.ts` | Browser-side text extraction. .md/.txt via FileReader; .pdf via pdfjs-dist (subpath import + worker at /pdf.worker.min.mjs); .docx via mammoth (dynamic import). |
| `components/interview-panel.tsx` | Context-first UI. Context labeled "(required)", file-upload Paperclip button, Start Interview gated on `!contextNotes.trim()`. Voice dictation textarea has the autoscroll bug noted above. |
| `app/page.tsx` | Header has no ModeSelector. Reserved-width div in its place to keep header layout. |
| `eval/regression-fixtures/cl-assembly/crowdstrike-ai-security-consultant/` | Fixture #6. Use this for framework-port verification. |
| `scripts/debug/verify-crowdstrike-v3.ts` | k=3 verification harness pinned to live SYSTEM_PROMPT. Re-runnable any time. |
| `process/ui-ux-feedback-2026-04-15.md` | UI iteration plan with implementation sketches per item. |
| `process/handoff-2026-04-15-session-close.md` | Prior handoff (earlier on the same day). Don't lose context — that one covers the v3 prompt setup that this session built on. |

## What NOT to do

Carrying forward from the prior handoff + adding new ones from this session:

- Do NOT add Strunk / anti-patterns / voice profile / banned-isms loads back
  into the assembly call. The 2026-04-14 strip + bisection proved every
  layer there costs VR. The framework content port (next session) is the
  ONE exception and it ports STRUCTURAL guidance (hook stringency, bullet
  format, honesty default, close template) — NOT style/voice loads.
- Do NOT replace the `stripInterviewQuestions` invariant. Uploaded context
  reaches the interview stage only; never the assembly call.
- Do NOT re-add coverage/rubric system to gate assembly.
- Do NOT auto-fire the kickoff on mode change (mode change is now moot
  anyway since the dropdown is gone).
- Do NOT recommend external dictation tools for production use without
  controlling for burstiness (`feedback_wispr_burstiness_tradeoff.md`). Use
  the webapp's native voice input.
- Do NOT delete the orphan `components/mode-selector.tsx` or the unused
  mode files yet without a separate cleanup commit — they're harmless and
  removing them touches multiple imports.
- Do NOT bypass missing dependencies with a worse-fit tool — install the
  right tool. Reinforced 2026-04-15 (`feedback_fix_root_cause.md`).
- Do NOT write to `eval/regression-fixtures/prompts/band-35-strategy.md`
  without re-baselining the regression suite per its own policy.

## Tooling/environment notes

- The container restart wipes apt-installed system libs AND ~/.gitconfig.
  When the container comes back up, expect: chromium will need
  `dsudo npx playwright install-deps chromium` (re-installs libglib2.0-0,
  libnss3, etc.); git will need `git config --global user.email ... &&
  git config --global user.name ...`. Both reinstall in <1 min when
  needed.
- The `playwright-cli` npm package (v0.262.0, in `linkedin_automation/`)
  has its own broken browser-install bookkeeping. Use the playwright
  library directly via a node script (template at `/tmp/ui-test.mjs`)
  or via `npx -p playwright playwright ...` — don't fight playwright-cli.
- Dev server: `cd /home/pn/projects/human-writer-pro && npm run dev`. May
  start on 3001 if 3000 is occupied (orphan dev process from prior session).
  Kill orphans with `pkill -f "next dev"`.

## State at session close

```
Branch: feat/context-first-no-mode-v3-prompt
Commits ahead of dev/oauth-localhost: 5 (f098e8a, 43dd62c, 777a92f, 5884e9d, 26ee0b6)
Working tree: clean (after this handoff commit lands)
Tests: 127 passing
Typecheck: clean
Production build: clean (204kB first-load JS)
Headless UI test: 12/12 passing
End-to-end live test: Letter 4 produced, 59% GPTZero, user confirmed shippable
```
