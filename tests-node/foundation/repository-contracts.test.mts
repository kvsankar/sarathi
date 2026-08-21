import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd());

async function text(path: string): Promise<string> {
  return await readFile(resolve(root, path), "utf8");
}

test("always-loaded instructions and command prompts stay within budgets", async () => {
  const limits = new Map<string, [number, number]>([
    ["AGENTS.md", [100, 5_000]],
    ["skills/sarathi/SKILL.md", [165, 9_000]],
  ]);
  for (const [path, [lineLimit, byteLimit]] of limits) {
    const value = await text(path);
    assert.ok(value.split(/\r?\n/u).length - 1 <= lineLimit, path);
    assert.ok(Buffer.byteLength(value) <= byteLimit, path);
  }

  const promptLimits: Record<string, [number, number]> = {
    create: [120, 7_500],
    assess: [80, 5_000],
    review: [80, 5_000],
    verify: [120, 6_000],
    status: [80, 5_000],
  };
  for (const name of await readdir(resolve(root, "prompts"))) {
    if (!name.endsWith(".prompt.md")) continue;
    const value = await text(`prompts/${name}`);
    const command = name.replace(/\.prompt\.md$/u, "");
    const kind =
      command === "workflow-status"
        ? "status"
        : (command.split("-").at(-1) ?? "");
    const [lineLimit, byteLimit] = promptLimits[kind] ?? [0, 0];
    assert.ok(value.split(/\r?\n/u).length - 1 <= lineLimit, name);
    assert.ok(Buffer.byteLength(value) <= byteLimit, name);
  }
});

test("skill and prompt metadata are valid", async () => {
  const skill = await text("skills/sarathi/SKILL.md");
  const frontmatter = /^---\n(?<body>[\s\S]*?)\n---/u.exec(skill)?.groups?.body;
  assert.ok(frontmatter);
  const fields = Object.fromEntries(
    frontmatter
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const separator = line.indexOf(":");
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim(),
        ];
      }),
  );
  assert.match(fields.name ?? "", /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
  assert.ok((fields.description ?? "").length > 0);

  for (const name of await readdir(resolve(root, "prompts"))) {
    if (!name.endsWith(".prompt.md")) continue;
    const value = await text(`prompts/${name}`);
    const block =
      /^---\n(?<body>[\s\S]*?)\n---/u.exec(value)?.groups?.body ?? "";
    assert.match(block, /^description:\s*\S/mu, name);
    assert.match(block, /^agent:\s*\S/mu, name);
    assert.ok(value.slice(value.indexOf("---", 3) + 3).trim(), name);
  }

  const openai = await text("skills/sarathi/agents/openai.yaml");
  assert.match(openai, /^\s*allow_implicit_invocation:\s*true\s*$/mu);
});

test("documented local Markdown references resolve", async () => {
  const sources = ["AGENTS.md", "README.md", "skills/sarathi/SKILL.md"];
  for (const directory of ["docs", "prompts"]) {
    for (const name of await readdir(resolve(root, directory)))
      if (name.endsWith(".md")) sources.push(`${directory}/${name}`);
  }
  const missing: string[] = [];
  for (const source of sources) {
    const value = await text(source);
    for (const match of value.matchAll(/\]\((?<target>[^)]+)\)/gu)) {
      const raw = match.groups?.target?.trim().replace(/^<|>$/gu, "") ?? "";
      const target = raw.split("#", 1)[0] ?? "";
      if (!target || target.includes("://") || target.startsWith("mailto:"))
        continue;
      if (!target.endsWith(".md")) continue;
      try {
        await stat(resolve(root, dirname(source), target));
      } catch {
        missing.push(`${source}: ${raw}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("skill manifest and source layout match the npm package", async () => {
  const packageMetadata = JSON.parse(await text("package.json")) as Record<
    string,
    unknown
  >;
  const manifest = JSON.parse(
    await text("skills/sarathi/manifest.json"),
  ) as Record<string, unknown>;
  assert.deepEqual(manifest, {
    distribution: packageMetadata.name,
    schema_version: 1,
    update_url: `https://registry.npmjs.org/${String(packageMetadata.name)}/latest`,
    version: packageMetadata.version,
  });
  assert.deepEqual((await readdir(resolve(root, "skills/sarathi"))).sort(), [
    "SKILL.md",
    "agents",
    "manifest.json",
  ]);
  assert.ok((await text(".gitignore")).split(/\r?\n/u).includes(".sdlc/"));
  await stat(resolve(root, "src/update/check-update.mts"));
});
