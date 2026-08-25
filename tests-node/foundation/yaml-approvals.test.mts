import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  approvalGatePassed,
  approvalRequirement,
  loadApprovalContext,
  parseYamlSubset,
  sha256File,
  validUtcTimestamp,
} from "../../src/checkers/lib/approvals.mjs";

test("bounded YAML accepts only the existing nested subset", () => {
  assert.deepEqual(
    parseYamlSubset(`approval:
  enabled: true
  count: 2
  note: "kept # literally"
  values: [one, false, null]
records:
  - id: APR-ONE
    scope: feature/component
`),
    {
      approval: {
        enabled: true,
        count: 2,
        note: "kept # literally",
        values: ["one", false, null],
      },
      records: [{ id: "APR-ONE", scope: "feature/component" }],
    },
  );
  assert.throws(() => parseYamlSubset("root:\n    child: yes\n  peer: no"));
  assert.deepEqual(parseYamlSubset("first: one\rsecond: two"), {
    first: "one",
    second: "two",
  });
  assert.deepEqual(parseYamlSubset("large: 9007199254740993123456789"), {
    large: 9007199254740993123456789n,
  });
});

test("directory artifact paths are reported as missing files", async () => {
  const root = await testTemp("directory-artifact");
  assert.equal(await sha256File(root), null);
});

test("UTC timestamps are strict and exact file bytes determine SHA-256", async () => {
  assert.equal(validUtcTimestamp("2026-08-21T10:20:30Z"), true);
  assert.equal(validUtcTimestamp("2026-02-30T10:20:30Z"), false);
  assert.equal(validUtcTimestamp("0099-08-21T10:20:30Z"), true);
  assert.equal(validUtcTimestamp("0000-08-21T10:20:30Z"), false);
  assert.equal(validUtcTimestamp("2026-08-21T10:20:30+00:00"), false);
  const root = await testTemp("hash");
  const artifact = join(root, "artifact.md");
  await writeFile(artifact, Buffer.from([0x61, 0x0d, 0x0a]));
  assert.equal(
    await sha256File(artifact),
    "8e4621379786ef42a4fec155cd525c291dd7db3c1fde3478522f4f61c03fd1bd",
  );
});

test("approval matching accepts a current automatic approval under bounded policy", async () => {
  const root = await testTemp("approval");
  await mkdir(join(root, ".sdlc"), { recursive: true });
  await writeFile(join(root, "spec.md"), "accepted\n");
  const digest = await sha256File(join(root, "spec.md"));
  assert.notEqual(digest, null);
  await writeFile(
    join(root, ".sdlc", "process-decisions.yaml"),
    "approval:\n  policy: automatic_eligible_gates\n",
  );
  await writeFile(
    join(root, ".sdlc", "gates.yaml"),
    `auto_approval:
  enabled: true
  allowed_gates: [spec.approved]
  allowed_scopes: [feature/component]
  expires_at: 2099-01-01T00:00:00Z
`,
  );
  await writeFile(
    join(root, ".sdlc", "approvals.yaml"),
    `approvals:
  - id: APR-SPEC
    gate: spec.approved
    scope: feature/component
    status: auto-approved
    approved_by: agent
    approved_at: 2026-08-21T10:20:30Z
    artifact:
      kind: spec
      path: spec.md
      sha256: ${digest}
`,
  );

  const context = await loadApprovalContext(root);
  const requirement = approvalRequirement(
    context,
    root,
    "spec.approved",
    "spec.md",
    { scope: "feature/component", artifactKind: "spec" },
  );
  assert.equal(requirement.approved, true);
  assert.equal(requirement.approval_id, "APR-SPEC");
  assert.equal(approvalGatePassed([requirement]), true);
});

async function testTemp(label: string): Promise<string> {
  const root = join(
    tmpdir(),
    `sarathi-node-${label}-${process.pid}-${Math.random().toString(16).slice(2)}`,
  );
  await mkdir(root, { recursive: true });
  return root;
}
