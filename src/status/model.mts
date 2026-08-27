/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-plus-operands, @typescript-eslint/restrict-template-expressions -- The renderer mirrors a heterogeneous, serialized Python status model during migration. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, type Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import {
  loadApprovalContext,
  loadYamlFile,
  sha256File,
} from "../checkers/lib/approvals.mjs";
import { annotationAttrs } from "../checkers/lib/markdown-structure.mjs";
import {
  isPlanId,
  isWaveId,
  planIdCandidates,
} from "../checkers/lib/schemas.mjs";
import { compareCodePoints, splitLines } from "../checkers/lib/output.mjs";
import { parseLearningWaves } from "../checkers/lib/waves.mjs";
import { validateWorkflowState } from "../checkers/lib/workflow-state.mjs";

export type StatusValue = Record<string, any>;

const APPROVED_STATUSES = new Set(["approved", "auto-approved"]);
const WIP_LEARNING_FIELDS = [
  ["Expected Result", "target"],
  ["Learning Target", "target"],
  ["Feedback From", "feedback_target"],
  ["Feedback Target", "feedback_target"],
  ["Feedback Status", "feedback_status"],
  ["Feedback Evidence", "feedback_evidence"],
  ["Current Work Group", "active_wave"],
  ["Active Learning Wave", "active_wave"],
  ["Current Work", "active_work_item"],
  ["Active Work Item", "active_work_item"],
  ["Parallel Limit", "wip_limit"],
  ["WIP Limit", "wip_limit"],
  ["Active Slices", "active_slices"],
  ["What Changed", "invalidation_result"],
  ["Invalidation Result", "invalidation_result"],
  ["Documents To Update", "ancestor_impact"],
  ["Ancestor Impact", "ancestor_impact"],
  ["Stop Conditions", "stop_or_replan"],
  ["Stop Or Replan Triggers", "stop_or_replan"],
] as const;
export const WIP_PRODUCT_FIELDS = [
  ["Goal", "goal"],
  ["Working Result", "working_result"],
  ["Blockers", "blockers"],
  ["Next Action", "next_action"],
] as const;
const WIP_LEGACY_PRODUCT_FIELDS = [
  ["Working Today", "working_today"],
  ["Reusable Today", "reusable_today"],
  ["Current Increment", "current_increment"],
  ["Remaining Shared Work", "remaining_shared_work"],
  ["Target-Owned Work", "target_owned_work"],
  ["Deferred", "deferred"],
  ["Before Coding", "before_coding"],
] as const;
const ASSESSMENT_LEARNING_FIELDS = [
  ["target", "target"],
  ["feedback_target", "feedback_target"],
  ["feedback_status", "feedback_status"],
  ["feedback_evidence", "feedback_evidence"],
  ["invalidation_result", "invalidation_result"],
  ["ancestor_impact", "ancestor_impact"],
  ["stop_or_replan", "stop_or_replan"],
] as const;
const EXCLUDED_DIRS = new Set([
  ".git",
  ".mypy_cache",
  ".pytest_cache",
  ".ruff_cache",
  ".tox",
  ".venv",
  "__pycache__",
  "dist",
  "node_modules",
  "vendor",
]);
const METADATA_FIELDS = [
  "Work Scope",
  "Ready To Implement",
  "Implementation Readiness",
  "Delivery Assurance Profile",
  "Approval Policy",
  "Work Outcome",
  "Review Level",
  "Delivery Profile",
  "Extra Checks",
  "Assurance Modules",
  "Plan Type",
  "Inherited Intent Record",
  "Lean Change Record",
  "Design Depth",
] as const;

async function exists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}

export async function readText(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export async function hashFile(path: string): Promise<string> {
  const hash = await sha256File(path);
  if (hash === null) throw new Error(`file does not exist: ${path}`);
  return hash;
}

export function relativePath(path: string, root: string): string {
  return relative(resolve(root), resolve(path)).split(sep).join("/");
}

async function walk(root: string, current = root): Promise<string[]> {
  const result: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (error) {
    if (["EACCES", "EPERM", "ENOENT"].includes(String(errorCode(error))))
      return result;
    throw error;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name))
        result.push(...(await walk(root, join(current, entry.name))));
    } else if (entry.isFile()) result.push(join(current, entry.name));
  }
  return result;
}

function gitFiles(root: string): string[] | null {
  const result = spawnSync(
    "git",
    [
      "-C",
      root,
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
    ],
    { encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0 || result.error) return null;
  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((path) => resolve(root, path))
    .filter(existsSync);
}

export async function discover(
  root: string,
  filename: string,
): Promise<string[]> {
  const wildcard = filename.startsWith("*") ? filename.slice(1) : undefined;
  const candidates = gitFiles(root) ?? (await walk(root));
  const paths = candidates.filter((path) =>
    wildcard === undefined
      ? basename(path) === filename
      : path.endsWith(wildcard),
  );
  return paths.sort((left, right) => {
    const depth =
      relative(root, left).split(sep).length -
      relative(root, right).split(sep).length;
    return (
      depth ||
      compareCodePoints(
        left.toLocaleLowerCase("en-US"),
        right.toLocaleLowerCase("en-US"),
      )
    );
  });
}

export function firstHeading(text: string): string | null {
  return /^#\s+(.+?)\s*$/m.exec(text)?.[1]?.trim() ?? null;
}

export function metadata(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of METADATA_FIELDS) {
    const match = new RegExp(
      `^${escapeRegex(field)}:\\s*(.+?)\\s*$`,
      "im",
    ).exec(text);
    if (match?.[1]) result[field] = match[1].trim().replace(/\.+$/, "");
  }
  return result;
}

async function canonicalArtifact(
  root: string,
  kind: string,
): Promise<string | null> {
  const candidates = await discover(root, `${kind}.md`);
  for (const preferred of [
    join(root, "docs", `${kind}.md`),
    join(root, `${kind}.md`),
  ]) {
    if (candidates.includes(preferred)) return preferred;
  }
  if (kind === "plan") {
    for (const path of candidates) {
      if (
        metadata(await readText(path))["Plan Type"]?.toLocaleLowerCase(
          "en-US",
        ) === "breakdown"
      )
        return path;
    }
  }
  return candidates[0] ?? null;
}

