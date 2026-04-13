# Handoff — 2026-04-13 — Day 1 implementation + refactor landing

## Session summary

Picked up from the brainstorm-complete handoff at
`/home/pn/projects/career-forge/.planning/handoff-2026-04-13-human-writer-pro-brainstorm.md`.
Executed subagent-driven Day 1 (Tasks 1–8) of the Human Writer Pro MVP,
then received and landed a refactor mid-session that pivots the product
architecture based on VR validation pilot findings and the discovery that
the existing `human-writer` Claude Code skill already contains the Socratic
interview pattern we were about to invent.

All Day 1 work preserved. Day 2–4 plan has been diffed in a refactor doc now
living in the repo. The band-35 production prompt and decisions log are
committed as regression source of truth.

No code pushed to GitHub yet. No Vercel deploy yet.

## Repo state at session close

### human-writer-pro (the build repo)

- Path: `/home/pn/projects/human-writer-pro`
- Branch: `main` (GitHub default since 2020; do NOT confuse with career-forge's `master`)
- Remote: `https://github.com/oklysit/human-writer-pro` — **not yet pushed** (origin/main still holds only the initial README + LICENSE commit)
- Working tree: clean at commit `551b2cc`
- Commits on main: 14 (original `de588aa` + 13 new this sprint)

### career-forge (parallel-session workspace)

- Path: `/home/pn/projects/career-forge`
- Branch: `master` (user's older convention; distinct from hwp's `main`)
- Working tree: clean at session close
- **Parallel sessions may be active** — one scheduler was holding `.claude/scheduled_tasks.lock` (pid 168785, session `06f9f3bc-...`) as of session close. Check the lock file before committing any career-forge work.
- The 7 parallel-session WIP items flagged in the kickoff were committed this session as `b0af478` (feat: pipeline scripts) + `eb3a5d0` (chore: runtime snapshot).

## Commits landed this session

### human-writer-pro (main), oldest → newest

```
9bcb490  feat(scaffold): Next.js 14 + TypeScript + Tailwind init, core deps
e72a702  feat(design): editorial palette + triple-stack typography + design-system MASTER.md
1e48a51  fix(design): flatten border-radius + move component classes to @layer components + remove dead CSS vars
0046cd5  feat(ui): shadcn/ui core primitives + editorial Button variants (sharp edges, mono labels, gold primary)
4d57b03  fix(ui): pin tailwind-merge v2 for TW3 compat + promote accent-hover + ring-offset tokens
d2c1280  feat(vr): port score-verbatim.js to TypeScript with Vitest coverage (tokenize + n-grams + overlap)
80079d5  feat(store): zustand session store with API key persistence (apiKey only, session state is ephemeral)
9f6cd95  feat(prompts): embed style rule references (Strunk + Zinsser + Albrighton + anti-patterns + banned isms) with markdown loader
6f60149  feat(prompts): base + 5 mode prompts + 3 step prompts + composer with prompt injection boundaries
fa46b10  feat(sdk): Anthropic client factory + streaming helper with dangerouslyAllowBrowser for BYO-key architecture
ee876f6  mojo: seed Active Hours log (brainstorm 3.0hr + Day 1 implementation 4.0hr = 7.0hr total)
3c4569c  mojo: correct Day 1 Active Hours (4.0 → 0.3) — subagent runtime is AFK per Part 3
a5c347c  docs(refactor): product pivot to two-stage pipeline + regression source of truth
551b2cc  docs(refactor): supersede Task 20 Change 2 + add decisions.md
```

### career-forge (master)

```
b0af478  feat(pipeline): add batch-regen + telegram-reminder scripts (from 2026-04-12 session)
eb3a5d0  chore(state): runtime snapshot — scheduler lock, jobs/index, eval baselines, 2026-04-13 report
```

## Tasks 1–8 completion state (Day 1)

All 8 tasks are marked complete. 21/21 tests green. `npx tsc --noEmit` clean.

| Task | Description | Commits |
|------|-------------|---------|
| 1 | Scaffold Next.js 14 + TS + Tailwind + core deps | `9bcb490` |
| 2 | Design system (editorial palette + triple-stack typography) | `e72a702` + `1e48a51` (fix) |
| 3 | shadcn/ui + editorial Button override | `0046cd5` + `4d57b03` (fix) |
| 4 | VR core logic TDD (tokenize/buildNgrams/computeVR) | `d2c1280` |
| 5 | Zustand session store TDD | `80079d5` |
| 6 | Style rule references (Strunk + Zinsser + Albrighton + AI anti-patterns + banned isms) | `9f6cd95` |
| 7 | Base + 5 mode prompts + 3 step prompts + composer | `6f60149` |
| 8 | Anthropic SDK client + streaming helper | `fa46b10` |

### Known blockers tracked from Day 1 (must land before specific downstream tasks)

- **Task 3.5 — shadcn primitive Tailwind v3 fix.** shadcn v4 CLI generated raw `oklch(...)` classes in dialog/textarea/select/toast/toaster/tooltip that don't resolve under Tailwind v3. Button was hand-overridden and works. Dialog ships in Task 10, Textarea in Task 13, Select in Task 11, Toast in Task 16 — so this must land before Task 10. Rewrite each broken component to use semantic tokens (`bg-card`, `border-border`, `text-foreground`, `ring-ring`, `ring-offset-background`), strip `dark:` variants. Est. 60–90 min.
- **Task 17.5 — App Router error boundaries.** `next build` currently fails with `<Html> should not be imported outside of pages/_document` on /404, /500, /, /_not-found. Root cause: App Router project has no error boundaries so Next falls back to Pages-router defaults. Add minimal `app/not-found.tsx`, `app/error.tsx` (use client), `app/global-error.tsx` (use client, renders <html>/<body>). Unblocks Task 18 (CSP + build) + Task 24 (Vercel deploy). Est. 15–30 min.

## Refactor summary (2026-04-13)

- **Location in repo:** `docs/refactor-2026-04-13.md`
- **Pair-review exhibit:** `process/pair-review-2026-04-13.md` (Decision Value artifact; Claude Opus 4.6 senior-engineer sparring that generated the refactor, ran in parallel with the Day 1 build and the 54-variant VR validation pilot)
- **Band-35 production prompt (regression source of truth):** `eval/regression-fixtures/prompts/band-35-strategy.md`
- **Decisions log (5 killed assumptions + 1 open research question):** `process/decisions.md`

### Architecture pivots

- **Two-stage pipeline:** Stage 1 Socratic interview (from `human-writer` skill's `assignment_workflow.md` Phase 2) → Stage 2 band-35 assembly (validated by 54-variant pilot)
- **VR demoted** from headline metric to diagnostic pill. The 54-variant pilot established VR is a downstream marker of prompt regime, not a causal lever.
- **AI-ism regex gate** (new Task 17b) takes the prominent UI slot instead of the VR badge. Compile `AI_ANTI_PATTERNS.md` + `BANNED_AI_ISMS.md` from the skill into a regex array at build time; surface matches inline on output.
- **Minimum input gate** (new Task 17a): assembly button disabled until raw interview ≥ 150 words AND `coverage_score` ≥ 0.6 (emitted from the Socratic interview engine). Architectural ethics defense: the tool cannot draft without evidence of the user's thinking.
- **Socratic edit chat** (Task 16 rewrite): when user highlights text and says "this feels off," chat asks one targeted question, takes verbatim response, localized-re-stitches just that paragraph. Never rewrites on its own authority.

### Task-by-task diff

See `docs/refactor-2026-04-13.md` for the full task-by-task diff with estimated times. Summary:

| Task | Refactor verdict |
|------|------------------|
| 1–8 | KEEP (all done) |
| 7 | **Refresh** — 1hr port of skill content into existing file structure (see below) |
| 9 | **REWRITE** — Socratic engine with 3-state assessment + coverage_score (port from `assignment_workflow.md` Phase 2) |
| 10 | KEEP |
| 11 | REWRITE light — map each mode to its `GOLDEN_DATASET.md` rule |
| 12 | REWRITE — demote VR pill, elevate AI-ism indicator |
| 13 | KEEP + surface coverage state in UI |
| 14 | KEEP |
| 15 | KEEP |
| 16 | **REWRITE** — Socratic edit chat (not polish-and-replace) |
| 17 | KEEP |
| **17a** | **NEW** — minimum input gate |
| **17b** | **NEW** — AI-ism regex gate |
| 18 | KEEP (but needs Task 17.5 first) |
| 19 | **REWRITE** — (interview + prompt + baseline) fixture triples from 5 real CLs |
| 20 | **REWRITE** — k=3 runs + LLM-judge rubric; **Change 2 is superseded** (see decisions.md; band-35 prompt stays verbatim with VR=35% line) |
| 21 | REWRITE — real automated diff with tolerance |
| 22 | KEEP + add VR-validation Decision Value entry |
| 23 | REWRITE — README written by the product itself on Day 4 |
| **23a** | **NEW** — process/ directory (already partially pre-populated this session: pair-review.md + decisions.md present; still need `three-pane-orchestration.png` screenshot at submission time) |
| **23b** | **STRETCH** — multi-model comparison exhibit (Sonnet + Gemini + GLM) |
| 24–28 | KEEP |

### Task 7 refresh — details

Day 1's Task 7 wrote the 5 mode prompts from scratch plus reference files. The refactor says this structure is right but the content should be ported from the `human-writer` skill:

- **Already copied correctly from the skill (no rework needed):**
  - `lib/prompts/references/strunk-rules.md`
  - `lib/prompts/references/ai-anti-patterns.md`
  - `lib/prompts/references/banned-ai-isms.md`
- **Written from scratch in Day 1, refactor doesn't flag them — leave as-is for now:**
  - `lib/prompts/references/zinsser-principles.md` (paraphrased from copyrighted work)
  - `lib/prompts/references/albrighton-principles.md` (paraphrased from copyrighted work)
- **Missing — add in the refresh:**
  - `lib/prompts/references/golden-dataset.md` — port verbatim from the skill's `GOLDEN_DATASET.md`. This file has 11 mode-specific rules with paired AI/human examples that ARE the mode-specific prompt engineering.
- **Mode prompts to rewrite:**
  - `cover-letter.ts` → load Rule 11 (Unglazed Cover Letter) as `systemAddition`
  - `email.ts` → load Rule 1 (Reactive Opener) + Rule 4 (Terse Colleague)
  - `essay.ts` → load Rule 5 (Rhetorical Interrogation) + Strunk rules
  - `blog.ts` → load Rule 8 (Meandering Path) + Rule 10 (Live Monologue)
  - `free-form.ts` → general fallback: loads anti-patterns but no mode-specific rule

Source material is already on disk at `/home/pn/projects/screenshots/human-writer-skill-snapshot-2026-04-13/` (copied there this session). The skill's own files at `/home/pn/projects/writer/.gemini/skills/human-writer/` are the canonical source.

## Key overrides and constraints

### Override: refactor Task 20 Change 2 is superseded

The refactor doc says to delete the `Target 5-gram VR ≈ 35%` line from the runner's generation prompt. **Do not apply this.** The user's clarification: that line is a stylistic nudge inside the band-35 prompt, not a claimed success criterion. The prompt stays verbatim everywhere. The eval measures the actual VR that emerges and the GPTZero result as independent downstream evaluators. See `process/decisions.md` entry "VR = 35% reframed from target to prompt nudge" and `eval/regression-fixtures/prompts/band-35-strategy.md` — "Relation to refactor Task 20 Change 2 — superseded" section.

### Active Hours accounting

- **Total Active Hours this session (engaged user time, per Beswick Part 3):** ~0.3 — kickoff prompt composition + three-four check-in messages + the refactor review + VR=35% clarification.
- **Subagent runtime (NOT counted):** ~4 hours of autonomous subagent orchestration producing all 8 Day 1 commits.
- **Running Project total:** 3.3 hrs (3.0 brainstorm + 0.3 Day 1 orchestration check-ins).
- **mojo-log:** `/home/pn/projects/human-writer-pro/mojo-log.jsonl` has 3 entries — schema header, brainstorm (3.0h), Day 1 implementation (0.3h after correction).
- **Rule reminder:** The `feedback_active_hours_excludes_subagent_runtime` memory at `/home/pn/.claude/projects/-home-pn-projects-career-forge/memory/` holds the official interpretation. Autonomous subagent runtime is AFK per Part 3 and does not count.

### Repo branch conventions

- **human-writer-pro:** `main` (GitHub default, since repo was created post-2020)
- **career-forge:** `master` (older user convention)
- Never standardize one repo's branch name to match the other. Memory: `reference_repo_branch_conventions.md`.

### Parallel session discipline

- Before any career-forge commit, verify branch with `git branch --show-current` and confirm it's `master` (not an in-flight parallel experiment branch like `fix/cl-await-bug`).
- human-writer-pro has no parallel sessions (it's owned by this workstream), so this check is only for career-forge.
- As of session close, career-forge is on `master` and a scheduler holds the lock file — other sessions may still be writing.

### Git + push

- Nothing pushed to GitHub yet. The first push to `https://github.com/oklysit/human-writer-pro` will need a PAT; user will generate one at `github.com/settings/tokens` when ready.
- `.claude/scheduled_tasks.lock` in career-forge is now tracked in git but probably should be gitignored; noted as backlog cleanup, not urgent.

## Outstanding skill invocations / reminders

- `feedback_preferred_design_skill`: ui-ux-pro-max is the user's go-to for UI design. Already used for Day 1 (editorial / magazine aesthetic locked in at Task 2).
- `feedback_cl_assembly_verbatim_rigor`: always invoke `/human-writer` via the Skill tool for any human-facing text. For the README draft on Day 4, the plan is to use Human Writer Pro itself (meta-move); that supersedes the skill invocation rule for that specific artifact.
- `feedback_screenshots_to_disk`: visual artifacts and reference bundles go to `/home/pn/projects/screenshots/` so the user can open them on Windows. Already used this session for the human-writer skill snapshot + the refactor + pair-review drops.

## Next session — recommended entry plan

Ordered by dependency. Work in `/home/pn/projects/human-writer-pro` on `main`.

1. **A — Task re-plan.** 5 min of `TaskCreate`/`TaskUpdate` to align the tracked task list with the refactor. Add the new tasks (17a, 17b, 23a partial, 23b stretch), mark the rewritten tasks (9, 11, 12, 16, 19, 20, 21, 23), keep KEEP tasks as-is.

2. **B — Task 7 refresh.** 60–90 min. Port `GOLDEN_DATASET.md` verbatim to `lib/prompts/references/golden-dataset.md`. Rewrite the 5 mode prompts to load their matched rules (see Task 7 refresh details above). Verify `npm test` still 21/21 green. Commit.

3. **C — Day 1 blockers.** 75–120 min.
   - C1: Task 3.5 (rewrite 5 shadcn primitives for Tailwind v3)
   - C2: Task 17.5 (add App Router error boundaries)
   - Each blocker should be its own subagent dispatch with two-stage review (spec → quality).

4. **Day 2 proper — Tasks 9–17 per refactor.** Bulk of Day 2 work. Start with Task 9 (Socratic engine) since it unblocks 11/12/13/16/17a. Then proceed Task 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 17a → 17b.

## Blockers that require a human decision before restart

None. All blockers are technical-execution items the implementation agent can handle.

## Files the next session should read at kickoff

Pre-flight reads (in order of importance):

1. This handoff: `/home/pn/projects/human-writer-pro/process/handoff-2026-04-13-session-close.md`
2. Refactor: `/home/pn/projects/human-writer-pro/docs/refactor-2026-04-13.md`
3. Decisions log: `/home/pn/projects/human-writer-pro/process/decisions.md`
4. Band-35 source of truth: `/home/pn/projects/human-writer-pro/eval/regression-fixtures/prompts/band-35-strategy.md`
5. Original plan (still valid for Tasks 1–8 + KEEP tasks): `/home/pn/projects/career-forge/docs/superpowers/plans/2026-04-13-human-writer-pro-mvp.md`

Optional deeper context:

6. Pair-review session (large, Decision Value exhibit): `/home/pn/projects/human-writer-pro/process/pair-review-2026-04-13.md`
7. Prior handoff (brainstorm close): `/home/pn/projects/career-forge/.planning/handoff-2026-04-13-human-writer-pro-brainstorm.md`
8. Human-writer skill snapshot (source for Task 7 refresh): `/home/pn/projects/screenshots/human-writer-skill-snapshot-2026-04-13/`

## Open questions / flags for the next session

- **Is decisions.md content in the right voice?** I wrote it in neutral engineering voice with Clarity Scores. User may want to rewrite in first-person voice for the public repo (this is the Decision Value exhibit and sits in a prominent submission artifact). Flag at start of next session; low-priority edit.
- **Human-writer skill's voice-profile.md and HUMAN_WRITING_SAMPLES.md exist.** Not yet ported. They're very large and personal to the user. Refactor doesn't mention them specifically. May be worth considering for a v2 feature (per-user voice profile); for v1 they should NOT ship in the public repo. `USER_PROFILE.md` also falls in this category — refactor explicitly calls it out as private (ship a `USER_PROFILE.template.md` schema-only placeholder).
- **`next build` still fails.** Tracked as Task 17.5. Implementation agents should run `npm run dev` to verify work, not `npm run build`, until Task 17.5 lands.
