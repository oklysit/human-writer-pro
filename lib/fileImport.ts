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
  // Use the LEGACY build path. The main build in pdfjs-dist 5.x uses
  // Uint8Array.prototype.toHex() which isn't available in all browser
  // runtimes (UAT 2026-04-15 surfaced "n.toHex is not a function" on
  // a real-world PDF). The legacy build targets older runtimes and
  // polyfills the missing methods. Also avoids the earlier Next.js 14
  // webpack wrapping failure (fixed 2026-04-15 by the explicit .mjs
  // subpath import — same approach, different sub-directory).
  let pdfjs: typeof import("pdfjs-dist");
  try {
    // Legacy subpath ships .d.mts types (pdf.d.mts) so no @ts-expect-error
    // needed. Runtime exports match the root entry exactly.
    pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as typeof import("pdfjs-dist");
  } catch (err) {
    throw new Error(
      `pdfjs-dist module load failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  const { getDocument, GlobalWorkerOptions } = pdfjs;

  // Worker is copied to /public/pdf.worker.min.mjs at install time so it
  // ships at same-origin (CSP script-src 'self' allows). The legacy worker
  // is used to match the legacy main build — worker/main version skew
  // will throw at getDocument time, so they must match.
  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const arrayBuffer = await file.arrayBuffer();
  let pdf: Awaited<ReturnType<typeof getDocument>["promise"]>;
  try {
    pdf = await getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error && err.stack ? `\nstack: ${err.stack}` : "";
    throw new Error(`pdfjs getDocument failed: ${msg}${stack}`);
  }

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
