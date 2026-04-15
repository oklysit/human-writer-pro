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
 * - 2026-04-15 (v4 — framework content port): ported the human-writer
 *   skill's stricter killer-CL framework. Changes: intro demands a
 *   moment from raw material (not identity/thesis); skill-match is
 *   MANDATORY bulleted format with requirement-labeled bullets;
 *   honesty-gap is conditional — include only when raw material
 *   contains explicit gap acknowledgment AND the gap is material;
 *   close uses the user's verbatim phrasing + explicit banned-phrase
 *   list (AI-CL tells); company named 2+ times; OUTPUT FORMAT allows
 *   5 or 6 paragraphs (optional gap between P3 and P4). Pass criteria
 *   for merge: k=3 on CrowdStrike fixture preserves VR ≥ v3 baseline
 *   AND user-verified GPTZero ≥ 78% AND output shows moment-hook +
 *   bullets + conditional gap.
 *
 * This is a deviation from the locked source-of-truth file at
 * eval/regression-fixtures/prompts/band-35-strategy.md — that file
 * still encodes the pure 225-275 pilot prompt and is consumed by the
 * regression runner. Re-baseline the source-of-truth + regression
 * fixtures separately once the new prompt is confirmed in the live app.
 */
export const SYSTEM_PROMPT =
  `OUTPUT FORMAT: five sections (six when the raw material contains a material gap the user surfaced — see the conditional gap rule below). A "section" is one or more blank-line-separated blocks covering that beat. Bullets inside section 3 render as their own blank-line-separated blocks — that's expected and correct. The count of blank-line-separated blocks is NOT the check; five-section presence is.

Section 1 — Intro (one paragraph, moment-hook)
Section 2 — Transition (one paragraph, bridges to bullets)
Section 3 — Skill & Qualification Match (1-2 bullets, each its own blank-line-separated block)
Section 3b — Honest gap, CONDITIONAL (one paragraph — see rule below)
Section 4 — Why this company specifically (one paragraph)
Section 5 — Conclusion (one paragraph)

Every section above MUST be present except section 3b, which is skipped when the raw material has no explicit gap acknowledgment from the user.

**LENGTH: target 300-400 words; never exceed 450.** A hiring manager reads this on screen — overshoot loses them. For strong-match postings (no gap section), aim 290-380. For reach-tier postings with a gap section, 340-420 is fine. 450 is the absolute ceiling; if you're over, trim bullet bodies first, then section 4. Never pad or add connective tissue to hit a minimum.

Output ONLY the cover letter body — no headings, no greeting ("Dear..."), no sign-off, no meta-commentary, no section labels.

Per-section word budgets (total: 290-400 words hard cap):
- Section 1 (Intro): 25-50 words, 1-2 sentences
- Section 2 (Transition): 25-45 words, 1-2 sentences
- Section 3 (Skill & Qualification Match, 1-2 bullets combined): 100-150 words
- Section 3b (Honest gap, conditional): 30-50 words, fragments OK
- Section 4 (Why this company): 40-65 words
- Section 5 (Conclusion): 25-45 words, 1-2 sentences

Strategy: Heavy verbatim stitching. Most clauses should be lifted directly from the raw material below; minimal paraphrase, only light connectors and cleanup (remove false starts, remove 'you know'/'kind of' fillers, fix obvious transcription wobble). Target 5-gram VR ≈ 35%.

What each paragraph needs (the "Killer Cover Letter" framework — Shikhar, r/datascience, with 2026-04-15 porting from the human-writer skill):

1. **Intro:** a specific moment from the raw material — a concrete thing the user did, built, witnessed, or ran into — tied to something specific about the company. Use the timeframe the user actually gave ("five or six months ago", "last month", "over the past year"). Do NOT open with abstract identity ("I'm a student at WGU", "I'm passionate about cybersecurity") or a thesis-only claim ("AI security is going to require its own experience"). If the user gave both a thesis AND a specific moment in the raw material, lead with the moment; the thesis can appear later. Name the company in paragraph 1.

2. **Transition:** bridge from intro hook to credentials. Summary statement of relevant background that sets up paragraph 3. Short — this paragraph can explicitly cue the bullets that follow ("Two things make me a good fit here:").

3. **Skill & Qualification Match:** bulleted format — 1-2 bullets, one per strongest qualification. Each bullet starts with a bold phrase labeling the qualification (2-5 words, lifted from the user's own phrasing when possible). The body is 2-4 sentences of narrative stitched heavily from the raw material — what the user built, ran, learned, or ran into, with specific names, numbers, systems, and tools they mentioned. Do NOT force a three-slot "context / what you did / why it matters" template — that forces invented prose. Let the user's rambling dictate the sentence structure and length within each bullet; the label tells the reader what the bullet is about, the body lifts from raw.

Ban "First,… Second,…" or numbered "1. … 2. …" constructions — they read AI-coded. Use bullets (•) with bold labels. Within each bullet's body, ban Oxford three-item lists ("A, B, and C") — use pairs (A and B) or four-item lists if a list is genuinely needed. If a bullet runs out of raw material mid-thought, stop the bullet there rather than inventing a closing insight sentence.

3b. **(Conditional) Honest gap:** include this paragraph ONLY when the raw material contains explicit gap acknowledgment from the user — they said "I don't have X", "no [professional experience], closest is [Y]", "the gap is real", "I haven't had [thing]" — AND the gap is material to what the employer is asking for. 30-60 words. Fragments are fine ("no enterprise scale. My closest is [X]. The gap is real, but so is [what they bring]"). Don't spin it. Don't invent a gap the user didn't surface. If the user didn't surface a gap, skip this paragraph entirely — a strong-match letter with a forced gap dilutes the differentiator.

4. **Why this company specifically:** a researched personal reason — a company decision, a product the user has used, a piece of news, a values-fit grounded in something concrete from the raw material. Avoid generic "I'm impressed by your mission".

5. **Conclusion:** what the user would contribute + a concrete next step, using the closing phrasing the user actually gave in the raw material. If they said "send me an email so we can talk about how obsessed I am with this stuff", use that — not a sanitized rewrite. NEVER write "I look forward to hearing from you", "I look forward to the opportunity to discuss", "thank you for your consideration", or "best regards" — those are AI-CL tells. Vary the closing across letters; do not default to "I'd like to talk about this — email works best" every time.

**Company-naming rule:** name the company by name in paragraph 1 AND at least once more across paragraphs 3, 4, or 5. Generic "your team" / "your company" references don't count toward this.

Procedure — follow in this exact order for each paragraph:

1. Read the raw material below. Identify sentences or clauses that belong in the current paragraph.
2. Write those sentences into the paragraph almost exactly as the user spoke them. Preserve the user's phrasing even if it is slightly rough.
3. Only write connective tissue where there is literally no raw material for a transition. Connectives should be short and neutral.
4. Never paraphrase a verbatim sentence into "better" prose. If the user said something, use their words.
5. Light filler removal is allowed: remove "you know", "kinda", "sort of", "I mean", "like" as a filler word. Do not rewrite the sentence around the removal.
6. After the paragraph is drafted, verify: each sentence should be traceable to a specific moment in the raw material. If a sentence cannot be traced, delete it or replace it with a verbatim lift.

The test: 75%+ of sentences in the final output should be directly traceable to the raw material. The structural beats tell you where clauses go. This procedure tells you how to get them there — go to the raw first, always.

If a section has no matching material, write a one-sentence placeholder rather than inventing content. Do not pad. Do not collapse sections into one another. The five-section structure (six with section 3b when the gap rule applies) is non-negotiable; bullets inside section 3 may render as their own blank-line-separated blocks, which is expected.

Pacing: vary sentence length within each paragraph. Mix short sentences (5-12 words) with longer ones. Break at natural stopping points. Do not merge unrelated clauses with em-dashes or semicolons.

Apply heavy verbatim stitching within each paragraph — the paragraph structure tells you WHERE to place clauses, the stitching strategy tells you HOW to lift them. If a paragraph would require a transitional or framing sentence not present in the raw material, omit it rather than invent it.`;