async function resolveLedgerPath(
  root: string,
  rawPath: string,
): Promise<string | null> {
  const normalized = rawPath.replaceAll("\\", "/");
  const candidates = [
    resolve(root, normalized),
    resolve(dirname(root), normalized),
  ];
  const parts = normalized.split("/");
  if (
    parts[0]?.toLocaleLowerCase("en-US") ===
    basename(root).toLocaleLowerCase("en-US")
  ) {
    candidates.push(resolve(root, ...parts.slice(1)));
  }
  for (const candidate of candidates)
    if (await exists(candidate)) return candidate;
  return null;
}

function asRecord(value: unknown): StatusValue | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as StatusValue)
    : undefined;
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

async function artifactPathMapping(
  root: string,
): Promise<
  [
    Record<string, string>,
    Record<string, Record<string, string>>,
    string | null,
  ]
> {
  const decisionsPath = join(root, ".sdlc", "process-decisions.yaml");
  const legacyPath = join(root, ".sdlc", "artifact-paths.yaml");
  let loaded: StatusValue | undefined;
  try {
    if (await exists(decisionsPath)) {
      const decisions = asRecord(await loadYamlFile(decisionsPath));
      if (!decisions) return [{}, {}, "process decisions must be a mapping"];
      const artifactPaths = decisions.artifact_paths;
      if (
        artifactPaths !== undefined &&
        artifactPaths !== null &&
        !asRecord(artifactPaths)
      )
        return [{}, {}, "artifact_paths must be a mapping"];
      loaded = asRecord(artifactPaths);
    }
    if (!loaded && (await exists(legacyPath))) {
      loaded = asRecord(await loadYamlFile(legacyPath));
      if (!loaded) return [{}, {}, "artifact paths must be a mapping"];
    }
  } catch (error) {
    return [{}, {}, errorMessage(error)];
  }
  if (!loaded) return [{}, {}, null];
  const resolveGroup = async (
    raw: unknown,
  ): Promise<Record<string, string>> => {
    const group = asRecord(raw);
    const result: Record<string, string> = {};
    if (!group) return result;
    for (const kind of ["spec", "design", "plan"]) {
      if (typeof group[kind] === "string") {
        const path = await resolveLedgerPath(root, group[kind]);
        if (path) result[kind] = path;
      }
    }
    return result;
  };
  const canonical = await resolveGroup(loaded.canonical);
  const children: Record<string, Record<string, string>> = {};
  const rawChildren = asRecord(loaded.children);
  if (rawChildren)
    for (const [id, raw] of Object.entries(rawChildren)) {
      const group = await resolveGroup(raw);
      if (Object.keys(group).length) children[id] = group;
    }
  return [canonical, children, null];
}

async function processDeliveryChoices(
  root: string,
): Promise<[Record<string, string>, string | null]> {
  const path = join(root, ".sdlc", "process-decisions.yaml");
  if (!(await exists(path))) return [{}, null];
  let loaded: StatusValue | undefined;
  try {
    loaded = asRecord(await loadYamlFile(path));
  } catch (error) {
    return [{}, errorMessage(error)];
  }
  if (!loaded) return [{}, "process decisions must be a mapping"];
  const delivery = asRecord(loaded.delivery) ?? {};
  const approval = asRecord(loaded.approval) ?? {};
  const profiles: Record<string, string> = {
    lean: "Lean",
    standard: "Standard",
    "high-assurance": "High-assurance",
    high_assurance: "High-assurance",
  };
  const policies: Record<string, string> = {
    human_checkpoints: "Human checkpoints",
    automatic_eligible_gates: "Automatic eligible gates",
  };
  const outcomes: Record<string, string> = {
    product_increment: "Product increment",
    decision_evidence: "Decision/evidence",
  };
  return [
    {
      profile:
        profiles[
          stringValue(delivery.assurance_profile).toLocaleLowerCase("en-US")
        ] ?? "",
      approval_policy:
        policies[stringValue(approval.policy).toLocaleLowerCase("en-US")] ?? "",
      work_outcome:
        outcomes[
          stringValue(delivery.work_outcome).toLocaleLowerCase("en-US")
        ] ?? "",
      modules: Array.isArray(delivery.extra_checks)
        ? delivery.extra_checks.map(String).join(", ")
        : stringValue(delivery.extra_checks).trim(),
    },
    null,
  ];
}

async function loadList(
  root: string,
  filename: string,
  key: string,
): Promise<[StatusValue[], string | null]> {
  const path = join(root, ".sdlc", filename);
  if (!(await exists(path))) return [[], null];
  try {
    const raw = asRecord(await loadYamlFile(path))?.[key];
    if (!Array.isArray(raw)) return [[], `${key} must be a list`];
    return [
      raw.flatMap((item) => (asRecord(item) ? [asRecord(item)!] : [])),
      null,
    ];
  } catch (error) {
    return [[], errorMessage(error)];
  }
}

async function loadDeliveryRecords(
  root: string,
): Promise<[StatusValue[], string | null, StatusValue[], string | null]> {
  const path = join(root, ".sdlc", "delivery-records.yaml");
  let records: StatusValue[] = [];
  if (await exists(path)) {
    try {
      const raw = asRecord(await loadYamlFile(path))?.records;
      if (!Array.isArray(raw))
        return [[], "records must be a list", [], "records must be a list"];
      if (raw.some((item) => !asRecord(item)))
        return [
          [],
          "each delivery record must be a mapping",
          [],
          "each delivery record must be a mapping",
        ];
      records = raw as StatusValue[];
    } catch (error) {
      const message = errorMessage(error);
      return [[], message, [], message];
    }
  }
  let assessments = records.filter(
    (record) => record.kind === "code_assessment",
  );
  let checkpoints = records.filter(
    (record) => record.kind === "wave_checkpoint",
  );
  let assessmentError: string | null = null;
  let checkpointError: string | null = null;
  if (!assessments.length)
    [assessments, assessmentError] = await loadList(
      root,
      "code-assessments.yaml",
      "assessments",
    );
  if (!checkpoints.length)
    [checkpoints, checkpointError] = await loadList(
      root,
      "wave-checkpoints.yaml",
      "checkpoints",
    );
  return [assessments, assessmentError, checkpoints, checkpointError];
}

export function compactValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value))
    return value.map(compactValue).filter(Boolean).join(", ") || null;
  const record = asRecord(value);
  if (record)
    return (
      Object.keys(record)
        .sort((a, b) =>
          compareCodePoints(
            a.toLocaleLowerCase("en-US"),
            b.toLocaleLowerCase("en-US"),
          ),
        )
        .flatMap((key) => {
          const rendered = compactValue(record[key]);
          return rendered ? [`${key}: ${rendered}`] : [];
        })
        .join("; ") || null
    );
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value).trim() || null;
}

