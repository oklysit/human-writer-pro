/**
 * LLM Judge module — scores generated CL output against an approved reference.
 *
 * Uses Claude Sonnet 4.6 in an explicit "you are a judge" role, separate from
 * the generator call. Returns structured 1-5 scores for voice match, content
 * fidelity, and AI-ism severity.
 *
 * Defensive JSON parsing: if the model returns malformed output, throws a
 * typed JudgeParseError. The runner catches it and skips that k-run rather
 * than aborting the whole fixture.
 */

import Anthropic from "@anthropic-ai/sdk";

export class JudgeParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
  ) {
    super(message);
    this.name = "JudgeParseError";
  }
}

export type JudgeResult = {
  voiceMatch: number; // 1-5
  contentFidelity: number; // 1-5
  aiIsmSeverity: number; // 1-5 (5 = human, 1 = machine)
  reasoning: string; // freeform short explanation
};

/**
 * Compose the judge system prompt (no API call — exported for testability).
 */
export function composeJudgePrompt(options: {
  generatedOutput: string;
  approvedReference: string;
  rubricNotes: string;
}): { system: string; user: string } {
  const { generatedOutput, approvedReference, rubricNotes } = options;

  const system = `You are an expert writing evaluator. Your job is to score a generated cover letter paragraph against an approved human reference. You must return ONLY a JSON object — no prose, no markdown code fences, no explanation outside the JSON fields.

Rubric definitions:
- voiceMatch: On a 1-5 scale, how closely does the generated output match the register, rhythm, and word choice of the approved reference? 5 = indistinguishable, 1 = wildly different tone.
- contentFidelity: On a 1-5 scale, does the output stay within the facts given in the interview (do NOT hallucinate credentials, companies, or outcomes)? 5 = perfect fidelity, 1 = significant hallucination.
- aiIsmSeverity: On a 1-5 scale, how much does the output feel AI-generated? 5 = human, 1 = machine.
- reasoning: A brief (1-3 sentence) explanation of your scores.

Return EXACTLY this JSON shape:
{
  "voiceMatch": <integer 1-5>,
  "contentFidelity": <integer 1-5>,
  "aiIsmSeverity": <integer 1-5>,
  "reasoning": "<string>"
}`;

  const user = `<approved_reference>
${approvedReference}
</approved_reference>

<generated_output>
${generatedOutput}
</generated_output>

<rubric_notes>
${rubricNotes}
</rubric_notes>

Score the generated output against the approved reference using the rubric in your system prompt. Return ONLY the JSON object.`;

  return { system, user };
}

/**
 * Strip markdown code fences and surrounding whitespace from a model response.
 */
function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/**
 * Parse the judge's response into a JudgeResult.
 * Throws JudgeParseError on any structural problem — no fallback scores.
 */
function parseJudgeResponse(raw: string): JudgeResult {
  const cleaned = stripCodeFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new JudgeParseError(
      `Judge response is not valid JSON: ${e instanceof Error ? e.message : String(e)}`,
      raw
    );
  }

  if (parsed === null || typeof parsed !== "object") {
    throw new JudgeParseError("Judge response is not a JSON object", raw);
  }

  const obj = parsed as Record<string, unknown>;

  const intField = (key: string): number => {
    const v = obj[key];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) {
      throw new JudgeParseError(
        `Judge field "${key}" must be an integer 1-5, got: ${JSON.stringify(v)}`,
        raw
      );
    }
    return v;
  };

  const voiceMatch = intField("voiceMatch");
  const contentFidelity = intField("contentFidelity");
  const aiIsmSeverity = intField("aiIsmSeverity");

  if (typeof obj["reasoning"] !== "string") {
    throw new JudgeParseError(
      `Judge field "reasoning" must be a string, got: ${JSON.stringify(obj["reasoning"])}`,
      raw
    );
  }

  return {
    voiceMatch,
    contentFidelity,
    aiIsmSeverity,
    reasoning: obj["reasoning"],
  };
}

/**
 * Call the LLM judge and return structured scores.
 *
 * @throws JudgeParseError  if the model returns malformed JSON
 * @throws Error            on Anthropic API failure
 */
export async function judge(options: {
  apiKey: string;
  generatedOutput: string;
  approvedReference: string;
  rubricNotes: string;
}): Promise<JudgeResult> {
  const { apiKey, generatedOutput, approvedReference, rubricNotes } = options;

  const client = new Anthropic({ apiKey });
  const { system, user } = composeJudgePrompt({
    generatedOutput,
    approvedReference,
    rubricNotes,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new JudgeParseError("Judge returned no text content", "");
  }

  return parseJudgeResponse(textBlock.text);
}
