import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { checkDesign } from "../../src/checkers/check_design.mjs";
import { checkCode } from "../../src/checkers/check_code.mjs";
import { checkPlan } from "../../src/checkers/check_plan.mjs";
import { checkSpec } from "../../src/checkers/check_spec.mjs";

async function workspace(): Promise<{
  root: string;
  spec: string;
  design: string;
  plan: string;
}> {
  const root = await mkdtemp(resolve(".node-stage-contract-"));
  const spec = resolve(root, "spec.md"),
    design = resolve(root, "design.md"),
    plan = resolve(root, "plan.md");
  await writeFile(
    spec,
    "- UC-AUTH-SIGNIN Sign in.\n- FR-AUTH-SIGNIN Allow sign in. UC-AUTH-SIGNIN.\n- NFR-AUTH-SPEED Fast enough.\n- AT-AUTH-SIGNIN Covers UC-AUTH-SIGNIN FR-AUTH-SIGNIN NFR-AUTH-SPEED.\n",
  );
  await writeFile(
    design,
    "- COMP-AUTH covers FR-AUTH-SIGNIN.\n- IFACE-AUTH owner COMP-AUTH.\n# Test Strategy\n- TEST-AUTH-POLICY covers COMP-AUTH FR-AUTH-SIGNIN.\n",
  );
  await writeFile(
    plan,
    "Plan Type: Implementation\n- PR-AUTH-SIGNIN\n  Work Classification: target-owned implementation\n  Covers UC-AUTH-SIGNIN FR-AUTH-SIGNIN NFR-AUTH-SPEED AT-AUTH-SIGNIN COMP-AUTH TEST-AUTH-POLICY.\n",
  );
  return { root, spec, design, plan };
}

async function ledger(
  root: string,
  records: string,
  policy?: string,
  gates?: string,
): Promise<void> {
  await mkdir(resolve(root, ".sdlc"), { recursive: true });
  await writeFile(
    resolve(root, ".sdlc", "approvals.yaml"),
    `version: 1\napprovals:\n${records}`,
  );
  if (policy)
    await writeFile(
      resolve(root, ".sdlc", "process-decisions.yaml"),
      `approval:\n  policy: ${policy}\n`,
    );
  if (gates) await writeFile(resolve(root, ".sdlc", "gates.yaml"), gates);
}

function approval(
  id: string,
  gate: string,
  kind: string,
  path: string,
  hash: string,
  status = "approved",
  at = "2026-07-01T12:00:00Z",
  extra = "",
): string {
  return `  - id: ${id}\n    gate: ${gate}\n    scope: feature/component\n    artifact:\n      kind: ${kind}\n      path: ${path}\n      sha256: ${hash}\n    status: ${status}\n    approved_by: Test User\n    approved_at: ${at}\n${extra}`;
}

