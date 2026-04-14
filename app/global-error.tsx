"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps): JSX.Element {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          padding: "2rem",
          backgroundColor: "#FAFAF7",
          color: "#171717",
          fontFamily: "Georgia, serif",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Something broke.
        </h1>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "1rem",
            lineHeight: 1.7,
            maxWidth: "28rem",
            textAlign: "center",
            color: "#404040",
            margin: 0,
          }}
        >
          A critical error occurred. You can retry below, or reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: "1px solid #171717",
            background: "#A16207",
            color: "#FFFFFF",
            padding: "0.5rem 1.5rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
