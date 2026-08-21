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
  stripFencedCode,
} from "./lib/markdown-structure.mjs";
import {
  HUMAN_FIRST_PLAN_SECTIONS,
  PLAN_ID,
  PLAN_ID_BY_KIND,
  PLAN_ID_CANDIDATE,
  PLAN_SECTIONS,
  PRODUCT_FIRST_PLAN_SECTIONS,
} from "./lib/schemas.mjs";
import { splitLines } from "./lib/output.mjs";
import { parseLearningWaves } from "./lib/waves.mjs";
import { validateWorkflowState } from "./lib/workflow-state.mjs";

const SLUG = "(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}";
const PYTHON_WORD = "\\p{L}\\p{N}_";
const patterns = Object.fromEntries(
  ["FR", "UC", "NFR", "AT", "JT", "TEST"].map((kind) => [
    kind.toLowerCase(),
    new RegExp(
      `(?<![${PYTHON_WORD}])${kind}-${SLUG}-${SLUG}(?![${PYTHON_WORD}])`,
      "gu",
    ),
  ]),
) as Record<string, RegExp>;
const COMP = new RegExp(
  `(?<![${PYTHON_WORD}])COMP-${SLUG}(?![${PYTHON_WORD}])`,
  "gu",
);
const VALID_ANY = new RegExp(
  `^(?:(?:MILE|WORK|PR|FR|UC|NFR|AT|JT)-${SLUG}-${SLUG}|TEST-${SLUG}-${SLUG}|COMP-${SLUG})$`,
);
const NON_PLAN_CANDIDATE =
  /(?<![A-Za-z0-9-])(?:(?:FR|UC|NFR|AT|JT|TEST)-[A-Za-z0-9]+-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*|COMP-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)(?![A-Za-z0-9-])/gi;
const EXTERNAL_DOUBLE =
  /\b(?:external|vendor|sdk|api|cli|host|service|broker|driver|database|file format)\b(?:(?!\n\n).){0,160}\b(?:mock|fake|stub|test double|mirror|mirrored|re-?declar|hand-?cop(?:y|ied)|hand-?authored|local interface|do not import)\b|\b(?:mock|fake|stub|test double|mirror|mirrored|re-?declar|hand-?cop(?:y|ied)|hand-?authored|local interface|do not import)\b(?:(?!\n\n).){0,160}\b(?:external|vendor|sdk|api|cli|host|service|broker|driver|database|file format)\b/gis;
const REAL_BOUNDARY =
  /\b(?:real[- ]boundary|real dependency|real external|official conformance|type[- ]conformance|contract test|integration test|vendor sandbox|emulator|captured real|generated client|schema|openapi|asyncapi)\b/i;
const UI_MOCK_REQUIRED = /^\s*UI Mock Preference\s*:\s*Required\s*$/im,
  UI_ARTIFACT = /^\s*(?:UI Mock|Approved Prototype) Artifact\s*:\s*(\S+)\s*$/im;
const LEAN = /^\s*Lean Change Record\s*:\s*Yes\s*$/im,
  INHERITED = /^\s*Inherited Intent Record\s*:\s*Yes\s*$/im,
  SLICE = /^\s*Work Scope\s*:\s*Slice\/change\s*$/im;
const PROFILE =
    /^\s*(?:Delivery Assurance Profile|Delivery Profile)\s*:\s*(.+?)\s*$/im,
  READINESS = /^\s*Implementation Readiness\s*:\s*(.+?)\s*$/im;
const PARENT_WORK = new RegExp(
  `^\\s*Parent Work Item\\s*:\\s*(WORK-${SLUG}-${SLUG})\\s*$`,
  "im",
);
const CLASSIFICATION =
  /^\s*(?:[-*+]\s+)?(?:\*\*)?Work Classification(?:\*\*)?\s*:\s*(.+?)\s*$/gim;
