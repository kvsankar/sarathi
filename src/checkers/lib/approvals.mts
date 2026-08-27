import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { compareCodePoints, normalizePath, splitLines } from "./output.mjs";

export const APPROVED_STATUSES = new Set(["approved", "auto-approved"]);
export const AUTOMATIC_APPROVAL_POLICY = "automatic_eligible_gates";
const UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;

export type YamlValue =
  | null
  | boolean
  | bigint
  | number
  | string
  | YamlValue[]
  | { [key: string]: YamlValue };
export interface ApprovalContext {
  approvals_path: string;
  gates_path: string;
  exists: boolean;
  records: unknown[];
  invalid_records: { id: unknown; issues: string[] }[];
  historical_records: { id: unknown; issues: string[] }[];
  load_error: string | null;
  recorded_approval_policy: string | null;
  gates_policy_exists: boolean;
  gates_policy: Record<string, unknown>;
}
export interface ApprovalRequirement {
  gate: string;
  artifact: string;
  scope: string | null;
  approved: boolean;
  approval_id: unknown;
  status: unknown;
  evidence_semantics?: string;
  issues: string[];
}

interface ParsedLine {
  indent: number;
  content: string;
}

function stripComment(line: string): string {
  let quote: "'" | '"' | undefined;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (
      (character === "'" || character === '"') &&
      (index === 0 || line[index - 1] !== "\\")
    ) {
      quote = quote === character ? undefined : character;
    }
    if (character === "#" && quote === undefined) return line.slice(0, index);
  }
  return line;
}

function scalar(raw: string): YamlValue {
  const value = raw.trim();
  if (!value) return "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true" || value === "True") return true;
  if (value === "false" || value === "False") return false;
  if (["null", "Null", "None", "~"].includes(value)) return null;
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(",").map((part) => scalar(part.trim())) : [];
  }
  if (/^-?\d+$/.test(value)) {
    const integer = BigInt(value);
    return integer >= BigInt(Number.MIN_SAFE_INTEGER) &&
      integer <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(integer)
      : integer;
  }
  return value;
}

function splitKeyValue(text: string): [string, string] {
  const separator = text.indexOf(":");
  if (separator < 0)
    throw new Error(`Expected key/value pair: ${JSON.stringify(text)}`);
  return [text.slice(0, separator).trim(), text.slice(separator + 1).trim()];
}

export function parseYamlSubset(text: string): YamlValue {
  const lines: ParsedLine[] = [];
  for (const raw of splitLines(text)) {
    const cleaned = stripComment(raw).trimEnd();
    if (!cleaned.trim()) continue;
    lines.push({
      indent: cleaned.length - cleaned.trimStart().length,
      content: cleaned.trim(),
    });
  }

  function parseBlock(index: number, indent: number): [YamlValue, number] {
    if (index >= lines.length) return [{}, index];
    return lines[index]?.content.startsWith("- ")
      ? parseList(index, indent)
      : parseDictionary(index, indent);
  }

  function parseDictionary(
    start: number,
    indent: number,
  ): [{ [key: string]: YamlValue }, number] {
    const output: { [key: string]: YamlValue } = {};
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (!line || line.indent < indent || line.content.startsWith("- ")) break;
      if (line.indent > indent) {
        throw new Error(
          `Unexpected indentation near: ${JSON.stringify(line.content)}`,
        );
      }
      const [key, value] = splitKeyValue(line.content);
      index += 1;
      if (value) {
        output[key] = scalar(value);
      } else if ((lines[index]?.indent ?? -1) > line.indent) {
        [output[key], index] = parseBlock(index, lines[index]?.indent ?? 0);
      } else {
        output[key] = null;
      }
    }
    return [output, index];
  }

  function parseList(start: number, indent: number): [YamlValue[], number] {
    const output: YamlValue[] = [];
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (!line || line.indent < indent || !line.content.startsWith("- "))
        break;
      if (line.indent > indent) {
        throw new Error(
          `Unexpected list indentation near: ${JSON.stringify(line.content)}`,
        );
      }
      const itemText = line.content.slice(2).trim();
      index += 1;
      let item: YamlValue;
      if (!itemText) {
        if ((lines[index]?.indent ?? -1) > line.indent) {
          [item, index] = parseBlock(index, lines[index]?.indent ?? 0);
        } else {
          item = null;
        }
      } else if (itemText.includes(":")) {
        const [key, value] = splitKeyValue(itemText);
        const mapping: { [key: string]: YamlValue } = {
          [key]: value ? scalar(value) : null,
        };
        if (!value && (lines[index]?.indent ?? -1) > line.indent) {
          [mapping[key], index] = parseBlock(index, lines[index]?.indent ?? 0);
        }
        if ((lines[index]?.indent ?? -1) > line.indent) {
          const [extra, next] = parseDictionary(
            index,
            lines[index]?.indent ?? 0,
          );
          Object.assign(mapping, extra);
          index = next;
        }
        item = mapping;
      } else {
        item = scalar(itemText);
      }
      output.push(item);
    }
    return [output, index];
  }

  if (lines.length === 0) return {};
  const [parsed, final] = parseBlock(0, lines[0]?.indent ?? 0);
  if (final !== lines.length)
    throw new Error("Could not parse complete YAML subset");
  return parsed;
}

