export const FREE_FORM_MODE = {
  name: "free-form",
  displayName: "Free-Form",
  seedQuestion: "What are we writing today? Describe it like you're pitching it to a friend.",
  targetWords: 500,
  systemAddition: `
# Mode: Free-Form

No preset structure. The user's intent from the interview determines format.

Adapt structure from context:
- If user describes a letter → letter form
- If user describes an explainer → essay-like
- If user describes something to memorize → list or bulleted format
- If user is unsure → ask what form they want in the interview

Style targets:
- Let the interview drive the structure
- Still apply voice-preservation priority
- Still avoid banned AI-isms
- If the user's intent is genuinely ambiguous by end of interview, offer to assemble in the most likely format and flag the alternative.
  `.trim(),
};
