[reasoning_content only — no final content]

Let me carefully analyze each part of this MoJo Score submission, applying Beswick's definitions rigorously.

## Part A — Investment Avoided Review

Beswick's key definition: "Investment Avoided is the realistic next increment of time and resources you would have spent before reaching the same conclusion the slow way. Not the full theoretical build-out. The next step you didn't have to take."

And his warning: "The temptation is to say 'I saved us from building the full version, and that would have taken 400 hours, so my Decision Value is 400.' That's a fantasy number."

Let me evaluate each decision:

**D1: VR-as-causal-lever reframed after n=54 pilot — 12h**
The claim is that they would have spent ~10h research scramble + ~2h eval-methodology rewrite if they'd shipped claiming VR as the mechanism and been challenged. This seems like a plausible "next increment" — if they'd gone forward with the wrong framing, being challenged in a review/interview would have forced a scramble. But wait — is this really the "next step you didn't have to take"? The decision was made during the pilot analysis phase. The "slow way" would have been to continue with the wrong framing until challenged. The next increment before reaching the same conclusion... hmm. Actually, this is a bit tricky. The question is: would they have actually shipped with the wrong framing and then been challenged? Or would they have caught it during normal review? The external review caught it. If they hadn't had the pre-registration + external review, the next checkpoint would likely have been a Part 2 interview or similar. So 12h for a research scramble + rewrite seems like a plausible "realistic next increment." I'd say this is **reasonable**, maybe slightly on the high side but defensible.

Actually, let me reconsider. Beswick says "the realistic next increment of time and resources you would have spent before reaching the same conclusion the slow way." The slow way = not having the pre-registration/external review catch this. They would have shipped, been challenged, and had to redo work. The 10h research scramble + 2h rewrite = the next increment. This seems reasonable. 12h is plausible for this kind of error correction.

**D2: Paragraph-level Edit Chat → whole-output regenerate-with-feedback — 10h**
The claim is they kept 514 LOC of edit-chat.tsx as dead code rather than deleting. The IA is for the selection-based Edit Chat refactor (range tracking, anchor-based replacement, contenteditable integration, two UI paradigms).

Wait — this is a bit confusing. The decision was to keep the code as dead code rather than deleting it, and the IA is the effort of the refactor they would have done? Actually, I think the decision was to NOT pursue the paragraph-level edit chat and instead use whole-output regenerate-with-feedback. The IA is the time they would have spent on the selection-based Edit Chat refactor.

But is 10h the "realistic next increment"? If they'd pursued the paragraph-level Edit Chat, how long would they have spent before realizing it was the wrong approach? The description mentions "range tracking, anchor-based replacement, contenteditable integration, two UI paradigms for word-vs-paragraph selections" — this sounds like a substantial implementation effort, possibly more than just a "next increment." 

Actually, re-reading: "Kept 514 LOC of edit-chat.tsx as dead code rather than deleting." The decision was to NOT invest in the edit chat refactor. The IA represents what they would have spent on the refactor. But is this the "next increment" or the "full theoretical build-out"? 

The description lists several technical challenges. If they'd started down this path, they probably would have spent a sprint (1-2 weeks) before realizing the complexity wasn't worth it. 10h seems like a plausible next increment — maybe a week of part-time work on this before reassessing. I'd say **reasonable**, maybe slightly generous but within bounds.

Actually, I'm second-guessing myself. The 514 LOC already exists as dead code. The IA is what they would have spent refactoring it into something usable. That's the "full build" of edit chat, not just the next increment. If Beswick's warning applies anywhere, it might be here. The next increment would be: start the refactor, spend some time on it, realize it's too complex, and pivot. That might be more like 4-6h of initial investigation and partial implementation before reaching the "this isn't worth it" conclusion.

Hmm, but the description says "Selection-based Edit Chat refactor (range tracking, anchor-based replacement, contenteditable integration, two UI paradigms for word-vs-paragraph selections)" — this does sound like it's listing the full scope of work, not just the next step. I'll flag this as potentially **inflated** and suggest maybe 5-6h.

Wait, let me re-read more carefully. The decision column says "Paragraph-level Edit Chat → whole-output regenerate-with-feedback. Kept 514 LOC of edit-chat.tsx as dead code rather than deleting." 

