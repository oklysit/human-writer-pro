## Part A — Investment Avoided review

D1: inflated — recommended IA: 4.0 h
    Reasoning: A hypothetical high-stress "live defense scramble" is exactly the kind of fantasy scenario Beswick warns against. The realistic next increment of time spent discovering this flaw without external review would be a few hours of normal pilot data analysis and prompt tuning.
D2: reasonable — recommended IA: 10.0 h
    Reasoning: Implementing a robust, contenteditable selection-based editing system in React is notoriously complex and routinely consumes full sprints.
D3: reasonable — recommended IA: 6.0 h
    Reasoning: Spending a full day (6 hours) fruitlessly tweaking prompts to beat a noisy, fundamentally flawed metric is a highly realistic trap that was successfully avoided.
D4: inflated — recommended IA: 0.0 h
    Reasoning: This heavily overlaps with D3, as the realization that GPTZero is noise and the pivot to a new target are two sides of the same insight. Counting the avoided prompt iteration twice inflates the score.
D5: conservative — recommended IA: 4.0 h
    Reasoning: Four hours to restore the UI picker, tune prompts, and test four new writing modes is a very strict, conservative estimate for the literal next step.
D6: inflated — recommended IA: 0.0 h
    Reasoning: Deferring inline editing in favor of whole-output regeneration is essentially the same architectural decision as D2. Counting it as a separate avoided investment is double-counting.
D7: reasonable — recommended IA: 1.5 h
    Reasoning: 1.5 hours to engineer and test a surgical prompt override is a perfectly bounded, realistic next increment of work.
Recommended total IA across 7 decisions: 25.5 h

## Part B — TVH benchmarks review

Cover letter: reasonable — recommended TVH saved vs traditional: 63.0 min
    Reasoning: 75 minutes for a tailored, thoughtful cover letter aligns with standard career coaching benchmarks.
Short essay: too high — recommended TVH saved vs traditional: 70.0 min
    Reasoning: 3 hours for 400 words (~133 words/hr) is much slower than typical college writing speeds (~500 words/hr); 1.5 hours is a more accurate traditional baseline.
3-5 page assignment: reasonable — recommended TVH saved vs traditional: 4.25 hr
    Reasoning: 5 hours is a standard, realistic baseline for drafting and editing a 1000+ word assignment with research.

## Part C — Volume projections review

Scenario A: realistic — recommended TVH: 164 TVH
    Reasoning: 150 cover letters over a 6-month active job hunt is standard, and the pipeline already has 24 strong matches. The volumes are grounded in immediate, verifiable real-world use.
Scenario B: inflated — recommended TVH: 225 TVH
    Reasoning: Applying the no-AI traditional baseline to external early adopters in 2026 overstates HWP's impact, as tech-savvy users already use generic AI. HWP's marginal TVH (vs generic AI) should be used for these projected external users to prevent inflating the value.

## Summary

TOP CONCERNS (where the numbers may be overstated):
1. D3 and D4 are overlapping decisions regarding GPTZero variance and target setting; scoring both as full IA double-counts the same avoided prompt iteration work.
2. D2 and D6 overlap significantly; deferring inline text editing (D6) is the direct consequence of moving to whole-output regeneration (D2), making them the same architectural pivot.
3. Using the no-AI traditional baseline for projected external early adopters (Scenario B) inflates the impact; in 2026, these users would already be using generic AI, meaning HWP's true marginal TVH is much lower.

TOP DEFENSES (where the numbers look honest):
1. The 10h IA for D2 (avoiding selection-based Edit Chat) is highly realistic; contenteditable React refactors are notoriously difficult and time-consuming.
2. D5 and D7 IAs are admirably conservative and accurately represent the literal, immediate next steps of prompt engineering and testing that were avoided.
3. Scenario A's volume projection is grounded in an actual real-world pipeline (24 strong job matches) and represents verifiable builder own-use rather than hypothetical adoption.
