# Handoff — 2026-04-14 — Day 2 + Day 3 close

## Session summary

Picked up from the Day 1 close handoff at
`process/handoff-2026-04-13-session-close.md`. Executed Day 2 proper
(Tasks 9–17 + 17a + 17b) plus Day 1 blockers (Task 3.5 shadcn fix +
Task 17.5 error boundaries) via subagent-driven-development. After
user handed off autonomously, continued through Day 3 proper (Tasks
18, 19, 20, 21, 22, 23, 23a) and imported the VR validation pilot
report from the eval-session workspace.

All remaining work is user-blocked (Tasks 23b stretch, 24 deploy, 25
Loom, 26 email, 27 submission, 28 follow-up).

## Repo state at session close

### human-writer-pro (this repo)

- Path: `/home/pn/projects/human-writer-pro`
- Branch: `main`. Tree clean at commit `18494a9`.
- Remote: `https://github.com/oklysit/human-writer-pro` — **not pushed**.
  49 commits ahead of origin (14 Day 1 + 35 Day 2–3). First push still
  needs a PAT the user will generate.
- `npm test`: 146/146 passing across 8 test files
- `npx tsc --noEmit`: clean
- `npm run build`: succeeds (109 kB main route, 87.4 kB _not-found,
  both static)
- `npm run dev`: starts cleanly

## Commits landed this session (34 new, oldest → newest)

```
bb4eef6  feat(prompts): port GOLDEN_DATASET + wire mode prompts to skill-validated rules
e2e8e09  fix(ui): rewire 6 shadcn primitives to Tailwind-v3 semantic tokens
c8f2088  fix(ui): swap bg-black/80 for semantic bg-foreground/80 on DialogOverlay
8c3ddb6  fix(app): add App Router error boundaries + fix NODE_ENV build
b907e70  feat(interview): pure coverage helpers with TDD
74d5fdf  feat(interview): Socratic assessment prompt + mode rubrics
19b2022  feat(interview): Socratic engine + store integration
3e2c247  fix(coverage): clamp score + validate assessment level + drop dead import
94cc6f4  feat(settings): add controlled SettingsDialog component (Task 10)
1446284  feat(ui): add ModeSelector component — store-driven mode picker (Task 11)
5074800  feat(ui): add DiagnosticPills component — VR demoted to tooltip, AI-ism elevated
2708189  feat(ui): add InterviewPanel component — Socratic interview left panel (Task 13)
319beec  fix(interview-panel): swap raw palette colors for semantic success/warning tokens
4c1ce5d  feat(interview-panel): Task 14 — functional Web Speech API voice input
db98768  feat(preview): add assemble helper + preview panel with streaming (Task 15)
30de33d  feat(edit-chat): Task 16 — Socratic edit chat with two-call cycle
5943b36  feat(layout): wire main workspace — header + two-panel editor + assemble + edit-chat
0f08219  feat(gate): Task 17a — enforce minimum input gate on Assemble button
6ff5e4b  style(store): hoist canAssemble/countUserWords imports to top
d37d562  feat(ai-ism): Task 17b — regex gate + DiagnosticPills wiring + Regenerate button
1f23f10  feat(ai-ism): Task 17b Part C — inline highlights via react-markdown custom renderer
572b340  mojo: Day 2 Active Hours entry — 0.3h engaged, 1h51m AFK
c117669  feat(eval): scaffold 5-fixture CL regression tree (Task 19)
fc5dcf8  feat(eval): add GPTZero client (Task 20, part 2)
6ab0ae4  feat(eval): add CL regression runner + node AI-ism helper (Task 20, part 3)
1d7a2b3  fix(eval): std() uses sample formula (n-1), not population (n)
b9e9276  feat(eval): Task 21 — regression baseline comparator
ceae4a8  fix(fixtures): add judge_ai_ism_severity to baseline schema
9663b8d  feat(mojo): Task 22 — MoJo Score report script + VR decision entry
dd9f256  docs(process): add future-experiments.md (Task 23a)
a825684  feat(security): add CSP + security headers to next.config.mjs
e8aa3c9  docs(readme): first-pass README + MOJO-SETUP.md
18494a9  docs(eval): import VR validation pilot report + fix gitignore negation
```

(Note: Task 20 landed in 3 commits split for reviewability: judge +
tests, GPTZero, runner + node helpers. The split was the subagent's
own discipline, not something I requested.)

## Task completion tracker

