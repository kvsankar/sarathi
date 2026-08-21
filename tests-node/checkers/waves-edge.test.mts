import assert from "node:assert/strict";
import test from "node:test";

import { parseLearningWaves } from "../../src/checkers/lib/waves.mjs";

test("wave parser accepts ordered exact members", () => {
  const result = parseLearningWaves(
    `# Learning Waves

## WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-CONTRACT, PR-AUTH-SIGNIN
WIP Limit: 2
Feedback/Integration Checkpoint: Review sandbox and contract evidence.
Stop/Replan Triggers: Stop if the token contract changes.
`,
    "docs/plan.md",
  );
  assert.equal(result.declared, true);
  assert.deepEqual(result.malformed_ids, []);
  assert.equal(result.waves[0]?.id, "WAVE-AUTH-BOUNDARY");
  assert.deepEqual(result.waves[0]?.members, [
    "PR-AUTH-CONTRACT",
    "PR-AUTH-SIGNIN",
  ]);
  assert.equal(result.waves[0]?.wip_limit, 2);
});

test("wave parser rejects one-token, extra-token, and bad controls", () => {
  const result = parseLearningWaves(`# Learning Waves

## WAVE-AUTH
Order: 1
Members: PR-AUTH-SIGNIN

## WAVE-AUTH-BOUNDARY-EXTRA
Order: later
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN-EXTRA
WIP Limit: 0
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.
`);
  assert.deepEqual(result.waves, []);
  assert.deepEqual(result.malformed_ids, [
    "WAVE-AUTH",
    "WAVE-AUTH-BOUNDARY-EXTRA",
  ]);
});

test("wave parser reports duplicate order and membership candidates", () => {
  const result = parseLearningWaves(`# Learning Waves

## WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN, PR-AUTH-SIGNIN, PR-AUTH
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.

## WAVE-AUTH-RECOVERY
Order: 1
Learning Target: Validate recovery behavior.
Members: PR-AUTH-RECOVERY
WIP Limit: 1
Feedback/Integration Checkpoint: Review recovery evidence.
Stop/Replan Triggers: Stop on recovery contract change.
`);
  assert.deepEqual(result.duplicate_orders, [1]);
  assert.deepEqual(result.invalid_members, {
    "WAVE-AUTH-BOUNDARY": ["PR-AUTH"],
  });
  assert.deepEqual(result.duplicate_members, {
    "WAVE-AUTH-BOUNDARY": ["PR-AUTH-SIGNIN"],
  });
});

test("wave parser rejects a wave without valid members", () => {
  const result = parseLearningWaves(`# Learning Waves

## WAVE-AUTH-EMPTY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.
`);
  assert.deepEqual(result.empty_members, ["WAVE-AUTH-EMPTY"]);
  assert.deepEqual(result.invalid_members, { "WAVE-AUTH-EMPTY": ["PR-AUTH"] });
});

test("empty wave section is declared and plan type controls member kind", () => {
  const empty = parseLearningWaves(`# Plan
Plan Type: Implementation

## Learning Waves

## Sequencing & Risks
`);
  const breakdown = parseLearningWaves(`# Plan
Plan Type: Breakdown

## Learning Waves

### WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.
`);
  assert.equal(empty.declared, true);
  assert.deepEqual(empty.waves, []);
  assert.deepEqual(breakdown.invalid_member_kinds, {
    "WAVE-AUTH-BOUNDARY": ["PR-AUTH-SIGNIN"],
  });
});

test("wave parser accepts a descriptive heading with hidden id", () => {
  const result = parseLearningWaves(`# Plan
Plan Type: Breakdown

## Waves

### Validate the identity boundary
<!-- sarathi:wave id="WAVE-AUTH-BOUNDARY" -->
Order: 1
Learning Target: Validate the identity boundary.
Members: WORK-AUTH-CONTRACT
WIP Limit: 1
Feedback/Integration Checkpoint: Review contract evidence.
Stop/Replan Triggers: Stop if the contract changes.
`);
  assert.deepEqual(result.malformed_ids, []);
  assert.equal(result.waves[0]?.id, "WAVE-AUTH-BOUNDARY");
  assert.equal(result.waves[0]?.name, "Validate the identity boundary");
});

test("wave parser accepts plain field names", () => {
  const result = parseLearningWaves(`# Plan
Plan Type: Breakdown

## Waves

### First coordinated change
<!-- sarathi:wave id="WAVE-AUTH-BOUNDARY" -->
Order: 1
Expected Result: Confirm the authentication boundary.
Members: WORK-AUTH-SIGNIN
Parallel Limit: 1
Review Point: Review the contract evidence.
Stop Conditions: Stop if the request shape changes.
`);
  assert.deepEqual(result.missing_fields, {});
  assert.equal(
    result.waves[0]?.learning_target,
    "Confirm the authentication boundary.",
  );
  assert.equal(result.waves[0]?.wip_limit, 1);
});
