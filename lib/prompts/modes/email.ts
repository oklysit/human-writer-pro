import { getGoldenRule, STYLE_REFERENCES } from "../references";

export const EMAIL_MODE = {
  name: "email",
  displayName: "Email",
  seedQuestion: "Who's this going to, and what do you need from them?",
  targetWords: 180,
  systemAddition: `
# Mode: Email

The output is a professional email (100-300 words). Structure:
- Subject line: specific, not clever. One sentence max.
- First sentence: name the ask or the context that makes the ask land.
- Body: one ask per email. If there are more, split into separate emails.
- Closing: name the next step, not a pleasantry.

Style targets:
- No "I hope this finds you well" or variants. Get to the point.
- Shortest professional register that still respects the reader.
- Active voice. First person. No passive constructions.
- If action is needed, make it visually distinct (short line or bullet).

## Golden Dataset Rules for This Mode

${getGoldenRule(1)}

---

${getGoldenRule(4)}

## Anti-Patterns to Avoid

${STYLE_REFERENCES.antiPatterns}
  `.trim(),
};