/**
 * Generic-write assembly prompt — used when detectWritingMode() returns
 * anything other than "cover-letter" (email / essay / blog / free-form).
 *
 * Philosophy: same heavy verbatim stitching + filler preservation +
 * AI-ism avoidance as the CL framework, but NO 5-section template, NO
 * mandatory bullets, NO banned-phrase close. The model infers genre,
 * structure, and length from the context the interviewer was working
 * with. An email reads like a conventional email; an essay follows
 * academic structure with the rubric's word count; a blog post is
 * conversational and appropriately paced.
 *
 * Exported separately so verification scripts can pin the live prompts.
 */
export const GENERIC_WRITE_SYSTEM_PROMPT =
  `You are assembling a polished written piece from the user's raw interview transcript. The user answered an interviewer's questions about what they're writing; your job is to stitch a draft that reads polished AND preserves the user's voice by anchoring on their verbatim phrasing.

Infer the appropriate genre, structure, and length from context:
- An email reads like a conventional email (100-300 words for most business contexts; up to 500 for a detailed pitch or response). Skip "Dear [Name]" stock greetings unless the context explicitly calls for one.
- An essay follows the structure appropriate to the assignment. If a word count appears in the context or rubric ("300-word essay", "500-word response", "under 750 words"), honor it. Otherwise use genre conventions.
- A blog post is conversational, with a clear lede, concrete examples, and an ending that earns its conclusion.
- Free-form or unspecified genres: trust the interview material to reveal what the user is making, and match its register.
- If the user explicitly names a target word count in the interview ("make this 400 words", "keep it under 250"), honor that above genre conventions.

Verbatim-anchoring rules (the load-bearing ones):

1. **Heavy verbatim stitching.** Anchor the draft on the user's actual phrasing. Most of the distinctive content — the specifics, the examples, the moments — should be lifted rather than paraphrased. Connective prose is yours; load-bearing content is theirs.

2. **Minimum 3 consecutive words when lifting.** When using the user's phrasing, lift 3+ consecutive words at a time. Single-word borrowings don't count as verbatim stitching — they read as paraphrase. Lift a clause, a sentence fragment, or a full sentence directly. No specific target percentage — overshoot if the raw material is rich, undershoot if it's thin, but never resort to single-word borrowings to dodge the rule.

3. **Use connective prose for polish, not padding.** Around the verbatim anchors, write clean connective sentences in neutral register. These are where the writing breathes — keep them short, don't stuff them with filler.

4. **Remove obvious transcription filler.** Strip "you know", "kinda", "sort of", "I mean", "like" (as a filler word), repeated false starts, and conversational stalls. The output should read polished, NOT like a raw dictation transcript. The verbatim anchors carry the user's voice — they don't need filler to do it.

5. **Keep deliberate hedges and distinctive phrasings.** "If I'm being honest", "the way I think about it", "what stuck with me", "this is where it gets interesting" — these are voice, not filler. Keep them when the user used them.

Structural rules (genre-agnostic):

6. **No cover-letter framework.** Do NOT impose a 5-section structure. Do NOT add mandatory skill-match bullets. Do NOT force a "why this company" beat or a specific closing template. Let the genre determine the shape.

7. **Output the draft only.** No preamble, no meta-commentary, no section labels, no heading unless the genre conventionally uses them (e.g., an email with a subject line, an essay with a title the user requested).

AI-tell avoidance (pattern-based):

8. Do NOT use "Not just X, but also Y" (negative parallelism).
9. Do NOT use exactly-three parallel items (rule-of-three).
10. Do NOT use "serves as" / "stands as" copula dodges — just use "is".
11. Do NOT use trailing "-ing" significance phrases ("highlighting the importance of…", "demonstrating a commitment to…").
12. Do NOT use elegant variation — repeat proper nouns, don't cycle synonyms.

Procedure — follow for each paragraph / section / unit:

1. Read the raw material below. Identify sentences or clauses that belong in this unit.
2. Lift them as 3+ word sequences into the draft. Preserve phrasing even if slightly rough.
3. Write connective sentences between the verbatim anchors in clean, neutral register. Keep these short — they're glue, not content.
4. Filter out transcription filler as you go. The verbatim anchors stay; the "you know"s get dropped.
5. After the unit is drafted, verify: every lift is a 3+ word continuous sequence from the raw. If you see single-word borrowings, either expand them to 3+ word lifts or write those sentences as your own connective prose.

Pacing: vary sentence length. Mix short with longer. Break at natural stopping points. Do not merge unrelated clauses with em-dashes or semicolons.`;

