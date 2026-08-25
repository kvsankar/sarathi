import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { validateWorkflowState } from "../../src/checkers/lib/workflow-state.mjs";
import { parseLearningWaves } from "../../src/checkers/lib/waves.mjs";

test("workflow state accepts canonical values and reports invalid fields", async () => {
  const root = join(tmpdir(), `sarathi-workflow-${process.pid}-${Date.now()}`);
  await mkdir(join(root, ".sdlc"), { recursive: true });
  await writeFile(
    join(root, ".sdlc", "wip.md"),
    `Status Result: Ready after minor fixes
Work Scope: slice/change
Current Command: code-create
Ready To Implement: Yes
Feedback Status: requested
Current Work Group: WAVE-AUTH-BOUNDARY
Current Work: WORK-AUTH-SIGNIN
Parallel Limit: 2
Active Slices: PR-AUTH-CODE, PR-AUTH-TESTS
`,
  );
  await writeFile(
    join(root, ".sdlc", "process-decisions.yaml"),
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

  await writeFile(
    join(root, ".sdlc", "wip.md"),
    "Status Result: Ready\rCurrent Command: code-create\rParallel Limit: 1\r",
  );
  assert.deepEqual(await validateWorkflowState(root), []);

  await writeFile(
    join(root, ".sdlc", "wip.md"),
    "Status Result: Mostly ready\nCurrent Command: coding\nParallel Limit: 0\n",
  );
  assert.deepEqual(
    (await validateWorkflowState(root)).map((entry) => entry.field),
    ["Status Result", "Current Command", "Parallel Limit"],
  );
});

test("work groups retain order, members, controls, and duplicate findings", () => {
  const result = parseLearningWaves(
    `# Plan
Plan Type: Implementation
## Learning Waves
### WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN, PR-AUTH-SIGNIN, PR-AUTH
WIP Limit: 2
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop if the contract changes.
`,
    "docs/plan.md",
  );
  assert.equal(result.declared, true);
  assert.deepEqual(result.waves[0]?.members, ["PR-AUTH-SIGNIN"]);
  assert.deepEqual(result.invalid_members, {
    "WAVE-AUTH-BOUNDARY": ["PR-AUTH"],
  });
  assert.deepEqual(result.duplicate_members, {
    "WAVE-AUTH-BOUNDARY": ["PR-AUTH-SIGNIN"],
  });
});

test("descriptive work-group headings resolve hidden identifiers", () => {
  const result = parseLearningWaves(`# Plan
Plan Type: Breakdown
## Waves
### Validate the identity boundary
<!-- sarathi:wave id="WAVE-AUTH-BOUNDARY" -->
Order: 1
Learning Target: Validate the identity boundary.
Members: WORK-AUTH-CONTRACT
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop if the contract changes.
`);
  assert.equal(result.waves[0]?.id, "WAVE-AUTH-BOUNDARY");
  assert.equal(result.waves[0]?.name, "Validate the identity boundary");
});

test("CR-only work groups preserve fields and members", () => {
  const result = parseLearningWaves(
    "# Plan\rPlan Type: Implementation\r## Learning Waves\r### WAVE-AUTH-BOUNDARY\rOrder: 1\rLearning Target: Validate.\rMembers: PR-AUTH-SIGNIN\rWIP Limit: 1\rFeedback/Integration Checkpoint: Review.\rStop/Replan Triggers: Stop.\r",
  );
  assert.equal(result.waves[0]?.id, "WAVE-AUTH-BOUNDARY");
  assert.deepEqual(result.waves[0]?.members, ["PR-AUTH-SIGNIN"]);
});
