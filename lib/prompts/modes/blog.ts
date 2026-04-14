import { getGoldenRule, STYLE_REFERENCES } from "../references";

export const BLOG_MODE = {
  name: "blog",
  displayName: "Blog Post",
  seedQuestion: "Walk me through what you want to write about — pretend I haven't seen it yet.",
  targetWords: 900,
  rubricItems: ["hook", "main idea", "supporting points or stories", "voice consistency", "takeaway"],
  systemAddition: `
# Mode: Blog Post

The output is a blog post (600-1200 words). Structure:
- Open with a story, question, or concrete scene. Hook the reader before the headline's promise fades.
- Payoff in paragraph two — deliver the "why this matters" early.
- Middle develops the idea with concrete examples, not abstractions.
- Close with a takeaway the reader can use — not a summary.

Style targets:
- Headings/subheadings are OK if the post is over 700 words.
- Direct address ("you") is fine and often right.
- Links / quotes / code blocks welcome if the user provided them in the interview.
- No SEO filler ("in this article, we'll explore..." — just show, don't pre-announce).

## Golden Dataset Rules for This Mode

${getGoldenRule(8)}

---

${getGoldenRule(10)}

## Anti-Patterns to Avoid

${STYLE_REFERENCES.antiPatterns}
  `.trim(),
};
