declare module "*.md?raw" {
  const content: string;
  export default content;
}

// The minified legacy build (pdf.min.mjs) is required at runtime to avoid a
// webpack dev-mode load failure (see lib/fileImport.ts), but the package only
// ships a declaration for the non-minified pdf.mjs (pdf.d.mts). Re-export the
// root types so the .min.mjs subpath import is fully typed.
declare module "pdfjs-dist/legacy/build/pdf.min.mjs" {
  export * from "pdfjs-dist";
}
