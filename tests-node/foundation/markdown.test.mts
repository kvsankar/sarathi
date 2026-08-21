import assert from "node:assert/strict";
import test from "node:test";

import {
  annotationAttrs,
  artifactFormat,
  humanFirstIssues,
  stripFencedCode,
} from "../../src/checkers/lib/markdown-structure.mjs";

test("fenced examples cannot satisfy checker-visible structure", () => {
  const text = "before\n```markdown\n## Product Overview\n```\nafter";
  assert.equal(stripFencedCode(text), "before\n\n\n\nafter");
});

test("CR-only Markdown retains headings and fence boundaries", () => {
  const text = "before\r```markdown\r## Hidden\r```\r## Product Overview";
  assert.equal(stripFencedCode(text), "before\n\n\n\n## Product Overview");
});

test("annotations and versioned human-first structure match the current contract", () => {
  assert.deepEqual(
    annotationAttrs(
      '<!-- sarathi:entity id="COMP-AUTH" refs="FR-AUTH-SIGNIN" -->',
    ),
    { id: "COMP-AUTH", refs: "FR-AUTH-SIGNIN" },
  );
  const document = `<!-- sarathi:artifact-format version="3" -->
# Feature
## Product Overview
Readable content.
## Traceability
Readable links.`;
  assert.equal(artifactFormat(document), "human-first-v3");
  assert.deepEqual(
    humanFirstIssues(
      document,
      ["Product Overview", "Product Crux"],
      ["human-first-v3"],
    ),
    [],
  );
});

test("human-first checks report unsupported formats and machine-only headings", () => {
  const unsupported = '<!-- sarathi:artifact-format version="4" -->';
  assert.deepEqual(humanFirstIssues(unsupported, "Product Overview"), [
    "unsupported_artifact_format:unsupported-v4",
  ]);
  const machineHeading = `<!-- sarathi:artifact-format version="3" -->
## Product Overview
## PR-AUTH-SIGNIN
## Traceability`;
  assert.deepEqual(
    humanFirstIssues(machineHeading, "Product Overview", ["human-first-v3"]),
    ["machine_only_heading:PR-AUTH-SIGNIN"],
  );
});
