import { describe, it, expect } from "vitest";
import { crc32, makeZip } from "../lib/zip";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("zip writer", () => {
  it("crc32 matches the standard check value", () => { expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926); });
  it("produces a zip that the system unzip accepts, with intact contents (incl. unicode)", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "zip-"));
    const files = [{ name: "a.md", content: "# Hello\nlíne 2 — ✓" }, { name: "dir-b.json", content: JSON.stringify({ x: 1 }) }];
    const f = path.join(dir, "t.zip"); writeFileSync(f, makeZip(files));
    expect(() => execFileSync("unzip", ["-tq", f])).not.toThrow();
    for (const x of files) expect(execFileSync("unzip", ["-p", f, x.name]).toString("utf8")).toBe(x.content);
    expect(readFileSync(f).subarray(0, 4).toString("hex")).toBe("504b0304");
  });
});