function assessmentLearning(record: StatusValue): Record<string, string> {
  const raw = asRecord(record.learning);
  if (!raw) return {};
  return Object.fromEntries(
    ASSESSMENT_LEARNING_FIELDS.flatMap(([source, target]) => {
      const rendered = compactValue(raw[source]);
      return rendered ? [[target, rendered]] : [];
    }),
  );
}

async function codeAssessmentFor(
  root: string,
  workItem: string,
  planPath: string,
  records: StatusValue[],
): Promise<StatusValue | null> {
  const currentHash = await hashFile(planPath);
  for (const record of [...records].reverse()) {
    const plan = asRecord(record.plan);
    if (record.work_item !== workItem || !plan) continue;
    const resolved = await resolveLedgerPath(root, stringValue(plan.path));
    if (!resolved || resolve(resolved) !== resolve(planPath)) continue;
    if (
      stringValue(record.verdict).toLocaleLowerCase("en-US") === "pass" &&
      plan.sha256 === currentHash
    ) {
      return {
        state: "assessed",
        id: record.id,
        verdict: record.verdict,
        hash: currentHash,
        assessed_at: record.assessed_at ?? null,
        learning: assessmentLearning(record),
      };
    }
    return null;
  }
  return null;
}

async function approvalFor(
  root: string,
  path: string,
  gate: string,
  records: unknown[],
  invalidById: Map<unknown, string[]>,
): Promise<StatusValue> {
  const currentHash = await hashFile(path);
  const matches: StatusValue[] = [];
  for (const raw of records) {
    const record = asRecord(raw);
    const artifact = asRecord(record?.artifact);
    if (!record || record.gate !== gate || !artifact) continue;
    const resolved = await resolveLedgerPath(root, stringValue(artifact.path));
    if (resolved && resolve(resolved) === resolve(path)) matches.push(record);
  }
  const approvalTime = (record: StatusValue): string =>
    record.approved_at === null ? "None" : stringValue(record.approved_at);
  matches.sort((a, b) => compareCodePoints(approvalTime(b), approvalTime(a)));
  for (const record of matches) {
    const artifact = asRecord(record.artifact)!;
    if (
      APPROVED_STATUSES.has(stringValue(record.status)) &&
      artifact.sha256 === currentHash &&
      !invalidById.has(record.id)
    ) {
      return {
        state: "approved",
        id: record.id,
        status: record.status,
        hash: currentHash,
        record_hash: artifact.sha256,
        approved_by: record.approved_by,
        approved_at: record.approved_at,
      };
    }
  }
  const latest = matches[0] ?? {};
  const artifact = asRecord(latest.artifact) ?? {};
  return {
    state: matches.length ? "stale" : "unapproved",
    id: latest.id ?? null,
    status: latest.status ?? null,
    hash: currentHash,
    record_hash: artifact.sha256 ?? null,
    approved_by: latest.approved_by ?? null,
    approved_at: latest.approved_at ?? null,
  };
}