| Task | State | Commit(s) |
|---|---|---|
| 3.5 shadcn primitives | ✅ done | `e2e8e09` + `c8f2088` |
| 17.5 error boundaries | ✅ done | `8c3ddb6` |
| 7 refresh mode prompts | ✅ done | `bb4eef6` |
| 9 Socratic engine | ✅ done | `b907e70` → `3e2c247` |
| 10 Settings dialog | ✅ done | `94cc6f4` |
| 11 Mode selector | ✅ done | `1446284` |
| 12 Diagnostic pills | ✅ done | `5074800` |
| 13 Interview panel + coverage | ✅ done | `2708189` + `319beec` |
| 14 Voice input | ✅ done | `4c1ce5d` |
| 15 Preview panel + assemble | ✅ done | `db98768` |
| 16 Socratic edit chat | ✅ done | `30de33d` |
| 17 Main page layout | ✅ done | `5943b36` |
| 17a Min input gate | ✅ done | `0f08219` + `6ff5e4b` |
| 17b AI-ism regex gate (+Part C) | ✅ done | `d37d562` + `1f23f10` |
| 18 CSP + security | ✅ done | `a825684` |
| 19 Regression fixtures | ✅ done | `c117669` |
| 20 Regression runner + LLM judge | ✅ done | `fc5dcf8` + `6ab0ae4` + `1d7a2b3` |
| 21 Baseline comparison | ✅ done | `b9e9276` + `ceae4a8` |
| 22 MoJo Score report | ✅ done | `9663b8d` |
| 23 README + MOJO-SETUP (first pass) | ✅ done | `e8aa3c9` |
| 23a process/ directory | ✅ done | `dd9f256` + `18494a9` (vr-validation import) |
| 23b multi-model comparison | ⏭️ skipped | Stretch; skip without regret per refactor |
| 24 Vercel deploy | ⏸ blocked | Needs user PAT |
| 25 Screen walkthrough (Loom) | ⏸ blocked | User records |
| 26 Email via HWP | ⏸ blocked | User uses HWP's own interview flow |
| 27 Final submission checklist | ⏸ blocked | User sends |
| 28 Post-submission followup | ⏸ blocked | Post-submission |

## Outstanding user-action items

### Critical path to submission

1. **First push to GitHub.** Generate a PAT at
   `github.com/settings/tokens` (fine-grained, scoped to the
   `oklysit/human-writer-pro` repo only, with contents:read/write).
   Then `git push -u origin main`.
2. **Vercel deploy.** Connect the repo via
   `vercel.com/new/import`. Vercel auto-detects Next.js. Add
   `ANTHROPIC_API_KEY` is NOT required (BYO-key architecture);
   leave env vars empty. Deploy to production.
3. **README meta-move paragraph.** Once deployed, open the live app,
   dictate the README opening through HWP's own interview flow, pick
   cover-letter or free-form mode, and paste the assembled output
   over the TODO placeholder in `README.md`. Commit + push. This is
   the "written by the product itself" meta-move flagged in the
   refactor §Task-23.
4. **Loom recording (Task 25).** Walk through the deployed app end
   to end. Include the 30-second Socratic interview pushback clip
   (deliberately vague answer → tool asks for specificity → better
   answer → advances). The pushback clip is worth more than the
   product demo itself for a Model Jockey audience — surface it.
5. **Submission email (Task 26).** Draft via HWP's email mode. Keep
   it one page. Include: deployed URL, GitHub repo URL, Loom URL,
   MOJO-SETUP.md link, pointer to `process/` directory.
6. **Send (Task 27).** Final checklist pass, then send to Ryan Beswick.

### Artifact slots the user still needs to fill

- `process/three-pane-orchestration.png` — screenshot of 3 simultaneous
  Claude Code panes from the Day 1 build / Day 2 UI / VR validation
  pilot workstream. Drop into the `process/` directory right before
  submission; README + MOJO-SETUP already reference this filename.
- `mojo-log.jsonl` — add Active Hours entries for Day 3 and Day 4
  user engagement as it happens. Schema documented in
  `MOJO-SETUP.md`; run `npm run mojo:report` to see the aggregated
  summary.

## Running the regression suite once the product is live

