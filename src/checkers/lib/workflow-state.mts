import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadYamlFile } from "./approvals.mjs";
import { compareCodePoints, splitLines } from "./output.mjs";
import { isPlanId, isWaveId } from "./schemas.mjs";

export interface WorkflowIssue {
  path: string;
  field: string;
  value: unknown;
  reason: string;
}

const WIP_ENUMS: Record<string, ReadonlySet<string>> = {
  "Status Result": new Set([
    "ready",
    "ready after minor fixes",
    "not ready",
    "cannot assess yet",
  ]),
  "Work Scope": new Set([
    "product/system",
    "feature/component",
    "slice/change",
    "unknown",
  ]),
  "Ready To Implement": new Set(["yes", "no", "unknown"]),
  "Implementation Readiness": new Set([
    "code-ready",
    "decomposable",
    "not ready",
    "unknown",
  ]),
  "Delivery Assurance Profile": new Set([
    "lean",
    "standard",
    "high-assurance",
    "unknown",
  ]),
  "Review Level": new Set(["lean", "standard", "high-assurance", "unknown"]),
  "Delivery Profile": new Set([
    "lean",
    "standard",
    "high-assurance",
    "unknown",
  ]),
  "Approval Policy": new Set([
    "human checkpoints",
    "automatic eligible gates",
    "unknown",
  ]),
  "Work Outcome": new Set([
    "product increment",
    "decision/evidence",
    "unknown",
  ]),
  "Feedback Status": new Set([
    "received",
    "requested",
    "unavailable",
    "not-applicable",
  ]),
};
const COMMAND =
  /^(?:(?:spec|design|plan|code)-(?:create|verify|review|assess)|workflow-status)$/i;
const OTHER_WIP_FIELDS = [
  "Current Command",
  "Current Stage",
  "Current Work Group",
  "Active Learning Wave",
  "Current Work",
  "Active Work Item",
  "Parallel Limit",
  "WIP Limit",
  "Active Slices",
] as const;

function issue(
  path: string,
  field: string,
  value: unknown,
  reason: string,
): WorkflowIssue {
  return { path, field, value, reason };
}

export async function validateWip(path: string): Promise<WorkflowIssue[]> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (errorCode(error) === "ENOENT") return [];
    return [issue(".sdlc/wip.md", "file", null, errorMessage(error))];
  }
  const issues: WorkflowIssue[] = [];
  const values = new Map<string, string[]>();
  const lines = splitLines(text);
  for (const field of [...Object.keys(WIP_ENUMS), ...OTHER_WIP_FIELDS]) {
    const pattern = new RegExp(`^${escapeRegex(field)}:\\s*(.*?)\\s*$`, "i");
    values.set(
      field,
      lines.flatMap((line) => {
        const match = pattern.exec(line);
        return match ? [match[1]?.trim() ?? ""] : [];
      }),
    );
  }
  for (const [field, allowed] of Object.entries(WIP_ENUMS)) {
    for (const value of values.get(field) ?? []) {
      if (!allowed.has(value.toLocaleLowerCase("en-US"))) {
        issues.push(
          issue(
            ".sdlc/wip.md",
            field,
            value,
            `expected one of: ${[...allowed].sort(compareCodePoints).join(", ")}`,
          ),
        );
      }
    }
  }
  for (const field of ["Current Command", "Current Stage"]) {
    for (const value of values.get(field) ?? []) {
      if (!COMMAND.test(value)) {
        issues.push(
          issue(
            ".sdlc/wip.md",
            field,
            value,
            "expected a command such as plan-review",
          ),
        );
      }
    }
  }
  for (const field of ["Current Work Group", "Active Learning Wave"]) {
    for (const value of values.get(field) ?? []) {
      if (value.toLocaleLowerCase("en-US") !== "none" && !isWaveId(value)) {
        issues.push(
          issue(
            ".sdlc/wip.md",
            field,
            value,
            "expected none or a WAVE-AREA-NAME identifier",
          ),
        );
      }
    }
  }
  for (const field of ["Current Work", "Active Work Item"]) {
    for (const value of values.get(field) ?? []) {
      const identifier = value.split(/\s+—\s+/u, 1)[0] ?? value;
      if (
        value.toLocaleLowerCase("en-US") !== "none" &&
        !isPlanId(identifier, "WORK") &&
        !isPlanId(identifier, "PR")
      ) {
        issues.push(
          issue(
            ".sdlc/wip.md",
            field,
            value,
            "expected none, WORK-AREA-NAME, or PR-AREA-NAME with an optional state after an em dash",
          ),
        );
      }
    }
  }
  for (const field of ["Parallel Limit", "WIP Limit"]) {
    for (const value of values.get(field) ?? []) {
      if (
        value.toLocaleLowerCase("en-US") !== "not-recorded" &&
        !(/^[0-9]+$/.test(value) && Number(value) > 0)
      ) {
        issues.push(
          issue(
            ".sdlc/wip.md",
            field,
            value,
            "expected a positive integer or not-recorded",
          ),
        );
      }
    }
  }
  for (const value of values.get("Active Slices") ?? []) {
    const identifiers = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (
      value.toLocaleLowerCase("en-US") !== "none" &&
      (identifiers.length === 0 ||
        identifiers.some(
          (identifier) =>
            !isPlanId(identifier, "WORK") && !isPlanId(identifier, "PR"),
        ))
    ) {
      issues.push(
        issue(
          ".sdlc/wip.md",
          "Active Slices",
          value,
          "expected none or comma-separated WORK-/PR- identifiers",
        ),
      );
    }
  }
  return issues;
}

