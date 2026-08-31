import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const NPM_CLI =
  process.env.npm_execpath ??
  resolve(
    dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js",
  );

interface PackEntry {
  filename: string;
  files: { path: string }[];
}

interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function run(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    env: options.env ?? process.env,
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  };
}

function parsePack(output: string): PackEntry {
  const parsed: unknown = JSON.parse(output);
  assert.ok(Array.isArray(parsed));
  assert.equal(parsed.length, 1);
  return parsed[0] as PackEntry;
}

function npm(args: string[], options: { cwd?: string } = {}): CommandResult {
  return run(process.execPath, [NPM_CLI, ...args], options);
}

test("assembly is deterministic and contains the complete runtime layout", async () => {
  const required = [
    "bundle/docs/enduring-model.md",
    "bundle/prompts/code-create.prompt.md",
    "bundle/skills/sarathi/SKILL.md",
    "bundle/skills/sarathi/scripts/check_update.mjs",
    "bundle/scripts/install.ps1",
    "bundle/scripts/install.sh",
    "bundle/scripts/check_update.mjs",
    "bundle/checkers/check_spec.mjs",
    "bundle/checkers/lib/checker-common.mjs",
    "bundle/checkers/status/cli.mjs",
    "bundle/checkers/render_workflow_status.mjs",
    "bundle/manifest.json",
  ];
  for (const path of required) await access(resolve(ROOT, path));

  const before = await readFile(resolve(ROOT, "bundle/manifest.json"), "utf8");
  await import(
    `${pathToFileURL(resolve(ROOT, "dist", "package", "assemble.mjs")).href}?distribution-test`
  );
  assert.equal(
    await readFile(resolve(ROOT, "bundle/manifest.json"), "utf8"),
    before,
  );
});

