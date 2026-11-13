import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe("no runtime dependency on Base44", () => {
  it("package.json has no Base44 packages", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter((d) => /base44/i.test(d))).toEqual([]);
  });

  it("application code never references Base44 SDKs, hosts or env vars", () => {
    const files = [...walk(join(root, "src")), join(root, "next.config.ts")].filter((f) => /\.(ts|tsx|js|mjs|css|json)$/.test(f));
    const offenders = files.filter((f) => /@base44|base44\.(app|com)|BASE44_|VITE_BASE44/i.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
