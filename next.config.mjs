/** @type {import('next').NextConfig} */

// CSP directives for production + dev.
//
// TRADE-OFFS (document here so future sessions don't "fix" these):
//
// 1. 'unsafe-inline' + 'unsafe-eval' on script-src are REQUIRED for Next.js 14.
//    Next.js injects inline hydration scripts and uses eval() in dev mode.
//    Removing these breaks the app entirely. Mitigation path: wire per-request
//    nonces via middleware + NEXT_CSP_NONCE env var (v2 concern, not MVP).
//
// 2. 'unsafe-inline' on style-src: Radix UI (shadcn) sets inline styles at
//    runtime. Same nonce path would tighten this. Acceptable for MVP.
//
// 3. microphone=(self) in Permissions-Policy: required for Task 14 voice input.
//    camera and geolocation are explicitly denied.
//
// 4. GPTZero in connect-src: used only by scripts/eval/ tooling today, but
//    included so the policy works if eval results surface in the UI later.
//
// 5. HSTS is intentionally absent — Vercel injects it at the hosting layer.
export const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com https://api.gptzero.me",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          // Belt-and-suspenders with CSP frame-ancestors above.
          { key: "X-Frame-Options", value: "DENY" },
          // Prevents MIME-type sniffing attacks.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send origin only on same-origin, send nothing on downgrade.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // microphone=(self): Task 14 voice input requires it.
          // camera + geolocation explicitly denied.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          // Allow DNS prefetch for performance.
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.module.rules.push({
      resourceQuery: /raw/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
