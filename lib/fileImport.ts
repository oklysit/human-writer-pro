"use client";

/**
 * Browser-side file-to-text extraction for the Context panel.
 *
 * Supported types:
 *   - .md, .txt      → FileReader.text()
 *   - .pdf           → pdfjs-dist, page-by-page getTextContent
 *   - .docx          → mammoth.extractRawText
 *
 * The extracted text is appended to `contextNotes` in the store and reaches
 * ONLY the interview stage. Never reaches the assembly call — the strip
 * discipline at lib/assemble.ts stays intact.
 *
 * pdfjs worker: resolved via `import.meta.url` so Next.js bundles the
 * worker asset. If the bundler can't resolve it, the fallback is a CDN
 * URL pinned to the installed pdfjs-dist version.
 */

// mammoth + pdfjs-dist are both dynamic-imported inside their extractors
// so they stay out of the main bundle until someone actually uploads a
// .docx or .pdf.

// Match file.name.toLowerCase()
const SUPPORTED = [".md", ".txt", ".pdf", ".docx"] as const;

export type SupportedExtension = (typeof SUPPORTED)[number];

export class UnsupportedFileTypeError extends Error {
  constructor(fileName: string) {
    super(`Unsupported file type: ${fileName}. Supported: ${SUPPORTED.join(", ")}`);
    this.name = "UnsupportedFileTypeError";
  }
}

export function isSupported(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED.some((ext) => lower.endsWith(ext));
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".txt")) {
    return (await file.text()).trim();
  }
  if (name.endsWith(".pdf")) {
    return await extractPdfText(file);
  }
  if (name.endsWith(".docx")) {
    return await extractDocxText(file);
  }
  throw new UnsupportedFileTypeError(file.name);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is copied to /public/pdf.worker.min.mjs at install time so it
  // ships at same-origin (CSP script-src 'self' allows). Keeping it as a
  // public asset avoids bundler-resolution edge cases with `import.meta.url`
  // under Next.js 14 webpack. If pdfjs-dist is upgraded, re-copy the worker:
  //   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: unknown) => {
        if (typeof item === "object" && item !== null && "str" in item) {
          return (item as { str: string }).str;
        }
        return "";
      })
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}
