import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validateWorkflowState } from "../../src/checkers/lib/workflow-state.mjs";

async function withRoot(
  action: (root: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(resolve(".node-workflow-state-"));
  try {
    await action(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function writeState(
  root: string,
  name: string,
  content: string,
): Promise<void> {
  await mkdir(resolve(root, ".sdlc"), { recursive: true });
  await writeFile(resolve(root, ".sdlc", name), content);
}

test("missing optional workflow state is valid", async () => {
  await withRoot(async (root) => {
    assert.deepEqual(await validateWorkflowState(root), []);
  });
});

test("canonical and legacy machine values are valid", async () => {
  await withRoot(async (root) => {
    await writeState(
      root,
      "wip.md",
      `# Current work
Status Result: Ready after minor fixes
Work Scope: slice/change
Current Command: code-create
Ready To Implement: Yes
Feedback Status: requested
Current Work Group: WAVE-AUTH-BOUNDARY
Current Work: WORK-AUTH-SIGNIN
Parallel Limit: 2
Active Slices: PR-AUTH-CODE, PR-AUTH-TESTS

Delivery Profile: Standard
Assurance Modules: Security
`,
    );
    await writeState(
      root,
      "process-decisions.yaml",
      `project_entry:
  mode: brownfield_delta_only
  scope: feature/component
delivery:
  assurance_profile: standard
  work_outcome: product_increment
  extra_checks: [security, accessibility]
approval:
  policy: human_checkpoints
  authorization: explicit_user_choice
bootstrap:
  status: injected
`,
    );
    assert.deepEqual(await validateWorkflowState(root), []);
  });
});

test("invalid machine values report file, field, value, and reason", async () => {
  await withRoot(async (root) => {
    await writeState(
      root,
      "wip.md",
      `# Current work
Status Result: Mostly ready
Current Command: coding
Feedback Status: waiting
Current Work: WORK-1
Parallel Limit: 0
`,
    );
    await writeState(
      root,
      "process-decisions.yaml",
      `delivery:
  assurance_profile: stanard
  extra_checks: security
approval:
  policy: sometimes_automatic
`,
    );
    const issues = await validateWorkflowState(root);
    assert.deepEqual(
      new Set(issues.map(({ field }) => field)),
      new Set([
        "Status Result",
        "Current Command",
        "Feedback Status",
        "Current Work",
        "Parallel Limit",
        "delivery.assurance_profile",
        "delivery.extra_checks",
        "approval.policy",
      ]),
    );
    assert.ok(issues.every(({ path }) => path.startsWith(".sdlc/")));
    assert.ok(issues.every(({ value }) => value !== null));
    assert.ok(issues.every(({ reason }) => reason.length > 0));
  });
});

test("workflow commands must match the entire field value", async () => {
  await withRoot(async (root) => {
    await writeState(
      root,
      "wip.md",
      `Current Command: spec-create rubbish
Current Stage: garbage workflow-status
`,
    );
    const issues = await validateWorkflowState(root);
    assert.deepEqual(
      issues.map(({ field, value }) => ({ field, value })),
      [
        { field: "Current Command", value: "spec-create rubbish" },
        { field: "Current Stage", value: "garbage workflow-status" },
      ],
    );
  });
});
