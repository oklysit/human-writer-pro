/**
 * AI-ism Detector
 *
 * Parses the two banned-pattern reference files at module load time and compiles
 * a set of case-insensitive word-boundary regexes. `detect(text)` returns every
 * match with its character-offset position.
 *
 * Inline highlight trade-off (Part C): inline highlights inside the ReactMarkdown
 * prose are deferred. Wrapping matched substrings requires a custom `components.p`
 * renderer that splits text nodes — complex with react-markdown's virtual DOM.
 * The DiagnosticPills panel already surfaces matches with positions, which is
 * sufficient for v1. Defer inline highlights to a future task.
 */

import { STYLE_REFERENCES } from "@/lib/prompts/references/index";
// Re-export the type so consumers can import from one place.
export type { AIIsmMatch } from "@/components/diagnostic-pills";

import type { AIIsmMatch } from "@/components/diagnostic-pills";

// ---------------------------------------------------------------------------
// Pattern extraction
// ---------------------------------------------------------------------------

/**
 * Escape special regex characters in a literal string.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a regex for a pattern string.
 * - Single words or hyphenated words: use `\b...\b`.
 * - Phrases (contain a space): escape and match as-is, case-insensitively.
 *   We skip `\b` anchors for phrases because word boundaries don't behave
 *   predictably around multi-word sequences with internal spaces.
 */
function buildRegex(pattern: string): RegExp | null {
  const trimmed = pattern.trim();
  if (!trimmed) return null;
  const escaped = escapeRegex(trimmed);
  if (trimmed.includes(" ")) {
    return new RegExp(escaped, "gi");
  }
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

/**
 * Extract word/phrase patterns from `banned-ai-isms.md`.
 *
 * Format includes lines like:
 *   - "stark reminder"
 *   - "delve"
 *   - "pivotal"
 *   - "synergy" / "unlock"    ← slash-separated alternatives
 *
 * We skip entries that are clearly sentence templates (length > 60 chars after cleaning).
 */
function extractBannedIsms(md: string): string[] {
  const results: string[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("-")) continue;

    // Strip the leading "- " and any surrounding quotes, then split on " / "
    let content = line.slice(1).trim();
    // Remove markdown-style quoted wrapping `"..."` or `'...'`
    const parts = content.split(" / ");
    for (const part of parts) {
      let candidate = part.trim().replace(/^["']|["']$/g, "");
      // Also handle: "stark reminder" / "one thing remains clear" — strip trailing note text
      // e.g. " (Prompt Bleed - ...)" → drop parens
      candidate = candidate.replace(/\s*\(.*?\)$/, "").trim();
      // Skip if too short (< 3 chars) or too long (> 60 chars) — likely prose, not pattern
      if (candidate.length < 3 || candidate.length > 60) continue;
      // Skip lines that look like full sentences (contains verb markers like "is a" mid-text)
      if (/\b(is a|are a|will be|I am|I came|I'm|While I)\b/.test(candidate)) continue;
      results.push(candidate);
    }
  }
  return results;
}

/**
 * Extract word/phrase patterns from `ai-anti-patterns.md`.
 *
 * The file has sections like:
 *   ### High-Frequency AI Words (strongest tells)
 *   - delve, tapestry (abstract), landscape (abstract), intricate/intricacies
 *   - meticulous/meticulously, pivotal, crucial, vital
 *
 * We extract list items, split on commas and slashes, clean parens, and keep
 * only word-length patterns (skip multi-sentence structural patterns).
 */
function extractAntiPatterns(md: string): string[] {
  const results: string[] = [];
  let inWordSection = false;

  for (const raw of md.split("\n")) {
    const line = raw.trim();

    // Track which section we're in. Only extract from word-list sections.
    if (line.startsWith("##")) {
      inWordSection =
        /Banned Vocabulary|High-Frequency|Mid-Risk|Banned Transitional/i.test(line);
      continue;
    }
    if (line.startsWith("#")) {
      inWordSection = false;
      continue;
    }

    if (!inWordSection) continue;
    if (!line.startsWith("-")) continue;

    const content = line.slice(1).trim();
    // Split on commas and slashes to get individual tokens
    const tokens = content.split(/[,/]/);
    for (const tok of tokens) {
      let candidate = tok.trim();
      // Strip parenthetical qualifiers like "(abstract)", "(verb)", "(metaphorical)"
      candidate = candidate.replace(/\s*\([^)]*\)$/, "").trim();
      // Strip leading/trailing quotes
      candidate = candidate.replace(/^["']|["']$/g, "");
      // Skip too short or too long
      if (candidate.length < 3 || candidate.length > 40) continue;
      // Skip lines that look like structural patterns (contain "not just", "serves as", etc.)
      if (/\b(not just|serves as|stands as|despite|on the one)\b/i.test(candidate)) continue;
      results.push(candidate);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Module-level compiled patterns (built once on first import)
// ---------------------------------------------------------------------------

type CompiledPattern = {
  pattern: string; // canonical lowercase form for output
  regex: RegExp;
};

function buildPatternList(): CompiledPattern[] {
  const rawPatterns = new Set<string>();

  for (const p of extractBannedIsms(STYLE_REFERENCES.bannedIsms)) {
    rawPatterns.add(p.toLowerCase());
  }
  for (const p of extractAntiPatterns(STYLE_REFERENCES.antiPatterns)) {
    rawPatterns.add(p.toLowerCase());
  }

  const compiled: CompiledPattern[] = [];
  rawPatterns.forEach((p) => {
    const regex = buildRegex(p);
    if (regex) {
      compiled.push({ pattern: p, regex });
    }
  });
  return compiled;
}

// Lazy-initialised so tests can import the module without side-effects at require time.
let _patterns: CompiledPattern[] | null = null;

function getPatterns(): CompiledPattern[] {
  if (_patterns === null) {
    _patterns = buildPatternList();
  }
  return _patterns;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect AI-ism patterns in `text`.
 *
 * Returns an array of `{ pattern, position }` objects — one entry per match
 * occurrence. The same pattern may appear multiple times if it occurs multiple
 * times in the text. `position` is the zero-based character offset of the
 * start of the match.
 */
export function detect(text: string): AIIsmMatch[] {
  if (!text) return [];

  const matches: AIIsmMatch[] = [];
  const patterns = getPatterns();

  for (const { pattern, regex } of patterns) {
    // Reset lastIndex since the regexes are compiled with /g flag (stateful).
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ pattern, position: m.index });
    }
  }

  // Sort by position for deterministic output
  matches.sort((a, b) => a.position - b.position);
  return matches;
}
