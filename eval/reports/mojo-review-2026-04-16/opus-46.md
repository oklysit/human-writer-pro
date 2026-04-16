## Part A — Quality Factor

SCORE: 1.15

REASONING: Verifying the bar first. The "127 unit tests, all passing" claim is real — `vitest run` at `f0ec908` reports `Test Files 8 passed (8) / Tests 127 passed (127)` in 1.76s. `tsc --noEmit` exits 0 under `strict: true`. `next build` succeeds clean on the pinned SHA (First Load JS 211 kB, marginally above the README's stated 205 kB but within rounding; not a red flag). TypeScript discipline is visibly high: the `Record<string, unknown>` casts for Web Speech API in `useVoiceInput.ts`, explicit `AssembleFeedbackMode` / `UseVoiceInputReturn` types, injection-defense comment in `interview-engine.ts` ("User content goes into messages, NOT the system prompt"). Zustand store has a sensible partialize (only `apiKey` persists — not session state or transcripts), and `useVoiceInput` demonstrates real attention to hard concurrency edges (`shouldRestartRef` for Chrome's silent auto-end, null-handler-before-stop to prevent in-flight chunks leaking into the next turn, SSR-safe support check). These are the kind of fixes you only write after hitting the bug in UAT, and the commit history confirms that lineage (18bf93b `fix(voice): auto-restart mic after browser silence timeout`).

The build/docs story is also well above average for a 6-day take-home. `process/decisions.md` is structured, dated, and honest — each entry names what was killed, what evidence forced the change, and carries a self-assessed Clarity Score. The VR-validation pilot is genuinely impressive for this scale: pre-registered hypotheses with a SHA-pinned lock, external reviewer invited, TL;DR revised twice on pushback, endpoint-cluster sensitivity analysis re-run after a reviewer noted the anchored-correlation problem, §9 rewritten three times as the causal story tightened. `process/four-letter-comparison.md` candidly falsifies a prior version of the product claim. The commit log is WHY-not-what, small, and attributable. Prompts in `lib/assemble.ts` carry dated version history inline (v1 pilot → v2 word-range → v3 procedural block → v4 framework port), so a later reader can reconstruct which change produced which behavior. That level of narrative discipline around prompt drift is rare.

Dragging the score off 1.2 toward 1.15: (1) `components/edit-chat.tsx` is 514 lines of orphaned code — no UI surface invokes it, confirmed by `grep` (only `app/page.tsx` comment references), and the `MOJO-SCORE.md` admits as much. That is shipped dead weight, not deleted after the decision to defer it. (2) `components/interview-panel.tsx` is 830 lines with substantial duplication: the Context dock and the answer dock carry near-identical voice-input wiring, base-snapshot refs, separator logic, autoscroll effects — a `useVoiceTextarea` custom hook would collapse ~100 lines and is the kind of refactor a "clean 1.2" would have landed before submission. (3) The `Mode` union is kept at 5 literals (`"essay" | "email" | "blog" | "cover-letter" | "free-form"`) purely to avoid churn, while the store comment itself says the non-cover-letter mode files "are orphaned" — this is honest debt, but it is debt. (4) `dangerouslyAllowBrowser: true` routes Anthropic calls directly from the client. `MOJO-SCORE.md` frames it as security-conscious BYO-key architecture, and the key persists to localStorage only. That is defensible for a personal tool, but it also means anyone who injects script into this page exfiltrates the key — a server proxy would be the "clean" answer and the roadmap doesn't list it. (5) The "Scenario B ≈ 28x" headline in `MOJO-SCORE.md` §8 cites projected TVH against a no-AI baseline while admitting in §4 that "a reader who already uses generic AI sees smaller TVH." The framing is disclosed but still leans on the larger number for the headline. Honest, but not fully clean.

TOP STRENGTHS:
1. 127 tests genuinely pass, tsc is clean, production build is clean — the self-assessment claims check out on the pinned SHA.
2. `lib/useVoiceInput.ts` shows real production hardening (auto-restart on silent end, null-handlers-before-stop to prevent post-submit leak, SSR-safe) not typical at this project scale.
3. VR-validation pilot is pre-registered with a SHA-locked hypothesis, invited-review-revised twice, endpoint-cluster caveat added, arithmetic error self-documented — the rigor is real and the revision discipline is the strongest signal of the build's engineering culture.
4. Commit hygiene is small, dated, WHY-forward, and inline prompt version history in `lib/assemble.ts` gives a later reader the audit trail needed to reproduce prompt drift.
5. `MOJO-SCORE.md` transparently lists the "evidence against 1.2" (multi-mode deferred, Edit Chat deferred, pdfjs-dist late fix) rather than hiding them, which is itself a quality signal.