async function artifactModel(
  root: string,
  kind: string,
  path: string | null,
  records: unknown[],
  invalidById: Map<unknown, string[]>,
): Promise<StatusValue> {
  if (!path)
    return {
      kind,
      state: "missing",
      title: titleCase(kind),
      path: null,
      metadata: {},
      approval: null,
    };
  const text = await readText(path);
  const approval = await approvalFor(
    root,
    path,
    `${kind}.approved`,
    records,
    invalidById,
  );
  return {
    kind,
    state: approval.state,
    title: firstHeading(text) ?? titleCase(kind),
    path: relativePath(path, root),
    metadata: metadata(text),
    approval,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function titleCase(value: string): string {
  return value
    .toLocaleLowerCase("en-US")
    .replace(/(^|[ -])\p{L}/gu, (part) => part.toLocaleUpperCase("en-US"));
}
function errorCode(error: unknown): unknown {
  return error && typeof error === "object" && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function section(text: string, heading: string): string {
  const match = new RegExp(
    `^##\\s+${escapeRegex(heading)}\\s*$\\n([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`,
    "m",
  ).exec(text);
  return match?.[1] ?? "";
}

function paragraphField(block: string, label: string): string | null {
  const multiline = new RegExp(
    `(?:^|\\n)\\s{2}${escapeRegex(label)}:\\s*(.+?)(?=\\n\\s{2}[A-Z][A-Za-z /-]+:\\s|(?![\\s\\S]))`,
    "s",
  ).exec(block);
  if (multiline?.[1])
    return splitLines(multiline[1])
      .map((line) => line.trim())
      .join(" ")
      .trim();
  return (
    new RegExp(`^\\s*(?:[-*+]\\s+)?${escapeRegex(label)}:\\s*(.+?)\\s*$`, "im")
      .exec(block)?.[1]
      ?.trim() ?? null
  );
}

function annotatedDeliveryStarts(
  lines: string[],
  kind: string,
): Array<[number, string, string]> {
  const starts = new Map<string, [number, string, string, boolean]>();
  let lastHeading: [number, string] | undefined;
  for (const [index, line] of lines.entries()) {
    const heading = /^#{3,6}\s+(.+?)\s*$/.exec(line.trim());
    if (heading?.[1]) lastHeading = [index, heading[1].trim()];
    const legacy = /^-\s+(\S+)/.exec(line);
    if (
      legacy?.[1]
        ?.toLocaleLowerCase("en-US")
        .startsWith(`${kind.toLocaleLowerCase("en-US")}-`)
    ) {
      const id = legacy[1];
      starts.set(id, [
        index,
        id,
        titleCase(id.replace(new RegExp(`^${kind}-`), "").replaceAll("-", " ")),
        true,
      ]);
      continue;
    }
    const id = annotationAttrs(line).id;
    if (
      id
        ?.toLocaleLowerCase("en-US")
        .startsWith(`${kind.toLocaleLowerCase("en-US")}-`)
    ) {
      const name =
        lastHeading?.[1] ??
        titleCase(id.replace(new RegExp(`^${kind}-`), "").replaceAll("-", " "));
      starts.set(id, [index, id, name, true]);
      continue;
    }
    if (line.trimStart().startsWith("|")) {
      const cells = line
        .trim()
        .replace(/^\|+|\|+$/g, "")
        .split("|")
        .map((cell) => cell.trim().replaceAll("`", ""));
      const candidate = cells[0];
      if (candidate && isPlanId(candidate, kind) && !starts.has(candidate))
        starts.set(candidate, [index, candidate, cells[1] || candidate, false]);
    }
  }
  return [...starts.values()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, id, name]) => [index, id, name]);
}

export function workItems(planText: string): [StatusValue[], string[]] {
  const result: StatusValue[] = [];
  const malformed: string[] = [];
  const lines = splitLines(planText);
  const starts = annotatedDeliveryStarts(lines, "WORK");
  starts.forEach(([start, id, name], position) => {
    const end = starts[position + 1]?.[0] ?? lines.length;
    const block = lines.slice(start + 1, end).join("\n");
    if (!isPlanId(id, "WORK")) {
      malformed.push(id);
      return;
    }
    result.push({
      id,
      name,
      parent_scope: paragraphField(block, "Parent scope"),
      child_scope: paragraphField(block, "Child scope"),
      scope: paragraphField(block, "Scope"),
      dependencies: paragraphField(block, "Dependencies"),
      readiness_target: paragraphField(block, "Readiness target"),
      child_requirement:
        paragraphField(block, "Required child artifacts") ??
        paragraphField(block, "Required child artifact"),
      parent_obligations: paragraphField(
        block,
        "Parent IDs / inherited obligations",
      ),
      done_signal: paragraphField(block, "Done signal"),
      risks: paragraphField(block, "Risks"),
      learning_target: paragraphField(block, "Learning target"),
      feedback_target: paragraphField(block, "Feedback target"),
      feedback_method: paragraphField(block, "Feedback method"),
      invalidation_question: paragraphField(block, "Invalidation question"),
      dependency_types: paragraphField(block, "Dependency types"),
      learning_wave: paragraphField(block, "Learning wave"),
      stop_or_replan:
        paragraphField(block, "Stop/replan trigger") ??
        paragraphField(block, "Stop or replan trigger"),
    });
  });
  return [result, [...new Set(malformed)].sort(compareCodePoints)];
}

export async function parseWip(root: string): Promise<StatusValue> {
  const path = join(root, ".sdlc", "wip.md");
  const result: StatusValue = {
    exists: await exists(path),
    artifacts: {},
    learning: {},
    product_status: {},
  };
  if (!result.exists) return result;
  const text = await readText(path);
  for (const field of [
    "Active Plan",
    "Last Completed",
    "Planned Review Point",
    "Latest Checks",
    "Work Target",
    "Current Command",
    "Current Stage",
    "Current Gate",
    "Project Entry Mode",
    "Work Scope",
    "Ready To Implement",
    "Implementation Readiness",
    "Delivery Assurance Profile",
    "Approval Policy",
    "Work Outcome",
    "Review Level",
    "Delivery Profile",
    "Extra Checks",
    "Assurance Modules",
  ]) {
    const match = new RegExp(
      `^${escapeRegex(field)}:[ \\t]*(.*?)[ \\t]*$`,
      "im",
    ).exec(text);
    if (match?.[1] !== undefined) result[field] = match[1].trim();
  }
  if (!result["Current Command"]) {
    const legacy = stringValue(result["Current Stage"]).trim();
    if (
      /^(?:(?:spec|design|plan|code)-(?:create|verify|review|assess)|workflow-status)$/i.test(
        legacy,
      )
    ) {
      result["Current Command"] = legacy;
      result.legacy_current_stage_command = true;
    }
  }
  for (const [field, key] of WIP_LEARNING_FIELDS) {
    const match = new RegExp(
      `^${escapeRegex(field)}:[ \\t]*(.*?)[ \\t]*$`,
      "im",
    ).exec(text);
    if (match?.[1] !== undefined && !(key in result.learning))
      result.learning[key] = match[1].trim();
  }
  for (const [field, key] of [
    ...WIP_PRODUCT_FIELDS,
    ...WIP_LEGACY_PRODUCT_FIELDS,
  ]) {
    const match = new RegExp(
      `^${escapeRegex(field)}:[ \\t]*(.*?)[ \\t]*$`,
      "im",
    ).exec(text);
    if (match?.[1] !== undefined) result.product_status[key] = match[1].trim();
  }
  result.product_status.working_result ||=
    result.product_status.working_today ||
    result.product_status.current_increment ||
    "";
  result.product_status.blockers ||= result.product_status.before_coding || "";
  for (const [field, key] of [
    ["Status Result", "status_result"],
    ["Status Summary", "status_summary"],
  ] as const) {
    const value = new RegExp(`^${field}:\\s*(.+?)\\s*$`, "im")
      .exec(text)?.[1]
      ?.trim();
    if (value) result.product_status[key] = value;
  }
  const currentArtifacts =
    section(text, "Relevant Files") || section(text, "Current Artifacts");
  for (const line of splitLines(currentArtifacts)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .trim()
      .replace(/^\|+|\|+$/g, "")
      .split("|")
      .map((cell) => cell.trim());
    if (
      cells.length < 3 ||
      cells[0] === "Kind" ||
      cells[0] === "---" ||
      /^-+$/.test(cells[0] ?? "")
    )
      continue;
    result.artifacts[(cells[1] ?? "").replaceAll("`", "")] = {
      kind: cells[0],
      status: cells[2],
      notes: cells[3] ?? "",
    };
  }
  result.path = relativePath(path, root);
  return result;
}

function wipClaimFor(wip: StatusValue, path: string): StatusValue | null {
  const normalized = path.replaceAll("\\", "/").replace(/^[./]+/, "");
  for (const [raw, claim] of Object.entries(wip.artifacts ?? {})) {
    const candidate = raw.replaceAll("\\", "/").replace(/^[./]+/, "");
    if (candidate === normalized || candidate.endsWith(`/${normalized}`))
      return asRecord(claim) ?? null;
  }
  return null;
}

export function explicitFocusItem(
  items: StatusValue[],
  wip: StatusValue,
): StatusValue | null {
  const ids = planIdCandidates(stringValue(wip.learning?.active_slices));
  for (const id of ids) {
    if (isPlanId(id, "WORK")) {
      const match = items.find((item) => item.id === id);
      if (match) return match;
    }
    if (isPlanId(id, "PR")) {
      const match = items.find((item) =>
        item.prs?.some((pr: StatusValue) => pr.id === id),
      );
      if (match) return match;
    }
  }
  return null;
}

async function childArtifacts(
  root: string,
  canonicalPaths: Record<string, string | null>,
): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  const excluded = new Set(
    Object.values(canonicalPaths)
      .filter(Boolean)
      .map((path) => resolve(path!)),
  );
  for (const path of await discover(root, "*.md")) {
    if (excluded.has(resolve(path))) continue;
    const text = await readText(path);
    const values = metadata(text);
    const heading = firstHeading(text) ?? "";
    const parent = /^Parent Work Item:\s*(\S+)\s*$/im.exec(text)?.[1];
    const headingId = planIdCandidates(heading).find((id) =>
      isPlanId(id, "WORK"),
    );
    const id = parent && isPlanId(parent, "WORK") ? parent : headingId;
    if (!id) continue;
    const planType = values["Plan Type"]?.toLocaleLowerCase("en-US");
    const filename = basename(path).toLocaleLowerCase("en-US");
    const headingText = heading.toLocaleLowerCase("en-US");
    const kind =
      planType === "breakdown" || planType === "implementation"
        ? "plan"
        : values["Design Depth"] || filename.includes("design")
          ? "design"
          : filename.includes("spec") ||
              headingText.includes("software requirements specification")
            ? "spec"
            : null;
    if (kind) (result[id] ??= {})[kind] ??= path;
  }
  return result;
}

