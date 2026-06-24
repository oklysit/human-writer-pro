# How Human Writer Pro Was Built

Human Writer Pro was built using a fully agent-driven development process — an Opus-orchestrated, Sonnet-implemented, pair-reviewed loop that applied the same verbatim-and-judgment discipline to the code as the product applies to writing.

## Model routing

| Role | Model |
|------|-------|
| Orchestrator — main session, architectural decisions, reviewing subagent output | Claude Opus 4.6 (1M context) |
| Implementer subagents — build tasks | Claude Sonnet 4.6 |
| Reviewer subagents — spec compliance and code quality | Claude Opus 4.6 |
| LLM-as-judge in the regression pipeline | Claude Sonnet 4.6 |

Sonnet handles implementation; Opus handles judgment. They are kept separate in the pipeline so the generator and the judge are never the same instance.

## Subagent-driven development loop

Each implementation task runs through five steps:

1. **Orchestrator** (Opus 4.6) extracts the task spec from the refactor doc and original plan.
2. **Implementer subagent** (Sonnet 4.6, fresh context) receives the full task text, prohibited-scope rules, and a TDD directive.
3. **Spec compliance reviewer** (Opus 4.6, fresh context) reads the actual code and verifies it matches the spec. Does not trust the implementer's report.
4. **Code quality reviewer** (Opus 4.6, fresh context) applies the standard code review protocol.
5. **Orchestrator** marks the task complete only when both reviews approve.

This is the `superpowers:subagent-driven-development` pattern. The pair-review session that produced the refactor doc is an instance of the same pattern applied one level up — a senior-engineer sparring session pressure-testing the Day 0 plan before any code was written.

## Git discipline

- Every change committed with a meaningful SHA before moving on. A change without a commit is invisible to future sessions.
- Commit messages explain WHY, not just what. The context a future session needs is in the message, not assumed.
- Pre-commit hooks are never skipped without explicit approval.
- New commits rather than amending. If a hook rejects a commit, amending would rewrite the previous commit — the safer path is always a new commit after fixing the issue.

## Key build decisions

- **VR reframed from target to prompt nudge** — the band-35 prompt is a stylistic nudge to the model, not a truth-claim the product validates.
- **VR is a downstream marker, not the causal lever** — the 54-variant pilot showed VR is downstream of prompt regime. Same-VR variants across band-25 and band-35 show opposite GPTZero results; the lever is the prompt, not the VR score.
- **Synthetic regression fixtures replaced with real shipped triples** — replaced with (interview + prompt + expected baseline) triples using 5 real shipped cover letters, including 2 documented failures.
- **5 modes on one engine with CL and email load-bearing** — only cover-letter and email have real ground truth; the other modes ship on the same engine without dedicated regression budget.
- **Adversarial edit framing replaced with Socratic** — the adversarial frame breaks flow state; the Socratic frame pulls more verbatim material without triggering defensive reactions.
