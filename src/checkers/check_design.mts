#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
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
  sectionText,
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
  DESIGN_SECTIONS,
  HUMAN_FIRST_DESIGN_SECTIONS,
} from "./lib/schemas.mjs";
import { splitLines } from "./lib/output.mjs";
import { validateWorkflowState } from "./lib/workflow-state.mjs";

const SLUG = "(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}";
const PYTHON_WORD = "\\p{L}\\p{N}_";
const DESIGN_SOURCE = `(?:LAYER|COMP|IFACE|DEC|RISK)-${SLUG}|TEST-${SLUG}-${SLUG}`;
const ID = new RegExp(
  `(?<![${PYTHON_WORD}])(?:${DESIGN_SOURCE})(?![${PYTHON_WORD}])`,
  "gu",
);
const ID_DEFINITION = new RegExp(
  `(?<![${PYTHON_WORD}])(?:${DESIGN_SOURCE})(?![${PYTHON_WORD}])`,
  "u",
);
const REQ = new RegExp(
  `(?<![${PYTHON_WORD}])(?:FR|UC|NFR|AT|JT)-${SLUG}-${SLUG}(?![${PYTHON_WORD}])`,
  "gu",
);
const VALID_ANY = new RegExp(
  `^(?:${DESIGN_SOURCE}|(?:FR|UC|NFR|AT|JT)-${SLUG}-${SLUG})$`,
);
const CANDIDATE = new RegExp(
  `(?<![${PYTHON_WORD}])(?:(?:LAYER|COMP|IFACE|DEC|RISK)-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*|(?:FR|UC|NFR|AT|JT|TEST)-[A-Za-z0-9]+-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)(?![${PYTHON_WORD}])`,
  "giu",
);
const EXTERNAL_DOUBLE =
  /\b(?:external|vendor|sdk|api|cli|host|service|broker|driver|database|file format)\b(?:(?!\n\n).){0,160}\b(?:mock|fake|stub|test double|mirror|mirrored|re-?declar|hand-?cop(?:y|ied)|hand-?authored|local interface|do not import)\b|\b(?:mock|fake|stub|test double|mirror|mirrored|re-?declar|hand-?cop(?:y|ied)|hand-?authored|local interface|do not import)\b(?:(?!\n\n).){0,160}\b(?:external|vendor|sdk|api|cli|host|service|broker|driver|database|file format)\b/gis;
const DRIFT_RISK =
  /\b(?:drift|verification risk|false confidence|real boundary|real dependency|external contract|vendor contract)\b/i;
const DRIFT_MITIGATION =
  /\b(?:real[- ]boundary|real dependency|real external|official conformance|type[- ]conformance|assignable to .*vendor|contract test|integration test|vendor sandbox|emulator|captured real|generated client|schema|openapi|asyncapi)\b/i;
const UI_MOCK_REQUIRED = /^\s*UI Mock Preference\s*:\s*Required\s*$/im;
const UI_INTENT_ARTIFACT =
  /^\s*(?:UI Mock|Approved Prototype) Artifact\s*:\s*(\S+)\s*$/im;
