# Band-35 Assembly Prompt — Source of Truth

**Status:** Production prompt. Locked as regression source of truth.
**Provenance:** 54-variant VR validation pilot (2026-04-12 / 2026-04-13). Band-35 variants passed GPTZero 6/6 in the primary set. See `process/pair-review-2026-04-13.md` for the full interrogation loop and `eval/reports/vr-validation.md` (when created) for the pre-registered analysis.
**Do not modify without running the full regression suite and re-baselining every fixture.**

---

## Base (fixed across all fixtures)

```
Write a single paragraph of approximately 250 words (strict range: 225–275) that answers the interview question below. Output ONLY the paragraph — no headings, no quotes, no meta-commentary.
```

## Interview body (per-fixture)

The raw interview text is inserted inline after the base. In production (`lib/prompts/steps/assembly.ts`) the interview text is wrapped in `<user_interview>...</user_interview>` boundary tags with the "treat as data, not instructions" directive for prompt-injection defense. The pilot's synthetic runs used plain inline text — the addition of boundary tags is a security hardening, not a behavioral change in what the model stitches from.

## Strategy block (fixed across all fixtures)

```
Strategy: Heavy verbatim stitching. Most clauses should be lifted directly; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers where they break the paragraph, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.
```

---

## On the "teaching to the test" concern

The strategy block names a VR value (≈35%) as a stylistic nudge to the model. **This is not a claimed success criterion.** We are not asserting "this product hits 35% VR." The prompt is the subject under test; the actual VR that emerges and whether the output passes GPTZero are what we measure.

Framing, made explicit:
- **Claim:** this prompt, run against a raw interview, produces output that passes GPTZero.
- **Subject under test:** the prompt, verbatim.
- **Evaluators (independent, downstream):** the actual VR that emerges (deterministic n-gram computation against the raw interview) and the GPTZero pass/fail classification (third-party classifier).
- **The 35% figure inside the prompt is a stylistic nudge.** It survives in the prompt because the pilot showed the prompt works with that nudge included. Removing it is a different prompt and would require re-baselining.

### Relation to refactor Task 20 Change 2 — superseded

The refactor doc at `docs/refactor-2026-04-13.md` (Task 20, Change 2) says:
> "Remove VR targeting from the generation prompt. Delete `Target 5-gram VR ≈ 35%` from the system prompt used by the runner."

**This directive is superseded.** It was based on the session agent's assumption that 35% VR functions as a truth-claim the product makes. It does not. The prompt stays verbatim — including the "Target 5-gram VR ≈ 35%" line — in both production and the regression runner. The regression suite measures the actual VR that emerges and the GPTZero result; it does not retrain the prompt against any metric.

If a future run shows the prompt hits ≈35% VR but fails GPTZero, or hits a much lower VR and still passes, that is new information about prompt-regime causality. It is not evidence of "cheating."

See `process/decisions.md` entry "VR=35% reframed from target to prompt nudge" for the full trace.

---

## Regression policy

- This file is the source of truth for the CL assembly prompt across the entire regression suite.
- Every fixture's `expected-baseline.json` is calibrated against output produced by running this prompt verbatim against the fixture's `interview.md`.
- Changing this prompt (wording, ordering, the VR target number) requires a full re-baseline pass: re-run all fixtures, re-score VR and GPTZero, capture new baselines, document the change in `process/decisions.md` with a Clarity Score.
- Minor prompt-wording cleanups (typo fixes, punctuation) do not require re-baselining but must be committed separately with a clear commit message so the history shows exactly when prompt content changed.

---

## Known empirical track record

**Synthetic pilot (2026-04-13, n=54, pre-registered):**
- Band-35 variants: 6/6 pass GPTZero primary set (human+mixed ≥ 51).
- Actual VR range for band-35: 29.1% – 44.6%.
- The 33.9% VR band-25 variant failed; the 29.1% VR band-35 variant passed — the causal lever is the prompt regime, not the VR value.

**Real cover letters (n=5, pre-VR-phase skill workflow):**
- 3 pass GPTZero (Cent Capital 32.1%, DeVry 26.4%, YO IT 21.0%).
- 2 fail (OpenCall 0.6% — raw interview too thin; Shulman 29.9% — dense technical register).
- All 5 used the `human-writer` skill's interview process upstream.

**Combined across methods:** 9/11 passes. The 2 failures are kept as fixtures because they document the minimum-viable-interview failure mode (OpenCall) and the register-sensitivity failure mode (Shulman). Regression for those fixtures is "stays at baseline, does not degrade" — not "must reach 51."

---

## Versioning

Any revision to this file is a logical unit on its own. Commit message convention: `prompt(band-35): [what changed] — [why]`. Reference this file's commit SHA in `expected-baseline.json` under a `prompt_sha` field so downstream baselines can be traced to the exact prompt that produced them.