const CLASSIFICATIONS = new Set([
  "reuse directly",
  "extract then reuse",
  "target-owned implementation",
  "new behavior",
  "deferred cleanup",
]);
const LEAD = /^[\s#>\-*+0-9.)]*/,
  DEF_MARKER = /^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/;
const WORK_FIELDS: [string[], string][] = [
  ["Parent scope"],
  ["Child scope", "Scope"],
  ["Parent IDs / inherited obligations"],
  ["Required child artifacts", "Required child documents"],
].map((labels, index) => [
  labels,
  [
    "parent_scope",
    "child_scope",
    "parent_obligations",
    "required_child_artifacts",
  ][index]!,
]);

const defId = (line: string): string | undefined =>
  definitionId(line, PLAN_ID, LEAD, DEF_MARKER);
const kind = (id: string): string => id.split("-", 1)[0] ?? "";
function definitionsAndReferences(text: string) {
  const defined = Object.fromEntries(
      ["MILE", "WORK", "PR"].map((key) => [key, new Set<string>()]),
    ) as Record<string, Set<string>>,
    refs = new Set<string>();
  let fenced = false;
  for (const line of splitLines(text)) {
    if (line.trim().startsWith("```")) {
      fenced = !fenced;
      allMatches(line, PLAN_ID).forEach((id) => refs.add(id));
      continue;
    }
    const ids = allMatches(line, PLAN_ID);
    if (ids.length) {
      const first = fenced ? undefined : defId(line);
      if (first) defined[kind(first)]?.add(first);
      ids.forEach((id) => refs.add(id));
    }
  }
  return { defined, refs };
}
function deliveryBlocks(text: string): {
  works: Map<string, string>;
  prs: Map<string, string>;
} {
  const works = new Map<string, string>(),
    prs = new Map<string, string>(),
    primary = primaryDefinitionIds(text, defId);
  let current: string | undefined,
    buffer: string[] = [],
    fenced = false;
  const save = (): void => {
    if (current)
      (current.startsWith("PR-") ? prs : works).set(current, buffer.join("\n"));
  };
  for (const line of splitLines(text)) {
    const fence = line.trim().startsWith("```");
    let id = fenced ? undefined : defId(line);
    if (id && line.trimStart().startsWith("|") && primary.has(id))
      id = undefined;
    if (id && ["WORK", "PR"].includes(kind(id))) {
      if (works.has(id) || prs.has(id) || current === id) continue;
      save();
      current = id;
      buffer = [line];
    } else if (current) {
      if (
        line.startsWith("## ") ||
        (id && ["MILE", "WORK", "PR"].includes(kind(id)))
      ) {
        save();
        current = undefined;
        buffer = [];
      } else buffer.push(line);
    }
    if (fence) fenced = !fenced;
  }
  save();
  return { works, prs };
}
function fieldPresent(block: string, label: string): boolean {
  return new RegExp(
    `^\\s*(?:[-*+]\\s+)?(?:\\*\\*)?${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\*\\*)?\\s*:\\s*\\S`,
    "im",
  ).test(block);
}
function compactIssues(text: string, implementation: boolean): string[] {
  const legacy = LEAN.test(text),
    inherited = INHERITED.test(text);
  if (!legacy && !inherited) return [];
  const issues: string[] = [];
  if (legacy && PROFILE.exec(text)?.[1]?.trim().toLowerCase() !== "lean")
    issues.push("delivery_profile_must_be_lean");
  if (legacy && !SLICE.test(text))
    issues.push("work_scope_must_be_slice_change");
  if (READINESS.exec(text)?.[1]?.trim().toLowerCase() !== "code-ready")
    issues.push("implementation_readiness_must_be_code_ready");
  if (!implementation) issues.push("plan_type_must_be_implementation");
  if (legacy && !PARENT_WORK.test(text))
    issues.push("parent_work_item_missing_or_invalid");
  for (const label of legacy
    ? [
        "Why Lean",
        "Changed Behavior",
        "Parent IDs / inherited obligations",
        "Acceptance & Verification",
        "Escalate If",
      ]
    : ["Why Direct", "Acceptance & Verification"])
    if (!fieldPresent(text, label))
      issues.push(
        `missing_${label.toLowerCase().replaceAll(" ", "_").replaceAll("/", "_").replaceAll("&", "and")}`,
      );
  return issues;
}

export async function checkPlan(
  argv: readonly string[],
  root = process.cwd(),
): Promise<{ report: Record<string, unknown>; exitCode: number }> {
  const feature = argv.includes("--feature"),
    inheritedSubset = argv.includes("--inherited-subset"),
    requireApprovals = argv.includes("--require-approvals");
  const approvalsPath = valueAfter(
      argv,
      "--approvals",
      ".sdlc/approvals.yaml",
    )!,
    gatesPath = valueAfter(argv, "--gates-policy", ".sdlc/gates.yaml")!,
    path = positional(argv)[0] ?? "plan.md";
  const text = await readUtf8(path),
    formatName = artifactFormat(text),
    formatIssues = humanFirstIssues(
      text,
      ["Implementation Approach", "Implementation Crux"],
      ["human-first-v2", "human-first-v3"],
    );
  const parentIds = new Set<string>(),
    parent = valueAfter(argv, "--parent");
  if (parent)
    Object.values(
      definitionsAndReferences(await readUtf8(parent)).defined,
    ).forEach((set) => set.forEach((id) => parentIds.add(id)));
  const specPath = valueAfter(argv, "--spec"),
    specText = specPath ? await readUtf8(specPath) : "",
    designPath = valueAfter(argv, "--design"),
    designText = designPath ? await readUtf8(designPath) : "";
  const required: Record<string, Set<string>> = {
    fr: new Set(allMatches(specText, patterns.fr!)),
    uc: new Set(allMatches(specText, patterns.uc!)),
    nfr: new Set(allMatches(specText, patterns.nfr!)),
    at: new Set(allMatches(specText, patterns.at!)),
    jt: new Set(allMatches(specText, patterns.jt!)),
    comp: new Set(allMatches(designText, COMP)),
    test: new Set(allMatches(designText, patterns.test!)),
  };
  const cited = Object.fromEntries(
    Object.entries({ ...patterns, comp: COMP }).map(([key, pattern]) => [
      key,
      new Set(allMatches(text, pattern)),
    ]),
  ) as Record<string, Set<string>>;
  const { defined, refs } = definitionsAndReferences(text),
    blocks = deliveryBlocks(text),
    waveResult = parseLearningWaves(text, path);
  const incomplete = Object.fromEntries(
    [...blocks.works].flatMap(([id, block]) => {
      const missing = WORK_FIELDS.flatMap(([labels, key]) =>
        labels.some((label) => fieldPresent(block, label)) ? [] : [key],
      );
      return missing.length ? [[id, missing]] : [];
    }),
  );
  const allBlocks = new Map([...blocks.works, ...blocks.prs]);
  const classificationIssues: Record<string, unknown> = {};
  for (const [id, block] of allBlocks) {
    if (block.trimStart().startsWith("|"))
      classificationIssues[id] = {
        reason: "descriptive_delivery_block_required",
        values: [],
      };
    else {
      const values = allMatches(block, CLASSIFICATION).map(
        (value) => CLASSIFICATION.exec(value)?.[1]?.trim() ?? value,
      );
      CLASSIFICATION.lastIndex = 0;
      if (values.length !== 1)
        classificationIssues[id] = {
          reason: "exactly_one_classification_required",
          values,
        };
      else if (!CLASSIFICATIONS.has(values[0]!.toLowerCase()))
        classificationIssues[id] = {
          reason: "unsupported_classification",
          values,
        };
    }
  }
  const classificationValues = [
    ...stripFencedCode(text).matchAll(CLASSIFICATION),
  ].map((match) => match[1]!.trim());
  const planType = /^Plan Type:\s*(.+?)\s*$/im
      .exec(text)?.[1]
      ?.trim()
      .toLowerCase(),
    breakdown = planType === "breakdown",
    implementation = planType === "implementation",
    lean = LEAN.test(text),
    inherited = INHERITED.test(text),
    compact = lean || inherited,
    compactRecordIssues = compactIssues(text, implementation);
  const workIds = breakdown ? new Set(blocks.works.keys()) : new Set<string>(),
    memberCounts = new Map<string, number>();
  for (const wave of waveResult.waves)
    for (const member of wave.members)
      memberCounts.set(member, (memberCounts.get(member) ?? 0) + 1);
  const unknownWaveMembers = sorted(
      [...memberCounts.keys()].filter((id) => !workIds.has(id)),
    ),
    unscheduled = sorted([...workIds].filter((id) => !memberCounts.has(id))),
    duplicateWaveMembers = sorted(
      [...memberCounts].filter(([, count]) => count > 1).map(([id]) => id),
    );
  const prOrder = new Map(
      [...blocks.prs.keys()].map((id, index) => [id, index]),
    ),
    forward: string[] = [];
  for (const [id, block] of blocks.prs)
    for (const ref of allMatches(block, PLAN_ID_BY_KIND.PR!))
      if (ref !== id && (prOrder.get(ref) ?? -1) > (prOrder.get(id) ?? -1)) {
        forward.push(id);
        break;
      }
  const deliveryText = `${[...allBlocks.values()].join("\n")}\n${sectionText(text, "Coverage Map")}`,
    covered = Object.fromEntries(
      Object.entries({ ...patterns, comp: COMP }).map(([key, pattern]) => [
        key,
        new Set(
          allMatches(deliveryText, pattern).filter((id) =>
            required[key]?.has(id),
          ),
        ),
      ]),
    ) as Record<string, Set<string>>;
  const primary = primaryDefinitionIds(text, defId),
    definitionIds: string[] = [];
  let fenced = false;
  for (const line of splitLines(text)) {
    if (line.trim().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    const id = fenced ? undefined : defId(line);
    if (id && !(line.trimStart().startsWith("|") && primary.has(id)))
      definitionIds.push(id);
  }
  const duplicates = sorted(
      new Set(
        definitionIds.filter(
          (id, index) => definitionIds.indexOf(id) !== index,
        ),
      ),
    ),
    candidates = new Set([
      ...allMatches(text, PLAN_ID_CANDIDATE),
      ...allMatches(text, NON_PLAN_CANDIDATE),
    ]),
    bad = sorted([...candidates].filter((id) => !VALID_ANY.test(id))),
    allIds = new Set([
      ...Object.values(defined).flatMap((set) => [...set]),
      ...parentIds,
    ]),
    orphans = sorted([...refs].filter((id) => !allIds.has(id)));
  const externalMentions = allMatches(text, EXTERNAL_DOUBLE).map((value) =>
      value.replace(/\s+/g, " ").trim(),
    ),
    mitigation = !externalMentions.length || REAL_BOUNDARY.test(deliveryText),
    unknownInherited = Object.fromEntries(
      Object.entries(cited).map(([key, values]) => [
        key,
        sorted([...values].filter((id) => !required[key]?.has(id))),
      ]),
    );
  const waveInvalid =
    !waveResult.declared ||
    !waveResult.waves.length ||
    !!(
      waveResult.malformed_ids.length ||
      waveResult.duplicates.length ||
      Object.keys(waveResult.missing_fields).length ||
      waveResult.invalid_orders.length ||
      waveResult.invalid_wip_limits.length ||
      waveResult.duplicate_orders.length ||
      Object.keys(waveResult.invalid_members).length ||
      Object.keys(waveResult.invalid_member_kinds).length ||
      Object.keys(waveResult.duplicate_members).length ||
      waveResult.empty_members.length
    );
  let approvalContext: ApprovalContext | undefined;
  const approvalRequirements: ApprovalRequirement[] = [];
  if (requireApprovals) {
    approvalContext = await loadApprovalContext(root, approvalsPath, gatesPath);
    if (specPath) {
      approvalRequirements.push(
        approvalRequirement(approvalContext, root, "spec.approved", specPath),
      );
      if (UI_MOCK_REQUIRED.test(specText)) {
        const match = UI_ARTIFACT.exec(`${specText}\n${designText}\n${text}`);
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
    if (designPath)
      approvalRequirements.push(
        approvalRequirement(
          approvalContext,
          root,
          "design.approved",
          designPath,
        ),
      );
  }
  const workflowStateIssues = await validateWorkflowState(root);
  const coverageGate = (key: string): boolean =>
    inheritedSubset
      ? (unknownInherited[key] as string[]).length === 0
      : covered[key]!.size === required[key]!.size;
  const gates: Record<string, boolean> = {
    workflow_state_valid: !workflowStateIssues.length,
    has_delivery_items: !!allBlocks.size,
    id_format_slug_only: !bad.length,
    no_duplicates: !duplicates.length,
    no_orphan_refs: !orphans.length,
    fr_coverage_100: coverageGate("fr"),
    uc_coverage_100: coverageGate("uc"),
    nfr_coverage_100: coverageGate("nfr"),
    at_coverage_100: coverageGate("at"),
    jt_coverage_100: coverageGate("jt"),
    comp_coverage_100: coverageGate("comp"),
    test_obligation_coverage_100: coverageGate("test"),
    external_double_mitigation_present: mitigation,
    work_allocations_well_formed: !Object.keys(incomplete).length,
    learning_waves_well_formed:
      implementation || !waveResult.declared || !waveInvalid,
    learning_wave_members_complete:
      implementation ||
      !waveResult.declared ||
      !(unknownWaveMembers.length || duplicateWaveMembers.length),
    lean_change_record_well_formed: !lean || !compactRecordIssues.length,
    inherited_intent_record_well_formed:
      !inherited || !compactRecordIssues.length,
    no_forward_deps: !forward.length,
    ...(requireApprovals
      ? { required_approvals_present: approvalGatePassed(approvalRequirements) }
      : {}),
    human_first_structure: !formatIssues.length,
    baseline_reuse_classified:
      formatName !== "human-first-v3" ||
      (!!sectionText(text, "Baseline Reuse").trim() &&
        classificationValues.length === allBlocks.size &&
        classificationValues.every((value) =>
          CLASSIFICATIONS.has(value.toLowerCase()),
        ) &&
        !Object.keys(classificationIssues).length),
  };
  if (!feature)
    gates.sections_present = sectionsPresentInOrder(
      text,
      formatName === "human-first-v3"
        ? PRODUCT_FIRST_PLAN_SECTIONS
        : formatName === "human-first-v2"
          ? HUMAN_FIRST_PLAN_SECTIONS
          : PLAN_SECTIONS,
    );
  const issueKeys = [
    "malformed_ids",
    "duplicates",
    "missing_fields",
    "invalid_orders",
    "invalid_wip_limits",
    "duplicate_orders",
    "invalid_members",
    "invalid_member_kinds",
    "duplicate_members",
    "empty_members",
  ] as const;
  const report = {
    mode: feature ? "feature" : "product",
    counts: Object.fromEntries(
      Object.entries(defined).map(([key, set]) => [key, set.size]),
    ),
    plan_kind:
      blocks.works.size && !blocks.prs.size ? "breakdown" : "implementation",
    implementation_plan: implementation,
    lean_change_record: {
      declared: lean,
      issues: compactRecordIssues,
      replaces: lean ? ["child spec", "child design", "child plan"] : [],
    },
    inherited_intent_record: {
      declared: inherited,
      legacy_lean_marker: lean,
      issues: compactRecordIssues,
      replaces: compact ? ["child spec", "child design"] : [],
    },
    inherited_subset_mode: inheritedSubset,
    unknown_inherited_refs: unknownInherited,
    work_items: sorted(blocks.works.keys()),
    incomplete_work_allocations: incomplete,
    baseline_reuse: {
      section_present: !!sectionText(text, "Baseline Reuse").trim(),
      allowed_classifications: sorted(CLASSIFICATIONS),
      classifications: classificationValues,
      expected_count: allBlocks.size,
      issues: classificationIssues,
    },
    learning_waves: waveResult.waves,
    learning_wave_issues: Object.fromEntries(
      issueKeys.map((key) => [key, waveResult[key]]),
    ),
    unknown_wave_members: unknownWaveMembers,
    unscheduled_work_items: unscheduled,
    unassigned_wave_members: unscheduled,
    duplicate_wave_members: duplicateWaveMembers,
    ...Object.fromEntries(
      Object.keys(required).map((key) => [
        `${key === "test" ? "test_obligation" : key}_coverage_pct`,
        percentage(covered[key]!, required[key]!),
      ]),
    ),
    uncovered_frs: sorted(
      [...required.fr!].filter((id) => !covered.fr!.has(id)),
    ),
    uncovered_ucs: sorted(
      [...required.uc!].filter((id) => !covered.uc!.has(id)),
    ),
    uncovered_nfrs: sorted(
      [...required.nfr!].filter((id) => !covered.nfr!.has(id)),
    ),
    uncovered_ats: sorted(
      [...required.at!].filter((id) => !covered.at!.has(id)),
    ),
    uncovered_jts: sorted(
      [...required.jt!].filter((id) => !covered.jt!.has(id)),
    ),
    uncovered_comps: sorted(
      [...required.comp!].filter((id) => !covered.comp!.has(id)),
    ),
    uncovered_test_obligations: sorted(
      [...required.test!].filter((id) => !covered.test!.has(id)),
    ),
    external_double_mentions: externalMentions,
    external_double_mitigation_present: mitigation,
    forward_deps: sorted(forward),
    approval_requirements: approvalRequirements,
    approval_ledger: {
      path: approvalsPath,
      exists: approvalContext?.exists ?? null,
      load_error: approvalContext?.load_error ?? null,
      invalid_records: approvalContext?.invalid_records ?? [],
    },
    orphan_refs: orphans,
    duplicates,
    bad_id_format: bad,
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
    result = await checkPlan(argv);
  if (argv.includes("--json")) printJson(result.report);
  else {
    const report: any = result.report,
      labels: Record<string, string> = {
        workflow_state_valid:
          "Saved work status and project settings are valid",
        has_delivery_items: "At least one change is planned",
        id_format_slug_only: "Identifiers use the supported format",
        no_duplicates: "No duplicate identifiers",
        no_orphan_refs: "Every referenced ID exists",
        external_double_mitigation_present:
          "Tests using a substitute also check the real external dependency",
        work_allocations_well_formed: "Child work has the required links",
        learning_waves_well_formed: "Work groups are valid",
        learning_wave_members_complete:
          "Every item named in a work group exists",
        no_forward_deps: "Planned changes are in dependency order",
        required_approvals_present: "Required approvals are current",
        human_first_structure:
          "The document starts with a plain summary and ends with links between related items",
        baseline_reuse_classified:
          "The plan says what will be reused, changed, added, or postponed",
        sections_present: "Required sections are present",
      };
    for (const [key, passed] of Object.entries(report.gates))
      console.log(
        `${passed ? "PASS" : "FAIL"}  ${labels[key] ?? key.replaceAll("_", " ")}`,
      );
    for (const item of report.workflow_state_issues)
      console.log(
        `ERROR ${item.path} ${item.field}: ${item.reason} (found ${pythonRepr(item.value)})`,
      );
    console.log(
      `\nRequirements covered: ${report.fr_coverage_pct}%  User outcomes covered: ${report.uc_coverage_pct}%  Acceptance covered: ${report.at_coverage_pct}%  Components covered: ${report.comp_coverage_pct}%  Required tests covered: ${report.test_obligation_coverage_pct}%`,
    );
    console.log(`${report.passed}/${report.total} checks passed`);
  }
  return result.exitCode;
}
/* node:coverage ignore next */
if (isDirectInvocation(import.meta.url)) process.exitCode = await main();
/* node:coverage ignore end */
