/* eslint-disable @typescript-eslint/no-non-null-assertion -- withFiles creates every declared fixture path before invoking the callback */
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { checkDesign } from "../../src/checkers/check_design.mjs";
import { checkPlan } from "../../src/checkers/check_plan.mjs";
import { checkSpec } from "../../src/checkers/check_spec.mjs";
import {
  humanFirstDesign,
  humanFirstPlan,
  humanFirstSpec,
  migrationDesign,
  smallChangePlan,
} from "./edges/human-first-fixtures.mjs";

type Report = Record<string, unknown>;

async function withFiles<T>(
  files: Record<string, string>,
  action: (paths: Record<string, string>, root: string) => Promise<T>,
): Promise<T> {
  const root = await mkdtemp(resolve(".node-human-first-"));
  try {
    const paths: Record<string, string> = {};
    for (const [name, content] of Object.entries(files)) {
      paths[name] = resolve(root, name);
      await writeFile(paths[name], content);
    }
    return await action(paths, root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function nested(report: Report, key: string): Record<string, unknown> {
  return report[key] as Record<string, unknown>;
}

test("human-first spec resolves annotations and checks structure", async () => {
  await withFiles(
    { "spec.md": humanFirstSpec },
    async ({ "spec.md": path }, root) => {
      const result = await checkSpec([path!, "--json"], root);
      assert.equal(result.exitCode, 0);
      assert.equal(result.report.artifact_format, "human-first-v2");
      assert.equal(nested(result.report, "counts").FR, 1);
      assert.equal(nested(result.report, "counts").AT, 1);
      assert.equal(nested(result.report, "gates").human_first_structure, true);
    },
  );
});

test("version two accepts documented legacy opening headings", async () => {
  await withFiles(
    {
      "spec.md": humanFirstSpec.replace(
        "## Product Overview",
        "## Product Crux",
      ),
      "design.md": humanFirstDesign
        .replace('version="3"', 'version="2"')
        .replace("## Technical Approach", "## Technical Crux"),
    },
    async (paths, root) => {
      const spec = await checkSpec([paths["spec.md"]!, "--json"], root);
      const design = await checkDesign(
        [
          paths["design.md"]!,
          "--component",
          "--spec",
          paths["spec.md"]!,
          "--json",
        ],
        root,
      );
      assert.equal(spec.exitCode, 0);
      assert.deepEqual(spec.report.human_first_issues, []);
      assert.equal(design.exitCode, 0);
      assert.equal(design.report.artifact_format, "human-first-v2");
      assert.deepEqual(design.report.human_first_issues, []);
    },
  );
});

test("human-first design and plan accept descriptive headings", async () => {
  await withFiles(
    {
      "spec.md": humanFirstSpec,
      "design.md": humanFirstDesign,
      "plan.md": humanFirstPlan,
    },
    async (paths, root) => {
      const design = await checkDesign(
        [
          paths["design.md"]!,
          "--component",
          "--spec",
          paths["spec.md"]!,
          "--json",
        ],
        root,
      );
      const plan = await checkPlan(
        [paths["plan.md"]!, "--feature", "--json"],
        root,
      );
      assert.equal(design.exitCode, 0);
      assert.equal(design.report.artifact_format, "human-first-v3");
      assert.equal(nested(design.report, "gates").human_first_structure, true);
      assert.equal(plan.exitCode, 0);
      assert.equal(nested(plan.report, "counts").PR, 1);
      assert.equal(nested(plan.report, "gates").human_first_structure, true);
    },
  );
});

test("full human-first artifacts use the new section contract", async () => {
  await withFiles(
    { "spec.md": humanFirstSpec, "plan.md": humanFirstPlan },
    async (paths, root) => {
      const spec = await checkSpec([paths["spec.md"]!, "--json"], root);
      const plan = await checkPlan([paths["plan.md"]!, "--json"], root);
      assert.equal(spec.exitCode, 0);
      assert.equal(nested(spec.report, "gates").sections_present, true);
      assert.equal(plan.exitCode, 0);
      assert.equal(nested(plan.report, "gates").sections_present, true);
    },
  );
});

test("human-first plan requires baseline reuse and one classification per item", async () => {
  const text = humanFirstPlan
    .replace("## Baseline Reuse", "## Existing Context")
    .replace("Work Classification: target-owned implementation\n", "");
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan(
      [paths["plan.md"]!, "--feature", "--json"],
      root,
    );
    assert.equal(result.exitCode, 1);
    assert.equal(
      nested(result.report, "gates").baseline_reuse_classified,
      false,
    );
    assert.deepEqual(result.report.baseline_reuse, {
      section_present: false,
      allowed_classifications: [
        "deferred cleanup",
        "extract then reuse",
        "new behavior",
        "reuse directly",
        "target-owned implementation",
      ],
      classifications: [],
      expected_count: 1,
      issues: {
        "PR-AUTH-COMPAT": {
          reason: "exactly_one_classification_required",
          values: [],
        },
      },
    });
  });
});

test("human-first plan rejects an unsupported work classification", async () => {
  const text = humanFirstPlan.replace(
    "Work Classification: target-owned implementation",
    "Work Classification: build the whole capability",
  );
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan(
      [paths["plan.md"]!, "--feature", "--json"],
      root,
    );
    assert.equal(result.exitCode, 1);
    const issues = nested(nested(result.report, "baseline_reuse"), "issues");
    assert.equal(
      nested(issues, "PR-AUTH-COMPAT").reason,
      "unsupported_classification",
    );
  });
});