test("packed package has an allowlisted, Python-free, dependency-free runtime", async () => {
  const dryRun = npm(["pack", "--dry-run", "--json", "--ignore-scripts"]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const preview = parsePack(dryRun.stdout);
  const paths = preview.files.map((file) => file.path).sort();
  assert.ok(paths.includes("dist/cli/index.mjs"));
  assert.ok(paths.includes("bundle/checkers/check_spec.mjs"));
  assert.ok(paths.includes("bundle/checkers/render_workflow_status.mjs"));
  assert.ok(paths.includes("bundle/skills/sarathi/scripts/check_update.mjs"));
  assert.equal(
    paths.some((path) => path.endsWith(".py")),
    false,
  );
  assert.equal(
    paths.some((path) => path.startsWith("bundle/docs/research/")),
    false,
  );
  assert.equal(
    paths.some((path) => path.includes("assemble")),
    false,
  );
  for (const path of paths)
    assert.match(
      path,
      /^(?:CHANGELOG\.md|LICENSE|README\.md|package\.json|bundle\/|dist\/cli\/|dist\/package\/paths\.mjs$|dist\/update\/)/u,
    );

  const packageJson = JSON.parse(
    await readFile(resolve(ROOT, "package.json"), "utf8"),
  ) as Record<string, unknown>;
  assert.equal(packageJson.private, false);
  assert.deepEqual(packageJson.dependencies ?? {}, {});

  const scratch = await mkdtemp(resolve(tmpdir(), "sarathi-pack-"));
  const archiveDirectory = resolve(scratch, "archive");
  const application = resolve(scratch, "application");
  await mkdir(archiveDirectory, { recursive: true });
  await mkdir(application, { recursive: true });
  const packed = npm([
    "pack",
    "--json",
    "--ignore-scripts",
    "--pack-destination",
    archiveDirectory,
  ]);
  assert.equal(packed.status, 0, packed.stderr);
  const archive = resolve(archiveDirectory, parsePack(packed.stdout).filename);
  await writeFile(
    resolve(application, "package.json"),
    '{"name":"sarathi-package-smoke","private":true}',
    "utf8",
  );
  const installed = npm(
    [
      "install",
      "--ignore-scripts",
      "--offline",
      "--no-audit",
      "--no-fund",
      archive,
    ],
    { cwd: application },
  );
  assert.equal(installed.status, 0, installed.stderr);

  const packageRoot = resolve(application, "node_modules", "sarathi-sdlc");
  const cli = resolve(packageRoot, "dist", "cli", "index.mjs");
  const version = run(process.execPath, [cli, "--version"], {
    cwd: application,
  });
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), String(packageJson.version));
  const nestedVersion = run(process.execPath, [cli, "install", "--version"], {
    cwd: application,
  });
  assert.equal(nestedVersion.status, 0, nestedVersion.stderr);
  assert.equal(nestedVersion.stdout.trim(), String(packageJson.version));

  const cache = resolve(scratch, "update.json");
  const updateEnvironment = {
    ...process.env,
    SARATHI_UPDATE_CACHE: cache,
    SARATHI_UPDATE_CHECK: "0",
  };
  const update = run(process.execPath, [cli, "check-update"], {
    cwd: application,
    env: updateEnvironment,
  });
  assert.equal(update.status, 0, update.stderr);
  assert.equal(update.stdout.trim(), "Sarathi SDLC update status unavailable.");

  const installTarget = resolve(scratch, "cli-install-target");
  await mkdir(installTarget, { recursive: true });
  const install = run(
    process.execPath,
    [
      cli,
      "install",
      "--target",
      installTarget,
      "--scope",
      "project",
      "--tools",
      "codex",
      "--no-cross-install",
      "--dry-run",
    ],
    { cwd: application },
  );
  assert.equal(install.status, 0, install.stderr);

  const invalidSpec = resolve(application, "invalid-spec.md");
  await writeFile(invalidSpec, "# Incomplete\n", "utf8");
  const checker = run(
    process.execPath,
    [cli, "check", "spec", invalidSpec, "--json"],
    { cwd: application },
  );
  assert.equal(checker.status, 1, checker.stderr);
  const report: unknown = JSON.parse(checker.stdout);
  assert.ok(report && typeof report === "object");
  assert.equal(Number(Reflect.get(report, "total")) > 0, true);

  const invalidSlice = run(
    process.execPath,
    [cli, "check", "slice", invalidSpec, "--json"],
    { cwd: application },
  );
  assert.equal(invalidSlice.status, 1, invalidSlice.stderr);
  const sliceReport: unknown = JSON.parse(invalidSlice.stdout);
  assert.equal(Reflect.get(sliceReport as object, "mode"), "slice");

  for (const [stage, args] of [
    ["design", [invalidSpec, "--component"]],
    ["plan", [invalidSpec]],
    [
      "code",
      [
        "--plan",
        invalidSpec,
        "--tests-argv",
        '["node","-e","process.exit(0)"]',
      ],
    ],
  ] as const) {
    const delegated = run(
      process.execPath,
      [cli, "check", stage, ...args, "--json"],
      { cwd: application },
    );
    const directChecker = run(
      process.execPath,
      [
        resolve(packageRoot, "bundle", "checkers", `check_${stage}.mjs`),
        ...args,
        "--json",
      ],
      { cwd: application },
    );
    assert.equal(delegated.status, directChecker.status, delegated.stderr);
    const delegatedReport: unknown = JSON.parse(delegated.stdout);
    assert.ok(delegatedReport && typeof delegatedReport === "object");
    assert.equal(Number(Reflect.get(delegatedReport, "total")) > 0, true);
    assert.deepEqual(delegatedReport, JSON.parse(directChecker.stdout));
  }

  const status = run(process.execPath, [cli, "status", application], {
    cwd: application,
  });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Status:/u);
  const statusWrite = run(
    process.execPath,
    [cli, "status", application, "--write"],
    { cwd: application },
  );
  assert.equal(statusWrite.status, 0, statusWrite.stderr);
  await access(resolve(application, "docs", "sdlc-status.html"));
  const statusCheck = run(
    process.execPath,
    [cli, "status", application, "--check"],
    { cwd: application },
  );
  assert.equal(statusCheck.status, 0, statusCheck.stderr);

  const pathWithoutNpx = (process.env.PATH ?? "")
    .split(delimiter)
    .filter((entry) => !entry.toLowerCase().includes("npm"))
    .join(delimiter);
  const direct = run(process.execPath, [cli, "--version"], {
    cwd: application,
    env: { ...process.env, PATH: pathWithoutNpx },
  });
  assert.equal(direct.status, 0, direct.stderr);
  await rm(scratch, { recursive: true, force: true });
});
