/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Assertions intentionally inspect the heterogeneous parity model. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  cp,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runStatus } from "../../src/status/cli.mjs";
import {
  buildModel,
  compactValue,
  discover,
  metadata,
  parseWip,
  planPrs,
  workItems,
} from "../../src/status/model.mjs";
import {
  GUIDE_FILENAME,
  normalizeRenderedHtml,
  renderHtml,
} from "../../src/status/render.mjs";

const repositoryRoot = resolve(process.cwd());

async function write(path: string, contents: string): Promise<string> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, contents, "utf8");
  return path;
}

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-status-"));
  const spec = await write(
    join(root, "docs", "spec.md"),
    "# Example Service - Software Requirements Specification\n\nWork Scope: product/system\n",
  );
  await write(
    join(root, "docs", "design.md"),
    "# Example Service - Software Design Document\n\nWork Scope: product/system\nDesign Depth: HLD\n",
  );
  await write(
    join(root, "docs", "plan.md"),
    `# Example Service Work Plan

Work Scope: product/system
Plan Type: Breakdown

## Pull Requests / Child Work Items

### First runnable slice
<!-- sarathi:delivery id="WORK-DEMO-ALPHA" -->
  Parent scope: product/system.
  Child scope: slice/change.
  Scope: establish the first runnable slice.
  Learning wave: WAVE-DEMO-FIRST.

### Later capability
<!-- sarathi:delivery id="WORK-DEMO-BETA" -->
  Parent scope: product/system.
  Child scope: feature/component.
  Scope: add the later capability.
`,
  );
  await write(
    join(root, "docs", "plans", "alpha.md"),
    `# WORK-DEMO-ALPHA Implementation Plan

Parent Work Item: WORK-DEMO-ALPHA
Work Scope: slice/change
Plan Type: Implementation

## Pull Requests / Child Work Items

### Runtime slice
<!-- sarathi:delivery id="PR-DEMO-RUNTIME" -->

## Work Groups

### First feedback point
<!-- sarathi:wave id="WAVE-DEMO-FIRST" -->
Order: 1
Expected Result: Validate the public boundary.
Members: PR-DEMO-RUNTIME
Parallel Limit: 1
Review Point: Review the boundary evidence.
Stop Conditions: Stop if the public contract changes.
`,
  );
  await write(
    join(root, ".sdlc", "wip.md"),
    `# Current work
Status Result: Ready
Status Summary: The accepted slice can proceed.
Goal: Deliver the example safely.
Working Result: Requirements, design, and plan exist.
Blockers: None.
Next Action: Implement the runtime slice.
Work Target: Runtime slice
Work Scope: slice/change
Current Command: code-create
Current Work Group: WAVE-DEMO-FIRST
Current Work: WORK-DEMO-ALPHA
Active Slices: PR-DEMO-RUNTIME
Feedback Status: requested
`,
  );
  await write(
    join(root, ".sdlc", "process-decisions.yaml"),
    "delivery:\n  assurance_profile: standard\n  work_outcome: product_increment\n  extra_checks: [documentation]\napproval:\n  policy: human_checkpoints\n",
  );
  await write(
    join(root, ".sdlc", "approvals.yaml"),
    `version: 1
approvals:
  - id: APR-SPEC-DEMO
    gate: spec.approved
    scope: product/system
    artifact:
      kind: spec
      path: docs/spec.md
      sha256: ${createHash("sha256")
        .update(await readFile(spec))
        .digest("hex")}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:00Z"
`,
  );
  return root;
}

async function rendered(
  root: string,
): Promise<{ model: Awaited<ReturnType<typeof buildModel>>; html: string }> {
  const model = await buildModel(root);
  return {
    model,
    html: renderHtml(
      model,
      root,
      join(root, "docs", "sdlc-status.html"),
      GUIDE_FILENAME,
    ),
  };
}

async function childHash(root: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(join(root, "docs", "plans", "alpha.md")))
    .digest("hex");
}