So the decision was to pivot from edit chat to regenerate-with-feedback. The IA is the work they avoided by making this decision early rather than continuing down the edit chat path. The "next increment" before they would have reached the same conclusion (that regenerate-with-feedback is better) would be the time spent trying to make edit chat work.

I think 10h is on the border. If they'd spent a concentrated week trying to make paragraph-level edit chat work, 10h isn't unreasonable. But Beswick's framework asks for the "realistic next increment" — the next checkpoint. If they'd have a daily or weekly self-check, they might have caught this after 4-6h. I'll say **slightly inflated** and recommend maybe 6h.

**D3: Ship v4.1 framework port despite GPTZero pass-rate 1/3 — 6h**
The claim is that additional prompt iteration would NOT have moved the GPTZero needle (variance is content-register-driven, not prompt-driven). The 6h represents prompt iteration that would have been fruitless.

This is a good example of Beswick's framework. The "slow way" would be to spend more time iterating on prompts before realizing the variance wasn't prompt-driven. 6h of prompt iteration as the "next increment" before reaching the same conclusion? That seems reasonable — you might spend a day or two trying different prompts before concluding the issue is elsewhere. **Reasonable**.

**D4: "GPTZero is noise" → "GPTZero IS the bar" reversal — 5h**
Energy that would have gone toward iterating prompts on framework adherence alone without addressing GPTZero pass-rate variance. The 5h represents time spent on the wrong optimization target.

This is similar to D3 — they would have spent time optimizing the wrong thing. 5h of prompt iteration on framework adherence (wrong target) before realizing GPTZero was the actual bar. Seems like a reasonable "next increment." **Reasonable**.

**D5: HWP is the submission (not Career Forge) — 4h**
Multi-mode polish deferred. Mode-picker restoration + per-mode prompt tuning + per-mode UI testing.

This is deferring work on an alternative path. The decision was to focus on HWP rather than Career Forge. The 4h represents work on Career Forge's multi-mode that they avoided. Is this the "realistic next increment"? If they'd pursued Career Forge with multi-mode, they would have spent... 4h seems modest for mode-picker + per-mode prompts + per-mode testing. This could actually be conservative. **Reasonable**, maybe even conservative.

**D6: Defer inline text editing — 3h**
Textarea retrofit + state sync + VR recalc wiring + UAT cycles that would have been replaced by the selection-based refactor anyway.

They decided to defer inline text editing because regenerate-with-feedback covers the use case. The 3h represents the next increment of work they would have done on inline editing before reaching the same conclusion. 3h for a textarea retrofit + state sync + VR wiring + some testing? That seems reasonable as a first sprint's worth of effort before reassessing. **Reasonable**.

**D7: Scope AI-isms down — 1.5h**
Prompt engineering + testing a preserve-verbatim system prompt override.

They decided to use a dismiss-only button instead of a surgical preserve-verbatim override. The 1.5h represents time they would have spent on the more complex approach. This seems quite modest. **Reasonable**, maybe even conservative.

Let me now reassess D2 more carefully.

D2: The description says "Kept 514 LOC of edit-chat.tsx as dead code rather than deleting." And the IA rationale is "Selection-based Edit Chat refactor (range tracking, anchor-based replacement, contenteditable integration, two UI paradigms for word-vs-paragraph selections)."

Hmm, I think the IA here is saying: "We had this edit chat code. We could have invested in refactoring it into a proper selection-based editor. That would have taken ~10h. Instead, we decided to go with regenerate-with-feedback and left the code as dead code."

The question is: is 10h the "realistic next increment" or the "full theoretical build-out"? 

If they'd started the refactor, the "next increment" would be the first attempt — maybe getting range tracking working, starting on contenteditable integration, and then realizing the complexity. That might be 4-6h. The full theoretical build-out (all of range tracking + anchor-based replacement + contenteditable + two UI paradigms) would be more like 15-20h.

10h seems to be somewhere in between. It's not the full build-out, but it's more than just the next increment. I'd say this is **slightly inflated** and recommend maybe 6h.

Actually, I want to be careful here. Let me re-read Beswick: "In reality, you were probably going to spend another two-week sprint doing deeper design and development before the next decision point."

So Beswick's own example suggests that 1-2 weeks (let's say 10-20h of focused work) is a reasonable "next increment" for many decisions. This makes 10h for D2 seem more reasonable.

