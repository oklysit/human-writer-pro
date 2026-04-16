## Part A — Investment Avoided review

D1: inflated — recommended IA: 6.0 h
    Reasoning: The "live defense under Part 2 interview pressure" framing retroactively counts a hypothetical future panic-response, which fails Beswick's "realistic next increment before the next checkpoint" test — no n=54 pilot re-run would have been executed in a live interview window, and the real "next increment" before external critique was ~1 more pilot pass (~4-6h) plus methodology writeup. Reframing was genuinely high-clarity (the pre-reg + pilot output forced the null), but 12h counts work that would have been rejected at the next checkpoint rather than actually spent.

D2: reasonable — recommended IA: 8.0 h
    Reasoning: Selection-based Edit Chat (range tracking + anchor replacement + contenteditable + two UI paradigms for word vs paragraph) is a well-scoped feature with real precedent (career-forge has the deferred-design doc), so 8-10h is credible; I trim 2h because `edit-chat.tsx` already existed as a paragraph-mode implementation — the refactor reuses scaffolding, so the next-increment is closer to 8h than 10h.

D3: inflated — recommended IA: 3.0 h
    Reasoning: After three rounds of k=3 already ran on the same fixture with variance > effect size, the realistic next increment before the team would have said "stop iterating on this dimension" is ~2-3h, not 6h — the decision documents that the variance-vs-effect-size call was already clear by round 3, so most of the claimed 6h would have been rejected at the next checkpoint. Also GLM-flagged overlap with D4 (same session, same GPTZero variance) means some of this IA double-counts.

D4: inflated — recommended IA: 3.0 h
    Reasoning: The reversal was a same-session reframing after user pushback, not a concrete avoided work-package — "energy toward framework-adherence-only iteration" is a diffuse counterfactual, and because D3's 6h already covers "additional prompt iteration," the non-overlapping increment here is smaller, closer to 3h of target-definition work (Mixed% framing + regression-scoping) that would otherwise have gone into untargeted iteration.

D5: reasonable — recommended IA: 4.0 h
    Reasoning: Mode-picker restoration + per-mode prompt tuning + per-mode UI testing is a concretely bounded scope (the orphaned `modes/*` files exist and a reader can count what wiring is missing), and 4h is a credibly tight next-increment for "make mode-picker demo-ready" before realizing the demo doesn't benefit from it. Fits Beswick's definition cleanly.

D6: reasonable — recommended IA: 3.0 h
    Reasoning: Textarea retrofit + state sync + VR recalc wiring + a UAT cycle is roughly 3h as a next-increment, and the deferral is well-grounded because selection-based editing is documented as the correct v2 design — this is exactly the "next step you didn't have to take" Beswick asks for. Clean.

D7: reasonable — recommended IA: 1.5 h
    Reasoning: Prompt engineering + testing a preserve-verbatim system-prompt override is the smallest scope on the list and 1.5h is a credible next-increment before the user's "I know myself" scope-cut call — the 3-line UI shipped in commit 4c943b1 is the proof that the alternative was well-understood. Fits cleanly.

Recommended total IA across 7 decisions: 28.5 h

## Part B — TVH benchmarks review

Cover letter: reasonable — recommended TVH saved vs traditional: 55 min
    Reasoning: 75-min traditional is within The Muse's 45-90 range but leans high for a 400-word CL, and HWP at 12 min is optimistic given dictation/review time; trimming both yields ~55 min saved, still a defensible single-row TVH.

Short essay: too high — recommended TVH saved vs traditional: 2.0 hr
    Reasoning: 3h traditional for 400 words assumes pure from-scratch with no source material and the 500-words/hour rate is for drafting-only (excludes the already-thinking-time that scales non-linearly with word count), and 400 words is short enough that 2.0-2.25h traditional is more realistic; adjust HWP-saved accordingly.

3-5 page assignment: reasonable — recommended TVH saved vs traditional: 3.75 hr
    Reasoning: 5h for a 3-5 page assignment at 500 words/hour and ~1000-1500 words tracks with the Purdue OWL/Bowdoin rate, but HWP at 45 min is slightly aggressive for a real 3-5 page piece with context uploads + review — trim to 3.75h saved to keep the benchmark defensible.

## Part C — Volume projections review

Scenario A: inflated — recommended TVH: 95 TVH
    Reasoning: 100 cold-start CLs over 6 months = ~4 CLs/week which exceeds the career-forge memory's stated "24 strong matches + nightly intake" throughput unless reach-tier postings count, and 10 WGU 3-5 page assignments before May 2026 (~6 weeks out) is high given the user graduates in ~6 weeks not 6 months. Recalibrating to 60 cold-start CLs + 40 template CLs + 6 assignments, with the Part B benchmark adjustments, lands ~95 TVH.

Scenario B: inflated — recommended TVH: 180 TVH
    Reasoning: "5 users × 20 CLs × 63 min + 5 users × 5 assignments × 4.25 hr" is a stacked counterfactual on top of an already-inflated Scenario A and a product with zero external users today — a more honest 5-user projection is ~3 CLs/user/month (job seekers don't write 20 CLs in 6 months of active hunting consistently) and 2 assignments/user, yielding ~85 TVH from users + ~95 own-use = ~180 TVH. Keep Beswick's Provisional flag on this number.

## Summary

TOP CONCERNS (where the numbers may be overstated):
1. D1's 12h Investment Avoided retroactively counts a future interview-pressure scramble that fails Beswick's "next increment before the next checkpoint" test — a hypothetical live-defense panic-response is exactly the fantasy-number failure mode he warns against.
2. D3 + D4 together claim 11h IA for the same GPTZero-variance session and overlap substantially — the non-double-counted next-increment is closer to 6h combined, and GLM flagged this overlap independently.
3. Scenario A volume (100 cold-start CLs in 6 months, 10 WGU assignments before a May 2026 graduation that is ~6 weeks out) is too high against the stated career-forge throughput + WGU timeline, inflating own-use TVH by ~40%.
4. The TVH "Short essay" row uses a 3h traditional baseline for 400 words that's too high against the cited 500 words/hour rate — 2.0-2.25h is the honest cell.
5. Scenario B builds a 5-user projection on top of an already-inflated Scenario A and assumes heavy per-user volume (20 CLs + 5 assignments each) with no external users today — the stack compounds the optimism.

TOP DEFENSES (where the numbers look honest):
1. D6 (defer inline editing) and D7 (scope AI-isms to dismiss-only) fit Beswick's "realistic next increment" definition cleanly — both are concretely scoped with known alternative designs and the IA is bounded.
2. D5 (single-mode framing) points at orphaned mode files that a reader can verify, and 4h is a tight credible next-increment for mode-picker polish.
3. The 3-5 page TVH row is anchored to published writing-pace benchmarks (Purdue OWL, Bowdoin) and survives light-touch recalibration at 3.75h saved — the methodology is sound even if individual cells move.
4. `MOJO-SCORE.md` §4 explicitly discloses the traditional-vs-generic-AI baseline tradeoff and §10 flags TVH as projected not measured — the headline leans on the larger number but the honesty Beswick rewards is present in the document.
