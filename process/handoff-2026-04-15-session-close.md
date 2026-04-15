# Session Handoff — 2026-04-15

## TL;DR

Two days of iteration on `dev/oauth-localhost` took the live app from
6-9% VR / wall-of-text / question-echo failures → first ship-ready
output. Validated end-to-end on a fresh CrowdStrike CL: **27% VR,
78% human GPTZero, 5 paragraphs, 3.5/4 consultant eye-test criteria.**

Branch is 20 commits ahead of `main`, all stable, all tests passing
(127 tests). Ready to merge once the user submits the actual CrowdStrike
CL or decides on the merge timing.

## What got fixed (commit chronology)

In rough order of when each problem surfaced + got addressed:

1. **`b2bb104` OAuth proxy URL fix.** Anthropic SDK chokes on relative
   `baseURL: "/api"` — `new URL()` throws on relative paths. Fixed by
   resolving against `window.location.origin`. Live app no longer hangs
   silently when starting an interview.
2. **`308c84a` Drop banned-AI-ism filter from base prompt.** Negative
   style refs were causing the model to paraphrase around banned words,
   hurting VR. (Note: this commit only touched the interview path; the
   actual VR collapse turned out to be elsewhere — see below.)
3. **`4f8c27e` Diagnostic scripts.** `scripts/debug/minimal-assembly.ts`
   (control: pilot band-35 reproduction outside the product) +
   `scripts/debug/bisect-pipeline.ts` (additive bisection of contamination
   layers). Control hit 46% VR — confirmed prompt + model + SDK still
   work in isolation; bug was in the product pipeline.
4. **`6c9e317` Strip assembly to band-35 pilot prompt only.** The biggest
   single fix. Removed `getAssemblySystemPrompt`, mode formatting, framing
   line, boundary tags, numbered rules — assembly call now sends ONLY
   the band-35 system prompt + raw interview as user message. Verified
   VR jump on cent-capital from 6-9% → 42.8%.
5. **`891645e` Bump word range 225-275 → 290-400.** Match the empirical
   distribution of the 5 approved CLs (median 344). Cross-fixture
   verify: 5/5 fixtures ≥20% VR, mean 43.6%.
6. **`a3029f1` Context input field** in the InterviewPanel. Free-form
   text the user pastes pre-interview; reaches ONLY the interview
   prompt, never the assembly call.
7. **`714d2a7` `stripInterviewQuestions` helper.** Explicit helper for
   building assembly-stage input from interview turns (user-only).
   Defensive — store already did this inline, but the named helper
   makes the invariant survive future edits.
8. **`4d55723` Structural beats + pacing in assembly prompt.** First
   structural addition — opener / credentials / why / close.
9. **`b4b8519` Voice accumulator fix (Scenario B state corruption).**
   Critical bug: the user's voice input was accumulating across turn
   submits, causing each subsequent turn's stored answer to contain all
   prior turns' text. Fixed by hoisting `accumulatedFinal` to a ref and
   adding `voice.reset()` to clear the buffer on each submit.
10. **`960ee97` Question-echo regex category** in the AI-ism detector.
    Catches "The single thing I want a hiring manager to know is..."
    style answer-prefix tells.
11. **`7db60f4` Ready-to-assemble UX banner** (later removed).
12. **`2d4b2c3` In-flight chunk leak fix.** Speech recognition has
    pipeline lag; words spoken just before submit could leak into the
    next turn's textbox. Fixed by nulling onresult/onerror/onend
    handlers in `voice.stop()` before calling `recognition.stop()`.
13. **`ad1d542` Binding line for assembly.** "Apply heavy verbatim
    stitching within each beat — the structural beats tell you WHERE
    to place clauses, the stitching strategy tells you HOW to lift
    them." Bumped cent-capital VR 42.4% → 46.4%.
14. **`e3342c8` Drop coverage UI + question count.** Removed "Question
    N of ~7", coverage progress bar, the ready-to-assemble banner.
    Assemble button now gates on ≥1 user turn instead of coverage.
15. **`bc75fa9` Adaptive interviewer + drop coverage state.** Rewrote
    the interview prompt as adaptive (drop fixed rubric, model judges
    readiness, conversational ready-signal). Dropped `coverage_score`
    + `rubric_items_addressed_this_turn` from the JSON shape. Dropped
    `rubricItems` / `seedQuestion` / `targetWords` from all mode
    configs. Net -24 tests (legacy-helper coverage removed).
16. **`f72fe0e` Context-first workflow.** Removed auto-kickoff on mode
    change. Context is a primary visible panel (not collapsible).
    "Start Interview →" button explicitly fires the kickoff.
17. **`bdc9e03` Five-paragraph killer-CL structure** in assembly prompt.
    First attempt at multi-paragraph format.
18. **`f2d6bcf` Killer-CL framework guidance** for the cover-letter
    interviewer. Replaces the prior format-spec with framework-driven
    interview probing — what each beat needs, conditional honest-gap
    rule, don't-default-to-fixed-template instruction.
19. **`bdd3f75` Format-first prompt** with literal 5-paragraph pattern.
    Reshaped SYSTEM_PROMPT so the multi-paragraph requirement is
    dominant. Lead with `[paragraph 1] / [paragraph 2] / ...` literal
    pattern, then per-paragraph word budgets, then content guidance.

## What's validated

End-to-end on the user's fresh CrowdStrike CL run (2026-04-15):

