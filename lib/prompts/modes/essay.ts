import { getGoldenRule, STYLE_REFERENCES } from "../references";

export const ESSAY_MODE = {
  name: "essay",
  displayName: "Essay",
  seedQuestion: "What's the big idea? If you had 10 seconds to make someone care, what would you say?",
  targetWords: 600,
  rubricItems: ["thesis", "main claim", "supporting evidence", "counter-position acknowledged", "close"],
  systemAddition: `
# Mode: Essay

The output is a short essay (400-800 words). Structure:
- Lead with the thesis or a concrete image. Never bury the lede.
- Each body paragraph advances one claim and grounds it with evidence or example.
- Close by returning to the thesis with new weight — show how the body earned it.

Style targets:
- Varied sentence length. Short. Then one that breathes. Short again.
- Concrete nouns beat abstract categories.
- At least one memorable sentence or phrase that a reader would quote.
- No hedging qualifiers ("perhaps", "somewhat", "it could be argued that") unless the argument truly needs them.

## Golden Dataset Rule for This Mode

${getGoldenRule(5)}

## Strunk Rules (Grammar and Style)

${STYLE_REFERENCES.strunk}

## Anti-Patterns to Avoid

${STYLE_REFERENCES.antiPatterns}
  `.trim(),
};