test("new format rejects machine-only visible headings", async () => {
  const text = humanFirstPlan.replace(
    "### Route password operations through the adapter\n",
    "### PR-AUTH-COMPAT\n",
  );
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan(
      [paths["plan.md"]!, "--feature", "--json"],
      root,
    );
    assert.equal(result.exitCode, 1);
    assert.equal(nested(result.report, "gates").human_first_structure, false);
    assert.ok(
      (result.report.human_first_issues as string[]).includes(
        "machine_only_heading:PR-AUTH-COMPAT",
      ),
    );
  });
});

test("version two traceability can define a delivery id without a visible id", async () => {
  const text = humanFirstPlan
    .replace('version="3"', 'version="2"')
    .replace('<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->\n', "")
    .replace(
      "| Human delivery item | Machine ID | Evidence |\n| --- | --- | --- |\n| Route password operations through the adapter | PR-AUTH-COMPAT | compatibility tests |",
      "| Machine ID | Human delivery item | Evidence |\n| --- | --- | --- |\n| PR-AUTH-COMPAT | Route password operations through the adapter | compatibility tests |",
    );
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan([paths["plan.md"]!, "--json"], root);
    assert.equal(result.exitCode, 0);
    assert.equal(nested(result.report, "counts").PR, 1);
  });
});

test("version three requires a descriptive block for each delivery id", async () => {
  const text = humanFirstPlan
    .replace('<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->\n', "")
    .replace(
      "| Route password operations through the adapter | PR-AUTH-COMPAT | compatibility tests |",
      "| PR-AUTH-COMPAT | Route password operations through the adapter | compatibility tests |",
    );
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan([paths["plan.md"]!, "--json"], root);
    assert.equal(result.exitCode, 1);
    const issues = nested(nested(result.report, "baseline_reuse"), "issues");
    assert.equal(
      nested(issues, "PR-AUTH-COMPAT").reason,
      "descriptive_delivery_block_required",
    );
  });
});

test("version three rejects a stray global classification", async () => {
  const text = humanFirstPlan
    .replace("Work Classification: target-owned implementation\n", "")
    .replace(
      "## Traceability\n",
      "Work Classification: target-owned implementation\n\n## Traceability\n",
    );
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan([paths["plan.md"]!, "--json"], root);
    assert.equal(result.exitCode, 1);
    const issues = nested(nested(result.report, "baseline_reuse"), "issues");
    assert.equal(
      nested(issues, "PR-AUTH-COMPAT").reason,
      "exactly_one_classification_required",
    );
  });
});

test("unversioned legacy artifact remains accepted", async () => {
  const text = `# Overview
Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready

## Direct-To-Code Decision
- Inherited Sources: accepted intent.
- Reviewable Increment: one change.
- Unresolved Blocker: none.
- Smallest Additional Artifact: none.

# Strategy
Use one focused change.

# Milestones
- MILE-AUTH-COMPAT Deliver compatibility.

# Pull Requests / Child Work Items
- PR-AUTH-COMPAT
  Scope: preserve compatibility.
  Verification: focused tests pass.

# Coverage Map
PR-AUTH-COMPAT covers the increment.

# Sequencing & Risks
PR-AUTH-COMPAT has no dependency.
`;
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan(
      [paths["plan.md"]!, "--feature", "--json"],
      root,
    );
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.artifact_format, "legacy");
    assert.equal(nested(result.report, "gates").human_first_structure, true);
  });
});