async function hash(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

test("spec checker preserves review-only prose and unbounded traceability", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `Brownfield Classification: existing\n- UC-AUTH-SIGNIN User signs in.\n- FR-AUTH-SIGNIN The system validates name and password. UC-AUTH-SIGNIN.\n- NFR-AUTH-SPEED Performance remains acceptable.\n- AT-AUTH-SIGNIN valid sign-in UC-AUTH-SIGNIN FR-AUTH-SIGNIN NFR-AUTH-SPEED.\n- AT-AUTH-SECOND another check UC-AUTH-SIGNIN FR-AUTH-SIGNIN.\n- JT-AUTH-JOURNEY Runs AT-AUTH-SIGNIN then AT-AUTH-SECOND.\n`,
    );
    const result = await checkSpec(
      [files.spec, "--feature", "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 0);
    assert.equal((result.report.counts as Record<string, number>).JT, 1);
    assert.equal(result.report.fr_at_coverage_pct, 100);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("spec checker rejects numbered lowercase and design-only identifiers", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      "- UC-AUTH-SIGNIN\n- FR-AUTH-1 UC-AUTH-SIGNIN\n- fr-auth-signin\n- TEST-AUTH-POLICY\n- AT-AUTH-SIGNIN UC-AUTH-SIGNIN\n",
    );
    const result = await checkSpec(
      [files.spec, "--feature", "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 1);
    assert.deepEqual(
      new Set(result.report.bad_id_format as string[]),
      new Set(["FR-AUTH-1", "fr-auth-signin", "TEST-AUTH-POLICY"]),
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("slice checker accepts one compact code-ready delta", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `# Sign-in Slice

## Intent And Baseline
Baseline: Accepted sign-in behavior and security constraints.
Change To Baseline: Add a visible retry message.
Applicable Constraints: Existing authorization and privacy rules.

## Observable Delta
Exclusions: No credential or session changes.
Affected Interfaces / State: Sign-in form message state.
- FR-AUTH-RETRY Show the retry message.

## Delivery And Checks
Technical Approach: Reuse the existing error path.
Delivery Unit: PR-AUTH-RETRY
Checks: Focused sign-in tests and the affected UI suite.
Rollback: Revert the delivery commit.
Review Point: Assess the exact delivery commit before push.

## Traceability
- AT-AUTH-RETRY Covers FR-AUTH-RETRY.
`,
    );
    const result = await checkSpec(
      [files.spec, "--slice", "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.mode, "slice");
    assert.equal(
      (result.report.gates as Record<string, boolean>).slice_contract_complete,
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("slice checker rejects a delta without its delivery contract", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `# Incomplete Slice

## Intent And Baseline
Baseline: Current behavior.
Change To Baseline: Change it.
Applicable Constraints: Existing constraints.

## Observable Delta
Exclusions: None.
Affected Interfaces / State: One interface.
- FR-AUTH-RETRY Show retry.

## Delivery And Checks
Technical Approach: Direct change.
Delivery Unit: PR-AUTH-RETRY
Checks: Focused tests.
Review Point: Review the commit.

## Traceability
- AT-AUTH-RETRY Covers FR-AUTH-RETRY.
`,
    );
    const result = await checkSpec(
      [files.spec, "--slice", "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 1);
    assert.match(
      (result.report.slice_contract_issues as string[]).join("\n"),
      /Rollback/u,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("slice checker requires a current slice-scoped approval when requested", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `# Approved Slice

## Intent And Baseline
Baseline: Current behavior.
Change To Baseline: Add retry.
Applicable Constraints: Existing constraints.

## Observable Delta
Exclusions: None.
Affected Interfaces / State: Retry state.
- FR-AUTH-RETRY Show retry.

## Delivery And Checks
Technical Approach: Direct change.
Delivery Unit: PR-AUTH-RETRY
Checks: Focused tests.
Rollback: Revert the commit.
Review Point: Review the commit.

## Traceability
- AT-AUTH-RETRY Covers FR-AUTH-RETRY.
`,
    );
    const current = await hash(files.spec);
    await ledger(
      files.root,
      `  - id: APR-SLICE\n    gate: spec.approved\n    scope: slice/change\n    artifact:\n      kind: spec\n      path: spec.md\n      sha256: ${current}\n    status: approved\n    approved_by: Test User\n    approved_at: 2026-07-01T12:00:00Z\n`,
    );
    const result = await checkSpec(
      [files.spec, "--slice", "--require-approvals", "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 0);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("slice checker accepts a protected-constraint-only delta", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `# Retention Slice

## Intent And Baseline
Baseline: Current audit retention behavior.
Change To Baseline: Shorten retention under the approved privacy rule.
Applicable Constraints: Approved privacy and audit authorities.

## Observable Delta
Exclusions: No audit event schema change.
Affected Interfaces / State: Stored audit records.
- NFR-AUDIT-RETENTION Delete expired audit records within one day.

## Delivery And Checks
Technical Approach: Reuse the existing expiry job.
Delivery Unit: PR-AUDIT-RETENTION
Checks: Retention boundary and affected audit tests.
Rollback: Restore the earlier retention setting.
Review Point: Review the exact delivery commit.

## Traceability
- AT-AUDIT-RETENTION Covers NFR-AUDIT-RETENTION.
`,
    );
    const result = await checkSpec(
      [files.spec, "--slice", "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.nfr_at_coverage_pct, 100);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("spec checker enforces hash time and automatic approval policy", async () => {
  const files = await workspace();
  try {
    const args = [files.spec, "--feature", "--require-approvals", "--json"];
    let result = await checkSpec(args, files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      false,
    );
    const current = await hash(files.spec);
    await ledger(
      files.root,
      approval("APR-OLD", "spec.approved", "spec", "spec.md", "f".repeat(64)) +
        approval("APR-CURRENT", "spec.approved", "spec", "spec.md", current),
    );
    result = await checkSpec(args, files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      true,
      JSON.stringify(result.report.approval_requirements),
    );
    const approvalLedger = result.report.approval_ledger as Record<
      string,
      unknown
    >;
    assert.deepEqual(approvalLedger.invalid_records, []);
    assert.equal("historical_records" in approvalLedger, false);
    const withHistory = await checkSpec(
      [...args, "--include-approval-history"],
      files.root,
    );
    assert.deepEqual(
      (
        (withHistory.report.approval_ledger as Record<string, unknown>)
          .historical_records as Array<{ id: string }>
      ).map(({ id }) => id),
      ["APR-OLD"],
    );
    await ledger(
      files.root,
      approval(
        "APR-BAD-TIME",
        "spec.approved",
        "spec",
        "spec.md",
        current,
        "approved",
        "2026-07-01 12:00:00",
      ),
    );
    result = await checkSpec(args, files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      false,
    );
    const automatic = approval(
      "APR-AUTO",
      "spec.approved",
      "spec",
      "spec.md",
      current,
      "auto-approved",
      "2026-07-01T12:00:00Z",
      "    policy: POL-AUTO\n    reason: eligible local gate\n",
    );
    await ledger(
      files.root,
      automatic,
      "automatic_eligible_gates",
      "auto_approval:\n  enabled: true\n  allowed_gates: [spec.approved]\n  allowed_scopes: [feature/component]\n  expires_at: 2099-01-01T00:00:00Z\n",
    );
    result = await checkSpec(args, files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      true,
      JSON.stringify(result.report.approval_requirements),
    );
    await writeFile(
      resolve(files.root, ".sdlc", "process-decisions.yaml"),
      "approval:\n  policy: human_checkpoints\n",
    );
    result = await checkSpec(args, files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      false,
    );
    await rm(resolve(files.root, ".sdlc", "process-decisions.yaml"));
    result = await checkSpec(args, files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .required_approvals_present,
      false,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("plan checker resolves a configured parent or names --parent", async () => {
  const files = await workspace();
  try {
    const parent = resolve(files.root, "parent.plan.md");
    await writeFile(
      parent,
      "Plan Type: Breakdown\n- WORK-AUTH-PARENT\n  Work Classification: target-owned implementation\n",
    );
    await writeFile(
      files.plan,
      "Plan Type: Implementation\nParent Work Item: WORK-AUTH-PARENT\n- PR-AUTH-SIGNIN\n  Work Classification: target-owned implementation\n",
    );
    let result = await checkPlan([files.plan, "--json"], files.root);
    assert.deepEqual(result.report.orphan_refs, ["WORK-AUTH-PARENT"]);
    assert.match(
      String(
        (result.report.parent_resolution as Record<string, unknown>).issue,
      ),
      /pass --parent <path>/u,
    );

    await mkdir(resolve(files.root, ".sdlc"), { recursive: true });
    await writeFile(
      resolve(files.root, ".sdlc", "process-decisions.yaml"),
      "artifact_paths:\n  canonical:\n    plan: parent.plan.md\n",
    );
    result = await checkPlan([files.plan, "--json"], files.root);
    assert.deepEqual(result.report.orphan_refs, []);
    assert.equal(
      (result.report.parent_resolution as Record<string, unknown>).path,
      "parent.plan.md",
    );

    await writeFile(
      resolve(files.root, ".sdlc", "process-decisions.yaml"),
      "artifact_paths:\n  canonical\n",
    );
    result = await checkPlan([files.plan, "--json"], files.root);
    assert.match(
      String(
        (result.report.parent_resolution as Record<string, unknown>).issue,
      ),
      /pass --parent <path>/u,
    );
    assert.equal(
      (
        result.report.workflow_state_issues as Array<Record<string, unknown>>
      ).some(({ path }) => path === ".sdlc/process-decisions.yaml"),
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("design checker covers drift ownership obligations and core shell aliases", async () => {
  const files = await workspace();
  try {
    let result = await checkDesign(
      [files.design, "--component", "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(result.exitCode, 0);
    await writeFile(
      files.design,
      "- COMP-AUTH uses an external API mock. FR-AUTH-SIGNIN.\n- IFACE-AUTH owner COMP-AUTH.\n# Test Strategy\n- TEST-AUTH-POLICY covers COMP-AUTH FR-AUTH-SIGNIN.\n# Risks & Trade-offs\n- RISK-AUTH notes drift risk.\n",
    );
    result = await checkDesign(
      [files.design, "--component", "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .external_doubles_have_real_boundary_mitigation,
      false,
    );
    await writeFile(
      files.design,
      `${await readFile(files.design, "utf8")}\n- TEST-AUTH-CONTRACT integration test covers COMP-AUTH RISK-AUTH.\n`,
    );
    result = await checkDesign(
      [files.design, "--component", "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .external_doubles_have_real_boundary_mitigation,
      true,
    );
    await writeFile(
      files.design,
      "- COMP-AUTH covers FR-AUTH-SIGNIN.\n- IFACE-AUTH has no owner.\n# Test Strategy\n",
    );
    result = await checkDesign(
      [files.design, "--component", "--spec", files.spec, "--json"],
      files.root,
    );
    const gates = result.report.gates as Record<string, boolean>;
    assert.equal(gates.iface_single_owner, false);
    assert.equal(gates.test_obligations_declared, false);
    const product = `# Overview\n# Tech Stack\n# Drivers & Constraints\n# Layers\n# Components\n- COMP-AUTH FR-AUTH-SIGNIN.\n# Interfaces\n- IFACE-AUTH owner COMP-AUTH.\n# Core vs. Shell / Equivalent Separation\n# Key Flows\n# Data Model\n# Design Decisions\n# Test Strategy\n- TEST-AUTH-POLICY COMP-AUTH FR-AUTH-SIGNIN.\n# Risks & Trade-offs\n# Traceability Matrix\n`;
    await writeFile(files.design, product);
    result = await checkDesign(
      [files.design, "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>).sections_present,
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("plan checker ignores retired ceremony and permits direct implementation plans", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.plan,
      `${await readFile(files.plan, "utf8")}\nComplexity Budget: 1\nReadiness Decision: old\nSecurity review and deployment are ordinary words.\n\`\`\`md\n# Learning Waves\n### WAVE-BAD-ONE\n\`\`\`\n- PR-AUTH-SECOND\n  Work Classification: target-owned implementation\n- PR-AUTH-THIRD\n  Work Classification: target-owned implementation\n- PR-AUTH-FOURTH\n  Work Classification: target-owned implementation\n`,
    );
    const result = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--design",
        files.design,
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .learning_waves_well_formed,
      true,
    );
    assert.equal("complexity_budget" in result.report, false);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("plan checker validates work groups allocations and unscheduled work", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.plan,
      `Plan Type: Breakdown\n- WORK-AUTH-FIRST\n  Parent scope: feature\n  Child scope: slice\n  Parent IDs / inherited obligations: FR-AUTH-SIGNIN\n  Required child artifacts: plan\n  Work Classification: target-owned implementation\n- WORK-AUTH-SECOND\n  Parent scope: feature\n  Child scope: slice\n  Parent IDs / inherited obligations: FR-AUTH-SIGNIN\n  Required child artifacts: plan\n  Work Classification: target-owned implementation\n# Learning Waves\n## WAVE-AUTH-FIRST\nOrder: 1\nExpected Result: learn\nMembers: WORK-AUTH-FIRST\nParallel Limit: 1\nReview Point: review\nStop Conditions: stop\n`,
    );
    let result = await checkPlan(
      [files.plan, "--feature", "--json"],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .learning_waves_well_formed,
      true,
    );
    assert.deepEqual(result.report.unscheduled_work_items, [
      "WORK-AUTH-SECOND",
    ]);
    await writeFile(
      files.plan,
      `${await readFile(files.plan, "utf8")}\n## WAVE-AUTH-BAD\nOrder: 1\nMembers: PR-AUTH-WRONG\n`,
    );
    result = await checkPlan([files.plan, "--feature", "--json"], files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .learning_waves_well_formed,
      false,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .learning_wave_members_complete,
      false,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("plan checker validates lean inherited and malformed delivery records", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.plan,
      `Plan Type: Implementation\nWork Scope: Slice/change\nDelivery Profile: Lean\nImplementation Readiness: Code-ready\nLean Change Record: Yes\nParent Work Item: WORK-AUTH-PARENT\nWhy Lean: small\nChanged Behavior: sign in\nParent IDs / inherited obligations: FR-AUTH-SIGNIN\nAcceptance & Verification: AT-AUTH-SIGNIN\nEscalate If: contract changes\n- PR-AUTH-SIGNIN\n  Work Classification: target-owned implementation\n  FR-AUTH-SIGNIN AT-AUTH-SIGNIN\n`,
    );
    let result = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--inherited-subset",
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .lean_change_record_well_formed,
      true,
    );
    await writeFile(
      files.plan,
      `Plan Type: Implementation\nImplementation Readiness: Code-ready\nInherited Intent Record: Yes\nWhy Direct: architecture inherited\nAcceptance & Verification: AT-AUTH-SIGNIN\n- PR-AUTH-SIGNIN\n  Work Classification: target-owned implementation\n  FR-AUTH-SIGNIN AT-AUTH-SIGNIN\n`,
    );
    result = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--inherited-subset",
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .inherited_intent_record_well_formed,
      true,
    );
    await writeFile(
      files.plan,
      "Plan Type: Implementation\nInherited Intent Record: Yes\n- PR-AUTH-1\n",
    );
    result = await checkPlan([files.plan, "--feature", "--json"], files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .inherited_intent_record_well_formed,
      false,
    );
    assert.deepEqual(result.report.bad_id_format, ["PR-AUTH-1"]);
    await writeFile(
      files.plan,
      "Plan Type: Implementation\n- pr-auth-signin\nTraceability file: `.sdlc/test-traceability.yaml`.\n",
    );
    result = await checkPlan([files.plan, "--feature", "--json"], files.root);
    assert.deepEqual(result.report.bad_id_format, ["pr-auth-signin"]);
    await writeFile(
      files.plan,
      "Plan Type: Implementation\nImplementation Readiness: Code-ready\nInherited Intent Record: Yes\nWhy Direct: inherited\nAcceptance & Verification: AT-OTHER-MISSING\n- PR-AUTH-SIGNIN\n  Work Classification: target-owned implementation\n  AT-OTHER-MISSING\n",
    );
    result = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--inherited-subset",
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>).at_coverage_100,
      false,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("plan checker enforces obligation journey external and upstream approval coverage", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `${await readFile(files.spec, "utf8")}- JT-AUTH-JOURNEY AT-AUTH-SIGNIN.\n`,
    );
    await writeFile(
      files.design,
      `${await readFile(files.design, "utf8")}- TEST-AUTH-EXTRA covers COMP-AUTH FR-AUTH-SIGNIN.\n`,
    );
    let result = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--design",
        files.design,
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>).jt_coverage_100,
      false,
    );
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .test_obligation_coverage_100,
      false,
    );
    await writeFile(
      files.plan,
      `${await readFile(files.plan, "utf8")}\nUses an external API mock without a real boundary.\n`,
    );
    result = await checkPlan([files.plan, "--feature", "--json"], files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .external_double_mitigation_present,
      true,
    );
    await writeFile(
      files.plan,
      (await readFile(files.plan, "utf8")).replace(
        "real boundary",
        "local shortcut",
      ),
    );
    result = await checkPlan([files.plan, "--feature", "--json"], files.root);
    assert.equal(
      (result.report.gates as Record<string, boolean>)
        .external_double_mitigation_present,
      false,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("design plan and code share prototype and upstream approval requirements", async () => {
  const files = await workspace();
  try {
    const prototype = resolve(files.root, "prototype.html");
    await writeFile(prototype, "<main>Approved</main>\n");
    await writeFile(
      files.spec,
      `${await readFile(files.spec, "utf8")}UI Mock Preference: Required\nApproved Prototype Artifact: prototype.html\n`,
    );
    await writeFile(
      files.plan,
      `${await readFile(files.plan, "utf8")}UI Work: Yes\nApproved Prototype Artifact: prototype.html\n`,
    );
    const required = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--design",
        files.design,
        "--require-approvals",
        "--json",
      ],
      files.root,
    );
    assert.deepEqual(
      (required.report.approval_requirements as Array<{ gate: string }>).map(
        ({ gate }) => gate,
      ),
      ["spec.approved", "ux.mock.approved", "design.approved"],
    );
    const records =
      approval(
        "APR-SPEC",
        "spec.approved",
        "spec",
        "spec.md",
        await hash(files.spec),
      ) +
      approval(
        "APR-MOCK",
        "ux.mock.approved",
        "prototype",
        "prototype.html",
        await hash(prototype),
      ) +
      approval(
        "APR-DESIGN",
        "design.approved",
        "design",
        "design.md",
        await hash(files.design),
      );
    await ledger(files.root, records);
    const accepted = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--design",
        files.design,
        "--require-approvals",
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (accepted.report.gates as Record<string, boolean>)
        .required_approvals_present,
      true,
    );
    const design = await checkDesign(
      [
        files.design,
        "--component",
        "--spec",
        files.spec,
        "--require-approvals",
        "--json",
      ],
      files.root,
    );
    assert.equal(
      (design.report.gates as Record<string, boolean>)
        .required_approvals_present,
      true,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("stage coverage percentages use Python ties to even rounding", async () => {
  const files = await workspace();
  try {
    const suffixes = "ABCDEFGHIJKLMNOP".split("");
    const frs = suffixes.map((suffix) => `FR-AUTH-ITEM${suffix}`);
    await writeFile(
      files.spec,
      `${frs.map((id) => `- ${id}`).join("\n")}\n- AT-AUTH-ONLY ${frs[0]}\n`,
    );
    const spec = await checkSpec(
      [files.spec, "--feature", "--json"],
      files.root,
    );
    assert.equal(spec.report.fr_at_coverage_pct, 6.2);

    const components = suffixes.map((suffix) => `COMP-AUTH${suffix}`);
    await writeFile(
      files.design,
      `${components.map((id, index) => `- ${id} ${frs[index]}`).join("\n")}\n# Test Strategy\n- TEST-AUTH-ONLY ${components[0]} ${frs[0]}\n`,
    );
    const design = await checkDesign(
      [files.design, "--component", "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(design.report.comp_test_coverage_pct, 6.2);

    await writeFile(
      files.plan,
      `Plan Type: Implementation\n- PR-AUTH-ONLY\n  Work Classification: target-owned implementation\n  ${frs[0]}\n`,
    );
    const plan = await checkPlan(
      [files.plan, "--feature", "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(plan.report.fr_coverage_pct, 6.2);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("stage identifier boundaries treat Unicode letters as Python word characters", async () => {
  const files = await workspace();
  try {
    await writeFile(files.spec, "éFR-AUTH-SIGNIN\n");
    const spec = await checkSpec(
      [files.spec, "--feature", "--json"],
      files.root,
    );
    assert.equal((spec.report.counts as Record<string, number>).FR, 0);
    assert.deepEqual(spec.report.orphan_refs, []);

    await writeFile(files.design, "éCOMP-AUTH FR-AUTH-SIGNIN\n");
    const design = await checkDesign(
      [files.design, "--component", "--json"],
      files.root,
    );
    assert.equal((design.report.counts as Record<string, number>).COMP, 0);

    await writeFile(files.spec, "- FR-AUTH-SIGNIN\n");
    await writeFile(
      files.plan,
      "Plan Type: Implementation\n- PR-AUTH-ONLY\n  Work Classification: target-owned implementation\n  éFR-AUTH-SIGNIN\n",
    );
    const plan = await checkPlan(
      [files.plan, "--feature", "--spec", files.spec, "--json"],
      files.root,
    );
    assert.equal(plan.report.fr_coverage_pct, 0);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("synthetic missing UI approvals omit hash evidence semantics", async () => {
  const files = await workspace();
  try {
    await writeFile(
      files.spec,
      `${await readFile(files.spec, "utf8")}UI Mock Preference: Required\n`,
    );
    const design = await checkDesign(
      [
        files.design,
        "--component",
        "--spec",
        files.spec,
        "--require-approvals",
        "--json",
      ],
      files.root,
    );
    const designSynthetic = (
      design.report.approval_requirements as Array<Record<string, unknown>>
    ).find(({ gate }) => gate === "ux.mock.approved");
    assert.equal("evidence_semantics" in (designSynthetic ?? {}), false);

    const plan = await checkPlan(
      [
        files.plan,
        "--feature",
        "--spec",
        files.spec,
        "--design",
        files.design,
        "--require-approvals",
        "--json",
      ],
      files.root,
    );
    const planSynthetic = (
      plan.report.approval_requirements as Array<Record<string, unknown>>
    ).find(({ gate }) => gate === "ux.mock.approved");
    assert.equal("evidence_semantics" in (planSynthetic ?? {}), false);

    await writeFile(
      files.plan,
      `${await readFile(files.plan, "utf8")}UI Work: Yes\n`,
    );
    await mkdir(resolve(files.root, "src"));
    await mkdir(resolve(files.root, "tests"));
    await writeFile(
      resolve(files.root, "src", "app.js"),
      "export const ok = true;\n",
    );
    await writeFile(
      resolve(files.root, "tests", "app.test.js"),
      "export const ok = true;\n",
    );
    const code = await checkCode(
      [
        "--plan",
        files.plan,
        "--design",
        files.design,
        "--src",
        resolve(files.root, "src"),
        "--tests-dir",
        resolve(files.root, "tests"),
        "--tests-argv",
        JSON.stringify([process.execPath, "-e", "process.exit(0)"]),
        "--require-approvals",
        "--json",
      ],
      files.root,
      () => 0,
    );
    const codeSynthetic = (
      code.report.approval_requirements as Array<Record<string, unknown>>
    ).find(({ gate }) => gate === "ux.mock.approved");
    assert.equal("evidence_semantics" in (codeSynthetic ?? {}), false);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});
