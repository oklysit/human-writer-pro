/**
 * Thin GPTZero client for the CL regression runner.
 *
 * Gated at call site: only invoked when process.env.GPTZERO_API_KEY is set.
 * Throws a typed error on failure — the runner catches and marks gptzero_skipped.
 */

export class GPTZeroError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "GPTZeroError";
  }
}

export type GPTZeroResult = {
  human_plus_mixed: number; // 0–100, sum of human + mixed class probabilities
  raw: unknown; // full API response for diagnostics
};

/**
 * Score `text` via GPTZero v2 predict/text endpoint.
 *
 * @param options.apiKey  GPTZero API key (x-api-key header)
 * @param options.text    The text to score
 * @returns               human_plus_mixed (0–100) + raw response
 * @throws GPTZeroError   on HTTP errors, quota exhaustion, or parse failures
 */
export async function scoreGPTZero(options: {
  apiKey: string;
  text: string;
}): Promise<GPTZeroResult> {
  const { apiKey, text } = options;

  const response = await fetch("https://api.gptzero.me/v2/predict/text", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ document: text }),
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      raw && typeof raw === "object" && "message" in raw
        ? String((raw as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw new GPTZeroError(`GPTZero request failed: ${detail}`, response.status);
  }

  // Extract class_probabilities.human + class_probabilities.mixed
  if (
    raw === null ||
    typeof raw !== "object" ||
    !("documents" in raw) ||
    !Array.isArray((raw as { documents: unknown }).documents) ||
    (raw as { documents: unknown[] }).documents.length === 0
  ) {
    throw new GPTZeroError("GPTZero response missing documents array");
  }

  const doc = (raw as { documents: Array<unknown> }).documents[0];
  if (
    doc === null ||
    typeof doc !== "object" ||
    !("class_probabilities" in doc)
  ) {
    throw new GPTZeroError("GPTZero document missing class_probabilities");
  }

  const probs = (doc as { class_probabilities: unknown }).class_probabilities;
  if (probs === null || typeof probs !== "object") {
    throw new GPTZeroError("GPTZero class_probabilities is not an object");
  }

  const p = probs as Record<string, unknown>;
  const human = typeof p["human"] === "number" ? p["human"] : 0;
  const mixed = typeof p["mixed"] === "number" ? p["mixed"] : 0;

  return {
    human_plus_mixed: Math.round((human + mixed) * 100 * 10) / 10,
    raw,
  };
}
