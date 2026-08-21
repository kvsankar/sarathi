#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */

import {
  approvalGatePassed,
  approvalRequirement,
  loadApprovalContext,
  type ApprovalContext,
  type ApprovalRequirement,
} from "./lib/approvals.mjs";
import {
  allMatches,
  isDirectInvocation,
  percentage,
  positional,
  printJson,
  pythonRepr,
  readUtf8,
  sectionsPresentInOrder,
  sorted,
  valueAfter,
} from "./lib/checker-common.mjs";
import {
  artifactFormat,
  definitionId,
  humanFirstIssues,
  primaryDefinitionIds,
} from "./lib/markdown-structure.mjs";
import {
  HUMAN_FIRST_SPEC_SECTIONS,
  LEGACY_HUMAN_FIRST_SPEC_SECTIONS,
  SPEC_SECTIONS,
} from "./lib/schemas.mjs";
import { splitLines } from "./lib/output.mjs";
import { validateWorkflowState } from "./lib/workflow-state.mjs";

const SLUG = "(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}";
const PYTHON_WORD = "\\p{L}\\p{N}_";
const ID_SOURCE = `(UN|FEAT|UC|FR|NFR|AT|JT)-(${SLUG})-(${SLUG})`;
const ID = new RegExp(
  `(?<![${PYTHON_WORD}])${ID_SOURCE}(?![${PYTHON_WORD}])`,
  "gu",
);
const ID_DEFINITION = new RegExp(
  `(?<![${PYTHON_WORD}])${ID_SOURCE}(?![${PYTHON_WORD}])`,
  "u",
);
const ID_FULL = new RegExp(`^${ID_SOURCE}$`, "u");
const CANDIDATE = new RegExp(
  `(?<![${PYTHON_WORD}])(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST)-[A-Za-z0-9]+-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![${PYTHON_WORD}])`,
  "giu",
);
const LEAD = /^[\s#>\-*+\d.)]*/;
const DEF_MARKER = /^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/;
const HEADING = /^#{1,6}\s+(.+?)\s*$/;
const KINDS = ["UN", "FEAT", "UC", "FR", "NFR", "AT", "JT"] as const;

function defId(line: string): string | undefined {
  return definitionId(line, ID_DEFINITION, LEAD, DEF_MARKER);
}

function kind(identifier: string): string {
  return identifier.split("-", 1)[0] ?? "";
}

function definitionsAndReferences(text: string): {
  defined: Record<string, Set<string>>;
  refs: Set<string>;
} {
  const defined = Object.fromEntries(
    KINDS.map((key) => [key, new Set<string>()]),
  );
  const refs = new Set<string>();
  let fenced = false;
  for (const line of splitLines(text)) {
    if (line.trim().startsWith("```")) {
      fenced = !fenced;
      allMatches(line, ID).forEach((identifier) => refs.add(identifier));
      continue;
    }
    const identifiers = allMatches(line, ID);
    if (identifiers.length > 0) {
      const first = fenced ? undefined : defId(line);
      if (first) defined[kind(first)]?.add(first);
      identifiers.forEach((identifier) => refs.add(identifier));
    }
  }
  return { defined, refs };
}

function itemBlocks(text: string, wanted: Set<string>): Map<string, string> {
  const blocks = new Map<string, string>();
  const primary = primaryDefinitionIds(text, defId);
  let current: string | undefined;
  let buffer: string[] = [];
  let fenced = false;
  for (const line of splitLines(text)) {
    const fence = line.trim().startsWith("```");
    let identifier = fenced ? undefined : defId(line);
    if (
      identifier &&
      line.trimStart().startsWith("|") &&
      primary.has(identifier)
    ) {
      identifier = undefined;
    }
    const heading = HEADING.test(line.trim());
    if (identifier && wanted.has(kind(identifier))) {
      if (blocks.has(identifier) || current === identifier) continue;
      if (current) blocks.set(current, buffer.join("\n"));
      current = identifier;
      buffer = [line];
    } else if (current) {
      if (heading || (identifier && wanted.has(kind(identifier)))) {
        blocks.set(current, buffer.join("\n"));
        current = undefined;
        buffer = [];
      } else buffer.push(line);
    }
    if (fence) fenced = !fenced;
  }
  if (current) blocks.set(current, buffer.join("\n"));
  return blocks;
}

export async function checkSpec(
  argv: readonly string[],
  root = process.cwd(),
): Promise<{ report: Record<string, unknown>; exitCode: number }> {
  const feature = argv.includes("--feature");
  const requireApprovals = argv.includes("--require-approvals");
  const approvalsPath = valueAfter(
    argv,
    "--approvals",
    ".sdlc/approvals.yaml",
  )!;
  const gatesPath = valueAfter(argv, "--gates-policy", ".sdlc/gates.yaml")!;
  const path = positional(argv)[0] ?? "spec.md";
  const text = await readUtf8(path);
  const { defined, refs } = definitionsAndReferences(text);
  const parentIds = new Set<string>();
  const parent = valueAfter(argv, "--parent");
  if (parent) {
    const parentDefinitions = definitionsAndReferences(
      await readUtf8(parent),
    ).defined;
    Object.values(parentDefinitions).forEach((items) =>
      items.forEach((item) => parentIds.add(item)),
    );
  }
  const allIds = new Set([
    ...Object.values(defined).flatMap((items) => [...items]),
    ...parentIds,
  ]);
  const acceptance = itemBlocks(text, new Set(["AT"]));
  const acceptanceRefs = new Set(
    [...acceptance.values()].flatMap((block) => allMatches(block, ID)),
  );
  const uc = defined.UC ?? new Set<string>();
  const fr = defined.FR ?? new Set<string>();
  const ucCovered = new Set([...uc].filter((item) => acceptanceRefs.has(item)));
  const frCovered = new Set([...fr].filter((item) => acceptanceRefs.has(item)));
  const primary = primaryDefinitionIds(text, defId);
  const definitionIds: string[] = [];
  let fenced = false;
  for (const line of splitLines(text)) {
    if (line.trim().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    const identifier = fenced ? undefined : defId(line);
    if (
      identifier &&
      !(line.trimStart().startsWith("|") && primary.has(identifier))
    )
      definitionIds.push(identifier);
  }
  const duplicates = sorted(
    new Set(
      definitionIds.filter(
        (item, index) => definitionIds.indexOf(item) !== index,
      ),
    ),
  );
  const badIdFormat = sorted(
    new Set(allMatches(text, CANDIDATE).filter((item) => !ID_FULL.test(item))),
  );
  const orphanRefs = sorted([...refs].filter((item) => !allIds.has(item)));
  const formatName = artifactFormat(text);
  const formatIssues = humanFirstIssues(
    text,
    ["Product Overview", "Product Crux"],
    ["human-first-v2", "human-first-v3"],
  );
  let approvalContext: ApprovalContext | undefined;
  const approvalRequirements: ApprovalRequirement[] = [];
  if (requireApprovals) {
    approvalContext = await loadApprovalContext(root, approvalsPath, gatesPath);
    approvalRequirements.push(
      approvalRequirement(approvalContext, root, "spec.approved", path, {
        scope: feature ? "feature/component" : "product/system",
      }),
    );
  }
  const workflowStateIssues = await validateWorkflowState(root);
  const gates: Record<string, boolean> = {
    workflow_state_valid: workflowStateIssues.length === 0,
    id_format_slug_only: badIdFormat.length === 0,
    no_duplicates: duplicates.length === 0,
    no_orphan_refs: orphanRefs.length === 0,
    uc_at_coverage_100: ucCovered.size === uc.size,
    fr_at_coverage_100: frCovered.size === fr.size,
    ...(requireApprovals
      ? { required_approvals_present: approvalGatePassed(approvalRequirements) }
      : {}),
    human_first_structure: formatIssues.length === 0,
  };
  if (!feature) {
    const required =
      formatName === "human-first-v3"
        ? HUMAN_FIRST_SPEC_SECTIONS
        : formatName === "human-first-v2"
          ? LEGACY_HUMAN_FIRST_SPEC_SECTIONS
          : SPEC_SECTIONS;
    gates.sections_present = sectionsPresentInOrder(text, required);
  }
  const report = {
    mode: feature ? "feature" : "product",
    counts: Object.fromEntries(
      KINDS.map((key) => [key, defined[key]?.size ?? 0]),
    ),
    uc_at_coverage_pct: percentage(ucCovered, uc),
    fr_at_coverage_pct: percentage(frCovered, fr),
    uncovered_use_cases: sorted([...uc].filter((item) => !ucCovered.has(item))),
    uncovered_frs: sorted([...fr].filter((item) => !frCovered.has(item))),
    orphan_refs: orphanRefs,
    duplicates,
    bad_id_format: badIdFormat,
    approval_requirements: approvalRequirements,
    approval_ledger: {
      path: approvalsPath,
      exists: approvalContext?.exists ?? null,
      load_error: approvalContext?.load_error ?? null,
      invalid_records: approvalContext?.invalid_records ?? [],
    },
    artifact_format: formatName,
    human_first_issues: formatIssues,
    workflow_state_issues: workflowStateIssues,
    gates,
    passed: Object.values(gates).filter(Boolean).length,
    total: Object.keys(gates).length,
  };
  return { report, exitCode: Object.values(gates).every(Boolean) ? 0 : 1 };
}

/* node:coverage ignore start -- text CLI is covered by entrypoint integration */
/* node:coverage ignore next */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const result = await checkSpec(argv);
  if (argv.includes("--json")) printJson(result.report);
  else {
    const labels: Record<string, string> = {
      workflow_state_valid: "Saved work status and project settings are valid",
      id_format_slug_only: "Identifiers use the supported format",
      no_duplicates: "No duplicate identifiers",
      no_orphan_refs: "Every referenced ID exists",
      uc_at_coverage_100: "User outcomes have acceptance coverage",
      fr_at_coverage_100: "Requirements have acceptance coverage",
      required_approvals_present: "Required approvals are current",
      human_first_structure:
        "The document starts with a plain summary and ends with links between related items",
      sections_present: "Required sections are present",
    };
    const report = result.report as any;
    for (const [key, passed] of Object.entries(report.gates))
      console.log(
        `${passed ? "PASS" : "FAIL"}  ${labels[key] ?? key.replaceAll("_", " ")}`,
      );
    for (const item of report.workflow_state_issues)
      console.log(
        `ERROR ${item.path} ${item.field}: ${item.reason} (found ${pythonRepr(item.value)})`,
      );
    console.log(
      `\nUser outcomes covered: ${report.uc_at_coverage_pct}%  Requirements covered: ${report.fr_at_coverage_pct}%`,
    );
    console.log(`${report.passed}/${report.total} checks passed`);
  }
  return result.exitCode;
}

/* node:coverage ignore next */
if (isDirectInvocation(import.meta.url)) process.exitCode = await main();
/* node:coverage ignore end */
