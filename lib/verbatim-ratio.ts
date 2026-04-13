export type VRResult = {
  threeGram: number;
  fiveGram: number;
  sevenGram: number;
  overlapCount: { three: number; five: number; seven: number };
  totalNgrams: { three: number; five: number; seven: number };
  rawWordCount: number;
  outputWordCount: number;
};

/**
 * Tokenize text: strip markdown headers, lowercase, strip punctuation, split on whitespace.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const withoutHeaders = text
    .split("\n")
    .filter(line => !line.trim().startsWith("#"))
    .join("\n");
  return withoutHeaders
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Build n-grams (as space-joined strings) from a token list.
 */
export function buildNgrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(" "));
  }
  return result;
}

/**
 * Compute VR: the fraction of output n-grams that also appear in raw.
 */
function vrForN(rawTokens: string[], outputTokens: string[], n: number): { ratio: number; overlap: number; total: number } {
  const rawSet = new Set(buildNgrams(rawTokens, n));
  const outputList = buildNgrams(outputTokens, n);
  if (outputList.length === 0) return { ratio: 0, overlap: 0, total: 0 };
  let overlap = 0;
  for (const gram of outputList) {
    if (rawSet.has(gram)) overlap++;
  }
  return {
    ratio: overlap / outputList.length,
    overlap,
    total: outputList.length,
  };
}

export function computeVR(rawInterview: string, output: string): VRResult {
  const rawTokens = tokenize(rawInterview);
  const outputTokens = tokenize(output);

  const three = vrForN(rawTokens, outputTokens, 3);
  const five = vrForN(rawTokens, outputTokens, 5);
  const seven = vrForN(rawTokens, outputTokens, 7);

  return {
    threeGram: three.ratio,
    fiveGram: five.ratio,
    sevenGram: seven.ratio,
    overlapCount: { three: three.overlap, five: five.overlap, seven: seven.overlap },
    totalNgrams: { three: three.total, five: five.total, seven: seven.total },
    rawWordCount: rawTokens.length,
    outputWordCount: outputTokens.length,
  };
}
