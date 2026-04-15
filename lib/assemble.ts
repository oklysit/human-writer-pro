import { createAnthropicClient, streamClaude } from "./anthropic-client";

/**
 * Assembly call — band-35 only.
 *
 * Per the 2026-04-14 VR collapse investigation:
 *   - The pilot's band-35 prompt (passed GPTZero 6/6 in the n=54 validation)
 *     is the empirical source of truth.
 *   - Every layer of additional context added to the assembly call —
 *     framing lines, mode formatting blocks, boundary tags, banned-phrase
 *     lists, voice/style/Strunk references — costs VR. See bisection at
 *     scripts/debug/bisect-pipeline.ts.
 *   - The two pilot sentences are sent as system prompt; the raw interview
 *     transcript is the only thing in the user message.
 *
 * Source of truth for the prompt itself: `eval/regression-fixtures/prompts/band-35-strategy.md`.
 * Modifying SYSTEM_PROMPT here without re-baselining the regression suite
 * is a regression-suite violation per that file's policy.
 *
 * Style/voice/anti-pattern references (lib/prompts/references/*) belong in
 * the interview stage and in post-assembly review passes. They do NOT belong
 * in the assembly call.
 */

/**
 * Exported so the verification scripts at scripts/debug/ can pin to the same
 * prompt the live app sends. Modifying this string requires re-running
 * scripts/debug/verify-all-fixtures.ts and confirming VR holds across all
 * cl-assembly fixtures before shipping.
 *
 * History:
 * - 2026-04-13: pilot band-35 (225-275 word range, single paragraph,
 *   strategy-only). Validated 6/6 GPTZero pass rate.
 * - 2026-04-14: word range bumped to 290-400 to match the empirical
 *   distribution of the 5 approved CLs (median 344 words).
 * - 2026-04-15: appended structural beats + pacing block per consultant
 *   fix #2. Reasoning: the strict band-35 prompt produced output that
 *   passed VR/GPTZero (17%, 97% human) but failed the eye-test on
 *   structure (no clear opener / credentials / why / close beats and
 *   monotone pacing). Structural guidance is allowed; style/Strunk/
 *   anti-pattern loads are still forbidden — those caused the original
 *   VR collapse. The "heavy verbatim stitching" instruction still
 *   governs HOW clauses get lifted; the new block governs WHERE they go
 *   and how they pace.
 * - 2026-04-15 (v3): inserted numbered procedural verbatim-first block
 *   between the killer-CL framework and Pacing, replacing the single-
 *   paragraph "Pull verbatim clauses…" directive. Per consultant memo:
 *   the prior prompt was declarative about verbatim stitching (WHAT to
 *   do) but not procedural (what ORDER to do it). Sonnet defaults to
 *   compose → inject unless explicit step-by-step ordering forces
 *   read-raw-first. The 75% traceability test gives the model a
 *   self-check anchor. Keeps "Target 5-gram VR ≈ 35%" line; open
 *   question on whether that target does work or is cargo-culted from
 *   the pilot — separate matched-pair experiment after this ships.
 *
 * This is a deviation from the locked source-of-truth file at
 * eval/regression-fixtures/prompts/band-35-strategy.md — that file
 * still encodes the pure 225-275 pilot prompt and is consumed by the
 * regression runner. Re-baseline the source-of-truth + regression
 * fixtures separately once the new prompt is confirmed in the live app.
 */