export function scopeLevel(value: unknown): string | null {
  const normalized = stringValue(value).toLocaleLowerCase("en-US");
  if (normalized.includes("product") || normalized.includes("system"))
    return "product";
  if (normalized.includes("feature") || normalized.includes("component"))
    return "feature";
  if (normalized.includes("slice") || normalized.includes("change"))
    return "slice";
  return null;
}

function childLevel(
  item: StatusValue,
  child: StatusValue | null,
): string | null {
  return (
    scopeLevel(item.child_scope) ??
    (child ? scopeLevel(child.metadata?.["Work Scope"]) : null) ??
    scopeLevel(item.child_requirement)
  );
}

async function traceabilityCounts(
  root: string,
): Promise<[Record<string, number>, string | null]> {
  const path = join(root, ".sdlc", "test-traceability.yaml");
  if (!(await exists(path))) return [{}, null];
  try {
    const tests = asRecord(await loadYamlFile(path))?.tests;
    if (!Array.isArray(tests)) return [{}, "tests must be a list"];
    const counts: Record<string, number> = {};
    for (const entry of tests) {
      const record = asRecord(entry);
      const id = stringValue(record?.plan);
      const testPath = await resolveLedgerPath(root, stringValue(record?.path));
      if (isPlanId(id, "PR") && testPath) counts[id] = (counts[id] ?? 0) + 1;
    }
    return [counts, null];
  } catch (error) {
    return [{}, errorMessage(error)];
  }
}

export function planPrs(
  planText: string,
  traces: Record<string, number>,
): StatusValue[] {
  const names = new Map<string, string>();
  const ids: string[] = [];
  for (const [, id, name] of annotatedDeliveryStarts(
    splitLines(planText),
    "PR",
  ))
    if (isPlanId(id, "PR")) {
      ids.push(id);
      if (!names.has(id)) names.set(id, name);
    }
  return [...new Set(ids)].map((id) => ({
    id,
    name: names.get(id),
    evidence_count: traces[id] ?? 0,
  }));
}

async function waveCheckpointFor(
  root: string,
  wave: StatusValue,
  planPath: string,
  records: StatusValue[],
): Promise<[StatusValue | null, string | null]> {
  const currentHash = await hashFile(planPath);
  for (const record of [...records].reverse()) {
    if (record.wave !== wave.id) continue;
    const plan = asRecord(record.plan);
    if (!plan) return [null, "work-group checkpoint has no plan record"];
    const resolved = await resolveLedgerPath(root, stringValue(plan.path));
    if (!resolved || resolve(resolved) !== resolve(planPath)) continue;
    if (plan.sha256 !== currentHash)
      return [null, "work-group checkpoint is for an earlier plan version"];
    if (stringValue(record.status).toLocaleLowerCase("en-US") !== "completed")
      return [
        null,
        `latest work-group checkpoint status is ${stringValue(record.status)}`,
      ];
    if (
      !Array.isArray(record.members) ||
      JSON.stringify(record.members.map(String)) !==
        JSON.stringify(wave.members)
    )
      return [null, "checkpoint members do not match the current plan"];
    return [
      {
        state: "completed",
        id: record.id,
        status: record.status,
        hash: currentHash,
        completed_at: record.completed_at ?? null,
        members: record.members.map(String),
        learning: assessmentLearning(record),
      },
      null,
    ];
  }
  return [null, null];
}

function activeDeliveryIds(wip: StatusValue): Set<string> {
  const raw = ["active_work_item", "active_slices"]
    .map((key) => stringValue(wip.learning?.[key]))
    .join(" ");
  return new Set(
    planIdCandidates(raw).filter(
      (id) => isPlanId(id, "WORK") || isPlanId(id, "PR"),
    ),
  );
}

function flattenItems(nodes: StatusValue[]): StatusValue[] {
  return nodes.flatMap((node) => [node, ...flattenItems(node.children ?? [])]);
}

export function stateLabel(state: string): string {
  const labels: Record<string, string> = {
    approved: "Approved",
    unapproved: "Present",
    stale: "Approval out of date",
    missing: "Not yet done",
    frontier: "No detailed plan yet",
    expanded: "Detailed plan found",
    started: "Documents started",
    evidence: "Tests linked",
    planned: "PRs planned",
    assessed: "Code checks and review passed",
    "children-assessed":
      "Child work passed checks and review or was approved for the next step",
    "slice-handed-off": "Approved for the next integration step",
    completed: "Group checkpoint finished",
  };
  return labels[state] ?? titleCase(state.replaceAll("-", " "));
}

function waveMemberState(
  id: string,
  workById: Map<string, StatusValue>,
  prById: Map<string, [StatusValue | null, StatusValue]>,
  activeIds: Set<string>,
  completed: boolean,
): StatusValue {
  if (completed)
    return { id, state: "completed", detail: "Group checkpoint finished" };
  const item = workById.get(id);
  if (item) {
    if (
      ["assessed", "children-assessed", "slice-handed-off"].includes(item.state)
    )
      return { id, state: "assessed", detail: stateLabel(item.state) };
    if (activeIds.has(id) || ["started", "expanded"].includes(item.state))
      return { id, state: "in-progress", detail: "In progress" };
    if (item.state === "evidence")
      return { id, state: "evidence", detail: "Tests linked" };
    return { id, state: "not-started", detail: "Not started" };
  }
  const pair = prById.get(id);
  if (pair) {
    const [owner, pr] = pair;
    if (
      owner &&
      ["assessed", "children-assessed", "slice-handed-off"].includes(
        owner.state,
      )
    )
      return { id, state: "assessed", detail: "Slice assessed" };
    if (activeIds.has(id))
      return { id, state: "in-progress", detail: "In progress" };
    if (pr.evidence_count)
      return {
        id,
        state: "evidence",
        detail: `${pr.evidence_count} linked tests`,
      };
    return { id, state: "not-started", detail: "Not started" };
  }
  return { id, state: "unknown", detail: "Member not discovered" };
}

