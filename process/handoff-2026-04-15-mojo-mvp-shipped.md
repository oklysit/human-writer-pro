# Session Handoff — 2026-04-15 (Mojo MVP Shipped)

Successor to `handoff-2026-04-15-context-first-shipped.md`. Picks up on
`feat/context-first-no-mode-v3-prompt` after the context-first ship, and
ends with the `experiment/framework-content-port` branch ready for merge
into `dev/oauth-localhost` → `main` for the Lawyer.com Mojo take-home
submission.

## TL;DR

The 8-hour MVP push pivoted from "more prompt iteration" to "ship the
working product as the Mojo deliverable." Outcome: HWP is now the
take-home submission to Ryan Beswick. The repo is presentable to a
third party, the README explains the orchestration story, and the
edit primitive switched from paragraph-level Socratic Edit Chat to
whole-output regenerate-with-voice-feedback (matches the proven
Career Forge dashboard workflow).

Branch `experiment/framework-content-port` is **17 commits ahead of
`dev/oauth-localhost`**, all stable, 127 unit tests + tsc clean,
production build clean (205 KB First Load JS).

MoJo Score: **22.3x mid (Senior IC hours framework)** at 13.2h
cumulative Active Hours — comfortably above the 20+ target.

## What got built (commit chronology)

After the prior handoff (`c8fef17`) on `feat/context-first-no-mode-v3-prompt`:

1. **`10dcb46`** — v4 framework content port (initial). Stricter killer-CL
   framework: moment-hook intro (not identity/thesis), MANDATORY bulleted
   skill-match, conditional honesty-gap, banned-phrase close, company
   named 2+ times. OUTPUT FORMAT allowed 5 or 6 paragraphs.

2. **`cd75a30`** — v4.1 calibration. After k=3 verification surfaced that
   the rigid "Context / What you did / Why it matters" bullet template
   was forcing invented "Why it matters" prose, replaced with looser
   narrative-from-raw guidance. Renamed OUTPUT FORMAT to "5 sections"
   (matches the killer-CL meaning vs the 7-block physical layout when
   bullets render as separate paragraphs). Tightened word budgets to
   target 290-400 words, hard ceiling 450.

3. **`648beb7`** — Edit Chat fixes (cancel + voice + Esc). Added X close
   button to the panel header (always visible), Escape key listener for
   any non-terminal state, and two independent useVoiceInput instances
   for the complaint and answer textareas with the same base-snapshot +
   live-preview + commit-on-stop pattern as InterviewPanel. handleSendX
   handlers stop+reset the corresponding voice. Toast on edit failure.

4. **`0a262c2`** — Submission-grade README. Replaced the Day-4 placeholder
   opening with substantive intro framing HWP as a generalized voice-
   preserving writer (cover-letter mode = load-bearing implementation;
   academic + email + free-form = roadmap). MoJo Score story up top.
   Orchestration table for the 5 in-product layers + cross-link to
   MOJO-SETUP.md for the in-build orchestration. Roadmap section honestly
   scopes deferred work. Final section explicitly addresses Ryan.

5. **`5a5217d`** — UI: Enter-to-send + voice-dictation autoscroll. Drops
   the "Cmd+Enter to send" hint in InterviewPanel; replaces with
   "Enter to send · Shift+Enter for newline" in EditChat. Adds
   inputTextareaRef + autoscroll effect that scrolls textareas to
   scrollHeight while voice is recording, mirrored to EditChat's
   complaint and answer textareas.

6. **`3815fcd`** — feat: regenerate-with-voice-feedback + upload-to-edit
   (the big one). Three pieces:
   * `lib/assemble.ts assembleWithFeedback()` — 3-turn conversation
     (rawInterview / previousOutput / feedback+revision directive),
     two prompt regimes: `cl` (default, preserves SYSTEM_PROMPT) and
     `edit` (GENERIC_EDIT_SYSTEM_PROMPT, preserves uploaded drafts
     without imposing CL structure; maxTokens 4096).
   * `lib/store.ts` — outputSource ("interview" | "upload" | null) +
     uploadedDraftContent fields + setUploadedDraft setter + setOutput
     auto-tags first non-empty output as "interview" if not already
     tagged.
   * `components/preview-panel.tsx` — empty state gets "Or upload an
     existing draft to edit" link with file picker reusing fileImport
     helpers. Output state gets "Regenerate with feedback" button +
     expanding panel (textarea + mic + Send + Cancel X + Esc).
   * `app/page.tsx` — handleRegenerateWithFeedback picks mode and raw
     source based on outputSource. EditChat trigger UI removed (component
     still ships in codebase; no UI surface invokes it). selectedParagraph
     state and editChatActive flag dropped.