export const SYSTEM_PROMPT =
  `OUTPUT FORMAT: five paragraphs separated by blank lines. Your response must match this literal pattern:

[paragraph 1 — Intro]

[paragraph 2 — Transition]

[paragraph 3 — Skill & Qualification Match]

[paragraph 4 — Why this company specifically]

[paragraph 5 — Conclusion]

Five paragraphs. Four blank-line separators between them. Not one paragraph. Not three paragraphs. Five.

Output ONLY the cover letter body — no headings, no greeting ("Dear..."), no sign-off, no meta-commentary, no labels in brackets (those are for your reference; replace each [paragraph N — beat] block with the actual paragraph content).

Per-paragraph word budgets (total ~290–380 words):
- Paragraph 1 (Intro): 25–50 words, 1-2 sentences
- Paragraph 2 (Transition): 25–50 words, 1-2 sentences
- Paragraph 3 (Skill & Qualification Match): 100–150 words
- Paragraph 4 (Why this company): 50–80 words
- Paragraph 5 (Conclusion): 25–50 words, 1-2 sentences

Strategy: Heavy verbatim stitching. Most clauses should be lifted directly from the raw material below; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.

What each paragraph needs (the "Killer Cover Letter" framework — Shikhar, r/datascience):

1. **Intro:** distinctive identity for THIS role — an obsessive focus, an unusual perspective, a stake-in-the-ground opinion — tied to something specific about the company. Do NOT lead with generic identity ("I'm a student at WGU").

2. **Transition:** bridge from intro hook to credentials. Summary statement of relevant background that sets up paragraph 3.

3. **Skill & Qualification Match:** strongest 1-2 qualifications shown via concrete projects, stories, or outcomes — not claims. Lift specifics from the raw material.

4. **Why this company specifically:** a researched personal reason — a company decision, a product the user has used, a piece of news, a values-fit grounded in something concrete from the raw material. Avoid generic "I'm impressed by your mission".

5. **Conclusion:** what the user would contribute + a concrete next step. Vary the closing — do NOT default to "I'd like to talk about this".

Procedure — follow in this exact order for each paragraph:

1. Read the raw material below. Identify sentences or clauses that belong in the current paragraph.
2. Write those sentences into the paragraph almost exactly as the user spoke them. Preserve the user's phrasing even if it is slightly rough.
3. Only write connective tissue where there is literally no raw material for a transition. Connectives should be short and neutral.
4. Never paraphrase a verbatim sentence into "better" prose. If the user said something, use their words.
5. Light filler removal is allowed: remove "you know", "kinda", "sort of", "I mean", "like" as a filler word. Do not rewrite the sentence around the removal.
6. After the paragraph is drafted, verify: each sentence should be traceable to a specific moment in the raw material. If a sentence cannot be traced, delete it or replace it with a verbatim lift.

The test: 75%+ of sentences in the final output should be directly traceable to the raw material. The structural beats tell you where clauses go. This procedure tells you how to get them there — go to the raw first, always.

If a paragraph has no matching material, write a one-sentence placeholder rather than inventing content. Do not pad. Do not collapse paragraphs into one another. The five-paragraph structure is non-negotiable even when input material is uneven across beats.

Pacing: vary sentence length within each paragraph. Mix short sentences (5-12 words) with longer ones. Break at natural stopping points. Do not merge unrelated clauses with em-dashes or semicolons.

Apply heavy verbatim stitching within each paragraph — the paragraph structure tells you WHERE to place clauses, the stitching strategy tells you HOW to lift them. If a paragraph would require a transitional or framing sentence not present in the raw material, omit it rather than invent it.`;

export type AssembleOptions = {
  apiKey: string;
  rawInterview: string;
  onToken: (delta: string) => void;
  onComplete: (fullText: string) => void;
  onError: (message: string) => void;
};

/**
 * Thin helper that wraps streamClaude with the band-35 assembly prompt.
 * Caller provides token/complete/error callbacks; this function manages
 * the Anthropic client lifecycle and forwards events.
 *
 * Returns a cancel handle. The Anthropic SDK stream does not expose an
 * AbortController on the async-iterator path used by streamClaude, so
 * cancel() sets an internal flag that suppresses further callbacks after
 * the fact. Streaming tokens already in-flight will be swallowed.
 */
export function assemble(options: AssembleOptions): { cancel: () => void } {
  const { apiKey, rawInterview, onToken, onComplete, onError } = options;

  let cancelled = false;

  const client = createAnthropicClient(apiKey);

  streamClaude(
    client,
    {
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawInterview.trim() }],
      maxTokens: 1024,
      model: "claude-sonnet-4-6",
    },
    {
      onDelta: (text) => {
        if (!cancelled) onToken(text);
      },
      onComplete: (fullText) => {
        if (!cancelled) onComplete(fullText);
      },
      onError: (err) => {
        if (!cancelled) onError(err.message);
      },
    }
  );

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
