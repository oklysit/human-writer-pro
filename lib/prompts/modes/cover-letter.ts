import { getGoldenRule, STYLE_REFERENCES } from "../references";

export const COVER_LETTER_MODE = {
  name: "cover-letter",
  displayName: "Cover Letter",
  seedQuestion: "Tell me about the job you're applying to, and why it caught your attention.",
  targetWords: 280,
  rubricItems: ["opener hook", "credentials", "why this company", "professional opinion", "close"],
  systemAddition: `
# Mode: Cover Letter

The output is a cover letter (200-350 words). Structure per the killer framework:
- Headline: 2 elements, ≤95 chars, no metrics, no graduation dates.
- First sentence: hooks with the reader's need, not your credentials.
- Second sentence: shows fit — specifically why you for this role.
- Third sentence: names the specific role/company — proves you read the posting.
- Body: 2-3 paragraphs of skill-match stories in Theme → Context → What you did → Why it matters format.
- Optional: conditional gap paragraph (only if this is a reach — skip for strong direct matches).
- Close: vary the closing line. Do NOT always end with "I'd like to talk about this."

Style targets:
- No "I am writing to express my interest." Get to the reader's need in sentence one.
- No corporate-ese. Default to plain, direct register.
- Match the company's stated values via vocabulary echo (use their words back).
- Word budget strict: aim for ~280 words, never over 400.

## Golden Dataset Rule for This Mode

${getGoldenRule(11)}

## Anti-Patterns to Avoid

${STYLE_REFERENCES.antiPatterns}
  `.trim(),
};