async function fileHash(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

async function appendApproval(root: string, record: string): Promise<void> {
  const path = join(root, ".sdlc", "approvals.yaml");
  await writeFile(path, `${await readFile(path, "utf8")}${record}`, "utf8");
}

async function addTrace(root: string): Promise<void> {
  await write(join(root, "tests", "runtime.test.mts"), "export {};\n");
  await write(
    join(root, ".sdlc", "test-traceability.yaml"),
    "tests:\n  - plan: PR-DEMO-RUNTIME\n    path: tests/runtime.test.mts\n",
  );
}

async function decomposedFixture(): Promise<string> {
  const root = await fixture();
  await write(
    join(root, "docs", "work", "alpha", "spec.md"),
    "# Alpha Slice - Software Requirements Specification\nParent Work Item: WORK-DEMO-ALPHA\nWork Scope: slice/change\n",
  );
  await write(
    join(root, "docs", "work", "alpha", "design.md"),
    "# Alpha Slice Design\nParent Work Item: WORK-DEMO-ALPHA\nWork Scope: slice/change\nDesign Depth: LLD\n",
  );
  await write(
    join(root, "docs", "plans", "alpha.md"),
    `# WORK-DEMO-ALPHA Implementation Plan
Parent Work Item: WORK-DEMO-ALPHA
Work Scope: slice/change
Plan Type: Implementation

## Pull Requests / Child Work Items

### Boundary slice
<!-- sarathi:delivery id="PR-ALPHA-ONE" -->

### Completion slice
<!-- sarathi:delivery id="PR-ALPHA-TWO" -->

## Learning Waves

### First feedback point
<!-- sarathi:wave id="WAVE-DEMO-FIRST" -->
Order: 1
Learning Target: Validate the public API boundary.
Members: PR-ALPHA-ONE
WIP Limit: 1
Feedback/Integration Checkpoint: Review boundary evidence.
Stop/Replan Triggers: Stop if the request shape changes.

### Next feedback point
<!-- sarathi:wave id="WAVE-DEMO-NEXT" -->
Order: 2
Learning Target: Complete behavior after boundary feedback.
Members: PR-ALPHA-TWO
WIP Limit: 1
Feedback/Integration Checkpoint: Review acceptance evidence.
Stop/Replan Triggers: Replan if the first group changes intent.
`,
  );
  await write(join(root, "tests", "alpha.test.mts"), "export {};\n");
  await write(
    join(root, ".sdlc", "test-traceability.yaml"),
    `tests:
  - plan: PR-ALPHA-ONE
    path: tests/alpha.test.mts
  - plan: PR-ALPHA-TWO
    path: tests/alpha.test.mts
  - plan: PR-ALPHA-TWO
    path: tests/alpha.test.mts
`,
  );
  await write(
    join(root, ".sdlc", "wip.md"),
    `# Current work
Status Result: Ready
Status Summary: Boundary evidence is ready for review.
Goal: Deliver the example safely.
Working Result: The first boundary has executable evidence.
Blockers: None.
Next Action: Review the second group.
Work Target: Alpha delivery
Work Scope: slice/change
Current Command: code-assess
Active Learning Wave: WAVE-DEMO-NEXT
Active Slices: PR-ALPHA-TWO
Feedback Status: requested

## Relevant Files
| Kind | Path | Status | Notes |
| --- | --- | --- | --- |
| Plan | docs/plans/alpha.md | approved and implemented | Current slice. |
`,
  );
  await write(
    join(root, ".sdlc", "process-decisions.yaml"),
    "delivery:\n  assurance_profile: standard\n  work_outcome: product_increment\n  extra_checks: [external integration, documentation]\napproval:\n  policy: human_checkpoints\n",
  );
  await appendApproval(
    root,
    `  - id: APR-DESIGN-DEMO
    gate: design.approved
    scope: product/system
    artifact:
      kind: design
      path: docs/design.md
      sha256: ${await fileHash(join(root, "docs", "design.md"))}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:01Z"
  - id: APR-PLAN-DEMO
    gate: plan.approved
    scope: product/system
    artifact:
      kind: plan
      path: docs/plan.md
      sha256: ${await fileHash(join(root, "docs", "plan.md"))}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:02Z"
  - id: APR-PLAN-ALPHA
    gate: plan.approved
    scope: slice/change
    artifact:
      kind: plan
      path: docs/plans/alpha.md
      sha256: ${await fileHash(join(root, "docs", "plans", "alpha.md"))}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:03Z"
`,
  );
  return root;
}

test("status parsers preserve descriptive work and PR names", () => {
  const plan =
    '### First runnable slice\n<!-- sarathi:delivery id="WORK-DEMO-ALPHA" -->\nScope: first.\n### Runtime adapter\n<!-- sarathi:delivery id="PR-DEMO-RUNTIME" -->\n';
  assert.deepEqual(
    workItems(plan)[0].map(({ id, name, scope }) => ({ id, name, scope })),
    [{ id: "WORK-DEMO-ALPHA", name: "First runnable slice", scope: "first." }],
  );
  assert.deepEqual(planPrs(plan, { "PR-DEMO-RUNTIME": 2 }), [
    { id: "PR-DEMO-RUNTIME", name: "Runtime adapter", evidence_count: 2 },
  ]);
});

test("legacy ID names and multiline fields preserve Python behavior", () => {
  const plan = `- WORK-AUTH-SIGNIN
  Scope: line one
  continues here
  notes: something
`;
  assert.deepEqual(
    workItems(plan)[0].map(({ name, scope }) => ({ name, scope })),
    [
      {
        name: "Auth Signin",
        scope: "line one continues here notes: something",
      },
    ],
  );
});

test("status path and object ordering uses Unicode code points", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-status-order-"));
  try {
    await write(join(root, "a-b", "plan.md"), "# Hyphen\n");
    await write(join(root, "ab", "plan.md"), "# Plain\n");
    assert.deepEqual(
      (await discover(root, "plan.md")).map((path) =>
        path.slice(root.length + 1).replaceAll("\\", "/"),
      ),
      ["a-b/plan.md", "ab/plan.md"],
    );
    assert.equal(compactValue({ ab: 2, "a-b": 1 }), "a-b: 1; ab: 2");
    assert.equal(compactValue({ enabled: true }), "enabled: True");
    assert.deepEqual(metadata("Work Scope: feature...\n"), {
      "Work Scope": "feature",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("HTML is deterministic, escaped, standalone, and check detects staleness", async () => {
  const root = await fixture();
  try {
    const spec = join(root, "docs", "spec.md");
    await writeFile(
      spec,
      "# Example <script> - Software Requirements Specification\n\nWork Scope: product/system\n",
      "utf8",
    );
    const model = await buildModel(root);
    const output = join(root, "docs", "sdlc-status.html");
    const first = normalizeRenderedHtml(
      renderHtml(model, root, output, GUIDE_FILENAME),
    );
    const second = normalizeRenderedHtml(
      renderHtml(await buildModel(root), root, output, GUIDE_FILENAME),
    );
    assert.equal(first, second);
    assert.match(first, /Example &lt;script&gt;/);
    assert.doesNotMatch(first, /<script> - sarathi/);
    for (const expected of [
      "Project-reported engineering status",
      "Delivery progress",
      "Documents, code, and reviews",
      "WORK-DEMO-ALPHA",
      'aria-label="Workflow details"',
      "WAVE-DEMO-FIRST",
      "Implementation PRs",
      "PR-DEMO-RUNTIME",
      '<dialog id="approval-details"',
      'id="approval-details-trigger"',
      "APR-SPEC-DEMO covers an earlier version",
      "Review and approve the current version",
      "Current focus",
      "Expand all",
      "Collapse all",
      'class="status status-success"',
      'class="status status-progress"',
      'class="status status-pending"',
      "No child spec discovered",
      "Code + executable tests",
    ])
      assert.match(
        first,
        new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    assert.doesNotMatch(first, /class="operational-details"/);
    assert.doesNotMatch(first, /Workflow and learning details/);
    assert.doesNotMatch(first, /class="waves-view"/);
    assert.match(first, /<style>[\s\S]+<\/style>/);
    assert.match(first, /<script>[\s\S]+<\/script>/);
    assert.equal(
      await runStatus([
        root,
        "--write",
        "--output",
        output,
        "--guide-source",
        join(repositoryRoot, "docs", "sarathi.html"),
      ]),
      0,
    );
    const generatedBytes = await readFile(output);
    const guideBytes = await readFile(join(root, "docs", GUIDE_FILENAME));
    assert.equal(generatedBytes.includes(13), false);
    assert.equal(guideBytes.includes(13), false);
    assert.equal(
      guideBytes.includes(Buffer.from('href="sdlc-status.html"')),
      true,
    );
    assert.equal(
      await runStatus([
        root,
        "--output",
        output,
        "--guide-source",
        join(repositoryRoot, "docs", "sarathi.html"),
        "--check",
      ]),
      0,
    );
    await writeFile(output, "stale\n", "utf8");
    assert.equal(
      await runStatus([
        root,
        "--output",
        output,
        "--guide-source",
        join(repositoryRoot, "docs", "sarathi.html"),
        "--check",
      ]),
      1,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("status summary leaves existing project files byte-identical", async () => {
  const root = await fixture();
  const output = join(root, "docs", "sdlc-status.html");
  const guide = join(root, "docs", GUIDE_FILENAME);
  try {
    await writeFile(output, Buffer.from([0x73, 0x74, 0x61, 0x74, 0x75, 0x73]));
    await writeFile(guide, Buffer.from([0x67, 0x75, 0x69, 0x64, 0x65]));
    const outputBefore = await readFile(output);
    const guideBefore = await readFile(guide);
    assert.equal(await runStatus([root]), 0);
    assert.equal((await readFile(output)).equals(outputBefore), true);
    assert.equal((await readFile(guide)).equals(guideBefore), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Git discovery excludes ignored project directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-git-status-"));
  try {
    assert.equal(
      spawnSync("git", ["init", "--quiet"], { cwd: root }).status,
      0,
    );
    await write(join(root, ".gitignore"), "var/\n");
    await write(join(root, "docs", "spec.md"), "# Tracked status\n");
    await write(join(root, "var", "plan.md"), "# Ignored status\n");
    const paths = (await discover(root, "*.md")).map((path) =>
      path.slice(root.length + 1).replaceAll("\\", "/"),
    );
    assert.deepEqual(paths, ["docs/spec.md"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Git discovery ignores tracked files deleted from the working tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-git-deleted-"));
  try {
    assert.equal(
      spawnSync("git", ["init", "--quiet"], { cwd: root }).status,
      0,
    );
    const spec = await write(join(root, "docs", "spec.md"), "# Deleted\n");
    assert.equal(
      spawnSync("git", ["add", "docs/spec.md"], { cwd: root }).status,
      0,
    );
    await rm(spec);
    const model = await buildModel(root);
    assert.equal(model.stages.spec.state, "missing");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test(
  "non-Git fallback tolerates an inaccessible irrelevant directory",
  { skip: process.platform === "win32" },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "sarathi-node-inaccessible-"));
    const blocked = join(root, "blocked");
    try {
      await write(join(root, "docs", "spec.md"), "# Available\n");
      await write(join(blocked, "plan.md"), "# Irrelevant\n");
      await chmod(blocked, 0o000);
      await assert.doesNotReject(discover(root, "*.md"));
    } finally {
      await chmod(blocked, 0o700).catch(() => undefined);
      await rm(root, { recursive: true, force: true });
    }
  },
);

test("embedded model neutralizes mixed-case script terminators", async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, "docs", "spec.md"),
      "# Example </ScRiPt><script>alert(1)</script> - Software Requirements Specification\n\nWork Scope: product/system\n",
      "utf8",
    );
    const html = normalizeRenderedHtml(
      renderHtml(
        await buildModel(root),
        root,
        join(root, "docs", "sdlc-status.html"),
        GUIDE_FILENAME,
      ),
    );
    const embedded =
      /<script type="application\/json" id="workflow-model">([\s\S]*?)<\/script>/.exec(
        html,
      )?.[1] ?? "";
    assert.doesNotMatch(embedded, /</);
    assert.match(embedded, /\\u003c\/ScRiPt>/);
    assert.equal(
      JSON.parse(embedded).project,
      "Example </ScRiPt><script>alert(1)</script>",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("compiled CLI preserves root, output, guide-source, and check behavior", async () => {
  const root = await fixture();
  const output = join(root, "published", "status.html");
  const cli = join(
    repositoryRoot,
    ".node-test-dist",
    "src",
    "status",
    "cli.mjs",
  );
  const args = [
    cli,
    root,
    "--output",
    output,
    "--guide-source",
    join(repositoryRoot, "docs", "sarathi.html"),
  ];
  try {
    const generated = spawnSync(process.execPath, [...args, "--write"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    assert.equal(generated.status, 0, generated.stderr);
    assert.match(generated.stdout, /wrote /);
    assert.equal(
      await readFile(output, "utf8").then((text) =>
        text.includes("Sarathi project status"),
      ),
      true,
    );
    assert.equal(
      (await readFile(join(root, "published", GUIDE_FILENAME))).length > 100,
      true,
    );
    const checked = spawnSync(process.execPath, [...args, "--check"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    assert.equal(checked.status, 0, checked.stderr);
    assert.equal(checked.stdout, "");

    const equalsOutput = join(root, "published", "equals-status.html");
    const equals = spawnSync(
      process.execPath,
      [
        cli,
        root,
        `--output=${equalsOutput}`,
        `--guide-source=${join(repositoryRoot, "docs", "sarathi.html")}`,
        "--write",
      ],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    assert.equal(equals.status, 0, equals.stderr);
    assert.equal(
      await readFile(equalsOutput).then((value) => value.length > 0),
      true,
    );
    await writeFile(output, "stale\n", "utf8");
    const stale = spawnSync(process.execPath, [...args, "--check"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /status page is out of date/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("compiled CLI resolves explicit relative output from process cwd", async () => {
  const root = await fixture();
  const invocationCwd = await mkdtemp(
    join(tmpdir(), "sarathi-node-status-cwd-"),
  );
  const cli = join(
    repositoryRoot,
    ".node-test-dist",
    "src",
    "status",
    "cli.mjs",
  );
  const relativeOutput = join("published", "relative-status.html");
  try {
    const generated = spawnSync(
      process.execPath,
      [
        cli,
        root,
        "--write",
        "--output",
        relativeOutput,
        "--guide-source",
        join(repositoryRoot, "docs", "sarathi.html"),
      ],
      { cwd: invocationCwd, encoding: "utf8" },
    );
    assert.equal(generated.status, 0, generated.stderr);
    assert.equal(
      (await readFile(join(invocationCwd, relativeOutput), "utf8")).includes(
        "Sarathi project status",
      ),
      true,
    );
    await assert.rejects(readFile(join(root, relativeOutput)), {
      code: "ENOENT",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(invocationCwd, { recursive: true, force: true });
  }
});

test("compact WIP fields retain plain-language product and learning state", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-wip-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      `# SDLC Work In Progress
Status Result: Ready
Status Summary: The reviewed export path is ready for implementation.
Goal: Deliver report exports in the target service.
Working Result: CSV and PDF exports run in the established service.
Work Target: Report export delivery
Work Scope: feature/component
Current Command: code-create
Ready To Implement: Yes
Blockers: Complete the target persistence review.
Next Action: Run the target persistence assessment.

## Relevant Files
| Kind | Path | Status | Notes |
| --- | --- | --- | --- |
| Plan | docs/export-plan.md | approved | Current implementation source. |

## Feedback
Expected Result: Confirm the public behavior.
Feedback From: API consumer
Feedback Status: requested
Feedback Evidence: docs/review.md
Current Work Group: WAVE-DEMO-NEXT
Current Work: WORK-DEMO-ALPHA
Parallel Limit: 1
What Changed: Nothing yet.
Documents To Update: none
Stop Conditions: Stop if the API changes.
`,
    );
    const wip = await parseWip(root);
    assert.equal(wip["Work Target"], "Report export delivery");
    assert.equal(wip["Current Command"], "code-create");
    assert.deepEqual(wip.product_status, {
      status_result: "Ready",
      status_summary: "The reviewed export path is ready for implementation.",
      goal: "Deliver report exports in the target service.",
      working_result: "CSV and PDF exports run in the established service.",
      blockers: "Complete the target persistence review.",
      next_action: "Run the target persistence assessment.",
    });
    assert.equal(wip.artifacts["docs/export-plan.md"].status, "approved");
    assert.equal(wip.learning.target, "Confirm the public behavior.");
    assert.equal(wip.learning.active_work_item, "WORK-DEMO-ALPHA");
    assert.equal(wip.learning.stop_or_replan, "Stop if the API changes.");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer promotes legacy combined stage to current command", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-legacy-command-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Work Scope: feature/component\nCurrent Stage: plan-review\n",
    );
    const { model, html } = await rendered(root);
    assert.equal(model.wip["Current Command"], "plan-review");
    assert.equal(model.current_activity.legacy_command_field, true);
    assert.match(html, /Command: plan-review\. Stage: plan\. Action: review\./);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer reads delivery choices copied into legacy wip", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-legacy-delivery-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Delivery Assurance Profile: Standard\nReview Level: Lean\nApproval Policy: Automatic eligible gates\nWork Outcome: Decision/evidence\nExtra Checks: external integration\n",
    );
    const { model, html } = await rendered(root);
    assert.deepEqual(model.delivery, {
      profile: "Standard",
      approval_policy: "Automatic eligible gates",
      work_outcome: "Decision/evidence",
      modules: "external integration",
    });
    assert.match(
      html,
      /Delivery path: Standard\. Approvals: Automatic eligible gates\./,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer prefers source documents then project choices over legacy wip", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-delivery-order-"));
  try {
    await write(
      join(root, "docs", "plan.md"),
      "# Delivery plan\nDelivery Assurance Profile: High-assurance\n",
    );
    await write(
      join(root, ".sdlc", "process-decisions.yaml"),
      "delivery:\n  assurance_profile: standard\n  work_outcome: product_increment\n  extra_checks: [security, accessibility]\napproval:\n  policy: human_checkpoints\n",
    );
    await write(
      join(root, ".sdlc", "wip.md"),
      "Delivery Assurance Profile: Lean\nApproval Policy: Automatic eligible gates\nWork Outcome: Decision/evidence\nExtra Checks: none\n",
    );
    assert.deepEqual((await buildModel(root)).delivery, {
      profile: "High-assurance",
      approval_policy: "Human checkpoints",
      work_outcome: "Product increment",
      modules: "security, accessibility",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer still reads legacy artifact paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-legacy-paths-"));
  try {
    await write(
      join(root, "docs", "features", "auth.spec.md"),
      "# Auth - Software Requirements Specification\nWork Scope: feature/component\n",
    );
    await write(
      join(root, ".sdlc", "artifact-paths.yaml"),
      "canonical:\n  spec: docs/features/auth.spec.md\n",
    );
    assert.equal(
      (await buildModel(root)).stages.spec.path,
      "docs/features/auth.spec.md",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer does not infer a green status when none is recorded", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-empty-status-"));
  try {
    const { html } = await rendered(root);
    assert.match(html, /Status result: Cannot assess yet/);
    assert.doesNotMatch(html, /Status result: Ready/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer rejects auto approval under human checkpoints", async () => {
  const root = await fixture();
  try {
    const approvals = join(root, ".sdlc", "approvals.yaml");
    await writeFile(
      approvals,
      (await readFile(approvals, "utf8")).replace(
        "status: approved",
        "status: auto-approved",
      ),
      "utf8",
    );
    await write(
      join(root, ".sdlc", "gates.yaml"),
      'auto_approval:\n  enabled: true\n  expires_at: "2999-01-01T00:00:00Z"\n  allowed_scopes: [product/system]\n  allowed_gates: [spec.approved]\n',
    );
    assert.equal((await buildModel(root)).stages.spec.state, "stale");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer rejects auto approval outside gate policy", async () => {
  const root = await fixture();
  try {
    const approvals = join(root, ".sdlc", "approvals.yaml");
    await writeFile(
      approvals,
      (await readFile(approvals, "utf8")).replace(
        "status: approved",
        "status: auto-approved",
      ),
      "utf8",
    );
    await write(
      join(root, ".sdlc", "process-decisions.yaml"),
      "approval:\n  policy: automatic_eligible_gates\n",
    );
    await write(
      join(root, ".sdlc", "gates.yaml"),
      'auto_approval:\n  enabled: true\n  expires_at: "2999-01-01T00:00:00Z"\n  allowed_scopes: [product/system]\n  allowed_gates: [design.approved]\n',
    );
    assert.equal((await buildModel(root)).stages.spec.state, "stale");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("product snapshot is visually primary and process state is secondary", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-product-first-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Goal: Deliver report exports.\nCurrent Increment: Renderer extraction: complete.\nTarget-Owned Work: Target persistence has not started.\nCurrent Command: plan-review\n",
    );
    const { html } = await rendered(root);
    assert.ok(
      html.indexOf("Status result: Cannot assess yet") <
        html.indexOf("Documents, code, and reviews"),
    );
    assert.match(html, /Renderer extraction: complete\./);
    assert.match(html, /Target persistence has not started\./);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer parses table only delivery definitions", () => {
  const plan =
    "| Machine ID | Human delivery item | Evidence |\n| --- | --- | --- |\n| WORK-DEMO-ALPHA | First runnable slice | acceptance |\n| PR-DEMO-COMPAT | Compatibility adapter | tests |\n";
  assert.deepEqual(
    workItems(plan)[0].map(({ id, name }) => ({ id, name })),
    [{ id: "WORK-DEMO-ALPHA", name: "First runnable slice" }],
  );
  assert.deepEqual(planPrs(plan, { "PR-DEMO-COMPAT": 1 }), [
    { id: "PR-DEMO-COMPAT", name: "Compatibility adapter", evidence_count: 1 },
  ]);
});

test("spec only leaves downstream stages visibly empty", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-spec-only-"));
  try {
    await write(
      join(root, "docs", "spec.md"),
      "# Example - Software Requirements Specification\nWork Scope: product/system\n",
    );
    const { model, html } = await rendered(root);
    assert.equal(model.stages.spec.state, "unapproved");
    assert.equal(model.stages.design.state, "missing");
    assert.equal(model.stages.plan.state, "missing");
    assert.match(html, /No child work planned/);
    assert.match(html, /href="sarathi-process\.html">Process guide/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("pr sized root plan renders ordered pr waves", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-root-pr-"));
  try {
    await write(
      join(root, "docs", "spec.md"),
      "# Leaf - Software Requirements Specification\nWork Scope: slice/change\n",
    );
    await write(
      join(root, "docs", "design.md"),
      "# Leaf Design\nWork Scope: slice/change\nDesign Depth: LLD\n",
    );
    await write(
      join(root, "docs", "plan.md"),
      "# Leaf Implementation Plan\nWork Scope: slice/change\nPlan Type: Implementation\n\n## Pull Requests / Child Work Items\n- PR-LEAF-BOUNDARY Scope: establish boundary.\n- PR-LEAF-FINISH Scope: finish.\n\n## Learning Waves\n\n### WAVE-LEAF-BOUNDARY\nOrder: 1\nLearning Target: Validate boundary.\nMembers: PR-LEAF-BOUNDARY\nWIP Limit: 1\nFeedback/Integration Checkpoint: Review boundary.\nStop/Replan Triggers: Stop if changed.\n\n### WAVE-LEAF-FINISH\nOrder: 2\nLearning Target: Finish behavior.\nMembers: PR-LEAF-FINISH\nWIP Limit: 1\nFeedback/Integration Checkpoint: Review acceptance.\nStop/Replan Triggers: Replan if needed.\n",
    );
    await write(
      join(root, ".sdlc", "wip.md"),
      "Active Learning Wave: WAVE-LEAF-BOUNDARY\nActive Slices: PR-LEAF-BOUNDARY\n",
    );
    const { model, html } = await rendered(root);
    const waves = model.learning_waves.sequences[0].waves;
    assert.deepEqual(
      model.root_prs.map((pr: { id: string }) => pr.id),
      ["PR-LEAF-BOUNDARY", "PR-LEAF-FINISH"],
    );
    assert.equal(waves[0].state, "in-progress");
    assert.equal(waves[1].state, "not-started");
    assert.match(html, /Slice workflow/);
    assert.match(html, /WAVE-LEAF-BOUNDARY/);
    assert.match(html, /PR-LEAF-FINISH/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("lean change record replaces child spec and design nodes", async () => {
  const root = await fixture();
  try {
    const child = join(root, "docs", "plans", "alpha.md");
    await writeFile(
      child,
      `${await readFile(child, "utf8")}\nDelivery Profile: Lean\nLean Change Record: Yes\n`,
      "utf8",
    );
    const { model, html } = await rendered(root);
    assert.equal(model.work_items[0].child_spec, null);
    assert.equal(model.work_items[0].child_design, null);
    assert.match(html, /Compact plan/);
    assert.doesNotMatch(html, /Slice spec/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("inherited intent record replaces child spec and design nodes", async () => {
  const root = await fixture();
  try {
    const child = join(root, "docs", "plans", "alpha.md");
    await writeFile(
      child,
      `${await readFile(child, "utf8")}\nInherited Intent Record: Yes\n`,
      "utf8",
    );
    const { model, html } = await rendered(root);
    assert.equal(
      model.work_items[0].child_plan.metadata["Inherited Intent Record"],
      "Yes",
    );
    assert.match(html, /Compact plan/);
    assert.doesNotMatch(html, /Slice spec/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hash current code slice approval marks only the slice handed off", async () => {
  const root = await fixture();
  try {
    await appendApproval(
      root,
      `  - id: APR-CODE-DEMO-ALPHA
    gate: code_slice.approved
    scope: slice/change
    artifact:
      kind: plan
      path: docs/plans/alpha.md
      sha256: ${await childHash(root)}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:04Z"
`,
    );
    const { model, html } = await rendered(root);
    assert.equal(model.work_items[0].state, "slice-handed-off");
    assert.equal(model.summary.handed_off_items, 1);
    assert.match(html, /Approved for the next integration step/);
    assert.doesNotMatch(html, />Completed</);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("handed off children do not complete the parent feature", async () => {
  const root = await fixture();
  try {
    await write(
      join(root, "docs", "plans", "alpha.md"),
      '# Alpha feature breakdown\nParent Work Item: WORK-DEMO-ALPHA\nWork Scope: feature/component\nPlan Type: Breakdown\n\n## Pull Requests / Child Work Items\n\n### Leaf delivery\n<!-- sarathi:delivery id="WORK-ALPHA-LEAF" -->\n  Parent scope: feature/component.\n  Child scope: slice/change.\n  Scope: deliver a leaf.\n',
    );
    const leaf = await write(
      join(root, "docs", "plans", "leaf.md"),
      "# Alpha leaf implementation\nParent Work Item: WORK-ALPHA-LEAF\nWork Scope: slice/change\nPlan Type: Implementation\n\n## Pull Requests / Child Work Items\n- PR-ALPHA-LEAF\n",
    );
    await appendApproval(
      root,
      `  - id: APR-CODE-ALPHA-LEAF
    gate: code_slice.approved
    scope: slice/change
    artifact:
      kind: plan
      path: docs/plans/leaf.md
      sha256: ${createHash("sha256")
        .update(await readFile(leaf))
        .digest("hex")}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:04Z"
`,
    );
    const { model, html } = await rendered(root);
    assert.equal(model.work_items[0].state, "children-assessed");
    assert.equal(model.work_items[0].children[0].state, "slice-handed-off");
    assert.match(
      html,
      /Child work passed checks and review or was approved for the next step/,
    );
    assert.doesNotMatch(html, />Completed</);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale wave checkpoint does not complete wave", async () => {
  const root = await fixture();
  try {
    await write(
      join(root, ".sdlc", "wave-checkpoints.yaml"),
      `checkpoints:
  - id: CHECK-WAVE-DEMO-FIRST
    wave: WAVE-DEMO-FIRST
    plan:
      path: docs/plans/alpha.md
      sha256: ${"0".repeat(64)}
    members: [PR-DEMO-RUNTIME]
    status: completed
`,
    );
    const { model, html } = await rendered(root);
    assert.equal(model.summary.completed_waves, 0);
    assert.match(html, /work-group checkpoint is for an earlier plan version/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy passing assessment without learning remains valid", async () => {
  const root = await fixture();
  try {
    await write(
      join(root, ".sdlc", "code-assessments.yaml"),
      `assessments:
  - id: ASSESS-CODE-DEMO-LEGACY
    work_item: WORK-DEMO-ALPHA
    plan:
      path: docs/plans/alpha.md
      sha256: ${await childHash(root)}
    verdict: Pass
`,
    );
    const { model, html } = await rendered(root);
    assert.equal(model.work_items[0].state, "assessed");
    assert.deepEqual(model.work_items[0].code_assessment.learning, {});
    assert.match(html, /Not recorded/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale code assessment remains evidence", async () => {
  const root = await fixture();
  try {
    await addTrace(root);
    await write(
      join(root, ".sdlc", "code-assessments.yaml"),
      `assessments:
  - id: ASSESS-CODE-DEMO-STALE
    work_item: WORK-DEMO-ALPHA
    plan:
      path: docs/plans/alpha.md
      sha256: ${"0".repeat(64)}
    verdict: Pass
`,
    );
    const model = await buildModel(root);
    assert.equal(model.work_items[0].state, "evidence");
    assert.equal(model.work_items[0].code_assessment, null);
    assert.equal(model.summary.assessed_items, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("latest nonpassing assessment supersedes earlier pass", async () => {
  const root = await fixture();
  try {
    await addTrace(root);
    const hash = await childHash(root);
    await write(
      join(root, ".sdlc", "code-assessments.yaml"),
      `assessments:
  - id: ASSESS-CODE-DEMO-PASS
    work_item: WORK-DEMO-ALPHA
    plan:
      path: docs/plans/alpha.md
      sha256: ${hash}
    verdict: Pass
  - id: ASSESS-CODE-DEMO-FIXES
    work_item: WORK-DEMO-ALPHA
    plan:
      path: docs/plans/alpha.md
      sha256: ${hash}
    verdict: Pass-with-fixes
`,
    );
    const model = await buildModel(root);
    assert.equal(model.work_items[0].state, "evidence");
    assert.equal(model.work_items[0].code_assessment, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("malformed work allocation is visible but excluded", async () => {
  const root = await fixture();
  try {
    const plan = join(root, "docs", "plan.md");
    await writeFile(
      plan,
      (await readFile(plan, "utf8")).replaceAll(
        "WORK-DEMO-BETA",
        "WORK-SHARING",
      ),
      "utf8",
    );
    const { model, html } = await rendered(root);
    assert.deepEqual(model.malformed_allocations, ["WORK-SHARING"]);
    assert.equal(model.summary.work_items, 1);
    assert.equal(model.summary.malformed_work_items, 1);
    assert.match(html, /1 invalid work item excluded from the totals/);
    assert.match(html, /WORK-SHARING/);
    assert.match(html, /Use <code>WORK-AREA-NAME<\/code>/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("check detects stale static process guide", async () => {
  const root = await fixture();
  const output = join(root, "docs", "sdlc-status.html");
  const guide = join(root, "docs", GUIDE_FILENAME);
  try {
    const args = [
      root,
      "--output",
      output,
      "--guide-source",
      join(repositoryRoot, "docs", "sarathi.html"),
    ];
    assert.equal(await runStatus([...args, "--write"]), 0);
    await writeFile(guide, "stale\n", "utf8");
    assert.equal(await runStatus([...args, "--check"]), 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing static process guide is an error", async () => {
  const root = await fixture();
  const isolated = await mkdtemp(join(tmpdir(), "sarathi-node-no-guide-"));
  const output = join(root, "docs", "missing-guide-status.html");
  try {
    await cp(
      join(repositoryRoot, ".node-test-dist", "src"),
      join(isolated, "dist"),
      { recursive: true },
    );
    const result = spawnSync(
      process.execPath,
      [
        join(isolated, "dist", "status", "cli.mjs"),
        root,
        "--write",
        "--output",
        output,
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 2);
    assert.match(result.stderr, /static process guide not found/);
    await assert.rejects(readFile(output), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(isolated, { recursive: true, force: true });
  }
});

test("renderer reads artifact paths from process decisions", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-mapped-path-"));
  try {
    await write(
      join(root, "docs", "features", "auth.spec.md"),
      "# Auth - Software Requirements Specification\nWork Scope: feature/component\n",
    );
    await write(
      join(root, ".sdlc", "process-decisions.yaml"),
      "artifact_paths:\n  canonical:\n    spec: docs/features/auth.spec.md\n",
    );
    assert.equal(
      (await buildModel(root)).stages.spec.path,
      "docs/features/auth.spec.md",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("null project artifact paths fall back to the legacy mapping", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-null-paths-"));
  try {
    await write(
      join(root, "docs", "auth.spec.md"),
      "# Auth - Software Requirements Specification\n",
    );
    await write(
      join(root, ".sdlc", "process-decisions.yaml"),
      "artifact_paths: null\n",
    );
    await write(
      join(root, ".sdlc", "artifact-paths.yaml"),
      "canonical:\n  spec: docs/auth.spec.md\n",
    );
    assert.equal(
      (await buildModel(root)).stages.spec.path,
      "docs/auth.spec.md",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("empty WIP aliases remain present and block later aliases", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-empty-wip-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Feedback From:   \nFeedback Target: later\n",
    );
    assert.deepEqual((await parseWip(root)).learning, { feedback_target: "" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repeated outer table pipes are stripped like Python", () => {
  assert.deepEqual(
    workItems("|||WORK-AUTH-SIGNIN|Sign in|||\n")[0].map(({ id, name }) => ({
      id,
      name,
    })),
    [{ id: "WORK-AUTH-SIGNIN", name: "Sign in" }],
  );
});

test("renderer shows invalid workflow state values", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-invalid-state-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Current Command: coding\nFeedback Status: waiting\n",
    );
    const { model, html } = await rendered(root);
    assert.deepEqual(
      new Set(
        model.workflow_state_issues.map(
          (item: { field: string }) => item.field,
        ),
      ),
      new Set(["Current Command", "Feedback Status"]),
    );
    assert.match(html, /Current-work or project-choice values need correction/);
    assert.match(html, /expected a command such as plan-review/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer leads with recorded plain language status", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-plain-status-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Status Result: Not ready\nStatus Summary: The release still exposes an internal screen.\nGoal: Release safely.\n",
    );
    const { model, html } = await rendered(root);
    assert.equal(model.wip.product_status.status_result, "Not ready");
    assert.match(html, /Status result: Not ready/);
    assert.match(html, /The release still exposes an internal screen/);
    assert.match(html, /project-authored status snapshot/);
    assert.ok(
      html.indexOf("Status result: Not ready") <
        html.indexOf("Delivery progress"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer rejects scoped text in the four value status field", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-scoped-status-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Status Result: Ready for implementation planning\nStatus Summary: Planning can start, but release is not ready.\n",
    );
    const { html } = await rendered(root);
    assert.match(html, /Status result: Cannot assess yet/);
    assert.doesNotMatch(
      html,
      /Status result: Ready for implementation planning/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderer keeps scope in summary beside a base status", async () => {
  const root = await mkdtemp(join(tmpdir(), "sarathi-node-status-summary-"));
  try {
    await write(
      join(root, ".sdlc", "wip.md"),
      "Status Result: Ready\nStatus Summary: Ready for implementation planning, not release.\n",
    );
    const { html } = await rendered(root);
    assert.match(html, /Status result: Ready/);
    assert.match(html, /Ready for implementation planning, not release/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("decomposition expands into child plan prs and evidence", async () => {
  const root = await decomposedFixture();
  try {
    const model = await buildModel(root);
    const [alpha, beta] = model.work_items;
    assert.deepEqual(model.delivery, {
      profile: "Standard",
      approval_policy: "Human checkpoints",
      work_outcome: "Product increment",
      modules: "external integration, documentation",
    });
    assert.equal(model.summary.approved_stages, 3);
    assert.equal(model.summary.work_items, 2);
    assert.equal(model.summary.expanded_items, 1);
    assert.equal(model.summary.pr_slices, 2);
    assert.equal(model.summary.evidenced_prs, 2);
    assert.equal(model.summary.learning_waves, 2);
    assert.equal(alpha.state, "evidence");
    assert.equal(alpha.child_spec.path, "docs/work/alpha/spec.md");
    assert.equal(alpha.child_design.path, "docs/work/alpha/design.md");
    assert.equal(alpha.child_plan.approval.state, "approved");
    assert.equal(alpha.evidence_count, 3);
    assert.equal(alpha.wip_claim.status, "approved and implemented");
    assert.equal(
      model.learning_waves.sequences[0].waves[0].member_states[0].detail,
      "1 linked tests",
    );
    assert.equal(model.learning_waves.sequences[0].waves[1].active, true);
    assert.equal(beta.state, "frontier");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale approval is distinct from missing approval", async () => {
  const root = await fixture();
  try {
    await appendApproval(
      root,
      `  - id: APR-DESIGN-DEMO
    gate: design.approved
    scope: product/system
    artifact:
      kind: design
      path: docs/design.md
      sha256: ${await fileHash(join(root, "docs", "design.md"))}
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:01Z"
`,
    );
    await writeFile(
      join(root, "docs", "spec.md"),
      `${await readFile(join(root, "docs", "spec.md"), "utf8")}\nChanged.\n`,
      "utf8",
    );
    const model = await buildModel(root);
    assert.equal(model.stages.spec.state, "stale");
    assert.equal(model.stages.design.state, "approved");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hash current passing code assessment marks work assessed", async () => {
  const root = await decomposedFixture();
  try {
    await write(
      join(root, ".sdlc", "delivery-records.yaml"),
      `records:
  - kind: code_assessment
    id: ASSESS-CODE-DEMO-ALPHA
    work_item: WORK-DEMO-ALPHA
    plan:
      path: docs/plans/alpha.md
      sha256: ${await childHash(root)}
    verdict: Pass
    assessed_at: "2026-07-15T00:00:04Z"
    learning:
      target: Prove the API boundary with a consumer-visible example.
      feedback_target: API consumer review.
      feedback_status: received
      feedback_evidence: docs/reviews/api-boundary.md
      invalidation_result: The request-shape assumption held.
      ancestor_impact:
        design: "revision-proposed: record observed retry timing"
        plan: "no-change: remaining work is unaffected"
        spec: "no-change: accepted behavior remains correct"
      stop_or_replan: Stop if the provider contract changes.
`,
    );
    const { model, html } = await rendered(root);
    assert.equal(model.work_items[0].state, "assessed");
    assert.equal(model.work_items[0].code_assessment.verdict, "Pass");
    assert.equal(model.summary.assessed_items, 1);
    assert.match(html, /Code checks and review passed/);
    assert.match(html, /What we learned/);
    assert.match(html, /Feedback received/);
    assert.match(html, /revision-proposed: record observed retry timing/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hash current wave checkpoint closes one wave only", async () => {
  const root = await decomposedFixture();
  try {
    await write(
      join(root, ".sdlc", "delivery-records.yaml"),
      `records:
  - kind: wave_checkpoint
    id: CHECK-WAVE-DEMO-FIRST
    wave: WAVE-DEMO-FIRST
    plan:
      path: docs/plans/alpha.md
      sha256: ${await childHash(root)}
    members: [PR-ALPHA-ONE]
    status: completed
    completed_at: "2026-07-15T00:00:04Z"
`,
    );
    const { model, html } = await rendered(root);
    const waves = model.learning_waves.sequences[0].waves;
    assert.equal(model.summary.completed_waves, 1);
    assert.equal(model.summary.active_waves, 1);
    assert.equal(waves[0].state, "completed");
    assert.equal(waves[0].member_states[0].state, "completed");
    assert.equal(waves[1].state, "in-progress");
    assert.doesNotMatch(html, /class="waves-view"/);
    assert.doesNotMatch(html, /Plan checks needing attention/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("malformed wave declaration stays visible for repair", async () => {
  const root = await decomposedFixture();
  try {
    const child = join(root, "docs", "plans", "alpha.md");
    await writeFile(
      child,
      (await readFile(child, "utf8")).replace("WAVE-DEMO-FIRST", "WAVE-FIRST"),
      "utf8",
    );
    const { model, html } = await rendered(root);
    assert.equal(model.summary.learning_waves, 1);
    assert.equal(
      model.learning_waves.issues[0].message,
      "malformed wave IDs: WAVE-FIRST",
    );
    assert.match(html, /Plan checks needing attention/);
    assert.match(html, /WAVE-FIRST/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