async function buildLearningWaveModel(
  root: string,
  parentPlanPath: string | null,
  rootPrs: StatusValue[],
  items: StatusValue[],
  checkpointRecords: StatusValue[],
  wip: StatusValue,
): Promise<StatusValue> {
  const allItems = flattenItems(items);
  const sources: Array<[string, string]> = [];
  if (parentPlanPath) sources.push([parentPlanPath, "Product plan"]);
  for (const item of allItems) {
    const path = await resolveLedgerPath(
      root,
      stringValue(item.child_plan?.path),
    );
    if (path) sources.push([path, `${item.name} plan`]);
  }
  const uniqueSources: Array<[string, string]> = [];
  const seenPaths = new Set<string>();
  for (const [path, label] of sources) {
    const resolved = resolve(path);
    if (!seenPaths.has(resolved)) {
      seenPaths.add(resolved);
      uniqueSources.push([path, label]);
    }
  }
  const workById = new Map(
    allItems.map((item) => [stringValue(item.id), item]),
  );
  const prById = new Map<string, [StatusValue | null, StatusValue]>(
    rootPrs.map((pr) => [stringValue(pr.id), [null, pr]]),
  );
  for (const item of allItems)
    for (const pr of item.prs ?? []) prById.set(stringValue(pr.id), [item, pr]);
  const activeIds = activeDeliveryIds(wip);
  const activeWave = stringValue(wip.learning?.active_wave).trim();
  const seenWaves = new Set<string>();
  const workWaves: Record<string, StatusValue> = {};
  const sequences: StatusValue[] = [];
  const issues: StatusValue[] = [];
  for (const [planPath, planLabel] of uniqueSources) {
    const planRelative = relativePath(planPath, root);
    const planText = await readText(planPath);
    const parsed = parseLearningWaves(planText, planRelative);
    if (
      !["breakdown", "implementation"].includes(
        metadata(planText)["Plan Type"]?.toLocaleLowerCase("en-US") ?? "",
      ) ||
      !parsed.declared
    )
      continue;
    const issueValues: Array<[string, unknown]> = [
      ["malformed wave IDs", parsed.malformed_ids],
      ["duplicate wave IDs", parsed.duplicates],
      [
        "waves with missing fields",
        Object.keys(parsed.missing_fields).sort(compareCodePoints),
      ],
      ["waves with invalid order", parsed.invalid_orders],
      ["waves with invalid WIP limit", parsed.invalid_wip_limits],
      ["duplicate wave order values", parsed.duplicate_orders],
      [
        "waves with malformed members",
        Object.keys(parsed.invalid_members).sort(compareCodePoints),
      ],
      [
        "waves with members of the wrong plan type",
        Object.keys(parsed.invalid_member_kinds).sort(compareCodePoints),
      ],
      [
        "waves with duplicate members",
        Object.keys(parsed.duplicate_members).sort(compareCodePoints),
      ],
      ["waves with no valid members", parsed.empty_members],
    ];
    for (const [label, values] of issueValues)
      if (Array.isArray(values) && values.length)
        issues.push({
          plan_path: planRelative,
          message: `${label}: ${values.map(String).join(", ")}`,
        });
    const sequenceWaves: StatusValue[] = [];
    for (const rawWave of parsed.waves) {
      const wave = rawWave as unknown as StatusValue;
      if (seenWaves.has(wave.id)) {
        issues.push({
          plan_path: planRelative,
          message: `duplicate project wave ID: ${wave.id}`,
        });
        continue;
      }
      seenWaves.add(wave.id);
      let [checkpoint, checkpointIssue] = await waveCheckpointFor(
        root,
        wave,
        planPath,
        checkpointRecords,
      );
      const unknown = (wave.members as string[]).filter(
        (id) => !workById.has(id) && !prById.has(id),
      );
      if (checkpoint && unknown.length) {
        checkpoint = null;
        checkpointIssue = `finished work-group checkpoint names items that were not found: ${unknown.join(", ")}`;
      }
      const members = (wave.members as string[]).map((id) =>
        waveMemberState(id, workById, prById, activeIds, checkpoint !== null),
      );
      const hasActivity = members.some(
        (member) => !["not-started", "unknown"].includes(member.state),
      );
      const state = checkpoint
        ? "completed"
        : activeWave === wave.id || hasActivity
          ? "in-progress"
          : "not-started";
      const checkpointState = checkpoint
        ? "complete"
        : state === "in-progress"
          ? members.length &&
            members.every((member) =>
              ["assessed", "completed"].includes(member.state),
            )
            ? "pending"
            : "open"
          : "not-started";
      Object.assign(wave, {
        state,
        checkpoint_state: checkpointState,
        active: activeWave === wave.id,
        member_states: members,
        checkpoint_record: checkpoint,
        checkpoint_issue: checkpointIssue,
      });
      for (const id of wave.members as string[]) workWaves[id] = wave;
      if (checkpointIssue)
        issues.push({ plan_path: planRelative, message: checkpointIssue });
      sequenceWaves.push(wave);
    }
    sequenceWaves.sort(
      (a, b) =>
        (a.order ?? 1e9) - (b.order ?? 1e9) ||
        compareCodePoints(stringValue(a.id), stringValue(b.id)),
    );
    sequences.push({
      plan_path: planRelative,
      plan_label: planLabel,
      waves: sequenceWaves,
    });
  }
  if (activeWave && activeWave.toLocaleLowerCase("en-US") !== "none") {
    if (!isWaveId(activeWave))
      issues.push({
        plan_path: wip.path ?? ".sdlc/wip.md",
        message: `active wave ID is malformed: ${activeWave}`,
      });
    else if (!seenWaves.has(activeWave))
      issues.push({
        plan_path: wip.path ?? ".sdlc/wip.md",
        message: `active wave is not declared in a discovered plan: ${activeWave}`,
      });
  }
  const allWaves = sequences.flatMap((sequence) => sequence.waves);
  return {
    sequences,
    issues,
    work_waves: workWaves,
    summary: {
      total: allWaves.length,
      completed: allWaves.filter((wave) => wave.state === "completed").length,
      in_progress: allWaves.filter((wave) => wave.state === "in-progress")
        .length,
      not_started: allWaves.filter((wave) => wave.state === "not-started")
        .length,
    },
  };
}

