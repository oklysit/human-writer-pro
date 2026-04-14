/**
 * Smoke-tests the CSP string exported from next.config.mjs.
 *
 * We import `cspHeader` directly (named export) so this stays a pure
 * string-manipulation test — no Next.js runtime needed, no HTTP server.
 */
import { describe, it, expect } from "vitest";
import { cspHeader } from "../next.config.mjs";

describe("CSP header string", () => {
  it("includes Anthropic API in connect-src", () => {
    expect(cspHeader).toContain("connect-src");
    expect(cspHeader).toContain("https://api.anthropic.com");
  });

  it("includes GPTZero in connect-src", () => {
    expect(cspHeader).toContain("https://api.gptzero.me");
  });

  it("locks frame-ancestors to none (clickjacking prevention)", () => {
    expect(cspHeader).toContain("frame-ancestors 'none'");
  });

  it("blocks object-src (no Flash / embedded objects)", () => {
    expect(cspHeader).toContain("object-src 'none'");
  });

  it("restricts base-uri to self", () => {
    expect(cspHeader).toContain("base-uri 'self'");
  });

  it("allows Google Fonts stylesheets", () => {
    expect(cspHeader).toContain("https://fonts.googleapis.com");
  });

  it("allows Google Fonts static assets", () => {
    expect(cspHeader).toContain("https://fonts.gstatic.com");
  });

  it("is a semicolon-separated single-line string", () => {
    // Must not contain raw newlines — headers cannot span lines.
    expect(cspHeader).not.toContain("\n");
  });
});
