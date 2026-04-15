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
 *
 * This is a deviation from the locked source-of-truth file at
 * eval/regression-fixtures/prompts/band-35-strategy.md — that file
 * still encodes the pure 225-275 pilot prompt and is consumed by the
 * regression runner. Re-baseline the source-of-truth + regression
 * fixtures separately once the new prompt is confirmed in the live app.
 */
export const SYSTEM_PROMPT =
  `Write a cover letter of approximately 350 words (strict range: 290–400). The output should have visible paragraph breaks (blank lines) between the five structural beats described below. Output ONLY the cover letter body — no headings, no greeting ("Dear..."), no sign-off, no meta-commentary.

Strategy: Heavy verbatim stitching. Most clauses should be lifted directly; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers where they break the flow, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.

The five structural beats (the "Killer Cover Letter" framework — Shikhar, r/datascience), in order, each its own paragraph:

1. **Intro (1-2 sentences):** who the user is, what they want, what they believe in — tied to something specific about the company. Lead with what's distinctive for THIS role (an obsessive focus, an unusual perspective, a stake-in-the-ground opinion). Do NOT lead with generic identity ("I'm a student at WGU").

2. **Transition (1-2 sentences):** a summary statement of the user's most relevant background that sets up the credential beats. Bridge from the intro's hook to the credentials that follow.

3. **Skill & Qualification Match (1 paragraph, 100-150 words):** the strongest 1-2 qualifications from the user's experience, tied directly to the role's requirements. Each shown via a concrete project, story, or outcome — not claims. Lift from the raw material.

4. **Why this company specifically (1 paragraph, 50-80 words):** the personal, researched reason — a specific company decision, a product the user has used, a piece of news, a values-fit grounded in something concrete from the raw material. Avoid generic "I'm impressed by your mission" lines.

5. **Conclusion (1-2 sentences):** what the user would contribute and a concrete next step. Vary the closing — do NOT default to "I'd like to talk about this."

Pull verbatim clauses from the raw material to fill each beat. If a beat has no matching material, write a one-sentence placeholder rather than inventing content. Do not pad. Do not collapse beats into one another.

Pacing: vary sentence length. Mix short sentences (5-12 words) with longer ones. Break at natural stopping points. Do not merge unrelated clauses with em-dashes or semicolons.

Apply heavy verbatim stitching within each beat — the structural beats tell you WHERE to place clauses, the stitching strategy tells you HOW to lift them. If a beat would require a transitional or framing sentence not present in the raw material, omit it rather than invent it.`;

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
