import type { AttachedFile } from "./store";

/**
 * Combine the user's typed/dictated context with any attached files'
 * extracted content into a single string the interviewer + assembler
 * can consume.
 *
 * Each file's content is wrapped in a `--- From: filename ---` marker
 * so the model can attribute material to its source. Order: typed
 * context first, then files in attachment order.
 *
 * Used at every call-site that previously passed contextNotes directly:
 * - InterviewPanel.kickoff() / handleSubmit() — askNextQuestion's contextNotes arg
 * - app/page.tsx handleAssemble / handleRegenerate / handleRegenerateWithFeedback —
 *   detectWritingMode input
 *
 * Why split state instead of inlining into contextNotes:
 * - Renders chips above the textarea instead of raw text dumps
 * - Removing a chip is clean (delete by id) instead of a fragile
 *   string-replace operation on the textarea content
 * - User can edit typed context without worrying about clobbering
 *   uploaded file boundaries
 */
export function combineContext(
  typed: string,
  files: AttachedFile[]
): string {
  const trimmedTyped = typed.trim();
  if (files.length === 0) return trimmedTyped;

  const fileBlocks = files
    .map((f) => `--- From: ${f.name} ---\n\n${f.content.trim()}`)
    .join("\n\n");

  if (!trimmedTyped) return fileBlocks;
  return `${trimmedTyped}\n\n${fileBlocks}`;
}

/**
 * Format a byte count as a short display string (e.g. "12 KB", "1.2 MB").
 * Used by the chip display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
