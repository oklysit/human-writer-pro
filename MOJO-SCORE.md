# MoJo Score — Human Writer Pro

Reconciles this project against the formula Ryan Beswick defines in
[Measuring the Magic: The MoJo Score](https://medium.com/@rybeswick/measuring-the-magic-the-mojo-score-740f6dbcaa0d)
(Model Jockey Manifesto, Part 3). Meant to be read by someone scoring the
submission — every number below cites the underlying source.

---

## 1. Formula (Beswick, verbatim)

```
MoJo Score = (Delivered Value + Decision Value) / Active Hours

Delivered Value = Business Impact × Quality Factor
  • Business Impact = TVH (Traditional Value Hours) — real-world
    human labor the tool replaces (hours saved × users/cases × horizon)
  • Quality Factor ∈ [0.5, 1.5] — peer review + LLM code analysis
    (clean code ≈ 1.2+; problematic ≈ 0.7 or below)

Decision Value = Σ (Investment Avoided × Clarity Score) per decision
  • Investment Avoided = the realistic next increment of time you
    would have spent before reaching the same conclusion the slow way
  • Clarity Score ∈ [0.0, 1.0] — how definitive the learning was

Active Hours = hands-on-keyboard + eyes-reviewing-output
  (agent runtime while AFK is excluded)
```

Beswick's worked example (lawclaw.ai / Punith Kashi): 30 Active Hours →
1,560 Delivered Value TVH → **52x MoJo Score** (5h/case × 260 cases/quarter
× QF 1.2 = 1,560).

---

## 2. Active Hours — 17.2h cumulative (through submission)

Logged in `mojo-log.jsonl`. Definition in `MOJO-SETUP.md`.

| Date | Hours | Activity |
|---|---|---|
| 2026-04-13 | 3.0 | Brainstorm, spec, design system, GitHub setup, ActivityWatch wiring |
| 2026-04-13 | 3.0 | Parallel orchestration — Day 1 kickoff + senior-consultant eval + VR pilot oversight |
| 2026-04-14 | 2.3 | Day 2+3 implementation orchestration — subagent dispatch + reviews |
| 2026-04-14 | 0.2 | Day 3 close + Day 4 kickstart planning |
| 2026-04-14 | 0.2 | MoJo math reconciliation + dual-formula script update |
| 2026-04-15 | 4.5 | Day 5 MVP push — v4 framework port + regen-with-feedback + UI bundle + README submission rewrite |
| 2026-04-16 | 4.0 | Day 6 UAT iteration (label/chip, mic auto-restart, Ignore button, paragraph spacing, VR feedback fold-in) + artifact finalization + submission |
| **Total** | **17.2** | |

**Reconciliation against ActivityWatch:** Days 1-4 were AW-corrected on
2026-04-14 after an initial undercount surfaced. Days 5-6 are
self-reported conservatively (exclude pre/post session setup time). AW
bucket `aw-watcher-afk_DESKTOP-FN0A3II` is the source of truth; logged
entries reconcile to ≤10% of not-afk wall time on
HWP/career-forge/VR/lawyer-titled windows.

**Excluded (per Beswick Part 3):**
- Autonomous subagent runtime (~8-10h across Days 1-3): excluded because
  user was AFK or multitasking during those blocks.
- Claude API calls during verification runs (~2h across five k=3 runs on
  Day 5): excluded — the API work was "started and waited on," not
  reviewed line-by-line.

---

## 3. Decision Value — 34.35 weighted hours

Entries in `mojo-log.jsonl` and `process/decisions.md`. Each row =
Investment Avoided × Clarity Score.

| Date | Decision | IA (h) | Clarity | Weighted |
|---|---|---|---|---|
| 2026-04-13 | VR is not the causal lever for GPTZero; prompt regime is. Reframed after external reviewer pushback on the n=54 pilot. | 12 | 0.9 | 10.80 |
| 2026-04-15 | Replaced paragraph Edit Chat with whole-output regenerate-with-feedback (Career-Forge dashboard pattern). | 10 | 0.85 | 8.50 |
| 2026-04-15 | Shipped v4.1 framework port despite GPTZero variance (eye-test + framework adherence prioritized; variance is content-register-driven). | 6 | 0.70 | 4.20 |
| 2026-04-15 | Reversed earlier "GPTZero is just noise" framing — the product name makes it a real bar. Optimize Mixed % going forward. | 5 | 0.75 | 3.75 |
| 2026-04-15 | Pivoted Mojo submission framing: HWP is the project (not Career Forge); multi-mode polish deferred. | 4 | 0.80 | 3.20 |
| 2026-04-16 | Deferred inline text editing (vs selection-based single-word inline design). Regenerate-with-feedback covers the "change one thing" use case; selection-based is post-MVP. | 3 | 0.85 | 2.55 |
| 2026-04-16 | Scoped "Ignore AI-isms" down from surgical-preserve-verbatim to dismiss-only. Detector is pattern-match; false positives are unavoidable; hiding the pill is the cheap honest fix. | 1.5 | 0.90 | 1.35 |
| **Total** | | | | **34.35** |

**Clarity Score calibration** (this document's §6 Review Results has
4-model averages for the 5 pre-2026-04-16 entries; the 2 Day-6 entries
were not yet included in the cross-model review and use self-assessed
Clarity Scores).

---

## 4. Business Impact (TVH) — three scenarios

HWP has no external user base yet (it's an MVP-stage product submitted as
the take-home). TVH estimates are **projections** based on realistic user
scenarios. Three scenarios bound the honest range. Per Beswick §"Living
framework" (line 119): *"Delivered Value should be re-scored over time. A
feature's Business Impact compounds as it keeps running... Think of it as
Provisional MoJo becoming Confirmed MoJo."*

### Baseline definition

Per Beswick's article, TVH = "Traditional Value Hours" = real-world human
labor the tool replaces. The lawclaw.ai worked example uses **traditional
(no-AI) labor** as the baseline — 5 paralegal hours per case, not
"AI-assisted paralegal hours." We follow that convention.

**Per-task benchmarks** (averaged from typical ranges; sources below):

| Task | Traditional (no AI) | Generic AI (ChatGPT cold) | HWP | TVH saved vs traditional | TVH saved vs generic AI |
|---|---|---|---|---|---|
| Cover letter (400 words, thoughtful) | 75 min | 30 min | 12 min | **63 min** | 18 min |
| Short essay / 400-word assignment | 3 hr | 45 min | 20 min | **2.67 hr** | 25 min |
| 3-5 page school assignment | 5 hr | 2 hr | 45 min | **4.25 hr** | 1.25 hr |

Sources: cover-letter writing averages per career-coaching guides (The
Muse, LinkedIn Career Advice blog) cite 45-90 min for thoughtful tailored
CLs. Essay-writing pace studies cite ~500 words/hour as a typical
college-writing rate (Bowdoin Writing Project, Purdue OWL). AI-assisted
rates from informal surveys on r/ChatGPT and published productivity
studies (Microsoft Copilot Impact Report 2024).

**Honest caveat:** a reader who already uses generic AI (ChatGPT, Claude)
sees smaller TVH per task than the "traditional" column above. The calc
uses the traditional baseline because Beswick does — but §8 flags this
disclosure explicitly.

### Scenario A: The author's own use (conservative, verifiable)

Primary user is Oklys (the builder). HWP is used for:
- **Career Forge cover letters** — ~8 approved this session + ~100 expected
  over the next 6 months of active job-hunting from the Career Forge
  pipeline's 24 strong matches + nightly intake.
- **WGU academic assignments** — 6-12 remaining assignments before May
  2026 graduation (mode hardcoded to cover-letter for MVP, but the
  verbatim-stitching pattern applies to written assignments via the
  parent human-writer skill).

| Use case | Traditional time | HWP-assisted time | Saved per unit | Volume (next 6 mo) | TVH |
|---|---|---|---|---|---|
| Cover letter (cold-start) | 75 min | 12 min | 63 min | 100 | 105h |
| Cover letter (template-tailor, pre-existing role family) | 30 min | 10 min | 20 min | 50 | 16.7h |
| WGU written assignment (3-5 page) | 5 hr | 45 min | 4.25 hr | 10 | 42.5h |
| **Total** | | | | | **~164 TVH** |

**vs generic-AI baseline** (for disclosure): ~45 TVH own-use (much smaller
— generic AI already saves most of the time; HWP's marginal improvement
is smaller but still real for CL polish + voice preservation).

### Scenario B: Small realistic user base (mid)

Post-MVP, HWP attracts a few early users. Conservative assumption: 5
users over the next 6 months, each a job-seeker or student with a similar
use-profile to the author.

- Per user: 20 CLs × 63 min saved + 5 assignments × 4.25 hr = 42.3h/user
- 5 users × 42.3h = **212 TVH**
- Plus Scenario A own-use: **164 TVH**
- **Combined: ~376 TVH**

### Scenario C: Projected early adoption (high)

HWP ships on a personal site or HN / Reddit writeup and gains traction.
50 users over 6 months, similar profile.

- 50 users × 42.3h = **2,115 TVH**
- Plus Scenario A: **164 TVH**
- **Combined: ~2,279 TVH**

**For the submission, use Scenario A or B as the honest number.** Scenario
C is defensible only if there's a stated deployment plan — the honest
framing is "this is MVP-stage with no external users yet; here's
realistic TVH for my own use + a small projected user base." Avoid
over-promising.

---

## 5. Quality Factor — 1.2 self-assessed (pending LLM review)

Beswick's rubric: clean code ≈ 1.2+; problematic ≈ 0.7 or below; midpoint
1.0.

**Evidence for 1.2:**

- **127 unit tests, all passing** with TDD discipline across the Socratic
  interview engine, store, voice hook, file extraction, CL assembly
  fixtures, and regression pipeline.
- **Clean TypeScript architecture** — strict types, no `any` leaks in
  product code, React forwardRef discipline for UI primitives, Zustand
  store with partialized persistence.
- **Five real regression fixtures** (CL assembly) with k=3 runner +
  LLM-as-judge + optional GPTZero + baseline differ.
- **Pre-registered empirical pilot (n=54, Fisher's p<0.0001)** with
  committed pre-reg SHA + external review round + revision. Rigor not
  typical at this project scale.
- **Commit hygiene** — every change explains WHY, not just WHAT. Small,
  focused commits. No force-pushes. 40+ substantive commits since
  dev/oauth-localhost in the MVP push.
- **Decision log** — 7 structured decisions with Clarity Scores +
  Investment Avoided, committed as `process/decisions.md`. Ryan
  explicitly cites this in Part 3 as a differentiator.
- **Handoff discipline** — four handoff docs across the build capturing
  state, open decisions, and what-not-to-do for future sessions.
- **BYO-key architecture** — security-conscious, no user credentials on
  server, explicit documentation of the `dangerouslyAllowBrowser`
  tradeoff in README.
- **No known critical bugs** shipping today (UAT cycles 1-3 surfaced ~12
  issues; all fixed within session).

**Evidence against 1.2 (honest):**

- Multi-mode polish deferred (mode hardcoded to cover-letter for the
  demo) — the "generalized writer" framing in README is an
  honest-roadmap item, not a delivered one.
- Selection-based Edit Chat deferred — current MVP uses whole-output
  regenerate-with-feedback as substitute. Fine for demo, not the final
  design.
- PDF upload compatibility had to be patched mid-UAT (pdfjs-dist legacy
  build switch) — a working fix but indicates production-browser testing
  wasn't exhaustive pre-UAT.

**Self-assessed QF: 1.2.** §6 below contains the external review
aggregate across four models.

---

## 6. LLM Review Results (cross-model average)

*Populated after the code-review and decision-log-review runs land.
Individual model outputs in `eval/reports/mojo-review-2026-04-16/`.*

| Model | Quality Factor | Clarity (log-average) |
|---|---|---|
| Opus 4.6 | _pending_ | _pending_ |
| Gemini 3.1 Pro | _pending_ | _pending_ |
| GLM 5.1 | _pending_ | _pending_ |
| Kimi K2.5 | _pending_ | _pending_ |
| **Average** | **_pending_** | **_pending_** |

Final MoJo Score in §7 uses the cross-model averaged QF (fallback: 1.2
self-assessed if one or more models fail). Per-decision Clarity Scores
in §3 are updated to the cross-model averages where the original was
≥0.15 away from the aggregate.

---

## 7. MoJo Score — three framings

### Beswick-aligned (primary — this is what the rubric expects)

Using **QF = 1.2** (self-assessed; will be updated post-§6 review):

| Scenario | Business Impact (TVH) | Quality Factor | Delivered Value | + Decision Value | / Active Hours | **MoJo Score** |
|---|---|---|---|---|---|---|
| A (own-use only) | 164 | 1.2 | 196.8 | +34.35 = 231.15 | / 17.2 | **13.4x** |
| B (5-user projection) | 376 | 1.2 | 451.2 | +34.35 = 485.55 | / 17.2 | **28.2x** |
| C (50-user projection) | 2,279 | 1.2 | 2,734.8 | +34.35 = 2,769.15 | / 17.2 | **161.0x** |

**Suggested number for the email:** **Scenario B at ~28x** — honest
(projects a small realistic user base rather than the builder alone, but
doesn't fabricate 50-user traction). Conservative fallback: **~13x
(Scenario A)**.

### Senior IC hours framework (secondary — sanity check)

Earlier internal estimate. Treats the numerator as "senior IC hours to
build this without AI." Does NOT match Beswick's framing (his TVH is
downstream user impact, not build-replacement cost) — keep as a side-by-
side sanity check only.

| Range | Senior IC Hours | / Active Hours | IC-framework MoJo |
|---|---|---|---|
| Conservative | 240 | / 17.2 | 14.0x |
| Mid/fair | 295 | / 17.2 | 17.2x |
| High | 350 | / 17.2 | 20.3x |

### Placeholder formula (tertiary — for internal tracking only)

From `scripts/mojo-report.ts`: weights commits × 0.25 + tests × 0.05 +
Decision Value × 1.0. Acknowledged inside the script as a placeholder;
not suitable for external citation.

---

## 8. Single-number answer for the email

> **Scenario B (5-user Provisional projection + own-use), Quality Factor 1.2:**
>
> **MoJo Score ≈ 28x**
>
> (164 TVH own-use + 212 TVH 5-user-projection) × 1.2 Quality Factor +
> 34.35 weighted Decision Value, all / 17.2 Active Hours.

If Ryan asks for the conservative number, **~13x (Scenario A, own-use
only)**. If he wants to see the projection, **~28x (Scenario B)** is
defensible with the stated small-user-base assumption. 161x (Scenario C)
is over-promising without a deployment plan and should be avoided unless
directly asked what "at scale" looks like.

Per Beswick §"Living framework" (line 119): treat these as **Provisional
MoJo**. Confirmed MoJo comes from instrumented real-usage data after
deployment.

---

## 9. Coursework MoJo (separate — don't blend into HWP's)

My own AI-tool use for WGU coursework is a separate MoJo case worth
citing as proof-of-discipline, NOT blended into HWP's number:

- **Traditional:** 3-4 courses per 6-month term (baseline from my first terms)
- **AI-assisted:** 18 courses in 6 months (current pace, 4-5x throughput)
- **Hours saved per course:** ~40h traditional → ~10h AI-assisted = 30h saved
- **TVH over 6 months:** 18 courses × 30h = **540 TVH**
- **Active Hours (coursework only):** ~180h (18 courses × ~10h each)
- **Coursework MoJo:** 540 / 180 = **3x**
- **Quality Factor:** WGU passes/transcript = ≥1.0

Mention as context for "I already live by the Mojo discipline in my own
learning." Do NOT combine with HWP's numbers — different tool, different
denominator.

---

## 10. Caveats worth disclosing

- **TVH is projected, not measured.** HWP has no external user base yet.
  Scenario A (own-use) is the only TVH component that's grounded in
  measurable near-term usage. Scenarios B and C are honest projections
  with stated assumptions, not data. Per Beswick, Provisional → Confirmed
  once instrumented.
- **Quality Factor is self-assessed** (until §6 external review lands).
  A cold-review pass could move it up or down ~0.1–0.2.
- **Active Hours reconcile to AW within ~10%.** Minor self-reporting
  noise; logged entries are conservative relative to AW data.
- **Decision Value includes entries where the "decision" is a reframing
  under external pushback.** Beswick's rubric explicitly rewards this
  (reviewer-caught errors have high Clarity because the correction is
  definitive). If someone reads the entries as "this person was wrong
  five times," the counter-framing is "this person invited review, acted
  on it, and converged to a defensible position each time."