test("version two plan remains accepted without baseline classification", async () => {
  let text = humanFirstPlan
    .replace('version="3"', 'version="2"')
    .replace("## Implementation Approach", "## Implementation Crux");
  text =
    text.slice(0, text.indexOf("## Baseline Reuse")) +
    text.slice(text.indexOf("## Overview"));
  text = text.replace("Work Classification: target-owned implementation\n", "");
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan(
      [paths["plan.md"]!, "--feature", "--json"],
      root,
    );
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.artifact_format, "human-first-v2");
    assert.equal(
      nested(result.report, "gates").baseline_reuse_classified,
      true,
    );
  });
});

test("unknown format version does not fall back to legacy", async () => {
  const text = humanFirstPlan.replace('version="3"', 'version="4"');
  await withFiles({ "plan.md": text }, async (paths, root) => {
    const result = await checkPlan(
      [paths["plan.md"]!, "--feature", "--json"],
      root,
    );
    assert.equal(result.exitCode, 1);
    assert.equal(result.report.artifact_format, "unsupported-v4");
    assert.deepEqual(result.report.human_first_issues, [
      "unsupported_artifact_format:unsupported-v4",
    ]);
  });
});

test("version three spec format is supported", async () => {
  const text = humanFirstSpec.replace('version="2"', 'version="3"');
  await withFiles({ "spec.md": text }, async (paths, root) => {
    const result = await checkSpec([paths["spec.md"]!, "--json"], root);
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.artifact_format, "human-first-v3");
    assert.deepEqual(result.report.human_first_issues, []);
  });
});

test("version three product spec requires complete hierarchy", async () => {
  const text = `# Thin product spec
<!-- sarathi:artifact-format version="3" -->

## Product Overview

People need the product to work.

## Traceability

No mappings yet.
`;
  await withFiles({ "spec.md": text }, async (paths, root) => {
    const result = await checkSpec([paths["spec.md"]!, "--json"], root);
    assert.equal(result.exitCode, 1);
    assert.equal(result.report.artifact_format, "human-first-v3");
    assert.equal(nested(result.report, "gates").sections_present, false);
  });
});

test("version two product spec retains legacy human-first contract", async () => {
  const text = `# Existing product spec
<!-- sarathi:artifact-format version="2" -->

## Product Overview

People need the product to work.

## Traceability

No mappings yet.
`;
  await withFiles({ "spec.md": text }, async (paths, root) => {
    const result = await checkSpec([paths["spec.md"]!, "--json"], root);
    assert.equal(result.exitCode, 0);
    assert.equal(result.report.artifact_format, "human-first-v2");
    assert.equal(nested(result.report, "gates").sections_present, true);
  });
});

test("small change stays compact and human-first", async () => {
  await withFiles({ "plan.md": smallChangePlan }, async (paths, root) => {
    const result = await checkPlan([paths["plan.md"]!, "--json"], root);
    const opening = smallChangePlan
      .replace(/<!--.*?-->/gs, "")
      .split("## Traceability", 1)[0]!;
    assert.equal(result.exitCode, 0);
    assert.equal(nested(result.report, "counts").PR, 1);
    assert.ok(opening.split(/\s+/).filter(Boolean).length < 180);
    assert.doesNotMatch(opening, /\b(?:PR|WORK|FR|COMP|TEST)-[A-Z]/);
  });
});

test("high-assurance migration adds evidence not identifier prose", async () => {
  await withFiles({ "design.md": migrationDesign }, async (paths, root) => {
    const result = await checkDesign(
      [paths["design.md"]!, "--component", "--json"],
      root,
    );
    const opening = migrationDesign
      .replace(/<!--.*?-->/gs, "")
      .split("## Traceability", 1)[0]!;
    assert.equal(result.exitCode, 0);
    for (const concept of [
      "owns",
      "migration",
      "Roll back",
      "failed",
      "reconciliation evidence",
    ])
      assert.ok(opening.includes(concept));
    assert.doesNotMatch(opening, /\b(?:FR|COMP|TEST|RISK)-[A-Z]/);
  });
});