But the issue is whether the rationale describes the full build or the next step. The rationale lists all the components of the selection-based edit chat, which sounds like the full scope. The "next increment" would be starting this work and getting partway through.

I'll go with **slightly inflated** and recommend 7h. Actually, let me settle on my assessments:

D1: **Reasonable** — 12h. A research scramble + methodology rewrite after being challenged on a wrong causal claim is a plausible next increment. Being challenged in an interview/defense and having to redo work under pressure is exactly the kind of "slow way" Beswick describes.

D2: **Inflated** — The rationale describes the full scope of a selection-based edit chat refactor, which reads more like the "full theoretical build-out" Beswick warns against. The next increment — starting the refactor, hitting the complexity wall of contenteditable + range tracking — might be 5-6h before pivoting. I'll recommend 6h.

D3: **Reasonable** — 6h. Prompt iteration that wouldn't have moved the needle is a classic "next increment you didn't have to take."

D4: **Reasonable** — 5h. Optimizing the wrong target for a day before realizing the real bar is GPTZero. Clean example of IA.

D5: **Reasonable** — 4h. Modest deferral of multi-mode polish. Could even be conservative.

D6: **Reasonable** — 3h. A sprint's worth of inline editing work before concluding regenerate-with-feedback is sufficient.

D7: **Conservative** — 1.5h. Prompt engineering + testing for a preserve-verbatim override could easily take 2-3h.

Let me sum up: 12 + 6 + 6 + 5 + 4 + 3 + 1.5 = 37.5h (my recommendations)
Original: 12 + 10 + 6 + 5 + 4 + 3 + 1.5 = 41.5h

Hmm, actually for D2, let me think again. The 514 LOC already exists. The IA is about the refactor work that was avoided. If they'd continued down the edit-chat path, they would have invested in making this code production-quality. The "next increment" would be... starting to refactor, spending time on the hard parts (contenteditable is notoriously painful), and then reassessing.

I think 10h is actually within the realm of reasonable for this. ContentEditable integration alone can eat days. But the question is: how long before they'd reach a checkpoint and reassess? If they're working in sprints, a sprint might be 1-2 weeks. In a solo project, they might check in with themselves after a few days.

I'll split the difference and say **reasonable but on the higher end** and recommend 8h.

Actually, you know what, let me just go with my gut on each of these and be consistent.

D1: **Reasonable** — 12h (keeping as-is)
D2: **Inflated** — 7h (reducing from 10h; rationale reads like full scope, not next increment)
D3: **Reasonable** — 6h (keeping as-is)
D4: **Reasonable** — 5h (keeping as-is)
D5: **Reasonable** — 4h (keeping as-is)
D6: **Reasonable** — 3h (keeping as-is)
D7: **Conservative** — 2h (slightly increasing from 1.5h)

Total recommended: 12 + 7 + 6 + 5 + 4 + 3 + 2 = 39h

Wait, actually for D2 I'm being a bit wishy-washy. Let me commit.

D2 rationale: "Selection-based Edit Chat refactor (range tracking, anchor-based replacement, contenteditable integration, two UI paradigms for word-vs-paragraph selections)." This is describing the full scope of the work they avoided. Beswick explicitly says "not the full theoretical build-out." The next increment would be starting this work, spending a few hours hitting the contenteditable wall, and pivoting. I'll say 6h.

OK final:

D1: **Reasonable** — 12h
D2: **Inflated** — 6h (from 10h)
D3: **Reasonable** — 6h
D4: **Reasonable** — 5h
D5: **Reasonable** — 4h
D6: **Reasonable** — 3h
D7: **Conservative** — 2h (from 1.5h)

Total recommended: 38h

## Part B — TVH Benchmarks Review

**Cover letter (400 words, thoughtful)**
- Traditional: 75 min — Sources: The Muse, LinkedIn (45-90 min). 75 min is within that range. Reasonable.
- Generic AI: 30 min — Using ChatGPT to draft a cover letter, then editing. Seems reasonable.
- HWP: 12 min — This is aggressive. With a voice-preserving AI assistant, you'd still need to input your information, review, and edit. 12 minutes for a thoughtful 400-word cover letter? That's very fast.
- TVH saved vs traditional: 63 min
- TVH saved vs generic AI: 18 min