function projectTitle(root: string, spec: StatusValue): string {
  const title = stringValue(spec.title).trim();
  if (title) {
    for (const separator of [" — ", " - "])
      if (title.includes(separator)) return title.split(separator, 1)[0]!;
    return title.replace(/\s+Software Requirements Specification$/, "").trim();
  }
  return titleCase(basename(root).replaceAll("-", " "));
}

function compactSortedJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(compactSortedJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => compareCodePoints(a, b))
    .map(([key, item]) => `${JSON.stringify(key)}:${compactSortedJson(item)}`)
    .join(",")}}`;
}

export async function buildModel(projectRoot: string): Promise<StatusValue> {
  const root = resolve(projectRoot);
  const approvalContext = await loadApprovalContext(root);
  const records = approvalContext.records;
  const autoIds = new Set(
    records.flatMap((raw) => {
      const record = asRecord(raw);
      return record?.status === "auto-approved" ? [record.id] : [];
    }),
  );
  const invalidById = new Map(
    approvalContext.invalid_records
      .filter((item) => autoIds.has(item.id))
      .map((item) => [item.id, item.issues]),
  );
  const [
    assessmentRecords,
    assessmentError,
    checkpointRecords,
    checkpointError,
  ] = await loadDeliveryRecords(root);
  const [mappedPaths, mappedChildren, artifactPathError] =
    await artifactPathMapping(root);
  const paths: Record<string, string | null> = {};
  for (const kind of ["spec", "design", "plan"])
    paths[kind] = mappedPaths[kind] ?? (await canonicalArtifact(root, kind));
  const stages: Record<string, StatusValue> = {};
  for (const kind of ["spec", "design", "plan"])
    stages[kind] = await artifactModel(
      root,
      kind,
      paths[kind] ?? null,
      records,
      invalidById,
    );
  const wip = await parseWip(root);
  const workflowStateIssues = await validateWorkflowState(root);
  const [projectDelivery, processDecisionsError] =
    await processDeliveryChoices(root);
  const currentCommand = stringValue(wip["Current Command"]).trim();
  const commandMatch =
    /^(spec|design|plan|code)-(create|verify|review|assess)$/i.exec(
      currentCommand,
    );
  const currentActivity = {
    work_target: stringValue(wip["Work Target"] || "Not recorded").trim(),
    scope: stringValue(wip["Work Scope"] || "Not recorded").trim(),
    command: currentCommand || "Not recorded",
    stage: commandMatch?.[1]?.toLocaleLowerCase("en-US") ?? "Not applicable",
    action: commandMatch?.[2]?.toLocaleLowerCase("en-US") ?? "Not applicable",
    legacy_command_field: Boolean(wip.legacy_current_stage_command),
  };
  const legacyProfile = stringValue(
    wip["Delivery Assurance Profile"] ||
      wip["Review Level"] ||
      wip["Delivery Profile"],
  ).trim();
  const legacyPolicy = stringValue(wip["Approval Policy"]).trim();
  const legacyOutcome = stringValue(wip["Work Outcome"]).trim();
  const legacyModules = stringValue(
    wip["Extra Checks"] || wip["Assurance Modules"],
  ).trim();
  let profile = "",
    policy = "",
    outcome = "",
    modules = "";
  for (const kind of ["plan", "design", "spec"]) {
    const meta = stages[kind]?.metadata ?? {};
    profile ||= stringValue(
      meta["Delivery Assurance Profile"] ||
        meta["Review Level"] ||
        meta["Delivery Profile"],
    ).trim();
    policy ||= stringValue(meta["Approval Policy"]).trim();
    outcome ||= stringValue(meta["Work Outcome"]).trim();
    modules ||= stringValue(
      meta["Extra Checks"] || meta["Assurance Modules"],
    ).trim();
  }
  profile ||= projectDelivery.profile || legacyProfile;
  policy ||= projectDelivery.approval_policy || legacyPolicy;
  outcome ||= projectDelivery.work_outcome || legacyOutcome;
  modules ||= projectDelivery.modules || legacyModules;
  const linkedArtifacts = await childArtifacts(root, paths);
  for (const [id, mapped] of Object.entries(mappedChildren))
    Object.assign((linkedArtifacts[id] ??= {}), mapped);
  const [traces, traceabilityError] = await traceabilityCounts(root);
  const parentText = paths.plan ? await readText(paths.plan) : "";
  const rootPrs = planPrs(parentText, traces);
  const [items, malformedAllocations] = workItems(parentText);
  const parentLevel =
    scopeLevel(stages.plan?.metadata?.["Work Scope"]) ??
    scopeLevel(stages.spec?.metadata?.["Work Scope"]);
  for (const item of items) {
    item.parent_level = parentLevel;
    const linked = linkedArtifacts[item.id] ?? {};
    const specPath = linked.spec;
    const designPath = linked.design;
    const childPath = linked.plan;
    item.child_spec = specPath
      ? await artifactModel(root, "spec", specPath, records, invalidById)
      : null;
    item.child_design = designPath
      ? await artifactModel(root, "design", designPath, records, invalidById)
      : null;
    if (!childPath) {
      Object.assign(item, {
        state: item.child_spec || item.child_design ? "started" : "frontier",
        child_plan: null,
        child_level: childLevel(item, null),
        prs: [],
        evidence_count: 0,
        wip_claim: null,
        code_slice_approval: null,
        code_assessment: null,
      });
      continue;
    }
    const childText = await readText(childPath);
    const childRelative = relativePath(childPath, root);
    const prs = planPrs(childText, traces);
    const evidenceCount = prs.reduce((sum, pr) => sum + pr.evidence_count, 0);
    const codeApproval = await approvalFor(
      root,
      childPath,
      "code_slice.approved",
      records,
      invalidById,
    );
    const assessment = await codeAssessmentFor(
      root,
      item.id,
      childPath,
      assessmentRecords,
    );
    const completion =
      codeApproval.state === "approved"
        ? "slice-handed-off"
        : assessment
          ? "assessed"
          : null;
    const childPlan = await artifactModel(
      root,
      "plan",
      childPath,
      records,
      invalidById,
    );
    Object.assign(item, {
      state: completion ?? (evidenceCount ? "evidence" : "expanded"),
      child_plan: childPlan,
      child_level: childLevel(item, childPlan),
      prs,
      evidence_count: evidenceCount,
      wip_claim: wipClaimFor(wip, childRelative),
      code_slice_approval:
        codeApproval.state === "approved" ? codeApproval : null,
      code_assessment: assessment,
    });
  }
  for (const item of items) {
    if (
      !item.child_plan?.path ||
      stringValue(item.child_plan.metadata?.["Plan Type"]).toLocaleLowerCase(
        "en-US",
      ) !== "breakdown"
    ) {
      item.children = [];
      continue;
    }
    const [children, childMalformed] = workItems(
      await readText(resolve(root, item.child_plan.path)),
    );
    malformedAllocations.push(...childMalformed);
    for (const child of children) {
      child.parent_level = item.child_level;
      const linked = linkedArtifacts[child.id] ?? {};
      const specPath = linked.spec;
      const designPath = linked.design;
      const leafPath = linked.plan;
      child.child_spec = specPath
        ? await artifactModel(root, "spec", specPath, records, invalidById)
        : null;
      child.child_design = designPath
        ? await artifactModel(root, "design", designPath, records, invalidById)
        : null;
      if (!leafPath) {
        Object.assign(child, {
          state:
            child.child_spec || child.child_design ? "started" : "frontier",
          child_plan: null,
          child_level: childLevel(child, null),
          prs: [],
          evidence_count: 0,
          wip_claim: null,
          code_slice_approval: null,
          code_assessment: null,
          children: [],
        });
        continue;
      }
      const leafText = await readText(leafPath);
      const prs = planPrs(leafText, traces);
      const evidenceCount = prs.reduce((sum, pr) => sum + pr.evidence_count, 0);
      const codeApproval = await approvalFor(
        root,
        leafPath,
        "code_slice.approved",
        records,
        invalidById,
      );
      const assessment = await codeAssessmentFor(
        root,
        child.id,
        leafPath,
        assessmentRecords,
      );
      const leafPlan = await artifactModel(
        root,
        "plan",
        leafPath,
        records,
        invalidById,
      );
      Object.assign(child, {
        state:
          codeApproval.state === "approved"
            ? "slice-handed-off"
            : assessment
              ? "assessed"
              : evidenceCount
                ? "evidence"
                : "expanded",
        child_plan: leafPlan,
        child_level: childLevel(child, leafPlan),
        prs,
        evidence_count: evidenceCount,
        wip_claim: wipClaimFor(wip, relativePath(leafPath, root)),
        code_slice_approval:
          codeApproval.state === "approved" ? codeApproval : null,
        code_assessment: assessment,
        children: [],
      });
    }
    item.children = children;
    if (
      children.length &&
      children.every((child) =>
        ["assessed", "slice-handed-off"].includes(child.state),
      )
    )
      item.state = "children-assessed";
  }
  const learningWaves = await buildLearningWaveModel(
    root,
    paths.plan ?? null,
    rootPrs,
    items,
    checkpointRecords,
    wip,
  );
  const attach = (nodes: StatusValue[]): void => {
    for (const item of nodes) {
      item.wave = learningWaves.work_waves[item.id] ?? null;
      attach(item.children ?? []);
    }
  };
  attach(items);
  const expanded = items.filter((item) => item.child_plan !== null).length;
  const prCount =
    rootPrs.length + items.reduce((sum, item) => sum + item.prs.length, 0);
  const evidencedPrs =
    rootPrs.filter((pr) => pr.evidence_count > 0).length +
    items.flatMap((item) => item.prs).filter((pr) => pr.evidence_count > 0)
      .length;
  const sourcePaths = Object.values(paths).filter((path): path is string =>
    Boolean(path),
  );
  for (const filename of [
    "approvals.yaml",
    "gates.yaml",
    "process-decisions.yaml",
    "wip.md",
    "test-traceability.yaml",
    "delivery-records.yaml",
    "artifact-paths.yaml",
    "code-assessments.yaml",
    "wave-checkpoints.yaml",
  ]) {
    const path = join(root, ".sdlc", filename);
    if (await exists(path)) sourcePaths.push(path);
  }
  for (const artifacts of Object.values(linkedArtifacts))
    sourcePaths.push(...Object.values(artifacts));
  const uniqueSources = [...new Set(sourcePaths)].sort((a, b) =>
    compareCodePoints(relativePath(a, root), relativePath(b, root)),
  );
  const model: StatusValue = {
    project: projectTitle(root, stages.spec!),
    artifact_path_error: artifactPathError,
    stages,
    wip,
    workflow_state_issues: workflowStateIssues,
    current_activity: currentActivity,
    delivery: {
      profile: profile || "Not recorded",
      approval_policy: policy || "Not recorded",
      work_outcome: outcome || "Not recorded",
      modules: modules || "Not recorded",
    },
    work_items: items,
    root_prs: rootPrs,
    learning_waves: learningWaves,
    malformed_allocations: malformedAllocations,
    summary: {
      approved_stages: Object.values(stages).filter(
        (stage) => stage.state === "approved",
      ).length,
      work_items: items.length,
      malformed_work_items: malformedAllocations.length,
      expanded_items: expanded,
      pr_slices: prCount,
      evidenced_prs: evidencedPrs,
      assessed_items: items.filter((item) =>
        ["assessed", "children-assessed"].includes(item.state),
      ).length,
      handed_off_items: items.filter(
        (item) => item.state === "slice-handed-off",
      ).length,
      learning_waves: learningWaves.summary.total,
      completed_waves: learningWaves.summary.completed,
      active_waves: learningWaves.summary.in_progress,
    },
    approval_error: approvalContext.load_error,
    traceability_error: traceabilityError,
    assessment_error: assessmentError,
    wave_checkpoint_error: checkpointError,
    process_decisions_error: processDecisionsError,
    sources: await Promise.all(
      uniqueSources.map(async (path) => ({
        path: relativePath(path, root),
        sha256: await hashFile(path),
      })),
    ),
  };
  model.fingerprint = createHash("sha256")
    .update(compactSortedJson(model))
    .digest("hex")
    .slice(0, 16);
  return model;
}
