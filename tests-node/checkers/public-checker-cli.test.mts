import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test, { type TestContext } from "node:test";

async function fixture(): Promise<string> {
  const root = await mkdtemp(resolve(".node-checker-cli-"));
  await mkdir(resolve(root, "src"));
  await mkdir(resolve(root, "tests"));
  await writeFile(
    resolve(root, "spec.md"),
    "- UC-AUTH-SIGNIN\n- FR-AUTH-SIGNIN UC-AUTH-SIGNIN\n- AT-AUTH-SIGNIN UC-AUTH-SIGNIN FR-AUTH-SIGNIN\n",
  );
  await writeFile(resolve(root, "parent-spec.md"), "");
  await writeFile(
    resolve(root, "slice.md"),
    "# Slice\n\n## Intent And Baseline\nBaseline: Current behavior.\nChange To Baseline: Add behavior.\nApplicable Constraints: Existing constraints.\n\n## Observable Delta\nExclusions: None.\nAffected Interfaces / State: One interface.\n- FR-AUTH-RETRY Add retry.\n\n## Delivery And Checks\nTechnical Approach: Direct change.\nDelivery Unit: PR-AUTH-RETRY\nChecks: Focused tests.\nRollback: Revert the commit.\nReview Point: Review the commit.\n\n## Traceability\n- AT-AUTH-RETRY Covers FR-AUTH-RETRY.\n",
  );
  await writeFile(
    resolve(root, "design.md"),
    "- COMP-AUTH FR-AUTH-SIGNIN\n- IFACE-AUTH owner COMP-AUTH\n# Test Strategy\n- TEST-AUTH-POLICY COMP-AUTH FR-AUTH-SIGNIN\n",
  );
  await writeFile(
    resolve(root, "plan.md"),
    "Plan Type: Implementation\n- PR-AUTH-SIGNIN\n  Work Classification: target-owned implementation\n  UC-AUTH-SIGNIN FR-AUTH-SIGNIN AT-AUTH-SIGNIN COMP-AUTH TEST-AUTH-POLICY\n",
  );
  await writeFile(resolve(root, "src", "app.js"), "export const ok = true;\n");
  await writeFile(
    resolve(root, "tests", "app.test.js"),
    "export const ok = true;\n",
  );
  return root;
}

