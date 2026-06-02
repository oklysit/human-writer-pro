/**
 * Output-handling guardrail (OWASP LLM05 — Improper Output Handling).
 *
 * Model output is rendered through react-markdown, which escapes raw HTML by
 * default — so there is no XSS sink TODAY. That invariant is load-bearing: the
 * app stores the user's BYO Anthropic key in the browser, so any XSS sink would
 * become a credential-theft path. This test pins the invariant so a future
 * "rich formatting" change can't silently reopen it by (a) adding a raw-HTML
 * markdown plugin or (b) introducing dangerouslySetInnerHTML / innerHTML.
 *
 * See security review 2026-06-02 (Finding: output handling).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe("output handling — no raw-HTML XSS sink", () => {
  it("does not depend on a raw-HTML markdown plugin", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of ["rehype-raw", "remark-html"]) {
      expect(deps[banned]).toBeUndefined();
    }
  });

  it("renders no untrusted content via dangerouslySetInnerHTML / innerHTML", () => {
    const offenders: string[] = [];
    const dirs = [path.join(root, "components"), path.join(root, "app")];
    for (const dir of dirs) {
      for (const file of walk(dir)) {
        const src = readFileSync(file, "utf8");
        if (/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(src)) {
          offenders.push(path.relative(root, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
