import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import { verifyRelease } from "../../src/package/verify-release.mjs";

const npmCli =
  process.env.npm_execpath ??
  resolve(
    dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js",
  );

test("release metadata matches the npm package version", async () => {
  const metadata = JSON.parse(
    await readFile(resolve("package.json"), "utf8"),
  ) as { version: string };
  assert.equal(
    await verifyRelease(`v${metadata.version}`, resolve()),
    `Release metadata matches v${metadata.version}.`,
  );
  await assert.rejects(verifyRelease("v0.0.0", resolve()), /does not match/u);
});

test("GitHub Release waits for provenance-backed npm publication", async () => {
  const workflow = await readFile(
    resolve(".github/workflows/release.yml"),
    "utf8",
  );
  const publish = workflow.indexOf("  publish:");
  const release = workflow.indexOf("  github-release:");
  assert.ok(publish >= 0 && release > publish);
  assert.match(workflow.slice(release), /^\s*needs:\s*publish\s*$/mu);
  assert.match(
    workflow,
    /npm publish artifacts\/\*\.tgz --access public --provenance/u,
  );
  assert.match(workflow, /id-token:\s*write/u);
  assert.match(workflow.slice(release), /artifacts\/\*\.tgz/u);
});

test("release preparation creates a clean artifact directory before packing", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "sarathi-release-pack-"));
  const artifacts = join(temporary, "artifacts");
  try {
    await mkdir(artifacts);
    const result = spawnSync(
      process.execPath,
      [npmCli, "pack", "--json", "--pack-destination", artifacts],
      { cwd: resolve(), encoding: "utf8" },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      (await readdir(artifacts)).some((name) => name.endsWith(".tgz")),
      true,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
