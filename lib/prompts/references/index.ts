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

export const STYLE_REFERENCES = {
  strunk: strunkRules,
  antiPatterns: aiAntiPatterns,
  bannedIsms: bannedAiIsms,
  zinsser: zinsserPrinciples,
  albrighton: albrightonPrinciples,
};

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
