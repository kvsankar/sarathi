import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  checkCode,
  splitLegacyCommand,
} from "../../src/checkers/check_code.mjs";

function withoutFlag(args: string[], flag: string): string[] {
  const result = [...args];
  const index = result.indexOf(flag);
  if (index >= 0) result.splice(index, 2);
  return result;
}

async function fixture(): Promise<{ root: string; args: string[] }> {
  const root = await mkdtemp(resolve(".node-code-test-"));
  const tests = resolve(root, "tests"),
    src = resolve(root, "src");
  await mkdir(tests);
  await mkdir(src);
  await writeFile(resolve(root, "plan.md"), "- PR-AUTH-SIGNIN\n");
  await writeFile(resolve(root, "design.md"), "");
  await writeFile(resolve(tests, "test_auth.js"), "export const ok = true;\n");
  await writeFile(resolve(src, "app.js"), "export const ok = true;\n");
  return {
    root,
    args: [
      "--plan",
      resolve(root, "plan.md"),
      "--design",
      resolve(root, "design.md"),
      "--tests-dir",
      tests,
      "--src",
      src,
      "--tests-argv",
      JSON.stringify([process.execPath, "-e", "process.exit(0)"]),
      "--json",
    ],
  };
}

test("check code records a passing verification command", async () => {
  const files = await fixture();
  try {
    let result;
    try {
      result = await checkCode(files.args, files.root);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      // The managed Windows sandbox can deny child creation from node:test.
      // CI and unsandboxed runs still exercise the real argv subprocess above.
      result = await checkCode(files.args, files.root, () => 0);
    }
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.verification_command_passed, true);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code fails when the verification command fails", async () => {
  const files = await fixture();
  try {
    const args = [...files.args];
    args[args.indexOf("--tests-argv") + 1] = JSON.stringify([
      process.execPath,
      "-e",
      "process.exit(3)",
    ]);
    const result = await checkCode(args, files.root, () => 3);
    assert.equal(result.exitCode, 1);
    assert.equal(result.report.verification_command_exit, 3);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code scans a supplied directory recursively", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "src", "bad.js"),
      "// FR-AUTH-SIGNIN\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.equal(result.exitCode, 1);
    assert.equal((result.report.process_id_hits as unknown[]).length, 1);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code collects markers only as private review context", async () => {
  const files = await fixture();
  try {
    await writeFile(resolve(files.root, "src", "app.js"), "// TODO simplify\n");
    const result = await checkCode(
      [...files.args, "--review-context"],
      files.root,
      () => 0,
    );
    const context = result.report.review_context as {
      marker_candidates: Array<{ marker: string }>;
    };
    assert.equal(context.marker_candidates[0]?.marker, "TODO");
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code rejects invalid workflow state", async () => {
  const files = await fixture();
  try {
    await mkdir(resolve(files.root, ".sdlc"));
    await writeFile(
      resolve(files.root, ".sdlc", "wip.md"),
      "Current Command: coding\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.equal(
      (result.report.gates as Record<string, boolean>).workflow_state_valid,
      false,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code requires plan approval only when requested", async () => {
  const files = await fixture();
  try {
    let result = await checkCode(
      [...files.args, "--require-approvals"],
      files.root,
      () => 0,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      false,
    );
    await mkdir(resolve(files.root, ".sdlc"));
    const plan = resolve(files.root, "plan.md");
    const hash = createHash("sha256")
      .update(await readFile(plan))
      .digest("hex");
    await writeFile(
      resolve(files.root, ".sdlc", "approvals.yaml"),
      `version: 1\napprovals:\n  - id: APR-PLAN\n    gate: plan.approved\n    scope: slice/change\n    artifact:\n      kind: plan\n      path: plan.md\n      sha256: ${hash}\n    status: approved\n    approved_by: Test User\n    approved_at: 2026-07-01T12:00:00Z\n`,
    );
    result = await checkCode(
      [...files.args, "--require-approvals"],
      files.root,
      () => 0,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code omits marker candidates from verification report", async () => {
  const files = await fixture();
  try {
    await writeFile(resolve(files.root, "src", "app.js"), "// TODO simplify\n");
    const result = await checkCode(files.args, files.root, () => 0);
    assert.equal("review_context" in result.report, false);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code collects skips for private review context", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "tests", "test_auth.js"),
      "test.skip('a',()=>{});\ntest.skipif(true);\nxfail();\n",
    );
    const result = await checkCode(
      [...files.args, "--review-context"],
      files.root,
      () => 0,
    );
    const hits = (
      result.report.review_context as {
        test_skip_candidates: Array<{ marker: string }>;
      }
    ).test_skip_candidates;
    assert.deepEqual(
      new Set(hits.map(({ marker }) => marker)),
      new Set(["SKIP", "SKIPIF", "XFAIL"]),
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code allows an ordinary production skip method", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "src", "app.js"),
      "queue.skip(item);\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.equal(result.exitCode, 0);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code rejects process ids in source and tests", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "src", "app.js"),
      "// FR-AUTH-SIGNIN\n",
    );
    await writeFile(
      resolve(files.root, "tests", "test_auth.js"),
      "// TEST-AUTH-POLICY\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.deepEqual(
      (result.report.process_id_hits as Array<{ identifier: string }>).map(
        ({ identifier }) => identifier,
      ),
      ["FR-AUTH-SIGNIN", "TEST-AUTH-POLICY"],
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code detects only canonical process ids", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "src", "app.js"),
      "// FR-AUTH-SIGNIN FR-AUTH-1 fr-auth-signin\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.deepEqual(
      (result.report.process_id_hits as Array<{ identifier: string }>).map(
        ({ identifier }) => identifier,
      ),
      ["FR-AUTH-SIGNIN"],
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code accepts behavioral test names without process ids", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "tests", "test_auth.js"),
      "test('allows valid users to sign in',()=>{});\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.equal(result.exitCode, 0);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code can exclude an explicit generated traceability artifact", async () => {
  const files = await fixture();
  try {
    const generated = resolve(files.root, "src", "trace.js");
    await writeFile(generated, "// FR-AUTH-SIGNIN\n");
    const result = await checkCode(
      [...files.args, "--generated-traceability-path", generated],
      files.root,
      () => 0,
    );
    assert.deepEqual(result.report.process_id_hits, []);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code scans common non python source by default", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "src", "app.ts"),
      "// FR-AUTH-SIGNIN\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.equal((result.report.process_id_hits as unknown[]).length, 1);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code scans a supplied test file", async () => {
  const files = await fixture();
  try {
    const testFile = resolve(files.root, "tests", "test_auth.js");
    await writeFile(testFile, "// FR-AUTH-SIGNIN\n");
    const args = withoutFlag(files.args, "--tests-dir");
    args.splice(args.indexOf("--src"), 0, "--tests-dir", testFile);
    const result = await checkCode(args, files.root, () => 0);
    assert.equal((result.report.process_id_hits as unknown[]).length, 1);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code scans all repeated inputs", async () => {
  const files = await fixture();
  try {
    const second = resolve(files.root, "second");
    await mkdir(second);
    await writeFile(resolve(second, "more.js"), "// FR-AUTH-SIGNIN\n");
    const result = await checkCode(
      [...files.args, "--src", second],
      files.root,
      () => 0,
    );
    assert.equal((result.report.process_id_hits as unknown[]).length, 1);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("check code reports missing and invalid scan inputs", async () => {
  const files = await fixture();
  try {
    const unsupported = resolve(files.root, "notes.txt");
    await writeFile(unsupported, "text\n");
    const result = await checkCode(
      [
        ...files.args,
        "--src",
        resolve(files.root, "missing"),
        "--src",
        unsupported,
      ],
      files.root,
      () => 0,
    );
    assert.deepEqual(
      (result.report.scan_input_issues as Array<{ reason: string }>).map(
        ({ reason }) => reason,
      ),
      ["does not exist", "unsupported source extension .txt"],
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("compiled check code preserves argv and explicit shell execution", async (t) => {
  const files = await fixture();
  try {
    const argvArgs = [...files.args];
    const argv = spawnSync(
      process.execPath,
      [resolve(".node-test-dist/src/checkers/check_code.mjs"), ...argvArgs],
      { cwd: files.root, encoding: "utf8" },
    );
    if ((argv.error as NodeJS.ErrnoException | undefined)?.code === "EPERM") {
      t.diagnostic(
        "managed sandbox denied child creation; CI runs argv and shell entrypoints",
      );
      return;
    }
    assert.equal(argv.status, 0, argv.stderr);
    const shellArgs = argvArgs.slice(0, argvArgs.indexOf("--tests-argv"));
    const shell = spawnSync(
      process.execPath,
      [
        resolve(".node-test-dist/src/checkers/check_code.mjs"),
        ...shellArgs,
        "--tests",
        "node --version",
        "--tests-shell",
        "--json",
      ],
      { cwd: files.root, encoding: "utf8" },
    );
    assert.equal(shell.status, 0, shell.stderr);
    assert.equal(
      (JSON.parse(shell.stdout) as { verification_command_passed: boolean })
        .verification_command_passed,
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("legacy tests tokenization matches Python on Windows and POSIX", () => {
  assert.deepEqual(splitLegacyCommand('cmd "a b" ""', true), [
    "cmd",
    '"a b"',
    '""',
  ]);
  assert.deepEqual(splitLegacyCommand("cmd a\\ b 'c d'", true), [
    "cmd",
    "a\\",
    "b",
    "'c d'",
  ]);
  assert.deepEqual(splitLegacyCommand('cmd "a b" ""', false), [
    "cmd",
    "a b",
    "",
  ]);
  assert.deepEqual(splitLegacyCommand("cmd a\\ b ''", false), [
    "cmd",
    "a b",
    "",
  ]);
  assert.deepEqual(splitLegacyCommand('cmd "a"b', true), ["cmd", '"a"', "b"]);
  assert.deepEqual(splitLegacyCommand('cmd pre"two words"post', true), [
    "cmd",
    'pre"two',
    'words"post',
  ]);
  assert.deepEqual(splitLegacyCommand('cmd --flag="value with spaces"', true), [
    "cmd",
    '--flag="value',
    "with",
    'spaces"',
  ]);
});

test("tests argv is preferred over the legacy tests string", async () => {
  const files = await fixture();
  try {
    let executed: string[] | string | undefined;
    const result = await checkCode(
      [...files.args, "--tests", "ignored --legacy value"],
      files.root,
      (command) => {
        executed = command;
        return 0;
      },
    );
    assert.deepEqual(executed, [process.execPath, "-e", "process.exit(0)"]);
    assert.equal(result.exitCode, 0);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("Unicode word prefixes do not create legacy test-name identifiers", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "tests", "test_auth.js"),
      "const étest_FR_AUTH_SIGNIN = true;\n",
    );
    await writeFile(
      resolve(files.root, "plan.md"),
      "- PR-AUTH-SIGNIN\n- FR-AUTH-SIGNIN\n",
    );
    const result = await checkCode(files.args, files.root, () => 0);
    assert.deepEqual(result.report.process_id_hits, []);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("source hit paths use Python code point order", async () => {
  const files = await fixture();
  try {
    await writeFile(
      resolve(files.root, "src", "\uE000.js"),
      "// FR-AUTH-SIGNIN\n",
    );
    await writeFile(resolve(files.root, "src", "😀.js"), "// FR-AUTH-SIGNIN\n");
    const result = await checkCode(files.args, files.root, () => 0);
    assert.deepEqual(
      (result.report.process_id_hits as Array<{ path: string }>).map(
        ({ path }) => path,
      ),
      ["src/\uE000.js", "src/😀.js"],
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});