I think the traditional time is reasonable (75 min for a thoughtful cover letter is standard career advice). The generic AI time seems reasonable (30 min with ChatGPT cold). The HWP time of 12 min... this assumes the user has already done the interview/input step and the assembler stitches it together. If the voice-preserving approach means the user spends less time editing because the output already sounds like them, 12 min is plausible for the generation + light editing step. But does it include the input time?

The claim seems to be that HWP saves time because:
1. User does interviews into it (this is the input step)
2. Assembler stitches verbatim phrasing into polished draft
3. Less editing needed because voice is preserved

If the 12 min includes the interview input + generation + editing, that's aggressive. If it's just the generation + editing (and the interview was done separately), it's more reasonable but then the comparison isn't apples-to-apples.

For a cover letter, I think 63 min saved vs traditional might be slightly high. If traditional is 75 min and HWP is 12 min, that assumes HWP can produce a near-final cover letter in 12 min including input. I'd say the savings might be more like 50-55 min (HWP taking 20 min instead of 12).

Actually, wait. Let me re-read the HWP description: "Voice-preserving AI writing assistant. User interviews into it; assembler stitches verbatim user phrasing into a polished draft."

So the workflow is: user speaks into the tool (interview style), and it produces a polished draft using their own words. The key innovation is voice preservation — less editing needed.

For a cover letter: user spends 5-8 min talking about the job, their relevant experience, why they're interested. AI generates a draft in their voice. User spends 3-5 min reviewing and tweaking. Total: maybe 12-15 min.

Hmm, 12 min is tight but not impossible. I'll say the traditional benchmark is **reasonable** but the HWP time might be slightly optimistic, making the TVH saved vs traditional slightly high. I'll recommend maybe 55 min saved vs traditional (HWP taking ~20 min).

Actually, I'm overthinking this. Let me consider: the HWP builder is also the primary user. They're highly proficient with the tool. For the builder's own use, 12 min is very plausible. For a new user, it might take longer.

I think the benchmarks are meant to be for an experienced user of HWP. In that context, 12 min is defensible but aggressive. I'll say **reasonable but on the high end** for TVH saved.

Let me just go with: **Reasonable** — 55 min saved vs traditional (slight reduction).

Hmm, actually 75 min for a thoughtful cover letter from scratch is very standard. 12 min for HWP... I'll say **slightly too high** and recommend 50-55 min.

You know what, I need to stop going back and forth. Let me be decisive.

Cover letter: The traditional time (75 min) is well-sourced and reasonable. The HWP time (12 min) is aggressive — even with voice preservation, inputting your relevant experience and reviewing a 400-word document takes more than 12 min for a "thoughtful" result. I'd estimate 18-20 min for HWP, giving ~55 min saved vs traditional. **Slightly too high** — recommend 55 min.

**Short essay / 400-word assignment**
- Traditional: 3 hr — Sources: Bowdoin Writing Project, Purdue OWL (~500 words/hour college rate). At 500 words/hr, 400 words = ~48 min. But that's just drafting. Total including research, outlining, drafting, revising? 3 hr seems reasonable for a college assignment.
- Generic AI: 45 min — Using ChatGPT to help with a short essay. Reasonable.
- HWP: 20 min — Speaking your ideas, getting a structured draft, reviewing. Plausible.
- TVH saved vs traditional: 2.67 hr

I think this is **reasonable**. 3 hours for a 400-word assignment (including all stages) is standard college timing. 20 min with HWP (assuming the student has already done the thinking/reading and just needs to produce the essay) is fast but plausible with voice-preserving AI.

**3-5 page school assignment**
- Traditional: 5 hr — Standard for a multi-page college paper.
- Generic AI: 2 hr — Using ChatGPT. Reasonable.
- HWP: 45 min — This seems fast for a 3-5 page paper. Even with voice preservation, a paper of that length requires substantial input and review. But if the student has already done research and has their ideas, 45 min of talking + reviewing + iterating... possible but aggressive.
- TVH saved vs traditional: 4.25 hr

I think the traditional time is reasonable. HWP at 45 min for a 3-5 page paper is aggressive. Even at 1 hr it would be fast. I'll say the TVH saved might be **slightly too high** and recommend maybe 3.5-4 hr saved (HWP taking ~60-75 min).

OK let me finalize Part B:

Cover letter: **Slightly too high** — recommend 55 min saved vs traditional (HWP taking ~20 min)
Short essay: **Reasonable** — 2.67 hr saved
3-5 page assignment: **Slightly too high** — recommend 3.75 hr saved vs traditional (HWP taking ~75 min)

