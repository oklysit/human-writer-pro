# Question-Echo Patterns

A category of AI-detectable tells where the model's output starts with a
phrase that sounds like an answer to a question — a giveaway that the
model has echoed the prompting question's structure into the response
instead of producing the answer in the user's own framing.

Introduced 2026-04-15 after observing **"The single thing I want a hiring
manager to know is that I'm obsessive"** in production output. That
construction is a direct paraphrase of the interview question
("if you had one sentence, what's the single thing you most want the
hiring manager to know?") — the model lifted the question's frame and
inverted it into an answer instead of stitching from the user's verbatim.

This file is **documentation only**. The actual regexes live in
`lib/ai-ism-detector.ts` under `QUESTION_ECHO_RULES`. To add or modify
patterns, edit the code; this doc tracks what's there.

## Patterns

### `what-X-is-that`
Catches: `What I learned is that...`, `How that worked is when...`, `Why we did it is that...`

```
^(What|Why|How|When|Where|Who)\s+.+?\s+(is|are|was|were|would be)\s+(that|when|why|how)\b
```

### `my-answer-is`
Catches: `My answer to this is...`, `My approach is...`, `Our response to that is...`

```
^(My|Our)\s+(answer|response|approach|take)\s+(is|to this|to that)\b
```

### `in-response-to`
Catches: `In response to your question...`, `To answer that...`, `To address the role...`, `Regarding the position...`

```
^(In response to|To answer|To address|Regarding)\b
```

### `the-X-thing-is`
Catches: `The single thing I want a hiring manager to know is...`, `The most important thing would be...`, `The biggest reason is...`

```
^The\s+(single|main|biggest|most important|key)\s+\w+\s+(is|would be|I want)
```

## Flags

All patterns use `gim`:
- `g` — find all occurrences (not just first)
- `i` — case-insensitive
- `m` — multiline; `^` matches start of any line, not only start of string

This anchors matches to paragraph/section starts. Question-echo phrasing
mid-paragraph is not caught (yet) — would require sentence-boundary
anchors like `(^|[.!?]\s+)` if needed.

## Why these stay out of the assembly prompt

These references describe what to **detect** in the output, not what to
tell the model to avoid in the input. Per the 2026-04-14 strip, anything
loaded into the assembly system prompt costs VR (the model paraphrases
around banned phrases instead of stitching verbatim). The detection
pattern lives downstream of the model — it flags the failure for the
post-assembly review pass and the diagnostic pill, not for the generator.