TOP CONCERNS:
1. `components/edit-chat.tsx` (514 LOC) is dead code — no call site wires it up — and should have been deleted when the decision to defer was made; shipping it as-is is the opposite of the "clean cleanup" Beswick's QF rewards.
2. `components/interview-panel.tsx` is 830 lines with near-duplicate voice-input wiring between Context dock and answer dock — a small custom hook would have landed the clean version.
3. BYO-key via `dangerouslyAllowBrowser: true` plus localStorage persistence means any injected script on the page exfiltrates the key; defensible for a personal tool but not production-grade, and the roadmap does not mention a server proxy.
4. The `Mode` union kept at 5 literals to avoid churn while admitting most of them are orphaned files is technical debt surfaced-but-not-paid, and the "generalized writer" README framing overstates what is actually wired to those modes today.
5. Scenario B's ~28x TVH headline in `MOJO-SCORE.md` §8 uses no-AI baseline while §4 admits the realistic user already uses generic AI — the disclosure is present but the headline number still leans on the larger framing.

## Part B — Clarity Scores

D1 — VR-as-causal-lever reframe (2026-04-13): 0.90
    Reasoning: Pre-registered Fisher's p < 0.0001 plus the boundary-contrast variants (33.9% VR band-25 fails while 29.1% VR band-35 passes) makes the causal reframe definitive at the pilot's scale, and the §13a real-CL baselines force the honest narrower claim — reviewer-caught, revised twice, learning is unambiguous.

D2 — Paragraph-Edit-Chat → regenerate-with-feedback (2026-04-15): 0.75
    Reasoning: The pivot is well-motivated by a proven Career Forge pattern and the MVP window, but "clear direction with some ambiguity remaining" fits better than 0.85 because (a) the replaced paragraph flow never went through user testing to fail, and (b) 514 lines of orphaned `edit-chat.tsx` were kept in the repo, so the decision was only half-executed.

D3 — Ship v4.1 despite GPTZero variance (2026-04-15): 0.60
    Reasoning: Shipping a framework change with k=3 pass rate of 1/3 on the named fixture, with "variance > effect size" as the defense and no automated regression yet, is a real judgment call but the signal is weak — the decision could as easily have been "don't ship, narrow variance first"; self-scoring 0.70 overstates clarity for a call that depends on eye-test over a noisy objective metric.

D4 — GPTZero-is-noise reversal → "the bar" (2026-04-15): 0.70
    Reasoning: The user's "product name = must pass GPTZero" framing is clear and brand-correct, but the reversal moves the goal to Mixed % — which the team admits is unvalidated and has no automated regression — so the pivot is definitive-in-direction but not in target; 0.75 self-score is defensible and I'd round slightly under.

D5 — Mojo framing pivot, HWP (not Career Forge) (2026-04-15): 0.80
    Reasoning: The reframe is strategically clean — HWP demonstrates productization instinct, Career Forge demonstrates orchestration depth, submitting the former with the latter as context is the stronger story — and the scope cut (multi-mode deferred) has matching README honesty; self-scored 0.80 is the right landing spot.

D6 — Defer inline text editing (2026-04-16): 0.85
    Reasoning: The deferral is unambiguously correct — the textarea-swap retrofit would be rework once the selection-based design lands, and regenerate-with-feedback already covers the use case — the Clarity is high because the next step was genuinely the one avoided.

D7 — Scope AI-isms to dismiss-only (2026-04-16): 0.90
    Reasoning: User recognized the scope-creep trap in real time and called the Decision Value tradeoff by name; 3-line UI change vs ~1.5h surgical-override work, where pattern-match false positives are unavoidable at this scope — the null on "detector can be perfect" is definitive.

AVERAGE CLARITY: 0.79

LOG STRENGTHS:
1. Every entry names the killed claim + the evidence that forced the change + a specific next-step avoided — the structure Beswick asks for is consistently present across all seven.
2. D1 carries reviewer-revision lineage visible in the linked `eval/reports/vr-validation.md` (TL;DR revised twice, §9 rewritten three times, arithmetic error self-documented) — the "invited review and acted on it" quality Beswick explicitly rewards is load-bearing here.
3. D4 is a self-reversal under user pushback within the same session, documented candidly — that is the kind of decision most self-assessments hide, and it should count in the builder's favor.

LOG CONCERNS:
1. D3's self-score (0.70) is too generous for a decision that rests on eye-test over a noisy metric with no automated regression yet — the team ships framework-adherence-looks-better on k=3=1/3, which is a judgment call, not a clarity-0.7 learning.
2. Several Investment Avoided hours (D1=12h, D2=10h, D3=6h) are counterfactual estimates with no instrumentation — the totals are defensible as informed guesses but should carry a wider uncertainty band than the weighted table implies.
3. D6 and D7 are Day-6 entries added after cross-model review was initiated — they use self-assessed Clarity without the same reviewer round, and the log notes this but the totals ledger treats them equally.