Actually, for the 3-5 page assignment, 5 hr traditional and 45 min HWP... let me think about what 3-5 pages means. At ~250 words/page, that's 750-1250 words. The student needs to:
1. Have done the research/reading already (or do it as part of the process)
2. Speak their ideas into HWP
3. Review and iterate on a 750-1250 word document
4. Make sure it's coherent, well-structured, meets assignment requirements

Even with perfect voice preservation, reviewing a 1000-word document for accuracy, flow, and assignment compliance takes time. 45 min is possible if the student is well-prepared and the tool is excellent, but I'd estimate 60 min as more realistic.

So: 5 hr - 1 hr = 4 hr saved. Let me recommend **4 hr saved** (down from 4.25).

## Part C — Volume Projections

**Scenario A: builder's own-use, 6-month horizon — 164 TVH**

Breaking down:
- 100 cold-start cover letters × 63 min = 105h
- 50 template-tailored cover letters × 20 min saved = 16.7h
- 10 WGU assignments × 4.25 hr = 42.5h

Context: Oklys graduates in ~6 weeks, has 24 strong-match jobs, nightly intake of new postings. Job hunt is active.

100 cold-start cover letters in 6 months = ~4 per week. That's a LOT of cover letters. Even for an active job hunt, 4 per week sustained over 6 months seems high. Most job seekers don't send 100 tailored cover letters. And after graduation + landing a job, the cover letter volume would drop dramatically.

24 strong-match jobs — if he applies to all of them, that's 24 cover letters in the first month. Then maybe some ongoing applications. Over 6 months, maybe 50-60 total? Not 100.

10 WGU assignments in 6 weeks (remaining before graduation). This is more bounded and plausible if he has 10 assignments left.

Wait, the projection says 6-month horizon but graduation is in 6 weeks. After graduation, would he still be doing WGU assignments? No. So the 10 assignments would be within 6 weeks, not 6 months. The 100 cover letters are over 6 months.

Let me recalculate:
- Cover letters: 100 seems high. Active job hunt with 24 strong matches might produce 40-60 applications over 6 months (not all need cold-start cover letters; some are quick applications). Say 50.
- Template-tailored: 50 seems reasonable if he's doing 50+ applications. Maybe 30.
- WGU assignments: 10 in 6 weeks seems plausible if that's what's remaining.

Revised: 50 × 55 min + 30 × 20 min + 10 × 4 hr = 45.8h + 10h + 40h = ~96 TVH

Hmm, that's significantly lower. But maybe I'm being too conservative. If he's doing a mass job hunt, 100 applications isn't crazy over 6 months. Let me split the difference.

I think the cover letter volume is **inflated**. 100 cold-start cover letters over 6 months means he's still doing this in month 4-6, long after most people have either landed a job or changed strategy. I'd estimate 60 cold-start CLs and 30 template-tailored.

The WGU assignment count is probably **reasonable** if there are 10 remaining assignments.

Revised Scenario A: 60 × 55 min + 30 × 20 min + 10 × 4 hr = 55h + 10h + 40h = ~105 TVH

But wait, I also adjusted the per-unit TVH. If I use my recommended benchmarks:
- 60 × 55 min = 55h
- 30 × 20 min = 10h  
- 10 × 4 hr = 40h
Total: ~105 TVH

That's down from 164. I'll recommend ~105 TVH.

Actually, hmm. Let me be a bit more generous. The context says "Career Forge pipeline has 24 strong-match jobs + nightly intake of new postings." If he's applying to jobs nightly, 100 over 6 months isn't insane. That's ~4/week or about 1 per weekday. For someone in an active, aggressive job hunt, that's doable.

But the question is: how many of those are cold-start cover letters vs. quick applies? Many modern job applications don't require cover letters. And if he's using Career Forge's pipeline, some might be streamlined.

I'll say the volume is **slightly inflated** and recommend ~130 TVH (assuming 75 cold-start CLs with adjusted savings of 55 min each, plus the rest).

Actually, let me just be straightforward. 100 cold-start cover letters is a lot but defensible for a 6-month aggressive job hunt. The per-unit savings are probably slightly high. Let me use my adjusted benchmarks:

75 CLs × 55 min + 40 template CLs × 20 min + 10 assignments × 4 hr = 68.75h + 13.3h + 40h = ~122 TVH