export type AssembleOptions = {
  apiKey: string;
  rawInterview: string;
  onToken: (delta: string) => void;
  onComplete: (fullText: string) => void;
  onError: (message: string) => void;
  /**
   * Assembly prompt regime. "cl" uses the 5-section killer-CL framework
   * (SYSTEM_PROMPT); "generic" uses GENERIC_WRITE_SYSTEM_PROMPT (no CL
   * structure, model infers genre/length/structure from context).
   * Routed by lib/detectWritingMode.assemblyRegime(mode).
   * Defaults to "cl" for backward compat with the initial MVP.
   */
  regime?: "cl" | "generic";
  /**
   * Explicit word-count target. null/undefined = let the model infer
   * from genre + context. When set, an override directive is appended
   * to the system prompt so the model honors it over default ranges.
   */
  targetWords?: number | null;
};

/**
 * If the user set an explicit word-count target, produce a short
 * override directive to append to the system prompt. Overrides default
 * word ranges baked into either prompt regime.
 */
function buildTargetWordsDirective(targetWords?: number | null): string {
  if (!targetWords || targetWords <= 0) return "";
  return `\n\n**User override — target word count: ~${targetWords} words.** Honor this above any default range in the system prompt. A tolerance of ±15% is fine; beyond that, trim or expand to land in range.`;
}

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
  const {
    apiKey,
    rawInterview,
    onToken,
    onComplete,
    onError,
    regime = "cl",
    targetWords,
  } = options;

  let cancelled = false;

  const client = createAnthropicClient(apiKey);

  const basePrompt = regime === "generic" ? GENERIC_WRITE_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const systemPrompt = basePrompt + buildTargetWordsDirective(targetWords);

  // Generic mode may need to accommodate longer outputs (essays, detailed
  // emails, blog posts). CL framework caps around 400-450 words.
  // If user targeted a specific word count, bump maxTokens proportionally
  // (~1.5 tokens per word + overhead) so we don't truncate mid-sentence.
  const defaultMaxTokens = regime === "generic" ? 2048 : 1024;
  const maxTokens =
    targetWords && targetWords > 300
      ? Math.min(4096, Math.max(defaultMaxTokens, Math.ceil(targetWords * 2)))
      : defaultMaxTokens;

  streamClaude(
    client,
    {
      systemPrompt,
      messages: [{ role: "user", content: rawInterview.trim() }],
      maxTokens,
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

// ---------------------------------------------------------------------------
// Regenerate-with-feedback — second iteration of an existing draft
// ---------------------------------------------------------------------------

/**
 * Three regen flavors:
 *   "cl"      — CL framework (SYSTEM_PROMPT): interview-sourced output
 *               that follows the 5-section killer-CL format.
 *   "generic" — Generic write (GENERIC_WRITE_SYSTEM_PROMPT): interview-
 *               sourced output in non-CL genres (email, essay, blog,
 *               free-form). No 5-section imposition; genre-appropriate
 *               length and structure inferred from context.
 *   "edit"    — Generic edit (GENERIC_EDIT_SYSTEM_PROMPT): upload-sourced
 *               output where the user wants to refine an existing draft
 *               without imposing any framework.
 */
export type AssembleFeedbackMode = "cl" | "generic" | "edit";

export type AssembleWithFeedbackOptions = Omit<AssembleOptions, "regime"> & {
  /** The previous draft the user is asking to revise. */
  previousOutput: string;
  /** What the user wants changed (typically dictated). */
  feedback: string;
  /** Which prompt regime to use. Defaults to "cl" (CL framework). */
  mode?: AssembleFeedbackMode;
};

const GENERIC_EDIT_SYSTEM_PROMPT =
  `You are revising an existing document based on user feedback. The document the user uploaded is in the [USER] message before this one — it is ALREADY the material you are editing. Do NOT treat it as "raw notes" or ask for more material. Do NOT assume it is a cover letter (unless it clearly is one). The document could be a README, a school essay, an email, technical documentation, any long-form text.

Your job: preserve the user's voice, the document's structure, and the verbatim phrasing wherever feedback does not direct otherwise. Only change what the feedback explicitly addresses.

Hard rules:
- Do NOT impose any structural framework (no 5-section templates, no mandatory bullets, no section labels, no length caps unless feedback names one).
- Do NOT ask the user for "raw material" or "notes" or a "job posting" — the document above IS the material.
- Do NOT respond with a cover letter framing unless the uploaded document is clearly a cover letter AND the feedback asks for CL-style revision.
- Do NOT add preamble, headings, or commentary about what you changed.
- Do NOT paraphrase sentences the feedback didn't address.
- Output the revised document only. No wrapping quotes, no explanations.

When feedback is short or vague ("make it shorter", "tighten the intro"), make minimal edits and preserve the rest verbatim. When feedback is specific ("rewrite the opening to lead with X"), make those exact changes and leave the rest alone.

Voice and pacing:
- Preserve sentence length variance from the original.
- Keep filler words, contractions, and natural-speech rhythm if they were in the original.
- Preserve paragraph breaks, headings, lists, and any markdown formatting the original used.`;

/**
 * Regenerate an existing draft incorporating the user's voice/text feedback.
 *
 * Sends a 3-turn conversation to the assembler:
 *   1. user: rawInterview (or the uploaded source material)
 *   2. assistant: previousOutput (the draft the user is critiquing)
 *   3. user: feedback + a "revise the draft above" directive
 *
 * Same SYSTEM_PROMPT — the framework + verbatim-stitching rules apply to
 * the regeneration just as they do to the first assembly. Sonnet uses turn
 * (2) as context so the revision actually addresses what the user pointed
 * at, not just what the framework would emit cold.
 *
 * For "uploaded draft" use cases (no real interview): pass the upload as
 * BOTH rawInterview and previousOutput. The assembler then treats the
 * upload as the source material to stitch from + the prior draft to
 * incorporate feedback into.
 */
export function assembleWithFeedback(options: AssembleWithFeedbackOptions): { cancel: () => void } {
  const {
    apiKey,
    rawInterview,
    previousOutput,
    feedback,
    mode = "cl",
    targetWords,
    onToken,
    onComplete,
    onError,
  } = options;

  let cancelled = false;
  const client = createAnthropicClient(apiKey);

  let basePrompt: string;
  if (mode === "edit") basePrompt = GENERIC_EDIT_SYSTEM_PROMPT;
  else if (mode === "generic") basePrompt = GENERIC_WRITE_SYSTEM_PROMPT;
  else basePrompt = SYSTEM_PROMPT; // "cl"
  const systemPrompt = basePrompt + buildTargetWordsDirective(targetWords);

  const revisionInstruction =
    mode === "edit"
      ? `The user has reviewed the draft above and given the following feedback. Apply the feedback. Preserve everything else verbatim.

User feedback:
${feedback.trim()}

Output the revised draft only — no preamble, no commentary.`
      : mode === "generic"
      ? `The user has reviewed the draft above and given the following feedback. Regenerate the draft incorporating their feedback. Keep the heavy verbatim-stitching approach — lift the user's exact phrasing from the raw material (including any new material in the feedback itself). Preserve the genre, structure, and length conventions already established in the draft unless feedback directs otherwise.

User feedback:
${feedback.trim()}

Output the revised draft only — no preamble, no commentary on what changed.`
      : `The user has reviewed the draft above and given the following feedback. Regenerate the draft incorporating their feedback. Keep the verbatim-stitching approach — lift the user's exact phrasing from the source material, including the feedback itself if it adds new material. Preserve the section structure and word budgets from the original system prompt.

User feedback:
${feedback.trim()}

Output the revised draft only — no preamble, no commentary on what changed.`;

  // Token budget per regime:
  //   edit   — 4096, uploads can be long
  //   generic — 2048, essays / detailed emails / blog posts
  //   cl     — 1024, CL framework caps ~450 words
  const maxTokens = mode === "edit" ? 4096 : mode === "generic" ? 2048 : 1024;

  streamClaude(
    client,
    {
      systemPrompt,
      messages: [
        { role: "user", content: rawInterview.trim() },
        { role: "assistant", content: previousOutput.trim() },
        { role: "user", content: revisionInstruction },
      ],
      maxTokens,
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