export async function loadYamlFile(path: string): Promise<YamlValue> {
  return parseYamlSubset(await readFile(path, "utf8"));
}

export async function sha256File(path: string): Promise<string | null> {
  try {
    if (!(await stat(path)).isFile()) return null;
    return createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

export function validUtcTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const match = UTC_TIMESTAMP.exec(value);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  const [year, month, day, hour, minute, second] = parts;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    return false;
  }
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

function asList(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeProjectPath(projectRoot: string, path: string): string {
  if (!isAbsolute(path)) return normalizePath(path);
  const fromRoot = relative(resolve(projectRoot), resolve(path));
  return fromRoot.startsWith("..") || isAbsolute(fromRoot)
    ? path.replaceAll("\\", "/")
    : normalizePath(fromRoot);
}

function policyAllows(
  record: Record<string, unknown>,
  policy: Record<string, unknown>,
  recordedApprovalPolicy: string | null,
  now = new Date(),
): string[] {
  const normalized = recordedApprovalPolicy
    ?.trim()
    .toLocaleLowerCase("en-US")
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  if (normalized === undefined) {
    return [
      `auto approval requires recorded approval policy: ${AUTOMATIC_APPROVAL_POLICY}`,
    ];
  }
  if (normalized !== AUTOMATIC_APPROVAL_POLICY) {
    return [
      `auto approval conflicts with recorded approval policy: ${recordedApprovalPolicy ?? ""}`,
    ];
  }
  const automatic = asRecord(policy.auto_approval);
  if (automatic === undefined || automatic.enabled !== true) {
    return ["auto approval used but not enabled in gates policy"];
  }
  const issues: string[] = [];
  const gate = stringValue(record.gate);
  const scope = stringValue(record.scope);
  const allowedGates = new Set(
    asList(automatic.allowed_gates).map(stringValue),
  );
  const allowedScopes = new Set(
    asList(automatic.allowed_scopes).map(stringValue),
  );
  const forbiddenGates = new Set(
    asList(automatic.forbidden_gates).map(stringValue),
  );
  if (forbiddenGates.has(gate))
    issues.push(`gate ${gate} is forbidden for auto approval`);
  if (!allowedGates.has("*") && !allowedGates.has(gate)) {
    issues.push(`gate ${gate} is not allowed for auto approval`);
  }
  if (!allowedScopes.has("*") && !allowedScopes.has(scope)) {
    issues.push(`scope ${scope} is not allowed for auto approval`);
  }
  if (!validUtcTimestamp(automatic.expires_at)) {
    issues.push("auto approval policy expires_at must be UTC ISO-8601");
  } else if (now.getTime() >= Date.parse(String(automatic.expires_at))) {
    issues.push("auto approval policy is expired");
  }
  return issues;
}

export function validateApprovalRecord(
  record: unknown,
  _projectRoot: string,
  gatesPolicy: Record<string, unknown> = {},
  recordedApprovalPolicy: string | null = null,
): string[] {
  const approval = asRecord(record);
  if (approval === undefined) {
    return ["approval record must be a YAML section with named fields"];
  }
  const issues: string[] = [];
  for (const key of [
    "id",
    "gate",
    "scope",
    "artifact",
    "status",
    "approved_by",
    "approved_at",
  ]) {
    if (!approval[key]) issues.push(`missing ${key}`);
  }
  if (!APPROVED_STATUSES.has(String(approval.status))) {
    issues.push("status must be approved or auto-approved");
  }
  if (!validUtcTimestamp(approval.approved_at)) {
    issues.push("approved_at must be UTC ISO-8601 like 2026-07-01T14:32:18Z");
  }
  const artifact = asRecord(approval.artifact);
  if (artifact === undefined) {
    issues.push("artifact details must be a YAML section with named fields");
    return issues;
  }
  for (const key of ["kind", "path", "sha256"]) {
    if (!artifact[key]) issues.push(`artifact details are missing ${key}`);
  }
  if (!/^[0-9a-f]{64}$/.test(stringValue(artifact.sha256)))
    issues.push("artifact sha256 must be a lowercase SHA-256 hex digest");
  if (approval.status === "auto-approved") {
    issues.push(...policyAllows(approval, gatesPolicy, recordedApprovalPolicy));
  }
  return issues;
}

export async function loadApprovalContext(
  projectRoot: string,
  approvalsPath = ".sdlc/approvals.yaml",
  gatesPath = ".sdlc/gates.yaml",
): Promise<ApprovalContext> {
  const approvalsFile = resolve(projectRoot, approvalsPath);
  const gatesFile = resolve(projectRoot, gatesPath);
  const context: ApprovalContext = {
    approvals_path: approvalsPath,
    gates_path: gatesPath,
    exists: false,
    records: [],
    invalid_records: [],
    historical_records: [],
    load_error: null,
    recorded_approval_policy: null,
    gates_policy_exists: false,
    gates_policy: {},
  };
  try {
    context.exists = await fileExists(approvalsFile);
    context.gates_policy_exists = await fileExists(gatesFile);
    if (context.gates_policy_exists) {
      context.gates_policy = asRecord(await loadYamlFile(gatesFile)) ?? {};
    }
    const decisionsFile = resolve(projectRoot, ".sdlc/process-decisions.yaml");
    if (await fileExists(decisionsFile)) {
      const decisions = asRecord(await loadYamlFile(decisionsFile));
      const approval = asRecord(decisions?.approval);
      if (approval?.policy)
        context.recorded_approval_policy = stringValue(approval.policy);
    }
    if (!context.exists) return context;
    const data = asRecord(await loadYamlFile(approvalsFile));
    if (!Array.isArray(data?.approvals)) {
      context.load_error = "approvals must be a list";
      return context;
    }
    context.records = data.approvals;
    for (const record of context.records) {
      const issues = validateApprovalRecord(
        record,
        projectRoot,
        context.gates_policy,
        context.recorded_approval_policy,
      );
      if (issues.length > 0) {
        context.invalid_records.push({ id: asRecord(record)?.id, issues });
        continue;
      }
      const approval = asRecord(record);
      const artifact = asRecord(approval?.artifact);
      if (!artifact || artifact.kind === "marker-inventory") continue;
      const artifactPath = resolve(projectRoot, stringValue(artifact.path));
      const actualHash = await sha256File(artifactPath);
      if (actualHash === null)
        context.historical_records.push({
          id: approval?.id,
          issues: [
            `approved file no longer exists: ${stringValue(artifact.path)}`,
          ],
        });
      else if (artifact.sha256 !== actualHash)
        context.historical_records.push({
          id: approval?.id,
          issues: [
            `approval is for an earlier version of: ${stringValue(artifact.path)}`,
          ],
        });
    }
  } catch (error) {
    context.load_error = errorMessage(error);
  }
  return context;
}

export function approvalRequirement(
  context: ApprovalContext,
  projectRoot: string,
  gate: string,
  artifactPath: string,
  options: {
    scope?: string;
    artifactKind?: string;
    expectedSha256?: string;
    allowedStatuses?: ReadonlySet<string>;
  } = {},
): ApprovalRequirement {
  const wanted = normalizeProjectPath(projectRoot, artifactPath);
  const result: ApprovalRequirement = {
    gate,
    artifact: wanted,
    scope: options.scope ?? null,
    approved: false,
    approval_id: null,
    status: null,
    evidence_semantics:
      "this record matches the current file; it does not prove that a person approved it",
    issues: [],
  };
  if (context.load_error) {
    result.issues.push(
      `could not read the approval file: ${context.load_error}`,
    );
    return result;
  }
  if (!context.exists) {
    result.issues.push(`approval file not found: ${context.approvals_path}`);
    return result;
  }
  const invalidById = new Map(
    context.invalid_records.map((item) => [item.id, item.issues]),
  );
  const historicalById = new Map(
    context.historical_records.map((item) => [item.id, item.issues]),
  );
  const candidateIssues: string[] = [];
  for (const rawRecord of context.records) {
    const record = asRecord(rawRecord);
    const artifact = asRecord(record?.artifact);
    if (!record || !artifact || record.gate !== gate) continue;
    if (options.scope !== undefined && record.scope !== options.scope) continue;
    if (
      options.artifactKind !== undefined &&
      artifact.kind !== options.artifactKind
    )
      continue;
    if (
      normalizeProjectPath(projectRoot, stringValue(artifact.path)) !== wanted
    )
      continue;
    if (
      options.expectedSha256 !== undefined &&
      artifact.sha256 !== options.expectedSha256
    ) {
      continue;
    }
    result.approval_id = record.id;
    result.status = record.status;
    const issues = [
      ...(invalidById.get(record.id) ?? []),
      ...(historicalById.get(record.id) ?? []),
    ];
    if (
      options.allowedStatuses &&
      !options.allowedStatuses.has(String(record.status))
    ) {
      issues.push(
        `approval status must be one of: ${[...options.allowedStatuses].sort(compareCodePoints).join(", ")}`,
      );
    }
    if (issues.length > 0) {
      candidateIssues.push(...issues);
      continue;
    }
    result.approved = true;
    return result;
  }
  result.issues =
    candidateIssues.length > 0
      ? [...new Set(candidateIssues)]
      : ["no approval matches this file and version"];
  return result;
}

export function approvalGatePassed(
  requirements: readonly ApprovalRequirement[],
): boolean {
  return requirements.every((requirement) => requirement.approved);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (isMissingFile(error)) return false;
    throw error;
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}