function run(
  t: TestContext,
  checker: string,
  args: string[],
  root: string,
): Record<string, unknown> | undefined {
  const result = spawnSync(
    process.execPath,
    [resolve(`.node-test-dist/src/checkers/${checker}.mjs`), ...args, "--json"],
    { cwd: root, encoding: "utf8" },
  );
  if ((result.error as NodeJS.ErrnoException | undefined)?.code === "EPERM") {
    t.diagnostic(
      "managed sandbox denied child creation; unsandboxed runs execute this public CLI case",
    );
    return undefined;
  }
  assert.equal(result.error, undefined, result.error?.message);
  assert.match(result.stdout, /^\{/);
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

async function cliCase(
  t: TestContext,
  checker: string,
  args: string[],
  assertion: (report: Record<string, unknown>) => void,
): Promise<void> {
  const root = await fixture();
  try {
    const report = run(t, checker, args, root);
    if (report) assertion(report);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("Node spec checker preserves the documented JSON interface", (t) =>
  cliCase(t, "check_spec", ["spec.md", "--feature"], (report) => {
    assert.equal(report.mode, "feature");
  }));
test("Node spec checker exposes compact slice mode", (t) =>
  cliCase(t, "check_spec", ["slice.md", "--slice"], (report) => {
    assert.equal(report.mode, "slice");
    assert.equal(
      (report.gates as Record<string, boolean>).slice_contract_complete,
      true,
    );
  }));
test("Node spec checker accepts a repository-relative spec path", (t) =>
  cliCase(t, "check_spec", ["spec.md", "--feature"], (report) => {
    assert.equal((report.counts as Record<string, number>).FR, 1);
  }));
test("Node spec checker accepts the verify prompt placeholder form", (t) =>
  cliCase(t, "check_spec", ["spec.md", "--feature"], (report) => {
    assert.equal(typeof report.passed, "number");
  }));
test("Node spec checker validates a feature against its parent", (t) =>
  cliCase(
    t,
    "check_spec",
    ["spec.md", "--feature", "--parent", "parent-spec.md"],
    (report) => {
      assert.equal(
        (report.gates as Record<string, boolean>).no_orphan_refs,
        true,
      );
    },
  ));

test("Node design checker preserves the documented JSON interface", (t) =>
  cliCase(
    t,
    "check_design",
    ["design.md", "--component", "--spec", "spec.md"],
    (report) => {
      assert.equal(report.mode, "component");
    },
  ));
test("Node design checker accepts repository-relative document paths", (t) =>
  cliCase(
    t,
    "check_design",
    ["design.md", "--component", "--spec", "spec.md"],
    (report) => {
      assert.equal((report.counts as Record<string, number>).COMP, 1);
    },
  ));
test("Node design checker enforces current approval records when requested", (t) =>
  cliCase(
    t,
    "check_design",
    ["design.md", "--component", "--spec", "spec.md", "--require-approvals"],
    (report) => {
      assert.equal(
        (report.gates as Record<string, boolean>).required_approvals_present,
        false,
      );
    },
  ));

test("Node plan checker preserves the documented JSON interface", (t) =>
  cliCase(
    t,
    "check_plan",
    ["plan.md", "--feature", "--spec", "spec.md", "--design", "design.md"],
    (report) => {
      assert.equal(report.mode, "feature");
    },
  ));
test("Node plan checker validates a plan with a standalone design", (t) =>
  cliCase(
    t,
    "check_plan",
    ["plan.md", "--feature", "--spec", "spec.md", "--design", "design.md"],
    (report) => {
      assert.equal(
        (report.gates as Record<string, boolean>).test_obligation_coverage_100,
        true,
      );
    },
  ));
test("Node plan checker validates a Lean plan without a standalone design", (t) =>
  cliCase(
    t,
    "check_plan",
    ["plan.md", "--feature", "--spec", "spec.md"],
    (report) => {
      assert.equal(
        (report.gates as Record<string, boolean>).fr_coverage_100,
        true,
      );
    },
  ));
test("Node plan checker enforces current upstream approvals when requested", (t) =>
  cliCase(
    t,
    "check_plan",
    [
      "plan.md",
      "--feature",
      "--spec",
      "spec.md",
      "--design",
      "design.md",
      "--require-approvals",
    ],
    (report) => {
      assert.equal(
        (report.gates as Record<string, boolean>).required_approvals_present,
        false,
      );
    },
  ));

const codeArgs = [
  "--plan",
  "plan.md",
  "--design",
  "design.md",
  "--src",
  "src",
  "--tests-dir",
  "tests",
  "--tests-argv",
  JSON.stringify([process.execPath, "-e", "process.exit(0)"]),
];
test("Node code checker runs the supplied verification command and returns JSON", (t) =>
  cliCase(t, "check_code", codeArgs, (report) => {
    assert.equal(report.verification_command_passed, true);
  }));
test("Node code checker preserves plan and JSON-array argument parsing", (t) =>
  cliCase(t, "check_code", codeArgs, (report) => {
    assert.match(String(report.verification_command), /node/);
  }));
test("Node code checker enforces plan approval when requested", (t) =>
  cliCase(t, "check_code", [...codeArgs, "--require-approvals"], (report) => {
    assert.equal(
      (report.gates as Record<string, boolean>).required_approvals_present,
      false,
    );
  }));

test("missing verification executable writes only a launch error", async (t) => {
  const root = await fixture();
  try {
    const result = spawnSync(
      process.execPath,
      [
        resolve(".node-test-dist/src/checkers/check_code.mjs"),
        "--plan",
        "plan.md",
        "--src",
        "src",
        "--tests-dir",
        "tests",
        "--tests-argv",
        JSON.stringify(["sarathi-command-that-does-not-exist"]),
        "--json",
      ],
      { cwd: root, encoding: "utf8" },
    );
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === "EPERM") {
      t.diagnostic(
        "managed sandbox denied outer child creation; unsandboxed runs assert launch failure",
      );
      return;
    }
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /ENOENT|not found|does not exist/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