Before the deploy, smoke-test the regression pipeline locally:

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
npm run eval:cl -- --dry-run    # confirms call count + cost estimate
npm run eval:cl                 # real run, ~$0.72 on Sonnet 4.6
npm run eval:cl-diff            # compares results vs baselines
```

The `--dry-run` output should read something like:
```
Anthropic calls planned: 30 (5 fixtures × 3 × 2)
Rough token estimate: ~240,000 tokens (~$0.72 USD)
Prompt SHA: ...
```

The real run writes `eval/reports/cl-regression-{date}.jsonl` +
`.md`. The diff exits non-zero on drift beyond tolerance.

If `GPTZERO_API_KEY` is set in env, GPTZero gets called too; if not,
the GPTZero field in each run block is null with a `gptzero_skipped`
flag and no test fails.

## Architecture summary (what you just got)

### User-facing features

- Two-panel editor workspace (header + interview left + preview right)
- Header: logo + mode selector (5 modes: cover-letter, essay, email,
  blog, free-form) + Settings button (pulses in accent color when
  API key missing)
- Interview panel: Socratic engine with 3-state assessment
  (sufficient/partial/insufficient), coverage progress bar, turn
  history, textarea with voice input (Web Speech API) and keyboard
  shortcut (Cmd/Ctrl+Enter)
- Assemble button: disabled until coverage ≥ 0.6 AND word count
  ≥ 150 (architectural gate, not policy)
- Preview panel: streaming output via react-markdown with editorial
  drop cap, diagnostic pills (VR secondary, AI-ism primary),
  click-to-expand AI-ism list, "Regenerate avoiding these" button
  that passes banned patterns as negative constraint to the assembly
  prompt, Copy/Download footer actions
- Inline AI-ism highlights in the rendered markdown with native
  `title` tooltips showing the matched pattern
- Edit chat: Socratic 2-call cycle — user highlights paragraph,
  signals "this feels off" → engine asks ONE question → user answers
  → engine restitches just that paragraph with the user's new
  verbatim as primary material. Never rewrites on its own authority.

### Non-user-facing infrastructure

- Regression pipeline: 5 real CL fixtures (including 2 GPTZero
  failures as "known hard cases"), k=3 runs, Sonnet 4.6 as LLM
  judge, optional GPTZero, baseline comparator with non-zero exit
  on drift
- MoJo tracking: `mojo-log.jsonl` + report script
- Design system: editorial (Playfair Display + Source Serif 4 +
  JetBrains Mono, gold accent, 2px sharp corners, no rounded-pills,
  no drop shadows, no dark mode in v1)
- Prompt references: GOLDEN_DATASET.md + strunk-rules.md +
  ai-anti-patterns.md + banned-ai-isms.md ported verbatim from the
  upstream human-writer skill
- CSP headers: connect-src allowlists Anthropic + GPTZero APIs,
  microphone=(self) for voice input, frame-ancestors none
- Build: NODE_ENV=production prefix on `npm run build` to defeat the
  harness-injected NODE_ENV=development leak (Next 14 bug)

## Open decisions the user may want to revisit

1. **Delivered Value weighting in MoJo report.** The current formula
   `commits × 0.25 + tests × 0.05 + decision_value_sum` is a
   placeholder flagged in the report output. At 45 commits, the
   commit term dominates (11.25 of 18.15 total). A 1-line typo fix
   and a 300-line feature commit aren't equivalent; the user may
   want to calibrate with a manual "impact" field per commit.
2. **Decision Value of the VR pivot.** The VR reframing entry has
   `investment_avoided_hours: 0` because the academic-mode workflow
   was already shipping. That zeroes out the Decision Value math
   even at Clarity 0.9. Arguably the pivot saved the product from
   shipping a bad headline metric — which is real value, just not
   in "build hours avoided." Consider a separate "pivoted_from
   _public_embarrassment" field or similar.
3. **Task 23 README opening paragraph.** TODO marker in place. The
   meta-move (dictated via HWP, assembled with band-35) is
   load-bearing for the Model Jockey submission — it's literal
   evidence of the product working on its own builder.

## Open research questions tracked

See `process/future-experiments.md` for 6 starting points:
1. Socratic vs. adversarial LLM-judge framing
2. Deterministic VR injection at assembly time
3. Register-based classifier for output quality expectations
4. Fuzzy rubric-item matching in coverage score
5. Register-diverse fixture expansion (email / essay / blog / free-form)
6. Multi-model comparison (Task 23b if ever picked up)

## Files the next session should read at kickoff

1. This handoff: `process/handoff-2026-04-14-session-close.md`
2. Day 1 handoff: `process/handoff-2026-04-13-session-close.md`
   (for continuity — not strictly needed if you trust this doc)
3. `README.md` — current state with Day 4 TODO marker
4. `MOJO-SETUP.md` — operational detail
5. `process/decisions.md` — killed assumptions log
6. `process/future-experiments.md` — research questions
7. `eval/reports/vr-validation.md` — 54-variant pilot
8. `docs/refactor-2026-04-13.md` — still the canonical task diff

## Active Hours accounting

Current `mojo-log.jsonl` entries (4 total):
- 2026-04-13: 3.0h brainstorm + spec + plan (Day 0)
- 2026-04-13: 0.3h Day 1 implementation orchestration
- Decision entry: VR as causal lever killed (Clarity 0.9)
- 2026-04-14: 0.3h Day 2 + Day 3 orchestration

Running project total: 3.6h active, ~6h agent runtime AFK. MoJo
Score as of now (per `npm run mojo:report --tests=146`): ≈ 5.04
based on placeholder Delivered Value weights.

The Day 4 submission arc (deploy + Loom + email + send) will
probably add another 2–3h of engaged user time across capture +
review + send cycles. Log those as they happen.
