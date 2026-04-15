# CrowdStrike AI Security Consultant — CL Assembly Fixture

Captured 2026-04-15 during the dev/oauth-localhost session close.

## Files

- `interview.md` — raw user-turns-only transcript (9 turns). Matches what `stripInterviewQuestions` produces from the live app's `interview.turns`, so passing this as the user message to the assembler reproduces the live app's assembly input exactly.
- `reference-output-baseline-webapp.md` — the letter the live webapp produced on this interview under the `bdd3f75` SYSTEM_PROMPT (format-first, 5-paragraph killer-CL framework, no procedural block). Measured: 27% 5-gram VR, 78% human GPTZero, 5 paragraphs, 3.5/4 consultant eye-test.
- `reference-output-skill-humanwriter.md` — the letter produced by the `/human-writer` skill (Claude Code, separate session) on the same job posting with the skill's 5-section killer-CL framework and the skill's procedural workflow. Measured: 89% human GPTZero, 99% human+mixed, user's qualitative preference.

## Purpose

Anchors the 2026-04-15 v3-prompt experiment. The question: can a procedural verbatim-first block in the webapp assembler close the Letter-2 → Letter-1 quality gap without porting the rest of the skill's framework content?

## Full interviewer Q&A transcript

The 9 interviewer questions, in order, for reproducibility and humman review (the assembler NEVER sees these; `stripInterviewQuestions` filters them out at `lib/coverage.ts:118`).

### Q1 — AI security stance

The role sits right at the intersection of AI and security — a space that's still pretty new and contested. Before we get into your background, I want to understand your actual stance on it: what's your genuine take on where AI security is headed, or what's the specific problem in this space that you think most people are getting wrong or underestimating?

### Q2 — Strongest relevant credential

That's a strong, specific take — especially the Von Neumann parallel and the point that AI specialization in security won't just fall out of seniority in adjacent areas. Good material. Now let's get into your actual background: what's the most relevant thing you've personally built, run, or led that you'd point to as your strongest credential for this specific role?

### Q3 — Security foundation and program

That's concrete and usable — the permission-scoping, the separation of orchestration from execution, the KV cache and parallelization tradeoffs. Good material. You mentioned your foundational cybersecurity education at the end there — I want to make sure I understand the full picture: outside of the AI orchestration work, what's your actual security background? Work, projects, the program you're finishing — what does that look like?

### Q4 — Full professional picture

Got it — helpful to have the full picture. One thing I want to make sure I understand: is the WGU program and the self-directed AI work the totality of your relevant background, or is there professional work experience in there too — jobs, internships, consulting, anything like that? The role asks for 2-6 years of experience, so I want to know what we're working with before we go further.

### Q5 — Why CrowdStrike specifically

That's the full picture — thank you for being straight about it. Now, a different angle: why CrowdStrike specifically? Not 'they're a leader in cybersecurity' — I mean what specifically drew you to apply here rather than to any of the other firms doing adjacent work in AI security?

### Q6 — Falcon outage + specific company reaction

That's really a reason why the role appeals to you — not yet a reason why CrowdStrike specifically. Any major firm posting an AI security specialization would fit that logic. Have you actually used any CrowdStrike products, followed any specific news about their platform or a decision they made, or have thoughts on something particular to them — the Falcon platform, their AI-native positioning, the 2024 outage and how they responded, anything like that? What's the reason it's this company and not, say, Palo Alto or Mandiant posting the same role?

### Q7 — Gap acknowledgment

That's actually usable — the accountability and integrity angle is genuine and specific, and the fact that you were following their incident response through industry newsletters while starting your program shows you've had them on your radar. Don't worry about whether to mention it; that's an assembly-stage call. Now, one thing I want to address directly before we close this out: the role asks for 2-6 years of experience in areas like security operations, security program development, or management consulting. Your background is a WGU program in progress, self-directed AI orchestration work, and the Apple Genius Bar. That gap is real and a hiring manager will notice it. How would you address it — what's your honest argument for why you're worth a conversation despite not having that professional security experience?

### Q8 — Close preference

That covers the gap — the AI specialization argument is the strong move there. One last thing: what do you actually want the hiring manager to do after reading this letter? And is there a specific way you want them to reach you — email, phone, LinkedIn?

### Q9 — Assemble signal

That's enough — 'send me an email so we can talk about how obsessed I am with this stuff' is exactly the kind of closing line that'll work. I have what I need across all five beats. Add anything you want in, or hit Assemble whenever you're ready.