| Metric | Result | Pass criterion |
|---|---|---|
| 5-gram VR | 27% | ≥20% rough threshold ✓ |
| GPTZero | 78% human / 22% AI | ≥51% non-AI ✓ |
| Format | 5 paragraphs, blank-line separated | 5-paragraph killer CL ✓ |
| Eye-test | 3.5/4 consultant criteria | ≥3/4 ship bar ✓ |

The interview itself was the other half of the win. The framework-guided
interviewer:
- Pushed back when the user gave a generic "why this company" answer
- Surfaced the Falcon outage as actionable material
- Addressed the experience-gap directly with a specific question
- Asked for a specific close + contact preference

## What's known broken / deferred

- **cent-capital fixture stuck at single-paragraph output.** The Q1 hook
  is so dominant (~1500 words) that Sonnet collapses the entire interview
  into one cohesive narrative regardless of format instructions. Format
  verification now requires real multi-topic interviews; cent-capital is
  still useful for VR but not for paragraph-structure checks.
- **Other modes (essay, blog, email, free-form) untested.** Their
  `systemAddition` is the pre-refactor format-spec content. None of the
  refactor work has been validated against these modes. If/when the user
  tries them, expect the same trajectory: assembly prompt is
  cover-letter-shaped, interview prompt loads mode-specific guidance.
- **Mode dropdown still resets state on change.** `setMode()` clears
  `contextNotes` + `interview` + `output`. Switching mid-session is
  destructive — fine for now since the user picks a mode and stays.
- **Short-sentence pacing not landing.** All sentences in the latest
  output are 17-40 words. The pacing instruction ("mix short 5-12 word
  sentences with longer ones") is in the prompt but the model isn't
  honoring it. Defer — output is shippable.
- **Source-of-truth file divergence.** `eval/regression-fixtures/prompts/band-35-strategy.md`
  still encodes the pure 225-275 pilot range. The live `SYSTEM_PROMPT`
  has diverged significantly (290-400 range, 5-paragraph killer CL,
  format-first structure). Re-baseline the source-of-truth + regression
  fixtures separately if/when shipping the new prompt as the canonical.
- **`.claude/scheduled_tasks.lock`** — deleted (housekeeping).

## Files of interest

| Path | What |
|---|---|
| `lib/assemble.ts` | The assembly call. `SYSTEM_PROMPT` is the format-first 5-paragraph killer-CL prompt. |
| `lib/prompts/steps/interview.ts` | Adaptive interviewer prompt — no rubric, model-judged readiness. |
| `lib/prompts/modes/cover-letter.ts` | Killer-CL framework guidance, consumed by the interview prompt as Mode-Specific Guidance. |
| `lib/coverage.ts` | `parseModelResponse` (new shape: question / priorAssessment / readyToAssemble) + `stripInterviewQuestions`. Legacy helpers (`computeCoverageScore`, `canAssemble`, `countUserWords`) deleted. |
| `lib/store.ts` | AppState: `contextNotes`, `interview { turns, rawTranscript, status, lastAssessment }`. Coverage/rubric state dropped. |
| `lib/useVoiceInput.ts` | `accumulatedFinalRef` + `reset()` + null-handler `stop()`. |
| `components/interview-panel.tsx` | Context-first UI, no count/coverage bar, Start-Interview button gates kickoff. |
| `app/page.tsx` | Assemble button gated on `useCanAssemble()` (≥1 user turn). |
| `scripts/debug/verify-strip.ts` | k=3 verify on cent-capital. Useful for VR regression checks (caveat above). |
| `scripts/debug/verify-all-fixtures.ts` | k=N across all 5 cl-assembly fixtures. |
| `scripts/debug/bisect-pipeline.ts` | Additive bisection from control to production prompt — used in the 2026-04-14 triage. |

## Open decisions for next session

1. **Merge `dev/oauth-localhost` → `main`?** Branch is stable, tests pass,
   ship-ready output validated. No reason to wait beyond user's call.
2. **Add the CrowdStrike output as a 6th cl-assembly regression fixture.**
   We have a known-good multi-topic interview + ship-ready output —
   lock as a baseline so future regressions are measurable.
3. **Re-baseline the source-of-truth file** (`eval/regression-fixtures/prompts/band-35-strategy.md`)
   to match the new SYSTEM_PROMPT, OR keep it as the historical pilot
   reference and document divergence.
4. **Lawyer.com Mojo writeup.** This branch is the strongest pitch
   material for Ryan Beswick's follow-up (per the career-forge memory).
   Setup writeup + Loom recording referenced in the existing task list
   (steps E, F, H, I).
5. **Edit chat (Task 16)** — the next product feature. The consultant
   identified this as the load-bearing feature for the "would I send
   this" eye-test bar; once landed, the user iterates on the first draft
   instead of relying on assembly to nail it in one shot.

## What NOT to do

- Do NOT add Strunk / anti-patterns / voice profile / banned-isms loads
  back into the assembly call. The 2026-04-14 strip + bisection proved
  every layer there costs VR.
- Do NOT replace the `stripInterviewQuestions` invariant. The model never
  sees questions in its assembly input — that's the question-echo defense.
- Do NOT re-add the coverage/rubric system to gate assembly. The model
  judges its own readiness conversationally; the user controls when to
  fire Assemble.
- Do NOT auto-fire the kickoff on mode change. Context-first means the
  user explicitly clicks Start Interview after filling Context.
