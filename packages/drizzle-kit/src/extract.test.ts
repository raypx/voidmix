import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { extract, readUpstream, upstreamDirectory } from "./extract.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = join(root, "fixtures/schema");
const upstream = upstreamDirectory(root);
let temporary: string;
let output: string;
let files: string[];

beforeAll(async () => {
  // Inside the package, so the extracted CLI resolves its dependencies like an install.
  await mkdir(join(root, "node_modules/.cache"), { recursive: true });
  temporary = await mkdtemp(join(root, "node_modules/.cache/extract-"));
  output = join(temporary, "dist");
  files = await extract(root, output);
});
afterAll(() => rm(temporary, { recursive: true, force: true }));

async function size(directory: string, names: string[]) {
  let total = 0;
  for (const name of names) total += (await stat(join(directory, name))).size;
  return total;
}

/** Runs `generate` and returns the SQL it wrote, without timestamped folder names. */
async function generate(bin: string): Promise<string[]> {
  const out = await mkdtemp(join(temporary, "out-"));
  execFileSync(process.execPath, [bin, "generate", "--config", "drizzle.config.ts"], {
    cwd: fixture,
    env: { ...process.env, DRIZZLE_OUT: out },
    stdio: "pipe",
  });
  const sql: string[] = [];
  for (const entry of await readdir(out, { recursive: true }))
    if (entry.endsWith(".sql")) sql.push(await readFile(join(out, entry), "utf8"));
  return sql;
}

describe("extracted drizzle-kit", () => {
  it("keeps the CLI, defineConfig and their declaration chunks only", () => {
    expect(files).toContain("bin.cjs");
    for (const entry of ["index.js", "index.mjs", "index.d.ts", "index.d.mts"])
      expect(files).toContain(entry);
    expect(files.filter((file) => /^(api|payload|cli)[-.]/.test(file))).toEqual([]);
    expect(files.every((file) => !file.endsWith(".d.ts") || !file.includes("/"))).toBe(true);
  });

  it("copies upstream bytes unchanged", async () => {
    const digest = async (file: string) =>
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
    for (const file of files)
      expect(await digest(join(output, file))).toBe(await digest(join(upstream, file)));
  });

  it("keeps the agent skills the CLI serves", async () => {
    const list = async (directory: string) =>
      (await readdir(directory, { recursive: true })).sort();
    expect(await list(join(output, "skills"))).toEqual(await list(join(upstream, "skills")));
    const help = execFileSync(process.execPath, [join(output, "bin.cjs"), "skills", "--help"], {
      cwd: fixture,
      encoding: "utf8",
    });
    expect(help).toContain("skills");
  });

  it("is a fraction of the upstream package", async () => {
    const all = (await readdir(upstream, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    expect(await size(output, files)).toBeLessThan((await size(upstream, all)) / 5);
  });

  it("mirrors upstream dependencies and binary name", async () => {
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      bin: Record<string, string>;
    };
    const kit = await readUpstream(upstream);
    expect(manifest.dependencies).toEqual(kit.dependencies);
    expect(Object.keys(manifest.bin)).toEqual(Object.keys(kit.bin));
    expect(manifest.devDependencies["drizzle-kit"]).toBe(kit.version);
    expect(manifest.devDependencies["drizzle-orm"]).toBe(kit.version);
  });

  it("generates the same migration as upstream", async () => {
    const slim = await generate(join(output, "bin.cjs"));
    expect(slim).toHaveLength(1);
    expect(slim[0]).toContain('CREATE TABLE "app"."users"');
    expect(slim).toEqual(await generate(join(upstream, "bin.cjs")));
  });

  it("reports the same versions as upstream", () => {
    const version = (directory: string) =>
      execFileSync(process.execPath, [join(directory, "bin.cjs"), "--version"], {
        cwd: fixture,
        encoding: "utf8",
      });
    expect(version(output)).toContain("drizzle-kit: v1.0.0");
    expect(version(output)).toBe(version(upstream));
  });
});
