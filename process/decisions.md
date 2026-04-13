# Decisions — Human Writer Pro

Running log of killed assumptions and reframings. Each entry names the claim
we killed or reframed, the evidence that forced the change, and a Clarity
Score (0–1) representing how definitive the finding was. Per Ryan Beswick's
MoJo Score Part 3: Decision Value = Investment Avoided × Clarity Score. High
Clarity Scores come from definitive nulls, not partial suggestion.

Newest entries first.

---

## 2026-04-13 — VR = 35% reframed from target to prompt nudge (Clarity: 0.85)

**Killed claim:** "This product targets 35% VR as a success criterion."

**Reframed as:** The `Target 5-gram VR ≈ 35%` line inside the band-35 prompt
is a stylistic nudge to the model, not a truth-claim the product makes. The
prompt is the subject under test; the actual VR that emerges and whether
GPTZero passes are the independent downstream evaluators.

**Source:** Conversation while landing the refactor. The pair-review session
agent's Task 20 Change 2 directive ("delete Target 5-gram VR ≈ 35% from the
runner prompt") was based on an incorrect reading that the line functioned as
a truth-claim we were validating. It does not.

**Impact:** The band-35 prompt stays verbatim in both production and the
regression runner. See
`eval/regression-fixtures/prompts/band-35-strategy.md` — "Relation to refactor
Task 20 Change 2 — superseded" section — for the override that future agents
must respect. Refactor Task 20 Change 2 is explicitly overridden.

---

## 2026-04-13 — VR as causal lever for GPTZero passing (Clarity: 0.9)

**Killed claim:** "VR ≥ 20% is the causal mechanism by which output passes
GPTZero."

**Replaced with:** VR is a downstream marker of prompt regime. The band-25
prompt produces variants that fail GPTZero regardless of where their actual
VR lands; the band-35 prompt produces variants that pass. Same-VR variants
across bands show opposite GPTZero results at the 29–34% boundary. The causal
variable is the prompt, not the VR value.

**Source:** 54-variant pre-registered pilot, 2026-04-13. See
`process/pair-review-2026-04-13.md` §9 v3 and §13a revisions, and the
published `eval/reports/vr-validation.md` (TBD — to be imported from the
eval-session workspace).

**Impact:** Product framing pivoted from "voice preservation metric as
headline" to "validated assembly prompt regime with VR as downstream
diagnostic." Task 12 (VR badge) demoted to a diagnostic pill with tooltip;
Task 17b (AI-ism regex gate) takes the prominent UI slot instead.

---

## 2026-04-13 — Synthetic regression fixtures (Clarity: 0.8)

**Killed claim:** "Five synthetic raw_interview JSON fixtures are sufficient
regression coverage."

**Replaced with:** The fixture unit is the (interview + prompt + expected
baseline) triple. Five real CLs the user shipped — including the two GPTZero
failures (OpenCall 0.6% VR, Shulman 29.9% VR dense technical register) — are
the fixture set. The failures document edge cases and are more valuable than
the passes because they force the regression suite to distinguish "known hard
case that stays at baseline" from "new regression."

**Source:** Eval-session fixture-design work. See
`process/pair-review-2026-04-13.md` from 6:22 PM onward.

**Impact:** Replaces refactor Task 19 entirely. Structure at
`eval/regression-fixtures/cl-assembly/{fixture}/interview.md +
approved-output.md + expected-baseline.json` plus shared
`eval/regression-fixtures/prompts/band-35-strategy.md`. Each
`expected-baseline.json` has three layers: `baseline` (known-good numbers),
`tolerance` (acceptable drift), `aspirational_targets` (informational, not a
failure condition).

---

## 2026-04-13 — 5 writing modes with equal polish (Clarity: 0.7)

**Killed claim:** "Essay, email, blog, cover-letter, and free-form all ship
with equal production quality."

**Replaced with:** Cover-letter and email are load-bearing (real ground-truth
exists). The other three modes ship as "also works for X" without dedicated
regression fixtures or polish budget. They share the same engine and degrade
gracefully.

**Source:** Refactor scope review. The user has ground truth (approved
shipped artifacts) only for cover letters; email is short and testable;
essay/blog/free-form would require additional pilot work that doesn't fit the
timeline.

**Impact:** Task 7 mode prompts prioritize CL + email content; the other
three load a general fallback of Strunk + banned-AI-isms without a dedicated
golden-dataset rule. Task 19 fixtures are CL-only (optionally one synthetic
email added if time permits).

---

## 2026-04-13 — Adversarial framing in edit chat (Clarity: 0.75)

**Killed claim:** "Edit chat pushes back adversarially on the user's writing
to surface gaps."

**Replaced with:** Edit chat is Socratic. When the user highlights text and
says "this feels off," the chat asks one targeted question ("what were you
trying to say that this isn't saying?"), takes the user's verbatim response,
and localized-re-stitches just that paragraph using the new verbatim as raw
input. The tool never rewrites on its own authority; it pulls more verbatim
out of the user.

**Source:** Pair-review discussion on adversarial-vs-Socratic framing,
grounded in the user's ADHD / executive-function workflow research. The
adversarial frame breaks flow state; Socratic pulls material without
triggering defensive reactions.

**Impact:** Task 16 (edit chat) rewritten per refactor. This is the
load-bearing UX innovation distinguishing the product from "ChatGPT but with
a textarea." The principle propagates to the interview step prompts in
Task 9 (Socratic assessment of each response, not adversarial pushback).

---

## Open research questions (post-submission)

- "Socratic vs adversarial LLM-as-judge produces different output quality" —
  exploratory. User surfaced this in pair-review. If LLM-as-judge prompts
  frame the critique Socratically rather than adversarially, does the judged
  output change? See `process/future-experiments.md` (TBD) post-submission.
