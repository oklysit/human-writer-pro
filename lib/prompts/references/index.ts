// Loads style rule references as raw markdown strings for prompt concatenation.
// In production (Next.js), these are imported at build time via webpack raw-loader or read from disk.
// For MVP, we embed the critical parts directly as template strings to avoid webpack config complexity.

// Minimal loader — reads the .md files as string content and exports them.
// We use ?raw imports (Vite-compatible) OR direct string content.

// Since Next.js App Router supports ?raw with default config, this works:
import strunkRules from "./strunk-rules.md?raw";
import aiAntiPatterns from "./ai-anti-patterns.md?raw";
import bannedAiIsms from "./banned-ai-isms.md?raw";
import zinsserPrinciples from "./zinsser-principles.md?raw";
import albrightonPrinciples from "./albrighton-principles.md?raw";
import goldenDataset from "./golden-dataset.md?raw";

export const STYLE_REFERENCES = {
  strunk: strunkRules,
  antiPatterns: aiAntiPatterns,
  bannedIsms: bannedAiIsms,
  zinsser: zinsserPrinciples,
  albrighton: albrightonPrinciples,
  goldenDataset: goldenDataset,
};

/**
 * Extract a single numbered rule from the Golden Dataset by rule number.
 * Returns the full rule block (heading + AI/Human examples + Rule line).
 */
export function getGoldenRule(ruleNumber: number): string {
  const src = STYLE_REFERENCES.goldenDataset;
  const startPattern = new RegExp(`### ${ruleNumber}\\.`);
  const nextPattern = /^### \d+\./m;
  const startMatch = startPattern.exec(src);
  if (!startMatch) return "";
  const startIdx = startMatch.index;
  const rest = src.slice(startIdx + startMatch[0].length);
  const nextMatch = nextPattern.exec(rest);
  const endIdx = nextMatch ? startIdx + startMatch[0].length + nextMatch.index : src.length;
  return src.slice(startIdx, endIdx).trim();
}

/**
 * Get a concatenated style rules block for system prompts.
 */
export function getStyleRulesBlock(): string {
  return `
# Style Rules

The following rules guide assembled output. They come from canonical writing references
(Strunk & White, Zinsser, Albrighton) plus original observations from AI-flagged drafts.

---

${STYLE_REFERENCES.strunk}

---

${STYLE_REFERENCES.zinsser}

---

${STYLE_REFERENCES.albrighton}

---

# Banned AI-isms (NEVER use these phrases)

${STYLE_REFERENCES.bannedIsms}

---

# AI Anti-Patterns (recognize + avoid)

${STYLE_REFERENCES.antiPatterns}
  `.trim();
}