const KINDS = ["LAYER", "COMP", "IFACE", "DEC", "RISK", "TEST"] as const;
const LEAD = /^[\s#>\-*+\d.)]*/;
const DEF_MARKER = /^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/;
const HEADING = /^#{1,6}\s+(.+?)\s*$/;

const kind = (id: string): string => id.split("-", 1)[0] ?? "";
const defId = (line: string): string | undefined =>
  definitionId(line, ID_DEFINITION, LEAD, DEF_MARKER);

function definitionsAndReferences(text: string) {
  const defined = Object.fromEntries(
    KINDS.map((key) => [key, new Set<string>()]),
  ) as Record<string, Set<string>>;
  const refs = new Set<string>();
  let fenced = false;
  for (const line of splitLines(text)) {
    if (line.trim().startsWith("```")) {
      fenced = !fenced;
      allMatches(line, ID).forEach((id) => refs.add(id));
      continue;
    }
    const ids = allMatches(line, ID);
    if (ids.length) {
      const first = fenced ? undefined : defId(line);
      if (first) defined[kind(first)]?.add(first);
      ids.forEach((id) => refs.add(id));
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
    let id = fenced ? undefined : defId(line);
    if (id && line.trimStart().startsWith("|") && primary.has(id))
      id = undefined;
    if (id && wanted.has(kind(id))) {
      if (blocks.has(id) || current === id) continue;
      if (current) blocks.set(current, buffer.join("\n"));
      current = id;
      buffer = [line];
    } else if (current) {
      if (HEADING.test(line.trim()) || (id && wanted.has(kind(id)))) {
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

function dependencyCycles(graph: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [],
    stack: string[] = [];
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const dfs = (node: string): void => {
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (visiting.has(next))
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
      else if (!visited.has(next)) dfs(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of graph.keys()) if (!visited.has(node)) dfs(node);
  return cycles;
}

export async function checkDesign(
  argv: readonly string[],
  root = process.cwd(),
): Promise<{ report: Record<string, unknown>; exitCode: number }> {
  const component = argv.includes("--component"),
    requireApprovals = argv.includes("--require-approvals");
  const approvalsPath = valueAfter(
      argv,
      "--approvals",
      ".sdlc/approvals.yaml",
    )!,
    gatesPath = valueAfter(argv, "--gates-policy", ".sdlc/gates.yaml")!;
  const path = positional(argv)[0] ?? "design.md",
    text = await readUtf8(path);
  const { defined, refs } = definitionsAndReferences(text);
  const parentIds = new Set<string>();
  const parent = valueAfter(argv, "--parent");
  if (parent)
    Object.values(
      definitionsAndReferences(await readUtf8(parent)).defined,
    ).forEach((set) => set.forEach((id) => parentIds.add(id)));
  const specPath = valueAfter(argv, "--spec"),
    specText = specPath ? await readUtf8(specPath) : "";
  const reqIds = new Set(allMatches(specText, REQ));
  const comps = defined.COMP ?? new Set<string>(),
    compBlocks = itemBlocks(text, new Set(["COMP"])),
    ifaceBlocks = itemBlocks(text, new Set(["IFACE"])),
    testBlocks = itemBlocks(text, new Set(["TEST"]));
  const covered = new Set(
    [...comps].filter((id) => allMatches(compBlocks.get(id) ?? "", REQ).length),
  );
  const tested = new Set(
    [...comps].filter((id) =>
      [...testBlocks.values()].some((block) => block.includes(id)),
    ),
  );
  const strategyTests = new Set(
    allMatches(sectionText(text, "Test Strategy"), ID).filter(
      (id) => kind(id) === "TEST",
    ),
  );
  const untracedTests = [...testBlocks].flatMap(([id, block]) => {
    const designLinks = allMatches(block, ID).filter((ref) =>
      ["COMP", "IFACE"].includes(kind(ref)),
    );
    const outcomeLinks = [
      ...allMatches(block, REQ),
      ...allMatches(block, ID).filter((ref) =>
        ["DEC", "RISK"].includes(kind(ref)),
      ),
    ];
    return designLinks.length && outcomeLinks.length ? [] : [id];
  });
  const primary = primaryDefinitionIds(text, defId),
    definitionIds: string[] = [],
    ifaceDefinitionIds: string[] = [];
  let fenced = false;
  for (const line of splitLines(text)) {
    if (line.trim().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    const id = fenced ? undefined : defId(line);
    if (id && !(line.trimStart().startsWith("|") && primary.has(id))) {
      definitionIds.push(id);
      if (kind(id) === "IFACE") ifaceDefinitionIds.push(id);
    }
  }
  const duplicates = sorted(
    new Set(
      definitionIds.filter((id, index) => definitionIds.indexOf(id) !== index),
    ),
  );
  const ifaceDuplicates = sorted(
    new Set(
      ifaceDefinitionIds.filter(
        (id, index) => ifaceDefinitionIds.indexOf(id) !== index,
      ),
    ),
  );
  const ifaceOwners = new Map<string, string>(),
    ifaceOwnerIssues: string[] = [];
  for (const [iface, block] of ifaceBlocks) {
    const owners = sorted(
      new Set(
        splitLines(block)
          .filter((line) => /\bowner\b/i.test(line))
          .flatMap((line) =>
            allMatches(line, ID).filter((id) => kind(id) === "COMP"),
          ),
      ),
    );
    if (owners.length !== 1 || !comps.has(owners[0]!))
      ifaceOwnerIssues.push(iface);
    else ifaceOwners.set(iface, owners[0]!);
  }
  const graph = new Map([...comps].map((id) => [id, new Set<string>()]));
  for (const [comp, block] of compBlocks)
    for (const iface of allMatches(block, ID).filter(
      (id) => kind(id) === "IFACE",
    )) {
      const owner = ifaceOwners.get(iface);
      if (owner && owner !== comp) graph.get(comp)?.add(owner);
    }
  const cycles = dependencyCycles(graph);
  const allIds = new Set([
    ...Object.values(defined).flatMap((set) => [...set]),
    ...parentIds,
  ]);
  const orphanRefs = sorted(
    [...refs].filter((id) => !allIds.has(id) && !reqIds.has(id)),
  );
  const badIdFormat = sorted(
    new Set(allMatches(text, CANDIDATE).filter((id) => !VALID_ANY.test(id))),
  );
  const externalDoubleMentions = allMatches(text, EXTERNAL_DOUBLE).map(
    (value) => value.replace(/\s+/g, " ").trim(),
  );
  const driftRisks = [...itemBlocks(text, new Set(["RISK"]))].flatMap(
    ([id, block]) => (DRIFT_RISK.test(block) ? [id] : []),
  );
  const driftTests = [...testBlocks].flatMap(([id, block]) =>
    DRIFT_MITIGATION.test(block) ? [id] : [],
  );
  const formatName = artifactFormat(text),
    formatIssues = humanFirstIssues(
      text,
      ["Technical Approach", "Technical Crux"],
      ["human-first-v2", "human-first-v3"],
    );
  let approvalContext: ApprovalContext | undefined;
  const approvalRequirements: ApprovalRequirement[] = [];
  if (requireApprovals) {
    approvalContext = await loadApprovalContext(root, approvalsPath, gatesPath);
    if (specPath)
      approvalRequirements.push(
        approvalRequirement(approvalContext, root, "spec.approved", specPath),
      );
    if (specPath && UI_MOCK_REQUIRED.test(specText)) {
      const match = UI_INTENT_ARTIFACT.exec(`${specText}\n${text}`);
      if (match?.[1])
        approvalRequirements.push(
          approvalRequirement(
            approvalContext,
            root,
            "ux.mock.approved",
            match[1],
          ),
        );
      else
        approvalRequirements.push({
          gate: "ux.mock.approved",
          artifact: null as unknown as string,
          scope: null,
          approved: false,
          approval_id: null,
          status: null,
          issues: [
            "The spec requires an approved UI mockup or prototype, but no file was listed",
          ],
        });
    }
  }
  const workflowStateIssues = await validateWorkflowState(root);
  const gates: Record<string, boolean> = {
    workflow_state_valid: !workflowStateIssues.length,
    id_format_slug_only: !badIdFormat.length,
    no_duplicates: !duplicates.length,
    no_orphan_refs: !orphanRefs.length,
    comp_req_coverage_100: covered.size === comps.size,
    comp_test_coverage_100: tested.size === comps.size,
    test_obligations_declared: comps.size ? !!strategyTests.size : true,
    test_obligation_traceability_100: !untracedTests.length,
    external_doubles_flagged_as_risk:
      !externalDoubleMentions.length ||
      (DRIFT_RISK.test(sectionText(text, "Risks & Trade-offs")) &&
        !!driftRisks.length),
    external_doubles_have_real_boundary_mitigation:
      !externalDoubleMentions.length || !!driftTests.length,
    iface_single_owner: !ifaceDuplicates.length && !ifaceOwnerIssues.length,
    no_dependency_cycles: !cycles.length,
    ...(requireApprovals
      ? { required_approvals_present: approvalGatePassed(approvalRequirements) }
      : {}),
    human_first_structure: !formatIssues.length,
  };
  if (!component)
    gates.sections_present = sectionsPresentInOrder(
      text,
      ["human-first-v2", "human-first-v3"].includes(formatName)
        ? HUMAN_FIRST_DESIGN_SECTIONS
        : DESIGN_SECTIONS,
    );
  const report = {
    mode: component ? "component" : "product",
    counts: Object.fromEntries(
      KINDS.map((key) => [key, defined[key]?.size ?? 0]),
    ),
    comp_req_coverage_pct: percentage(covered, comps),
    comp_test_coverage_pct: percentage(tested, comps),
    uncovered_components: sorted([...comps].filter((id) => !covered.has(id))),
    untested_components: sorted([...comps].filter((id) => !tested.has(id))),
    test_obligation_count: defined.TEST?.size ?? 0,
    test_obligations_in_strategy: sorted(strategyTests),
    untraced_test_obligations: sorted(untracedTests),
    external_double_mentions: externalDoubleMentions,
    external_double_drift_risks: sorted(driftRisks),
    external_double_mitigation_tests: sorted(driftTests),
    iface_owner_count: ifaceOwners.size,
    dependency_cycles: cycles,
    approval_requirements: approvalRequirements,
    approval_ledger: {
      path: approvalsPath,
      exists: approvalContext?.exists ?? null,
      load_error: approvalContext?.load_error ?? null,
      invalid_records: approvalContext?.invalid_records ?? [],
    },
    orphan_refs: orphanRefs,
    duplicates,
    bad_id_format: badIdFormat,
    iface_duplicates: ifaceDuplicates,
    iface_owner_issues: sorted(ifaceOwnerIssues),
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
  const argv = process.argv.slice(2),
    result = await checkDesign(argv);
  if (argv.includes("--json")) printJson(result.report);
  else {
    const labels: Record<string, string> = {
      workflow_state_valid: "Saved work status and project settings are valid",
      id_format_slug_only: "Identifiers use the supported format",
      no_duplicates: "No duplicate identifiers",
      no_orphan_refs: "Every referenced ID exists",
      comp_req_coverage_100: "Components link to requirements",
      comp_test_coverage_100: "Components link to tests",
      test_obligations_declared: "Required tests are described",
      test_obligation_traceability_100: "Required tests are linked",
      iface_single_owner: "Each interface has one owner",
      no_dependency_cycles: "No dependency cycles",
      required_approvals_present: "Required approvals are current",
      human_first_structure:
        "The document starts with a plain summary and ends with links between related items",
      sections_present: "Required sections are present",
    };
    const report: any = result.report;
    for (const [key, passed] of Object.entries(report.gates))
      console.log(
        `${passed ? "PASS" : "FAIL"}  ${labels[key] ?? key.replaceAll("_", " ")}`,
      );
    for (const item of report.workflow_state_issues)
      console.log(
        `ERROR ${item.path} ${item.field}: ${item.reason} (found ${pythonRepr(item.value)})`,
      );
    console.log(
      `\nComponents linked to requirements: ${report.comp_req_coverage_pct}%  Components linked to tests: ${report.comp_test_coverage_pct}%`,
    );
    console.log(`${report.passed}/${report.total} checks passed`);
  }
  return result.exitCode;
}
/* node:coverage ignore next */
if (isDirectInvocation(import.meta.url)) process.exitCode = await main();
/* node:coverage ignore end */
