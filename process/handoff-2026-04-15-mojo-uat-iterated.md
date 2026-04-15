# Session Handoff — 2026-04-15 (Mojo UAT Iterated)

Successor to `handoff-2026-04-15-mojo-mvp-shipped.md`. Same day; this
session iterated heavily through UAT cycles after the MVP cut, landing
multi-mode routing, file chips, target-words override, seed-transcript
utility, MoJo Score reconciliation against Beswick's actual formula,
and a stack of UAT-driven UX fixes.

## TL;DR

Branch `experiment/framework-content-port` is **38 commits ahead of
`dev/oauth-localhost`** (was 17 at the start of this session). 127
tests pass, tsc clean, production build clean. User is doing the
final round of UAT as of session-close — once it passes, merge
through dev → main, push, then dogfood the email response via HWP
itself and send.

The MoJo Score landed at **17.2x conservative** / **36.5x mid (Scenario
B)** under the honest-audit scoring. The script and `/projects/screenshots/
hwp-mojo-score-calc.md` are aligned to Beswick's actual formula
(`(Delivered Value + Decision Value) / Active Hours` where Delivered
Value = TVH × Quality Factor) — NOT the earlier IC-hours-to-build
proxy that we'd previously been reporting as the headline.

## What got built this session (commit chronology, after the prior handoff at `bb2086c`)

1. **`d2518ef`** — Email-response prep card at `process/email-response-prep-2026-04-15.md` so the user has facts/numbers/angles within reach during the dogfood email-drafting interview.

2. **`655ed47`** — Two UAT-blocking fixes:
   - Settings dialog accepts dummy keys when `NEXT_PUBLIC_USE_LOCAL_OAUTH=1` (was forcing `sk-ant-` prefix unconditionally, breaking OAuth dev mode).
   - Mic-button focus restoration after stop on all three sites (InterviewPanel, PreviewPanel feedback, EditChat) — previously Enter retoggled the mic instead of submitting because focus stayed on the button.

