# Forward vs Backward Workflow — Cover Letter Quality Comparison

**Date:** 2026-04-15
**Context:** During the Lawyer.com Model Jockey take-home, I produced four versions of the same cover letter (target: CrowdStrike AI Security Consultant role) using two different workflows. The comparison falsified part of the product's original claim and surfaced the actual load-bearing mechanism.

## TL;DR

VR (Verbatim Ratio) does NOT predict letter quality across workflows — the lowest-VR letter scored the highest on both my eye-test and GPTZero's mixed-% band. The causal mechanism is **procedural ordering inside the assembly prompt** (go to raw transcript → pull verbatim → write connectives), not the VR target. I refactored the assembly prompt based on this finding and kept VR as a downstream diagnostic, not a shipping gate.

## The four letters

**Letter 1** was produced via the Human Writer Pro web app. I added the job posting and description as context, walked through the in-product interview, and the assembly stage produced the draft.

**Letter 2** was produced in Claude Code using the original `human-writer` skill that inspired this project. I gave it the same job context and let it interrogate me. I hypothesized that its greater context (e.g. knowing my resume and preferences, etc) would lead to better output.

Three iterations:
- **v1** — the skill's first draft, no verbatim direction.
- **v2** — same draft, second pass instructing the skill to stitch more of my words verbatim into the output.
- **v3** — same draft, third pass with more aggressive direction ("heavy verbatim stitching"), which raised the VR score further.

## The data

| Letter | Workflow | 5-gram VR | GPTZero | My eye-test rank |
|---|---|---|---|---|
| Letter 1 | Forward (webapp, structure fixes) | 27% | 78% human | 3rd |
| Letter 2 v1 | Backward (skill, draft) | 0.9% | 13% human | n/a (draft) |
| Letter 2 v2 | Backward (skill, more iteration) | 6.7% | 48% mixed | 1st |
| Letter 2 v3 | Backward (skill, more iteration) | 22.1% | 89% human | 2nd |

By "Forward" I mean that the Webapp started with VR as an initial goal and needed prompt improvements to increase subjective quality.
By "Backward" I mean that the skill use starts with high subjective quality as an initial goal and needed prompt improvements to increase VR.

## What I expected

I expected that increasing VR would lead to improved scores on GPTZero, and that GPTZero scores would track my eye test for quality. The first half of that prediction held. The second half didn't.

## What actually happened

The quality ranking is inverse to the VR ranking among the three viable letters. The best non-draft letter (v2) had the lowest VR. The second-best (v3) had the second-lowest. The third-best (Letter 1) had the highest.

Within a single refinement trajectory (v1 → v2 → v3), VR and GPTZero rose together — supporting the narrow claim that more verbatim density tends to produce more human-passing output. Across workflows, VR did not predict quality. The webapp's higher-VR output read as less polished than the skill's lower-VR output.

A second pattern: GPTZero's "100% mixed" classification on v2 suggests polished writing scores as mixed because the polish itself is what GPTZero learns to associate with LLM editing. "100% human" can mean unpolished rambling that survives intact. Mixed-classified text from a polish workflow is plausibly *higher quality* than human-classified text from a raw-dictation workflow.

## What this falsifies

The product's original claim was: *higher VR produces better writing because it preserves the user's actual voice*. The pre-registered pilot supported this for synthetic interview-reflection paragraphs in a narrow VR band. The four-letter comparison falsified it as a general quality predictor. **VR is a refinement diagnostic, not a quality target.**

## What I learned by debugging the gap

The mechanism that makes the backward workflow produce better letters is not the VR target. It is the **procedural order of operations**. In the backward workflow, the model is forced — by my real-time iteration with it — to go to the raw transcript first and stitch from there. In the forward workflow's earlier prompt, the model received declarative constraints ("heavy verbatim stitching") but no explicit procedure, so it defaulted to writing polished prose first and grudgingly adding verbatim afterward.

I added a numbered procedure to the assembly prompt — *"for each beat, go to the raw transcript first, pull verbatim sentences, then write connectives"* — and forward-workflow output quality improved without changing the VR target.

The load-bearing mechanism is procedural ordering, not the metric.

## What this means for the product

The purpose of this tool is not to maximize VR or beat AI detectors. AI detection is an arms race I don't have the resources to keep up with, and chasing the detectors would build the wrong product anyway.

What Human Writer Pro actually does is productize a workflow that has worked for me as someone with executive dysfunction: when the model gives me context and prompts me with questions, it offloads the part of starting a writing task that I struggle with most. Instead of staring at a blank page and being anxious about it, I'm answering questions. The output is polished prose composed largely of my own raw words. For people whose blockage is activation rather than ideas, this changes what writing feels like.

VR drops to a floor diagnostic. Like burstiness or perplexity, it's one signal that an output is doing what I want, but the balance between AI-evasion and quality is delicate enough that I won't optimize for it alone. What the product actually simplifies is **getting something on paper**, then refining it until I'm satisfied. The prompts that try to stitch my own words into the output are what differentiates this from an unstructured Claude or ChatGPT session — and the procedural ordering is what makes the stitching reliable.

For v2, I'm interested in optimizing for quality and AI-avoidance simultaneously. My intuition is that a high "mixed %" score on GPTZero is what the most polished human text actually looks like — not gibberish like 100% human stream-of-consciousness, not as smooth as fully-AI output, but something in between because it contains the user's verbatim words polished for an audience. If that turns out to be a regime worth optimizing for via prompt design, the product would let people produce essays, assignments, and other written work that contain their own analysis verbatim while reading as polished prose for the reader.

## Future work

- Test whether explicit procedural ordering is the load-bearing mechanism by running the assembly prompt with and without the "Target 5-gram VR ≈ 35%" line, holding everything else constant.
- Investigate "mixed % from GPTZero" as a primary optimization target instead of "human %."
- Add file-upload context (resume, job posting, prior writing samples) to the interview stage to close the remaining forward-vs-backward quality gap.
- Build an interview engine that reasons about coverage from context rather than walking a fixed question list.