7. **`e2e58c5`** — Settings inline validation + VR for upload mode.
   Settings dialog: handleSave checks `startsWith("sk-ant-")` for
   non-empty values, sets validationError, renders inline message and
   destructive border (post-mvp-backlog #1 fix).
   PreviewPanel: VR computation picks rawSource based on outputSource
   (uploadedDraftContent for upload, interview.rawTranscript otherwise)
   so upload mode shows meaningful VR instead of always 0%.

8. **`5461d8a`** — README updates for new flows. Quick-start now
   describes both flows (Write something new + Edit an existing draft).
   Orchestration table updates "Edit Chat" entry to "Regenerate-with-
   feedback" with cl/edit mode notes. Project structure note clarifies
   `lib/assemble.ts` now contains both initial assemble and regen variant.

9. **`ff75409`** — Drop cap removed (post-mvp-backlog #5). Universal
   `.prose-output > p:first-of-type::first-letter` rule removed; was
   reading "pretentious" for cover-letter and email contexts. Comment
   notes that future modes (essay / blog / free-form) can re-enable
   per-mode if desired.

10. **`01b851d`** — Mojo audit trail (Day 5 entries). 1 active hours +
    4 decision entries to mojo-log.jsonl. 3 new top entries to
    decisions.md (regenerate-with-feedback, v4.1 ship despite variance,
    GPTZero IS the bar). SENIOR_IC_HOURS bumped 200/250/300 →
    240/295/350 with Day 5 line-items in the comment.

## What's validated

### Tests (after every commit)

127 unit tests passing (vitest run). Tsc clean. Production build
clean (next build → 205 KB First Load JS).

### Live measurement on the CrowdStrike CL fixture (this session)

Three rounds of k=3 with GPTZero scoring on
`eval/regression-fixtures/cl-assembly/crowdstrike-ai-security-consultant`:

| Round | Mean VR | GPTZero rep 1 | rep 2 | rep 3 | Pass rate (≥51% h+m) |
|---|---|---|---|---|---|
| v3 (pre-port) | 27.5% | 99% | 0% | 0% | 1/3 |
| v4 (rigid bullets) | 14.9% | 0% | 83% | 39% | 1/3 |
| v4.1 (loose bullets + 5-section + 400-word target) | 9.7% | 0% | 0% | 47% | 0/3 |

**Conclusion:** GPTZero variance dwarfs prompt-level effect on this
fixture. Letter 1 (the gold reference, separate session via human-writer
skill) lands at 91% human. Both v3 and v4.1 produce occasional 80%+
passes but neither reliably. Roughness-injection pass scoped as
post-MVP work to actually narrow the variance band.

User decision: ship v4.1 because framework adherence (moment-hook,
bullets, conditional gap, named company 2x, banned phrases absent)
is materially better than v3's wall-of-text prose, and the GPTZero
variance is content-register-driven (dense technical cybersec), not
prompt-driven.

### Browser smoke test (still pending — user UAT)

User running the smoke checklist as of session-end:
- Empty state "Or upload" link
- Upload .md → preview populates
- Regenerate-with-feedback button → expanding panel
- Voice dictation in feedback → autoscroll
- Esc / X close
- Interview flow: Enter-to-send, mic + autoscroll, assemble + regen
- Settings dialog inline validation on bad keys

If anything fails, fix on `experiment/framework-content-port` before
merging downward.

## Submission deliverables (handoff state)

Per Ryan Beswick's email (saved in `project_lawyercom_mojo_takehome.md`
career-forge memory) Ryan asked for:

1. ✅ **Build something real** — HWP. Original, working, demo-able.
2. ✅ **Share output** — github.com/oklysit/human-writer-pro (already
   public). Branch state at submission time will be `main` after the
   experiment → dev → main FF merge.
3. ✅ **Explain MoJo setup** — MOJO-SETUP.md (already in repo) covers
   Active Hours definition, model routing table, subagent-driven
   development loop, Decision Value log per Beswick Part 1-3 framework.
4. ⏳ **Email response** — to be drafted via HWP itself (dogfood demo).
   User pastes Ryan's email as Context, does the interview, assembles
   the response.
5. ⏳ **Loom video (optional)** — captures user using HWP to write the
   response email. 5 min runtime. Self-demonstrating.

## Open decisions for next session

In priority order:

### 1. Browser UAT (immediate)

User is testing the smoke list above. Bug fixes (if any) land on
`experiment/framework-content-port` or a new fix branch. After UAT
passes, merge.

### 2. Merge experiment → dev/oauth-localhost → main (FF chain)

Branch state confirmed clean: main is 0 commits ahead of dev/oauth-
localhost; dev → experiment is 17 commits ahead. All FF-eligible.
No merge conflicts possible.

```bash
# After UAT passes
cd /home/pn/projects/human-writer-pro
git checkout dev/oauth-localhost
git merge --ff-only experiment/framework-content-port
git checkout main
git merge --ff-only dev/oauth-localhost
git push origin main
```

User is git-curious (per career-forge memory `user_git_knowledge.md`)
— walk through the FF semantics during the merge.

### 3. Dogfood README v1 + email response via HWP

Both are user-driven. Workflow:
1. Open HWP at localhost
2. **README v1 path** — Output panel → "Or upload an existing draft to
   edit" → upload current README → Regenerate with feedback ("tighten
   the intro to lead with MoJo Score; mention the v4.1 prompt iteration
   discipline; …"). Iterate until sharp.
3. **Email response path** — Context panel → paste Ryan's email →
   Start Interview → answer questions about the MoJo angle, orchestration
   setup, why HWP qualifies → Assemble → Regenerate with feedback as
   needed.

Both demonstrate the product working on its meta-task. Ryan
implicitly sees HWP being used to communicate about itself.

### 4. Loom video (optional)

5-7 minute screen recording of the user using HWP to write the
response email. Demonstrates Output / Human Time visually.

### 5. Backlog (post-submission)

- Selection-based Edit Chat refactor with single-word inline editing
  (career-forge memory: `project_edit_chat_selection_scope.md`)
- Multi-mode polish — academic essay mode (PDF assignment + rubric →
  essay), email mode, free-form on the same engine
- Roughness-injection pass for GPTZero variance
- Automated GPTZero regression test (statistically significant n)
- Mode picker UI restoration
- File chips + progress feedback indicators (UI bundle items 3 + 4
  from `process/ui-ux-feedback-2026-04-15.md`)
- Chat-paradigm restructure (UI bundle item 6, bundles with
  selection-based Edit Chat)
- /handoff workflow automation (career-forge memory:
  `project_handoff_workflow_skill.md`)

## Files of interest

| Path | What |
|---|---|
| `lib/assemble.ts` | SYSTEM_PROMPT (v4.1 with 5-section framing) + assembleWithFeedback() with cl/edit modes. v4 history in the file's docstring. |
| `lib/store.ts` | outputSource + uploadedDraftContent + setUploadedDraft. setOutput auto-tags interview-source. |
| `lib/prompts/modes/cover-letter.ts` | v4 interviewer probes — moment-hook stringency in beat 1, bulleted-format awareness in beat 3, unconditional gap probe in beat 6 (assembler decides inclusion). |
| `components/preview-panel.tsx` | Upload-to-edit empty state + regenerate-with-feedback panel + per-source VR computation. |
| `components/edit-chat.tsx` | Paragraph-level Edit Chat — still ships, no UI surface invokes it for MVP. Has X close + Escape + voice on both textareas if/when re-surfaced. |
| `components/settings-dialog.tsx` | Inline API key validation. |
| `app/page.tsx` | handleAssemble + handleRegenerate (legacy) + handleRegenerateWithFeedback (new MVP edit primitive). EditChat render path removed. |
| `app/globals.css` | Drop cap removed. |
| `README.md` | Submission-framing rewrite. |
| `MOJO-SETUP.md` | Beswick Part 1-3 setup writeup (already existed pre-session). |
| `mojo-log.jsonl` | Active Hours + Decision Value audit trail. Day 5 entries appended. |
| `process/decisions.md` | Decision Value log. 3 new top entries from Day 5. |
| `process/handoff-2026-04-15-context-first-shipped.md` | Prior handoff. |
| `eval/reports/mojo-score-2026-04-15.md` | Latest report (gitignored, regenerable via `npm run mojo:report -- --tests=127`). |

## What NOT to do

Carrying forward from prior handoffs + adding new from this session:

- Do NOT add Strunk / anti-patterns / voice profile / banned-isms loads
  back into the assembly call. Strip discipline holds (2026-04-14
  bisection). v4 framework port is structural (5-section + bullets +
  conditional gap), NOT style/voice loads.
- Do NOT re-add the EditChat trigger UI in app/page.tsx without first
  refactoring the trigger to respect actual selection ranges (see
  `project_edit_chat_selection_scope.md`).
- Do NOT use VR cross-prompt comparisons as a ranking metric (see
  `feedback_vr_as_within_draft_signal.md`). Within-draft iteration
  signal only.
- Do NOT read GPTZero's `burstiness` field as meaningful (see
  `feedback_gptzero_burstiness_not_signal.md`). Always returns 0.
