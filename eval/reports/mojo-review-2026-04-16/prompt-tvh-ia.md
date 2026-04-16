# Cross-Model Review: TVH Benchmarks + Investment Avoided

You are reviewing the **most subjective** components of a MoJo Score
submission (Ryan Beswick's Model Jockey framework, Manifesto Part 3):
**Business Impact / TVH** and **Investment Avoided (IA)** per decision.
Your scores will be averaged with three other independent models (Opus
4.6, Gemini 3.1 Pro, GLM 5.1, Kimi K2.5).

---

## Beswick's definitions (verbatim quotes from Manifesto Part 3)

**Business Impact / TVH:**

> "Business Impact is what your work does for real people. Time saved.
> Revenue generated. Users served. Risk mitigated. We convert all of it
> into a common unit I'm calling Traditional Value Hours (TVH), so we can
> compare apples to apples."
>
> "Here's an example. You build a tool that automates your support
> team's weekly reporting. It took you six Active Hours. That report
> used to take someone three hours every week to compile manually. Over
> a quarter, that's 39 hours of saved time. Your Business Impact is 39
> TVH. And it keeps compounding every week after that."
>
> "A feature's Business Impact compounds as it keeps running. The
> reporting tool that saved 39 hours in its first quarter saves 156 over
> its first year. When something first ships, you're estimating impact.
> Over time, you validate those estimates against real usage data. Think
> of it as Provisional MoJo becoming Confirmed MoJo."

**Investment Avoided (this is the critical warning):**

> "We need to be careful about how we quantify this. The temptation is
> to say 'I saved us from building the full version, and that would have
> taken 400 hours, so my Decision Value is 400.' **That's a fantasy
> number.** Nobody was going to build all 400 hours without another
> checkpoint. In reality, you were probably going to spend another
> two-week sprint doing deeper design and development before the next
> decision point."
>
> "**Investment Avoided is the realistic next increment of time and
> resources you would have spent before reaching the same conclusion
> the slow way. Not the full theoretical build-out. The next step you
> didn't have to take.**"

**Worked example (Beswick's lawclaw.ai / Punith Kashi):**
> 30 Active Hours. 5 hours of paralegal research replaced per case × 20
> cases/week × 13 weeks = 1,300 TVH. × Quality Factor 1.2 = 1,560
> Delivered Value. MoJo Score: 52x.

---

## The project

**Human Writer Pro (HWP).** Voice-preserving AI writing assistant. User
interviews into it; assembler stitches verbatim user phrasing into a
polished draft. No external user base yet (MVP). Primary near-term user
is the builder (Oklys Pimentel). See `MOJO-SCORE.md` for full context.

---

## Part A — Review the Investment Avoided numbers (7 decisions)

Beswick explicitly warns these are the most abuseable part of the
framework. For EACH decision below, score the IA against his "realistic
next increment" definition. Was the user genuinely about to spend the
listed hours before reaching the same conclusion the slow way? Or is
this a fantasy number?

| # | Decision | Self-IA (h) | Rationale |
|---|---|---|---|
| D1 | VR-as-causal-lever reframed after n=54 pilot. Pre-registered + external review caught that VR is a diagnostic marker of prompt regime, not the causal lever. | **12** | Had we shipped claiming 35% VR as the mechanism and been challenged in a Part 2 interview, live defense would have required redoing the pilot under pressure — ~10h research scramble + ~2h eval-methodology rewrite. |
| D2 | Paragraph-level Edit Chat → whole-output regenerate-with-feedback. Kept 514 LOC of `edit-chat.tsx` as dead code rather than deleting. | **10** | Selection-based Edit Chat refactor (range tracking, anchor-based replacement, contenteditable integration, two UI paradigms for word-vs-paragraph selections). |
| D3 | Ship v4.1 framework port despite GPTZero pass-rate 1/3 on CrowdStrike fixture (variance > effect size). | **6** | Additional prompt iteration that would NOT have moved the GPTZero needle (variance is content-register-driven, not prompt-driven). |
| D4 | "GPTZero is noise" → "GPTZero IS the bar" reversal after user pushback. Target pivoted to Mixed %. | **5** | Energy that would have gone toward iterating prompts on framework adherence alone without addressing GPTZero pass-rate variance — the actual product-quality bar. |
| D5 | HWP is the submission (not Career Forge). Multi-mode polish deferred. | **4** | Mode-picker restoration + per-mode prompt tuning + per-mode UI testing. |
| D6 | Defer inline text editing (2026-04-16). Regenerate-with-feedback covers the "change one thing" case; selection-based inline editing is post-MVP. | **3** | Textarea retrofit + state sync + VR recalc wiring + UAT cycles that would have been replaced by the selection-based refactor anyway. |
| D7 | Scope AI-isms down from surgical preserve-verbatim override to dismiss-only button. | **1.5** | Prompt engineering + testing a preserve-verbatim system prompt override. |

For each: **score `reasonable` / `inflated` / `conservative`** and give a recommended adjusted IA (can be same as self-IA if reasonable).

## Part B — Review the TVH per-task benchmarks

| Task | Traditional (no AI) | Generic AI (ChatGPT cold) | HWP | TVH saved vs traditional | TVH saved vs generic AI |
|---|---|---|---|---|---|
| Cover letter (400 words, thoughtful) | 75 min | 30 min | 12 min | **63 min** | 18 min |
| Short essay / 400-word assignment | 3 hr | 45 min | 20 min | **2.67 hr** | 25 min |
| 3-5 page school assignment | 5 hr | 2 hr | 45 min | **4.25 hr** | 1.25 hr |

Sources cited: The Muse, LinkedIn Career Advice (cover letters 45-90 min); Bowdoin Writing Project, Purdue OWL (~500 words/hour college rate); Microsoft Copilot Impact Report 2024 (AI-assisted rates).

Score each row as **reasonable / too high / too low** and give recommended adjusted benchmarks if needed.

## Part C — Review the TVH volume projections

### Scenario A (builder's own-use, 6-month horizon)

- 100 cold-start cover letters × 63 min saved = 105h
- 50 template-tailored cover letters × 20 min saved = 16.7h
- 10 WGU 3-5 page assignments × 4.25 hr saved = 42.5h
- **Total Scenario A: ~164 TVH**

Context: Oklys graduates from WGU ~May 2026 (6 weeks out). Career Forge
pipeline has 24 strong-match jobs + nightly intake of new postings. Job
hunt is active.

Score: **realistic / inflated / conservative** and give recommended
volume estimates.

### Scenario B (5-user projection, 6 months, Provisional per Beswick)

- 5 users × 20 CLs × 63 min = 105h
- 5 users × 5 assignments × 4.25 hr = 106.25h
- Plus Scenario A own-use (164) = **~376 TVH**

Context: no external user base yet. HWP is MVP-stage. Assumption: post-
submission, HWP attracts 5 early users over 6 months.

Score: **realistic / inflated / conservative** and give recommended
projected user count + per-user volume.

---

## Output format (strict)

```
## Part A — Investment Avoided review

D1: [reasonable | inflated | conservative] — recommended IA: [x.x h]
    Reasoning: [1-2 sentences]
D2: ...
...
D7: ...
Recommended total IA across 7 decisions: [XX.X h]

## Part B — TVH benchmarks review

Cover letter: [reasonable | too high | too low] — recommended TVH saved vs traditional: [x.x min]
    Reasoning: [1 sentence]
Short essay: ...
3-5 page assignment: ...

## Part C — Volume projections review

Scenario A: [realistic | inflated | conservative] — recommended TVH: [x TVH]
    Reasoning: [2 sentences]
Scenario B: [realistic | inflated | conservative] — recommended TVH: [x TVH]
    Reasoning: [2 sentences]

## Summary

TOP CONCERNS (where the numbers may be overstated):
1. ...
2. ...
3. ...

TOP DEFENSES (where the numbers look honest):
1. ...
2. ...
```

Be calibrated, not charitable. Beswick's framework rewards honest
numbers over inflated ones. If an IA looks like a fantasy number per
his explicit warning, say so.
