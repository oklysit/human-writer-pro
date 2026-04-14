/**
 * Node-side AI-ism detection helper.
 *
 * Mirrors the logic in lib/ai-ism-detector.ts but reads markdown files
 * directly from disk using node:fs/promises rather than webpack ?raw imports.
 * This avoids the Next.js/webpack dependency in Node scripts.
 *
 * Do NOT import from lib/ai-ism-detector (it uses ?raw imports that won't
 * resolve in a plain tsx/Node context).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types (mirror lib/ai-ism-detector.ts)
// ---------------------------------------------------------------------------

export type AIIsmMatch = {
  pattern: string;
  position: number;
};

// ---------------------------------------------------------------------------
// Pattern extraction (copied from lib/ai-ism-detector.ts — do not modify lib)
// ---------------------------------------------------------------------------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegex(pattern: string): RegExp | null {
  const trimmed = pattern.trim();
  if (!trimmed) return null;
  const escaped = escapeRegex(trimmed);
  if (trimmed.includes(" ")) {
    return new RegExp(escaped, "gi");
  }
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

function extractBannedIsms(md: string): string[] {
  const results: string[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("-")) continue;
    let content = line.slice(1).trim();
    const parts = content.split(" / ");
    for (const part of parts) {
      let candidate = part.trim().replace(/^["']|["']$/g, "");
      candidate = candidate.replace(/\s*\(.*?\)$/, "").trim();
      if (candidate.length < 3 || candidate.length > 60) continue;
      if (/\b(is a|are a|will be|I am|I came|I'm|While I)\b/.test(candidate)) continue;
      results.push(candidate);
    }
  }
  return results;
}

function extractAntiPatterns(md: string): string[] {
  const results: string[] = [];
  let inWordSection = false;

  for (const raw of md.split("\n")) {
    const line = raw.trim();
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
    const tokens = content.split(/[,/]/);
    for (const tok of tokens) {
      let candidate = tok.trim();
      candidate = candidate.replace(/\s*\([^)]*\)$/, "").trim();
      candidate = candidate.replace(/^["']|["']$/g, "");
      if (candidate.length < 3 || candidate.length > 40) continue;
      if (/\b(not just|serves as|stands as|despite|on the one)\b/i.test(candidate)) continue;
      results.push(candidate);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Compiled pattern cache (lazy init per process)
// ---------------------------------------------------------------------------

type CompiledPattern = { pattern: string; regex: RegExp };

let _patterns: CompiledPattern[] | null = null;

/**
 * Load and compile AI-ism patterns from the reference markdown files.
 * Must be called once before detect(). Safe to call multiple times (no-op
 * after first load).
 */
export async function loadPatterns(refsDir?: string): Promise<void> {
  if (_patterns !== null) return;

  const dir =
    refsDir ??
    path.resolve(
      new URL(".", import.meta.url).pathname,
      "../../lib/prompts/references"
    );

  const [bannedIsms, antiPatterns] = await Promise.all([
    readFile(path.join(dir, "banned-ai-isms.md"), "utf8"),
    readFile(path.join(dir, "ai-anti-patterns.md"), "utf8"),
  ]);

  const rawPatterns = new Set<string>();
  for (const p of extractBannedIsms(bannedIsms)) rawPatterns.add(p.toLowerCase());
  for (const p of extractAntiPatterns(antiPatterns)) rawPatterns.add(p.toLowerCase());

  const compiled: CompiledPattern[] = [];
  rawPatterns.forEach((p) => {
    const regex = buildRegex(p);
    if (regex) compiled.push({ pattern: p, regex });
  });
  _patterns = compiled;
}

/**
 * Detect AI-ism patterns in `text`.
 * Requires loadPatterns() to have been called first.
 */
export function detect(text: string): AIIsmMatch[] {
  if (!text) return [];
  if (_patterns === null) {
    throw new Error("AI-ism patterns not loaded — call loadPatterns() first");
  }

  const matches: AIIsmMatch[] = [];
  for (const { pattern, regex } of _patterns) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ pattern, position: m.index });
    }
  }
  matches.sort((a, b) => a.position - b.position);
  return matches;
}