- Do NOT push to GitHub without user approval (career-forge memory
  `user_git_knowledge.md` — user is learning git semantics; merge +
  push deserve a walk-through).
- Do NOT delete the orphan mode files (`lib/prompts/modes/{essay,
  blog,email,free-form}.ts` + `mode-selector.tsx`) yet — multi-mode
  is on the roadmap; orphans may be re-activated soon.
- Do NOT bump SENIOR_IC_HOURS without justifying via a line-item
  breakdown comment (anti-padding discipline; the constants must
  reflect what a senior IC would actually take).

## State at session close (pre-merge)

```
Branch: experiment/framework-content-port
Commits ahead of dev/oauth-localhost: 17 (10dcb46, cd75a30, 648beb7,
  0a262c2, 5a5217d, 3815fcd, e2e58c5, 5461d8a, ff75409, 01b851d,
  + earlier session commits f098e8a, 43dd62c, 777a92f, 5884e9d,
  26ee0b6, c8fef17, plus this handoff commit)
Working tree: clean (after this handoff commit lands)
Tests: 127 passing
Typecheck: clean
Production build: clean (205 kB First Load JS)
MoJo Score (Senior IC hours, mid/fair): 22.3x at 13.2h Active Hours
Decision Value: 30.45h across 6 entries

Ready for: browser UAT → merge → push → email Ryan
```
