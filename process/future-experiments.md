# Future Experiments

Open research questions surfaced during the Human Writer Pro build
(2026-04-13 / 2026-04-14). None of these are required for the MVP
submission — they are starting points for follow-up work if the
Lawyer.com team invites a Part 2 / Part 3 interview, or for later
iterations of the product itself.

Each entry names the question, the current state of evidence (if any),
and the minimal experiment that would move the needle.

---

## 1. Socratic vs. adversarial LLM-as-judge

**Question.** Does judging AI-generated prose Socratically ("what is
this paragraph trying to do, and is it doing it?") produce different
quality ratings than adversarial judging ("attack this paragraph for
AI-isms, vagueness, or register drift")?

**Why it matters.** The generator prompt in this product is Socratic
(pulls verbatim out of the user) and the edit-chat is Socratic (asks
one targeted question rather than rewriting). Extending that discipline
to the judge (used in `scripts/eval/llm-judge.ts`) would maintain
framing consistency across the pipeline. But adversarial judges are
the standard in LLM-evaluation literature and may surface different
failure modes.

**Minimal experiment.** Take the 5 regression fixtures. Generate 3
outputs per fixture (k=3) using the locked band-35 prompt. Score each
output twice — once via the current Socratic-framed judge prompt, once
via an adversarial-framed judge prompt (same rubric axes, different
tone). Compare per-axis score deltas. If the Socratic judge
systematically scores higher or lower by >0.5 on the 1-5 scale, the
framing is a real variable and deserves a decision log entry. If the
scores track within 0.2, framing is not load-bearing and we default to
Socratic for internal consistency.

**Budget.** ~$1-2 and ~15 minutes of engineering time to write the
alternate judge prompt + re-run.

---

## 2. Deterministic VR injection at assembly time

**Question.** Can we raise the output's 5-gram VR by enforcing a
minimum verbatim overlap at assembly time — e.g., pre-extract the
10 strongest sentences from the interview and require the assembly
prompt to use at least 6 of them verbatim?

**Why it matters.** The 54-variant VR validation pilot showed VR is a
downstream marker of prompt regime, not a causal lever. The band-35
prompt's "Heavy verbatim stitching" instruction produces VR in the
29-45% range without explicit enforcement. But the 2 real-CL failures
(OpenCall at 0.6%, Shulman at ~30% but dense register) suggest the
prompt alone can be insufficient for some input shapes. Deterministic
injection — picking sentences mechanically and instructing the model
to preserve them — might shift those edge cases.

**Status.** Pilot evidence says the prompt regime is primary. Any
deterministic injection experiment needs to establish that it doesn't
regress the already-passing cases (cent-capital, devry-university,
yo-it-consulting) while lifting the edge cases.

**Minimal experiment.** Add a pre-assembly step that tokenizes the
interview, scores sentences by length + lexical diversity + named-
entity density (crude proxies for "signal sentences"), picks the top
N, and injects them as a `<must_preserve>` block in the assembly
prompt. Compare output VR + GPTZero against the current band-35
baseline using the regression runner. Fixtures: all 5.

**Budget.** ~4 hours engineering + ~$3 eval.

---

## 3. Register-based classifier for output quality expectations

**Question.** Can we classify interview transcripts by register
(reflective narrative vs. dense technical vs. marketing-style
polished) and set differentiated quality targets per class?

**Why it matters.** Shulman-fleming fails GPTZero not because the
assembly is bad but because the register (dense cybersec technical
prose) is inherently harder to pass as human-written — AI detectors
are trained primarily on casual / reflective text. If we know the
class, we can ship with honest per-class targets instead of uniform
thresholds that embarrass us on hard cases.

**Minimal experiment.** Hand-label the 5 regression fixtures +
10-15 additional interview transcripts from the career-forge
applications by register. Train (or few-shot a Claude call for) a
3-way classifier. Verify classification matches intuition on a
held-out set. Then re-score the regression baselines per class,
setting per-class aspirational targets.

**Budget.** ~6 hours engineering + manual labeling + ~$2 eval.

---

## 4. Fuzzy rubric-item matching in the coverage score

**Question.** The Socratic interview engine's `coverage_score` is
computed by exact-match (case-insensitive, trimmed) between the
model-emitted `rubric_items_addressed_this_turn` strings and the
mode's `rubricItems` array. If the model says `"opener"` instead of
`"opener hook"`, it doesn't count — the match fails. Should we accept
a fuzzy prefix / Levenshtein match?

**Why it matters.** Exact-matching is fragile. Minor model drift
("credentials" vs. "professional credentials") silently undercounts
coverage. The current mitigation is the prompt itself — it enumerates
the rubric verbatim and instructs "use the exact rubric item name" —
but this relies on the model to comply.

**Minimal experiment.** Run 20 interview sessions end-to-end (local,
cheap — use real API, real prompts). Log every `rubric_items_addressed_this_turn`
emission vs. the canonical rubric. Measure exact-match rate. If < 90%,
implement fuzzy matching (Levenshtein ≤ 2, or `startsWith` prefix
matching) and re-measure coverage distributions.

**Budget.** ~3 hours engineering + ~$1 eval.

---

## 5. Register-diverse fixture expansion

**Question.** Does the regression suite generalize to other writing
modes (email, essay, blog, free-form) with the same pipeline, or does
each mode need its own fixture set and baseline calibration?

**Why it matters.** Currently only the cover-letter mode has real
regression fixtures (5 shipped CLs). The other 4 modes load the same
engine but have zero empirical validation. Ships could break silently
in essay / email mode without signal.

**Minimal experiment.** Add 2-3 fixtures per mode — user dictates a
short email / essay / blog post through the interview flow, ships
output, captures baseline. Run the regression runner across all modes
weekly.

**Budget.** ~2 hours per mode for the user (dictation + acceptance);
~$1 per mode for eval.

---

## 6. Multi-model comparison exhibit (Task 23b)

**Question.** Does another frontier model (Gemini 3.1 Pro, GLM 5.1,
Kimi K2.5) produce higher-quality output on the band-35 prompt than
Claude Sonnet 4.6?

**Why it matters.** Literal "Model Jockey" evidence — shows the
engineer can route across providers instead of defaulting to one.
Also hedges against Claude-specific failure modes.

**Minimal experiment.** Run regression suite (Task 20) against the
5 CL fixtures with Sonnet 4.6 (current), Gemini 3.1 Pro (via
gemini-cli), and GLM 5.1 or Kimi K2.5. Report comparative VR + judge
scores. Note which model family wins per fixture.

**Status.** Explicitly listed as Day 3 stretch goal (Task 23b) in the
implementation plan. Skip without regret if Day 3 budget is spent.

**Budget.** ~90 minutes engineering + ~$3 eval.

---

## Prioritization (when the user asks)

If forced to rank these by expected leverage on product quality in the
next 2 weeks of the project:

1. **#4 Fuzzy rubric matching** — cheapest, highest chance of fixing a
   real silent bug
2. **#1 Socratic vs. adversarial judge** — fastest clarity-score win;
   informs pipeline framing consistency
3. **#6 Multi-model comparison** — pure marketing / portfolio value for
   the Lawyer.com submission
4. **#2 Deterministic VR injection** — real technical contribution but
   depends on confirming the causal-lever framing is stable
5. **#3 Register classifier** — valuable but heavy lift
6. **#5 Register-diverse fixtures** — important eventually but blocked
   on real user usage data across modes