3. **`913a590`** — Strengthened `GENERIC_EDIT_SYSTEM_PROMPT` (explicit prohibitions: don't ask for raw material, don't assume CL, don't impose templates) + visible mode indicator chip in Output header (`· editing uploaded draft` accent / `· from interview` muted).

4. **`0b6418b`** — PDF upload fix: switched `pdfjs-dist` to its **legacy build** (was hitting `n.toHex is not a function` because pdfjs 5.x's main build uses `Uint8Array.prototype.toHex()` which not all browser runtimes ship). Postinstall script updated to copy the legacy worker.

5. **`4bf5f58`** — Chat-paradigm lite v1: removed redundant "Interview" header, added a model-style greeting in the turn-history area styled like an assistant turn.

6. **`b0abafb`** — Mic on the Context textarea (pre-interview dictation) — independent voice instance from the answer-stage hook.

7. **`a63739d`** — Chat-paradigm lite v2: moved the Context textarea + Upload + Start-Interview controls from the top of the pane down into the bottom input dock, mirroring the interview's answer dock layout. Pre-interview state now reads as "greeting above + context input below," same shape as the interview state.

8. **`4ee8ddf`** — Paperclip in the answer dock so the user can add context mid-interview. Hidden file input moved to the root of the component so `fileInputRef.current` is valid in both dock states. Toast confirmation distinguishes pre- vs mid-interview ("Context added — the interviewer will reference it in the next question.").

9. **`592296b`** — Loading-state text upgrade: explicit "Thinking…" / "Assembling…" / "Streaming…" captions paired with the existing pulse bars across InterviewPanel turn history + PreviewPanel (both empty-state and output-streaming).

10. **`fffdb71`** — Mode detection + generic-write assembler:
    - `lib/detectWritingMode.ts` — heuristic classification (cover-letter / email / essay / blog / free-form) with explicit override phrases. Defaults to **free-form** (not CL) when context is empty per user pushback on the "90% is CL" assumption.
    - `lib/assemble.ts` — new `GENERIC_WRITE_SYSTEM_PROMPT` with concrete rules: heavy verbatim stitching, **3+ consecutive words minimum** when lifting (no percentage target — user pushed back on a specific VR target, says polish suffers more than detection improves), **filler removed** for polished output (departing from CL framework's "preserve filler for burstiness" rule), no 5-section template, AI-tell avoidance.
    - `assemble()` and `assembleWithFeedback()` accept a `regime: "cl" | "generic" | "edit"` param.
    - `app/page.tsx` handlers detect mode + route on every assembly call.
    - `lib/store.ts` adds `updateMode` (soft mode change, preserves session) alongside `setMode` (hard reset).

11. **`466d076`** — Target-words input + detected-mode chip in the Assemble dock:
    - Number input "Target __ words (blank = auto)" stored in `store.targetWords`.
    - Threaded into `assemble` and `assembleWithFeedback` via a `buildTargetWordsDirective` system-prompt suffix.
    - `maxTokens` auto-scales when targetWords > 300 to avoid mid-stream truncation.
    - Detected-mode label chip (right-aligned, accent color) in the Assemble dock — shows live which mode the assembler will run.
    - Prompt regime refinement: dropped the ~25% verbatim target from `GENERIC_WRITE_SYSTEM_PROMPT` per user data-driven pushback; kept "heavy verbatim stitching" + 3-word min as the qualitative anchor.

12. **`b11bad4`** — Seed-from-prior-transcript dev utility:
    - `lib/parseTranscript.ts` parses common transcript formats: `[USER]/[ASSISTANT]`, `User/Assistant`, `**You**/**Interviewer**`, `Q/A`. Picks the marker style with the most matches; lines without markers append to most recent turn; full fallback to single user turn when no markers detected.
    - `store.seedInterview(turns)` bulk-replaces interview state.
    - Collapsible "or seed from prior transcript" affordance in the pre-interview dock.

13. **`ef61a4e`** — File uploads as chips (UI bundle item #4 from the original deferred list, pulled forward):
    - `lib/store.ts` — new `AttachedFile` type + `attachedFiles` state + `attachFile`/`removeAttachedFile` actions.
    - `lib/combineContext.ts` — merges typed text + file content at call time, wrapped in `--- From: filename ---` markers. Helper `formatFileSize` for chip display.
    - `handleFileSelect` now pushes a chip rather than inlining text. Clean textarea, file content reaches model only at askNextQuestion / detectWritingMode call time.
    - Chips render above the textarea in BOTH pre-interview and mid-interview docks: FileText icon + truncated filename + ext badge + X remove. Title tooltip shows full name + size + char count.
    - Mode detection upgraded to use combined context, so an uploaded job-posting PDF triggers CL mode even when typed textarea is empty.

14. **`01b851d`** — Day 5 mojo audit trail: 5 mojo-log.jsonl entries (1 active + 4 decisions) + 3 new top entries in `process/decisions.md` + SENIOR_IC_HOURS bumped (240/295/350) for the Day 5 added scope.

15. **`bb2086c`** — Mojo MVP shipped handoff doc (the one this handoff supersedes).

16. **`6a61c30`** — Rewrote `scripts/mojo-report.ts` to Beswick's actual formula:
    - Primary: `(BUSINESS_IMPACT_TVH × QUALITY_FACTOR + decisionValueSum) / activeHours` for 3 scenarios (A: 164 own-use / B: 376 5-user / C: 2279 50-user)
    - `QUALITY_FACTOR = 1.2` (self-assessed; honest-audit recommends 1.0 pending external review)
    - Senior IC hours framework demoted to "secondary sanity check"
    - Placeholder formula demoted to "tertiary internal tracking"
    - All three reported side-by-side
    - Constants exposed for editing

## What's validated this session

### Production build + tests
- `next build` → 205 KB First Load JS, clean
- 127 unit tests passing across 8 files
- `tsc --noEmit` clean

### MoJo Score (Beswick-aligned)
- Active Hours: **13.2h** cumulative (engaged time only; agent runtime excluded; AW-reconciled Day 1-4, conservative self-report Day 5)
- Decision Value sum: **30.45h** (6 entries, see `mojo-log.jsonl`)
- Quality Factor: **1.2 self-assessed** (honest audit suggests 1.0 pending external review; see "Open decisions" §2)
- TVH: **164h** (Scenario A own-use) / **376h** (Scenario B 5-user) / **2279h** (Scenario C 50-user)
- **MoJo Score (Scenario B mid, default to cite): 36.5x**
- Conservative (Scenario A): 17.2x
- Honest-audit revision (drop academic-mode TVH + lower QF + revised Clarity per user's scale): would land closer to 11x conservative / 27x mid

### UAT cycles
- Round 1 (commits 655ed47 → b0abafb) — surfaced API key + mic focus + edit-mode prompt + chat paradigm
- Round 2 (commits 4ee8ddf → 466d076) — surfaced mid-interview upload + loading-text + mode routing + target-words slider
- Round 3 in progress at session close (commits b11bad4 → ef61a4e) — seed transcript + file chips
- Each round added ~3-6 commits of UAT-driven fixes; pace was tight but stable

### Decision log
- 6 entries in `process/decisions.md`, 3 new this session (regen-with-feedback, v4.1 ship despite variance, GPTZero IS the bar reversal)
- 5 audit-revised Clarity Scores documented in `/projects/screenshots/hwp-mojo-score-calc.md` §4

## Submission deliverables — current state

| Item | Status | Where |
|---|---|---|
| Public repo | ✅ shipped | `github.com/oklysit/human-writer-pro` (main is 0 ahead of dev; needs FF merge from experiment) |
| README | ✅ submission-grade | `README.md` + `/projects/screenshots/hwp-readme.md` |
| MOJO-SETUP.md | ✅ pre-existed | `MOJO-SETUP.md` |
| Decision log | ✅ 6 entries with Clarity Scores | `process/decisions.md` + `/projects/screenshots/hwp-decisions.md` |
| MoJo Score calc | ✅ Beswick-aligned | `/projects/screenshots/hwp-mojo-score-calc.md` |
| VR pilot TL;DR | ✅ 400-word digest | `/projects/screenshots/hwp-vr-pilot-tldr.md` |
| Email response prep | ✅ talking points | `/projects/screenshots/hwp-email-response-prep.md` |
| Working clone-and-run | ✅ verified pre-UAT | BYO-key default; OAuth optional via env flag |
| Mode routing for non-CL | ✅ shipped | detection + generic prompt + chips + target-words override |
| Final UAT pass | ⏳ in progress at close | user driving |
| Email to Ryan | ⏳ pending | dogfood via HWP itself |
| Loom video | ⏳ optional | recommended but not strictly required |
| Merge experiment → dev → main | ⏳ pending UAT | FF eligible (no conflicts) |
| Push to GitHub | ⏳ pending merge | needs user PAT confirmation |

## Open decisions for next session

In priority order:

### 1. Finalize UAT and merge

User is doing UAT round 3 at session-close. If anything fails, fix on `experiment/framework-content-port` (or a new branch off it for a substantial change). Once UAT clears:

```bash
cd /home/pn/projects/human-writer-pro
git checkout dev/oauth-localhost
git merge --ff-only experiment/framework-content-port
git checkout main
git merge --ff-only dev/oauth-localhost
git push origin main
```

User is git-curious (per `user_git_knowledge.md` memory) — walk through the FF semantics during the merge. Confirm before pushing.

### 2. Decide MoJo numbers for the email

Three options on the table (see `/projects/screenshots/hwp-mojo-score-calc.md` for full breakdown):

- **Honest audit revision** (recommended): drop academic-mode TVH from Scenario A (not deliverable today since multi-mode polish is still roadmap), lower Quality Factor to 1.0 pending external review, revise Clarity Scores per user's scale. Lands at **~11x conservative / ~27x mid**. Defensible, conservative, invites Beswick to adjust upward.
- **Self-assessed mid (Scenario B at QF=1.2)**: ~36.5x. Honest about the projection assumptions but uses self-assessed Quality Factor. Closer to Beswick's lawclaw.ai 52x example.
- **Run an LLM code review subagent** (~20 min): validates Quality Factor with at least the LLM half of "peer + LLM" criterion. Could push QF to 1.3 if the review lands strong, supporting a higher headline number.

User's personal coursework MoJo (separate case, mentioned for credibility): ~3-5x throughput on WGU coursework with AI tools (18 courses in 6 months vs 3-4 traditional). Worth citing as proof-of-discipline; do NOT blend with HWP's number.

### 3. Dogfood the email response via HWP

Workflow:
1. Open HWP at localhost (or wherever it's hosted)
2. Paste Ryan's email into Context
3. Upload helper docs as chips: `hwp-readme.md` + `hwp-vr-pilot-tldr.md` + `hwp-decisions.md` + `hwp-mojo-score-calc.md`
4. Click Start Interview — should detect "Cover Letter" mode (job posting signals)
5. Answer questions about MoJo angle, orchestration, why HWP
6. Click Assemble (Target ~300-400 words)
7. Refine via Regenerate with feedback as needed
8. Copy → email

The `process/email-response-prep-2026-04-15.md` doc has facts/numbers/angles to keep in arm's reach during the interview.

### 4. Optional Loom

Captures user using HWP to write the response email. ~5-7 min runtime. Self-demonstrating MoJo (the product working on its own meta-task).

### 5. Backlog (post-submission)

- Selection-based Edit Chat refactor with single-word inline editing (`project_edit_chat_selection_scope.md`)
- Multi-mode polish (academic essay mode, email mode, free-form on the same engine)
- Roughness-injection pass for GPTZero variance
- Automated GPTZero regression at statistically significant n
- LLM code review subagent for Quality Factor calibration
- Full chat-paradigm restructure (we shipped lite v1+v2; v3 would be unified message thread, currently structured panels with chat-like affordances)
- `/handoff` skill + SessionStart hook automation (`project_handoff_workflow_skill.md`)

## Files of interest

| Path | What |
|---|---|
| `lib/assemble.ts` | SYSTEM_PROMPT (CL framework, v4.1) + GENERIC_WRITE_SYSTEM_PROMPT + GENERIC_EDIT_SYSTEM_PROMPT + assemble + assembleWithFeedback (cl/generic/edit modes) + buildTargetWordsDirective |
| `lib/detectWritingMode.ts` | Heuristic mode classification + assemblyRegime helper. Defaults to free-form. |
| `lib/combineContext.ts` | combineContext(typed, files) + formatFileSize |
| `lib/parseTranscript.ts` | Multi-format transcript parser for the seed utility |
| `lib/store.ts` | Adds AttachedFile + attachedFiles + chip actions, updateMode (soft), setTargetWords, seedInterview |
| `lib/prompts/modes/cover-letter.ts` | v4 interviewer probes (moment-hook, bulleted-aware, unconditional gap probe) |
| `components/interview-panel.tsx` | Chat-paradigm-lite layout, chips render in both docks, mid-interview paperclip, seed-transcript utility, target-words via store |
| `components/preview-panel.tsx` | Upload-to-edit empty state, regenerate-with-feedback panel, mode indicator in header, Streaming/Assembling captions, VR by output source |
| `components/edit-chat.tsx` | Cancel X + Esc + voice on both textareas + focus-restoration. UI surface removed in app/page.tsx; component still ships in codebase for v2 selection refactor. |
| `components/settings-dialog.tsx` | Inline API key validation; OAuth dev mode bypass for dummy keys |
| `app/page.tsx` | Detected-mode chip + target-words input near Assemble; combineContext threaded into all assembly handlers |
| `app/api/v1/messages/route.ts` | OAuth proxy (USE_LOCAL_OAUTH=1 only); 403 by default for clone-and-run safety |
| `MOJO-SETUP.md` | Beswick Part 1-3 setup writeup (pre-existed) |
| `mojo-log.jsonl` | Active Hours + Decision Value audit trail; 12 entries |
| `process/decisions.md` | 8 entries (3 from this session) |
| `process/post-mvp-backlog.md` | Items #1, #2, #5 already addressed this session; #3, #4, #6, #7 remain |
| `process/ui-ux-feedback-2026-04-15.md` | Items #1 (autoscroll), #2 (chat paradigm — lite shipped, full v3 not), #4 (chips) addressed |
| `process/email-response-prep-2026-04-15.md` | Talking points for the dogfood email |
| `process/handoff-2026-04-15-context-first-shipped.md` | First handoff of the day (pre-MVP push) |
| `process/handoff-2026-04-15-mojo-mvp-shipped.md` | Second handoff of the day (post-MVP cut, pre-UAT) |
| `process/handoff-2026-04-15-mojo-uat-iterated.md` | This handoff |
| `eval/reports/mojo-score-2026-04-15.md` | Latest report (gitignored, regenerable) |
| `/projects/screenshots/hwp-readme.md` | Cross-platform-readable README copy |
| `/projects/screenshots/hwp-vr-pilot-tldr.md` | 400-word pre-reg pilot digest |
| `/projects/screenshots/hwp-decisions.md` | Decision log copy |
| `/projects/screenshots/hwp-mojo-score-calc.md` | MoJo Score calculation breakdown with TVH benchmarks + sources + honest audit |
| `/projects/screenshots/hwp-email-response-prep.md` | Email prep talking points copy |

## What NOT to do

Carrying forward + adding new from this session:

- Do NOT add Strunk / banned-isms / voice profile loads to the assembly call (strip discipline still holds; v4 framework port is structural, NOT style).
- Do NOT re-add the EditChat trigger UI in `app/page.tsx` without first refactoring the trigger to respect actual selection ranges (see `project_edit_chat_selection_scope.md`).
- Do NOT use VR cross-prompt comparisons as a ranking metric (see `feedback_vr_as_within_draft_signal.md`). Within-draft iteration only.
- Do NOT read GPTZero's `burstiness` field as meaningful (`feedback_gptzero_burstiness_not_signal.md`).
- Do NOT push to GitHub without user approval (user_git_knowledge.md — user is learning git semantics).
- Do NOT delete the orphan mode files (`lib/prompts/modes/{essay,blog,email,free-form}.ts` + `mode-selector.tsx`) yet — the mode files are now ACTIVE (mode detection routes to them); only `mode-selector.tsx` is genuinely orphan.
- Do NOT bump SENIOR_IC_HOURS or QUALITY_FACTOR without justifying via line-item evidence (anti-padding discipline).
- Do NOT inline file content into contextNotes — chips are the canonical pattern now (`combineContext()` merges at call-time).
- Do NOT skip the per-call `combineContext()` — using `contextNotes` directly will miss attached file content for any new code paths.

## State at session close

```
Branch: experiment/framework-content-port
Commits ahead of dev/oauth-localhost: 38
Working tree: clean (after the chips commit lands; this handoff commit
  brings it to 39)
Tests: 127 passing
Typecheck: clean
Production build: clean (205 kB First Load JS)
MoJo Score (Beswick-aligned, Scenario B): 36.5x at 13.2h Active Hours
  (or ~11-27x under honest-audit revision)
UAT round 3: in progress at session close
Decision Value: 30.45h across 6 entries

Ready for: UAT pass → FF merge → push → dogfood email → optional Loom → send to Ryan
```
