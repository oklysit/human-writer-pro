import type { Mode } from "./store";

/**
 * Heuristic detection of writing mode from user-provided context.
 *
 * When the user drops a job posting into Context, this should route the
 * interviewer + assembler to cover-letter mode. When they paste an essay
 * prompt, an email they need to respond to, or general writing context,
 * this should route to a generic (non-CL) mode that doesn't impose the
 * killer-CL 5-section framework.
 *
 * Design: signal-based. A strong cover-letter signal wins; otherwise
 * specific genre signals (essay / email / blog); otherwise free-form.
 *
 * Users can override by typing an explicit trigger word in context
 * (e.g., "this is an essay", "cover letter for Acme") — those trigger
 * phrases are checked before the weaker signals.
 */

const CL_STRONG_SIGNALS = [
  "cover letter",
  "cover-letter",
  "coverletter",
  "hiring manager",
  "what you'll do",
  "what you will do",
  "we are looking for",
  "we're looking for",
  "qualifications:",
  "responsibilities:",
  "minimum qualifications",
  "preferred qualifications",
  "about the role",
  "about the position",
  "job posting",
  "job description",
];

const EMAIL_SIGNALS = [
  "respond to this email",
  "reply to this email",
  "reply to ",
  "email response",
  "responding to ",
  "this email",
  // "Regards,\n" and "Best,\n" as email-signature signals
  "\nregards,",
  "\nbest,",
  "\nthanks,",
  "\nsincerely,",
  // Direct mention of email genre
  "draft an email",
  "write an email",
];

const ESSAY_SIGNALS = [
  "write an essay",
  "essay on",
  "essay about",
  "word essay",
  "argumentative essay",
  "persuasive essay",
  "research paper",
  "rubric:",
  "assignment:",
  "thesis statement",
  "course:",
];

const BLOG_SIGNALS = [
  "blog post",
  "blog about",
  "substack",
  "medium post",
  "newsletter",
];

// Explicit override phrases — user types these to force a mode
const OVERRIDE_PATTERNS: Array<{ mode: Mode; signals: string[] }> = [
  { mode: "cover-letter", signals: ["this is a cover letter", "assemble as cl", "assemble as cover letter"] },
  { mode: "email", signals: ["this is an email", "assemble as email"] },
  { mode: "essay", signals: ["this is an essay", "assemble as essay"] },
  { mode: "blog", signals: ["this is a blog", "assemble as blog"] },
  { mode: "free-form", signals: ["this is free-form", "assemble as free-form", "free-form writing"] },
];

function contains(lower: string, signals: string[]): boolean {
  return signals.some((s) => lower.includes(s));
}

/**
 * Returns the detected mode based on context. Defaults to "free-form"
 * when no signal matches — i.e., generic writing without CL framework.
 */
export function detectWritingMode(contextNotes: string): Mode {
  if (!contextNotes || contextNotes.trim().length === 0) {
    // No context — default to free-form (generic-write regime). Avoids
    // the assumption that every session is a cover letter; CL routing
    // only fires when the context contains strong CL signals.
    return "free-form";
  }
  const lower = contextNotes.toLowerCase();

  // Explicit overrides win first
  for (const { mode, signals } of OVERRIDE_PATTERNS) {
    if (contains(lower, signals)) return mode;
  }

  // Strong CL signals next (job postings are the dominant use case)
  if (contains(lower, CL_STRONG_SIGNALS)) return "cover-letter";

  // Then specific non-CL genre signals
  if (contains(lower, EMAIL_SIGNALS)) return "email";
  if (contains(lower, ESSAY_SIGNALS)) return "essay";
  if (contains(lower, BLOG_SIGNALS)) return "blog";

  // Fall back to free-form — a non-CL generic assembly path that doesn't
  // impose the killer-CL framework or any other structural template.
  return "free-form";
}

/**
 * Classifies a mode into assembler prompt regime:
 *   "cl"      — uses the killer-CL framework SYSTEM_PROMPT in assemble.ts
 *   "generic" — uses GENERIC_WRITE_SYSTEM_PROMPT (heavy verbatim stitching,
 *               infer length/structure from context, no CL framework)
 */
export function assemblyRegime(mode: Mode): "cl" | "generic" {
  return mode === "cover-letter" ? "cl" : "generic";
}