export async function validateProcessDecisions(
  path: string,
): Promise<WorkflowIssue[]> {
  let loaded: unknown;
  try {
    loaded = await loadYamlFile(path);
  } catch (error) {
    if (errorCode(error) === "ENOENT") return [];
    return [
      issue(".sdlc/process-decisions.yaml", "file", null, errorMessage(error)),
    ];
  }
  if (!isRecord(loaded)) {
    return [
      issue(
        ".sdlc/process-decisions.yaml",
        "document",
        loaded,
        "expected a YAML section with named fields",
      ),
    ];
  }
  const issues: WorkflowIssue[] = [];
  const displayPath = ".sdlc/process-decisions.yaml";
  const project = mapping(
    loaded.project_entry,
    displayPath,
    "project_entry",
    issues,
  );
  const delivery = mapping(loaded.delivery, displayPath, "delivery", issues);
  const approval = mapping(loaded.approval, displayPath, "approval", issues);
  const bootstrap = mapping(loaded.bootstrap, displayPath, "bootstrap", issues);
  enumValue(
    project,
    "mode",
    ["greenfield", "brownfield_baseline", "brownfield_delta_only"],
    displayPath,
    "project_entry",
    issues,
  );
  enumValue(
    project,
    "scope",
    ["product/system", "feature/component", "slice/change"],
    displayPath,
    "project_entry",
    issues,
  );
  enumValue(
    delivery,
    "assurance_profile",
    ["lean", "standard", "high-assurance", "high_assurance"],
    displayPath,
    "delivery",
    issues,
  );
  enumValue(
    delivery,
    "work_outcome",
    ["product_increment", "decision_evidence"],
    displayPath,
    "delivery",
    issues,
  );
  if ("extra_checks" in delivery) {
    const extraChecks = delivery.extra_checks;
    const valid =
      (typeof extraChecks === "string" &&
        extraChecks.toLocaleLowerCase("en-US") === "none") ||
      (Array.isArray(extraChecks) &&
        extraChecks.every(
          (entry) => typeof entry === "string" && entry.trim(),
        ));
    if (!valid) {
      issues.push(
        issue(
          displayPath,
          "delivery.extra_checks",
          extraChecks,
          "expected none or a list of non-empty check names",
        ),
      );
    }
  }
  enumValue(
    approval,
    "policy",
    ["human_checkpoints", "automatic_eligible_gates"],
    displayPath,
    "approval",
    issues,
  );
  enumValue(
    approval,
    "authorization",
    ["explicit_user_choice", "explicit_yolo"],
    displayPath,
    "approval",
    issues,
  );
  enumValue(
    bootstrap,
    "status",
    ["injected", "declined", "deferred"],
    displayPath,
    "bootstrap",
    issues,
  );
  return issues;
}

export async function validateWorkflowState(
  root: string,
): Promise<WorkflowIssue[]> {
  return [
    ...(await validateWip(resolve(root, ".sdlc", "wip.md"))),
    ...(await validateProcessDecisions(
      resolve(root, ".sdlc", "process-decisions.yaml"),
    )),
  ];
}

function mapping(
  value: unknown,
  path: string,
  field: string,
  issues: WorkflowIssue[],
): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (!isRecord(value)) {
    issues.push(
      issue(path, field, value, "expected a YAML section with named fields"),
    );
    return {};
  }
  return value;
}

function enumValue(
  source: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  path: string,
  prefix: string,
  issues: WorkflowIssue[],
): void {
  if (!(key in source)) return;
  const value = source[key];
  if (
    typeof value !== "string" ||
    !allowed.includes(value.toLocaleLowerCase("en-US"))
  ) {
    issues.push(
      issue(
        path,
        `${prefix}.${key}`,
        value,
        `expected one of: ${[...allowed].sort(compareCodePoints).join(", ")}`,
      ),
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorCode(error: unknown): unknown {
  return error !== null && typeof error === "object" && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
