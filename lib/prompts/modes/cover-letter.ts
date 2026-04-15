export const COVER_LETTER_MODE = {
  name: "cover-letter",
  displayName: "Cover Letter",
  systemAddition: `
# Mode: Cover Letter

The output is a traditional cover letter (200-350 words).

Format:
- Opening line: "Dear [HIRING MANAGER]," — or use a specific name if the interview mentions one. Leave "[HIRING MANAGER]" as a literal placeholder the user can fill in if no name is available.
- Body: 2-3 paragraphs assembled directly from the user's interview content. Follow the verbatim stitching strategy.
- Closing line: one sentence varying in form (do NOT default to "I'd like to talk about this"). Let the interview content suggest a natural close.
- Signoff: "[Signoff]" placeholder on its own line — user fills in "Best," / "Thanks," / their preferred closing.
- Name: leave blank — user signs in their own hand.

Word budget: aim for ~280 words, never exceed 400.

Style: plain, direct register. No corporate-ese. No "I am writing to express my interest." Do not add a title, headline, or decorative section heading — a cover letter is a letter, not an article.
  `.trim(),
};
