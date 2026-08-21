import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";
import { test } from "node:test";

import { installArguments, parseInstall } from "../../src/cli/index.mjs";
import { resolveBundleRoot } from "../../src/package/paths.mjs";

test("install parsing preserves scope, checker, and forwarding options", () => {
  const parsed = parseInstall([
    "--target",
    "example",
    "--scope",
    "project",
    "--tools",
    "codex,gemini",
    "--with-checkers",
    "--no-cross-install",
    "--dry-run",
    "--verbose",
  ]);
  assert.deepEqual(parsed, {
    target: "example",
    scope: "project",
    tools: "codex,gemini",
    checkers: true,
    noCrossInstall: true,
    dryRun: true,
    verbose: true,
  });
});

test("implicit user install omits project checkers", () => {
  const parsed = parseInstall([]);
  assert.ok(parsed);
  const windows = installArguments("C:\\bundle", parsed, "win32");
  const unix = installArguments("/bundle", parsed, "linux");
  assert.ok(windows.args.includes("-NoCheckers"));
  assert.ok(unix.args.includes("--no-checkers"));
});

test("project install includes checkers unless explicitly disabled", () => {
  const included = parseInstall(["--scope", "project"]);
  const excluded = parseInstall(["--scope", "project", "--no-checkers"]);
  assert.ok(included);
  assert.ok(excluded);
  assert.equal(
    installArguments("/bundle", included, "linux").args.includes(
      "--no-checkers",
    ),
    false,
  );
  assert.equal(
    installArguments("/bundle", excluded, "linux").args.includes(
      "--no-checkers",
    ),
    true,
  );
});

test("checker selection flags are mutually exclusive", () => {
  assert.throws(
    () => parseInstall(["--with-checkers", "--no-checkers"]),
    /cannot be combined/u,
  );
});

test("installer arguments forward verbose and cross-install controls", () => {
  const parsed = parseInstall([
    "--scope",
    "project",
    "--tools",
    "codex,gemini",
    "--with-checkers",
    "--no-cross-install",
    "--dry-run",
    "--verbose",
  ]);
  assert.ok(parsed);
  const windows = installArguments("C:\\bundle", parsed, "win32").args;
  const unix = installArguments("/bundle", parsed, "linux").args;
  assert.ok(windows.includes("-v"));
  assert.ok(windows.includes("-NoCrossInstall"));
  assert.ok(windows.includes("-DryRun"));
  assert.ok(unix.includes("--verbose"));
  assert.ok(unix.includes("--no-cross-install"));
  assert.ok(unix.includes("--dry-run"));
  assert.equal(windows.includes("-NoCheckers"), false);
  assert.equal(unix.includes("--no-checkers"), false);
});

test("bundle-root override is resolved and validated", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "sarathi-bundle-root-"));
  assert.equal(await resolveBundleRoot(directory), directory);
  await assert.rejects(
    resolveBundleRoot(resolve(directory, "missing")),
    /bundle root does not exist/u,
  );
  assert.equal(await resolveBundleRoot("~"), resolve(homedir()));
});