I'll recommend ~120 TVH.

**Scenario B: 5-user projection, 6 months — 376 TVH**

Context: no external user base yet. MVP-stage. Assumption: 5 early users over 6 months.

5 users × 20 CLs × 63 min = 105h
5 users × 5 assignments × 4.25 hr = 106.25h
Plus Scenario A: 164h = ~376h

Issues:
1. 5 users in 6 months for an MVP with no marketing budget... possible but optimistic. These would likely be friends/classmates/colleagues, not organic users.
2. 20 CLs per user — this assumes each of the 5 users is also doing an aggressive job hunt. If they're students, they might not need 20 cover letters.
3. 5 assignments per user — this assumes student users. But where do these users come from? If from WGU or similar, 5 assignments in 6 months is plausible.
4. This is "Provisional" per Beswick — it's an estimate, to be validated later.

The biggest concern: the per-user volume assumptions. 20 CLs + 5 assignments per user is very high unless these users are specifically in a job hunt + school situation like Oklys. Most early adopters won't have the same use case.

I'd estimate:
- 3-5 users is reasonable for MVP stage
- Per user: maybe 10 CLs + 3 assignments (not all will be power users)
- Using adjusted benchmarks

Revised: 4 users × 10 CLs × 55 min + 4 users × 3 assignments × 4 hr = 36.7h + 48h + 120h (scenario A) = ~205 TVH

Hmm, but Beswick's framework allows for Provisional estimates. The key is whether the assumptions are stated clearly and are reasonable. 5 users with heavy use is optimistic.

I'll say **inflated** and recommend ~200-220 TVH, using:
- 3-4 users (more realistic for MVP)
- Lower per-user volume
- Adjusted benchmarks

Let me settle on specific numbers:

Recommended Scenario B: ~200 TVH
- 3 users × 10 CLs × 55 min = 27.5h
- 3 users × 3 assignments × 4 hr = 36h  
- Plus Scenario A (120h) = ~184h

I'll round to ~185 TVH.

Hmm, actually I realize I should be more careful about what adjustments I'm making where. Let me think about this holistically.

