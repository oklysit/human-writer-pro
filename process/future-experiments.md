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

---

## Product Roadmap (post-submission)

These are product features rather than empirical experiments. Added
2026-04-15 from the builder's backlog. They represent what HWP
becomes if the MoJo submission leads to continued development.

---

## 7. Selection-based inline text editing

**What.** Replace whole-output regenerate-with-feedback with a
selection-respecting edit system. User selects a word, phrase, or
paragraph → inline popover for short selections, side-panel Socratic
edit for paragraphs. Single-word replacements shouldn't need a full
assembly round-trip.

**Status.** Component exists (`components/edit-chat.tsx`, 514 LOC) but
no UI surface invokes it. Deferred as Decision D2 (cross-model Clarity
0.80) — the selection-respecting design was the right v2 target, and
regenerate-with-feedback covers the "change one thing" use case for MVP.

**VR implication.** Manual edits only recalculate VR against the
numerator (output 5-grams vs existing user-word pool). Edits are NOT
folded into the denominator — prevents paste-to-inflate abuse.

**Budget.** ~8-12 hours (range tracking, anchor-based replacement,
contenteditable integration, UAT).

---

## 8. Export to PDF / DOCX / rich formats

**What.** The output panel currently offers Copy (clipboard) and
Download (.md). Add export to PDF (via browser print or a headless
renderer) and DOCX (via `docx` npm package or server-side pandoc). For
cover letters, a clean single-page PDF with basic typography. For
essays, a properly formatted DOCX with heading levels + page breaks.

**Why it matters.** Many submission portals (job boards, LMS) expect
PDF or DOCX uploads. Copy-paste loses formatting. A one-click export
closes the gap between "draft in HWP" and "submit."

**Budget.** ~4-6 hours (PDF via CSS `@media print` is cheap; DOCX
needs a library).

---

## 9. Formatting directives in regenerate-with-feedback

**What.** Let the user say "bold the company name," "add bullet points
under the skills paragraph," "underline the closing line" as feedback
and have the assembler output markdown with the requested formatting.
Currently the assembler outputs flat prose; markdown formatting
(bold, bullets, headers) is not reliably threaded through.

**Status.** The `GENERIC_WRITE_SYSTEM_PROMPT` doesn't prohibit
formatting, but also doesn't instruct it. The CL `SYSTEM_PROMPT`
explicitly asks for a 5-section structure with bulleted skills — so
partial precedent exists. Needs a formatting-directive parser or a
simple "the user asked for formatting; apply it" instruction appended
to the regen prompt.

**Budget.** ~2-3 hours (prompt engineering + ReactMarkdown already
renders bold/bullets/etc via `.prose-output`).

---

## 10. Voice profile memory — distill user voice rules from transcripts

**What.** Accumulate interview transcripts across sessions. After n
sessions (e.g., 10), run an extraction pass that distills the user's
recurring speech patterns, vocabulary preferences, filler style,
sentence-length distribution, and topic-specific register into a
compact voice-profile document. Feed this profile into the assembly
prompt so output matches the user without the user repeating themselves.

**Precedent.** The parent `human-writer` Claude Code skill already
ships a voice profile (`voice-profile.md`) built from ~133K words of
the builder's transcribed writing. This feature productizes that
process: instead of manually curating the profile, the app learns it
from accumulated usage.

**Research questions.** How many sessions until the profile stabilizes?
Does the profile help or hurt VR (adding style constraints could
compete with verbatim stitching)? Does the profile transfer across
writing modes (CL voice != essay voice)?

**Budget.** ~8-12 hours for extraction pipeline + storage + prompt
integration. Validation: compare assembly output with/without profile
across 3+ sessions.

---

## 11. Local model fine-tuning from interview transcripts

**What.** Use accumulated question-answer pairs from interviews as
training data for a small local model (e.g., SmolLM, Phi, or a LoRA
on Llama). The fine-tuned model's natural output would approximate the
user's voice, reducing the assembly prompt's burden to stitch verbatim.

**Challenges.**
- Filler removal: spoken transcripts contain disfluencies that
  shouldn't transfer to the model's writing style.
- Context window: small models struggle with long transcripts
  (interview + context + prior output for regen).
- Quality floor: the model must produce comprehensible, coherent
  prose — not all small models can at 3B-7B scale.
- Data volume: meaningful fine-tuning likely needs 50+ interview
  sessions (~25K+ words of Q&A pairs).

**Precedent.** The builder's side project explored SmolLM3 + XTC
sampling for voice-matched text generation. Results were mixed — the
small model captured burstiness and filler patterns but couldn't
reliably produce structured output (cover letters, essays). A hybrid
approach (small model for voice texture, frontier model for structure)
is the more promising path.

**Budget.** ~20-40 hours research + training + eval. Requires GPU
access (local or cloud).

---

## 12. GPTZero "Mixed %" as a quality optimization target

**What.** Validate whether optimizing for GPTZero's "Mixed" score
(rather than "Human %") is a better proxy for polished
voice-preserved output. Hypothesis: polished writing from a
verbatim-stitching workflow should land as "Mixed" because it contains
real human phrasing + model-generated connective tissue. "100% Human"
often means unpolished rambling that survived intact. "100% AI" means
the model dominated. "Mixed" is the sweet spot.

**Status.** This hypothesis was surfaced in the four-letter comparison
(`process/four-letter-comparison.md`): Letter 2 v2 scored "100% mixed"
and was the highest quality by eye-test. The GPTZero reversal decision
(D4, Clarity 0.74) adopted Mixed % as the directional target but has
no automated regression to validate it.

**Minimal experiment.** Generate 20 outputs across 4 fixtures using the
band-35 prompt. Score each via GPTZero API. Bin by classification
(Human / Mixed / AI). Have the builder eye-test-rank within each bin.
If Mixed-classified outputs consistently rank higher than
Human-classified outputs, the hypothesis holds and Mixed % becomes the
primary optimization target.

**Budget.** ~4 hours engineering + ~$5 GPTZero API.

---

## Prioritization (updated 2026-04-15)

If forced to rank by expected leverage on product quality:

**Immediate (next sprint):**
1. **#7 Selection-based Edit Chat** — biggest UX gap; unlocks
   single-word fixes without full regen
2. **#9 Formatting directives** — cheap (2-3h), unlocks bold/bullets
   in output via feedback
3. **#8 PDF/DOCX export** — closes the "draft → submit" gap

**Short-term (next month):**
4. **#12 GPTZero Mixed % validation** — validates the quality-signal
   hypothesis; informs all future prompt work
5. **#4 Fuzzy rubric matching** — cheapest fix for a likely silent bug
6. **#1 Socratic vs. adversarial judge** — framing consistency

**Medium-term (next quarter):**
7. **#10 Voice profile memory** — productizes the manual voice-profile
   process; differentiator at scale
8. **#3 Register classifier** — enables per-register quality targets
9. **#2 Deterministic VR injection** — edge-case hardening

**Long-term (research):**
10. **#11 Local model fine-tuning** — highest potential, highest risk,
    needs data volume + GPU access
11. **#5 Register-diverse fixtures** — blocked on multi-mode usage data
12. **#6 Multi-model comparison** — portfolio/marketing value
