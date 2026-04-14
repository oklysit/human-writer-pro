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
 * Get the protective style rules block for system prompts.
 *
 * Only includes rules that PREVENT bad output (banned AI-isms + anti-patterns).
 * Positive-style references (Strunk, Zinsser, Albrighton, Golden Dataset) are
 * deliberately excluded: they encourage "improving" the user's prose, which
 * causes the model to paraphrase and smooth — defeating voice preservation.
 * Per the 54-variant pilot, leaner prompts produced 20-40% VR; the original
 * layered prompt with positive-style references dropped live-app VR to 3-4%.
 */
export function getStyleRulesBlock(): string {
  return `
# Banned AI-isms (NEVER use these phrases)

${STYLE_REFERENCES.bannedIsms}

---

# AI Anti-Patterns (recognize + avoid)

${STYLE_REFERENCES.antiPatterns}
  `.trim();
}