The per-task benchmarks are slightly high (I'm reducing cover letter savings from 63 to 55 min, and 3-5 page from 4.25 to 4 hr). The volume assumptions are somewhat inflated (100 CLs is high, 5 users with heavy use is optimistic).

For the final output, I need to be clear and decisive.

Let me finalize:

**Part A:**
- D1: Reasonable — 12h
- D2: Inflated — 6h (rationale describes full scope, not next increment)
- D3: Reasonable — 6h
- D4: Reasonable — 5h
- D5: Reasonable — 4h
- D6: Reasonable — 3h
- D7: Conservative — 2h
- Total: 38h (from 41.5h)

**Part B:**
- Cover letter: Slightly too high — 55 min (from 63 min)
- Short essay: Reasonable — 2.67 hr
- 3-5 page assignment: Slightly too high — 4 hr (from 4.25 hr)

Wait, I want to reconsider the short essay. 3 hours for a 400-word assignment seems high to me. That's only about 1.5 pages. Even with research, 3 hours for 400 words? Well, the sources cited say ~500 words/hour college rate, so 400 words would be ~48 min of writing. But including research, outlining, and revision, 3 hours is plausible for a "thoughtful" piece. OK, I'll keep it as reasonable.

**Part C:**
- Scenario A: Slightly inflated — ~120 TVH (from 164)
  - 75 CLs × 55 min + 40 template CLs × 20 min + 10 assignments × 4 hr ≈ 120h
- Scenario B: Inflated — ~190 TVH (from 376)
  - 3 users × 10 CLs × 55 min + 3 users × 3 assignments × 4 hr + 120h (Scenario A) ≈ 190h

Wait, I need to reconsider. The 100 cover letters over 6 months... let me think about whether the builder is being unrealistic or whether I'm being too conservative.

Oklys graduates in ~6 weeks. Job hunt is active. 24 strong matches now + nightly intake. If the job hunt lasts 3-4 months (not uncommon), and he's applying to ~5 jobs per week, that's 60-80 applications. Many won't need cover letters (easy apply, etc.), but some will. 100 total (cold-start + template) over 6 months seems achievable for someone using a tool specifically designed for this purpose.

But the "6-month horizon" extends well past the expected job hunt duration. After landing a job, CL volume drops to near zero. So maybe the volume should be concentrated in the first 3-4 months.

I'll stick with my estimate of ~120 TVH for Scenario A, acknowledging that the cover letter volume is the main point of contention.

For Scenario B, 5 external users is aspirational. Even with post-submission visibility, getting 5 people to actively use an MVP over 6 months is hard. And each using it for 20 CLs + 5 assignments assumes they're all in Oklys's exact situation. This is where the inflation really shows.

OK, let me write this up.

Actually, let me reconsider D2 one more time.

D2: "Paragraph-level Edit Chat → whole-output regenerate-with-feedback. Kept 514 LOC of edit-chat.tsx as dead code rather than deleting."

IA: 10h — "Selection-based Edit Chat refactor (range tracking, anchor-based replacement, contenteditable integration, two UI paradigms for word-vs-paragraph selections)."

The decision was to NOT refactor the edit chat code and instead use regenerate-with-feedback. The IA is the time saved by not pursuing the refactor.

The "slow way" would be: start the selection-based edit chat refactor, invest time in it, and then either (a) complete it but realize regenerate-with-feedback is better, or (b) hit complexity walls and pivot to regenerate-with-feedback anyway.

The "next increment" before reaching the same conclusion: how long would they spend on the refactor before reassessing?

For a solo developer working on contenteditable integration — this is notoriously tricky. They might spend a full day (6-8h) just on range tracking and contenteditable before realizing the complexity isn't worth it. Or they might invest 2-3 days (10-15h) trying to make it work.

10h seems like a reasonable "next sprint" amount. But Beswick's framework specifically asks for the "realistic next increment" — the minimum you'd spend before the next checkpoint. If the developer checks in with themselves daily, the next increment might be 4-6h. If weekly, 10-15h.

I think 10h is defensible but on the higher end. I'll call it **slightly inflated** and recommend 7h.

Actually wait, I just realized I need to look at this differently. The 514 LOC already exists. The IA is about what they would have spent refactoring/reviving this code. If the code is already there as dead code, the "next increment" might be even less — they'd spend some time reviewing it, trying to integrate it, and then deciding it's not worth the complexity. Maybe 4-6h.

Hmm, but "refactor" implies significant work, not just review. If they were going to refactor edit-chat.tsx into a working selection-based editor, that's a real engineering effort.

I'll go with 6h as my recommendation. The rationale describes what looks like a full implementation scope, not just the next step.

OK, final answers:

D1: Reasonable — 12h
D2: Inflated — 6h
D3: Reasonable — 6h
D4: Reasonable — 5h
D5: Reasonable — 4h
D6: Reasonable — 3h
D7: Conservative — 2h

Total recommended: 38h

Let me also reconsider D1. The claim is that if they'd shipped claiming VR as the causal mechanism and been challenged in a Part 2 interview, they'd need to redo the pilot. 10h research scramble + 2h eval-methodology rewrite.

Is this the "realistic next increment"? If they'd gone forward with the wrong framing:
- They ship the claim
- In a Part 2 interview, someone asks about the mechanism
- They realize the framing is wrong
- They need to scramble to fix it

The 12h is the cost of the scramble. This seems like a genuine "next increment" — it's the cost of reaching the same conclusion (VR is not the causal lever) the slow way (by being challenged and having to redo work).

Yes, I think this is reasonable. 12h is plausible for a research investigation + methodology rewrite under pressure.

Let me write up my final output now.

Hmm, for Part C, let me reconsider the Scenario A numbers more carefully.

The breakdown:
- 100 cold-start cover letters × 63 min = 105h
- 50 template-tailored cover letters × 20 min saved = 16.7h
- 10 WGU 3-5 page assignments × 4.25 hr = 42.5h

Using my adjusted benchmarks:
- Cover letter savings: 55 min (from 63)
- 3-5 page assignment savings: 4 hr (from 4.25)

And adjusted volumes:
- Cold-start CLs: 70 (from 100) — 6 months is a long horizon; job hunt likely concludes earlier
- Template CLs: 35 (from 50) — proportional reduction
- WGU assignments: 10 (keeping — this is bounded by remaining coursework)

Revised Scenario A:
- 70 × 55 min = 64.2h
- 35 × 20 min = 11.7h
- 10 × 4 hr = 40h
Total: ~116 TVH

I'll round