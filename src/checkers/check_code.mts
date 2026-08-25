#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
import { spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

import {
  approvalGatePassed,
  approvalRequirement,
  loadApprovalContext,
  type ApprovalContext,
  type ApprovalRequirement,
} from "./lib/approvals.mjs";
import {
  isDirectInvocation,
  printJson,
  pythonRepr,
  sorted,
  valueAfter,
  valuesAfter,
} from "./lib/checker-common.mjs";
import { compareCodePoints, splitLines } from "./lib/output.mjs";
import { validateWorkflowState } from "./lib/workflow-state.mjs";

const SLUG = "(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}";
const PYTHON_WORD = "\\p{L}\\p{N}_";
const PROCESS_ID = new RegExp(
  `(?<![A-Za-z0-9_-])(?:(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST|MILE|WORK|PR|WAVE)-${SLUG}-${SLUG}|(?:LAYER|COMP|IFACE|DEC|RISK)-${SLUG}|(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST|MILE|WORK|PR|WAVE)_${SLUG}_${SLUG}|(?:LAYER|COMP|IFACE|DEC|RISK)_${SLUG})(?![A-Za-z0-9_-])`,
  "g",
);
const TEST_OBLIGATION_NAME = new RegExp(
  `(?<![${PYTHON_WORD}])test_((?:(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST|MILE|WORK|PR|WAVE)_${SLUG}_${SLUG}|(?:LAYER|COMP|IFACE|DEC|RISK)_${SLUG}))`,
  "gu",
);
const UI_WORK = /^\s*UI Work\s*:\s*Yes\s*$/im,
  MOCK_DEP = /^\s*Mock UI Dependency\s*:\s*(?!None\b)(.+)$/im,
  UI_ARTIFACT = /^\s*(?:UI Mock|Approved Prototype) Artifact\s*:\s*(\S+)\s*$/im;
const SKIPPED = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  ".venv",
  "venv",
  "__pycache__",
  "dist",
  "build",
]);
const MARKERS: [string, RegExp][] = [
  ["TODO", /\bTODO\b/i],
  ["FIXME", /\bFIXME\b/i],
  ["XXX", /\bXXX\b/i],
  [
    "SKIP",
    /(@pytest\.mark\.skip\b|pytest\.skip\s*\(|\b(?:it|test|describe)\.skip\s*\(|\bskip\s*\()/i,
  ],
  ["SKIPIF", /(@pytest\.mark\.skipif\b|\bskipif\s*\()/i],
  ["XFAIL", /(@pytest\.mark\.xfail\b|\bxfail\s*\()/i],
];

function relPath(path: string, root: string): string {
  const result = relative(resolve(root), resolve(path));
  return result.startsWith("..")
    ? path.replaceAll("\\", "/")
    : result.replaceAll("\\", "/");
}
async function sourceFiles(
  root: string,
  suffixes: Set<string>,
): Promise<string[]> {
  const output: string[] = [];
  const walk = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (SKIPPED.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && suffixes.has(extname(path))) output.push(path);
    }
  };
  await walk(root);
  return sorted(output);
}
async function scanInputs(
  inputs: string[],
  suffixes: Set<string>,
  root: string,
  reportMissing = true,
): Promise<{ files: string[]; issues: { path: string; reason: string }[] }> {
  const files = new Set<string>(),
    issues: { path: string; reason: string }[] = [];
  for (const supplied of inputs) {
    let info;
    try {
      info = await stat(supplied);
    } catch {
      if (reportMissing)
        issues.push({
          path: relPath(supplied, root),
          reason: "does not exist",
        });
      continue;
    }
    if (info.isFile()) {
      const extension = extname(supplied);
      if (!suffixes.has(extension))
        issues.push({
          path: relPath(supplied, root),
          reason: `unsupported source extension ${extension || "<none>"}`,
        });
      else files.add(resolve(supplied));
    } else if (info.isDirectory())
      (await sourceFiles(supplied, suffixes)).forEach((path) =>
        files.add(path),
      );
    else
      issues.push({
        path: relPath(supplied, root),
        reason: "is not a regular file or directory",
      });
  }
  return { files: sorted(files), issues };
}
async function markerHits(
  files: string[],
  root: string,
): Promise<Record<string, unknown>[]> {
  const hits: Record<string, unknown>[] = [];
  for (const path of files)
    for (const [index, line] of splitLines(
      await readFile(path, "utf8"),
    ).entries())
      for (const [marker, pattern] of MARKERS)
        if (pattern.test(line))
          hits.push({
            path: relPath(path, root),
            line: index + 1,
            marker,
            text: line.trim(),
          });
  return hits;
}
async function processIdHits(
  files: string[],
  root: string,
  declared: Set<string>,
): Promise<Record<string, unknown>[]> {
  const hits: Record<string, unknown>[] = [],
    names = [...declared]
      .sort(compareCodePoints)
      .map(
        (id) =>
          [
            id,
            new RegExp(
              `(?<![${PYTHON_WORD}])test_${id.toLocaleLowerCase("en-US").replaceAll("-", "_")}(?=_|[^${PYTHON_WORD}]|$)`,
              "iu",
            ),
          ] as const,
      );
  for (const path of files)
    for (const [index, line] of splitLines(
      await readFile(path, "utf8"),
    ).entries()) {
      const found: [string, number][] = [...line.matchAll(PROCESS_ID)].map(
        (match) => [match[0], match.index],
      );
      found.push(
        ...[...line.matchAll(TEST_OBLIGATION_NAME)].map(
          (match) => [match[1]!, (match.index ?? 0) + 5] as [string, number],
        ),
      );
      for (const [id, pattern] of names) {
        const match = pattern.exec(line);
        if (match) found.push([id, (match.index ?? 0) + 5]);
      }
      const unique = new Map(
        found.map((item) => [`${item[0]}:${item[1]}`, item]),
      );
      for (const [id] of [...unique.values()].sort((a, b) => a[1] - b[1]))
        hits.push({
          path: relPath(path, root),
          line: index + 1,
          identifier: id.replaceAll("_", "-").toUpperCase(),
          text: line.trim(),
        });
    }
  return hits;
}
export function splitLegacyCommand(
  command: string,
  windows = process.platform === "win32",
): string[] {
  const words: string[] = [];
  let current = "";
  let quote: "'" | '"' | undefined;
  let started = false;
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index]!;
    if (windows) {
      if (quote) {
        current += character;
        if (character === quote) {
          words.push(current);
          current = "";
          started = false;
          quote = undefined;
        }
      } else if (!started && (character === "'" || character === '"')) {
        quote = character;
        current += character;
        started = true;
      } else if (/\s/.test(character)) {
        if (started) {
          words.push(current);
          current = "";
          started = false;
        }
      } else {
        current += character;
        started = true;
      }
      continue;
    }
    if (quote === "'") {
      if (character === "'") quote = undefined;
      else current += character;
      continue;
    }
    if (quote === '"') {
      if (character === '"') {
        quote = undefined;
      } else if (character === "\\") {
        const following = command[index + 1];
        if (following === undefined) throw new Error("No escaped character");
        if ('\\"$`\n'.includes(following)) {
          if (following !== "\n") current += following;
          index += 1;
        } else current += character;
      } else current += character;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      started = true;
    } else if (character === "\\") {
      const following = command[index + 1];
      if (following === undefined) throw new Error("No escaped character");
      current += following;
      started = true;
      index += 1;
    } else if (/\s/.test(character)) {
      if (started) {
        words.push(current);
        current = "";
        started = false;
      }
    } else {
      current += character;
      started = true;
    }
  }
  if (quote) throw new Error("No closing quotation");
  if (started) words.push(current);
  return words;
}
function displayCommand(command: string[] | string | null): string | null {
  if (command === null || typeof command === "string") return command;
  return command
    .map((part) =>
      /^[A-Za-z0-9_@%+=:,./-]+$/.test(part)
        ? part
        : `'${part.replaceAll("'", `'"'"'`)}'`,
    )
    .join(" ");
}

export async function checkCode(
  argv: readonly string[],
  root = process.cwd(),
  execute: (
    command: string[] | string,
    shell: boolean,
    cwd: string,
  ) => number | null = executeCommand,
): Promise<{ report: Record<string, unknown>; exitCode: number }> {
  const plan = valueAfter(argv, "--plan", "plan.md")!,
    design = valueAfter(argv, "--design", "design.md")!,
    approvalsPath = valueAfter(argv, "--approvals", ".sdlc/approvals.yaml")!,
    gatesPath = valueAfter(argv, "--gates-policy", ".sdlc/gates.yaml")!;
  const explicitTests = valuesAfter(argv, "--tests-dir"),
    explicitSources = valuesAfter(argv, "--src");
  const testInputs = explicitTests.length ? explicitTests : ["tests"],
    sourceInputs = explicitSources.length ? explicitSources : ["."];
  const suffixes = new Set(
    valueAfter(
      argv,
      "--src-ext",
      ".py,.ts,.tsx,.js,.jsx,.java,.kt,.kts,.go,.rs,.cs,.c,.h,.cc,.cpp,.hpp,.rb,.php,.swift,.scala,.sh,.ps1",
    )!
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  let command: string[] | string | null = null,
    shell = false;
  const commandJson = valueAfter(argv, "--tests-argv");
  if (commandJson) {
    const parsed: unknown = JSON.parse(commandJson);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((item) => typeof item === "string")
    )
      throw new Error("--tests-argv must be a JSON array of strings");
    command = parsed as string[];
  } else {
    const value = valueAfter(argv, "--tests");
    if (value) {
      shell = argv.includes("--tests-shell");
      command = shell ? value : splitLegacyCommand(value);
    }
  }
  const testScan = await scanInputs(
      testInputs,
      suffixes,
      root,
      !!explicitTests.length,
    ),
    sourceScan = await scanInputs(sourceInputs, suffixes, root);
  const scanInputIssues = [...testScan.issues, ...sourceScan.issues];
  const generated = valuesAfter(argv, "--generated-traceability-path").map(
    (path) => resolve(path),
  );
  const excluded = (path: string): boolean =>
    generated.some(
      (allowed) =>
        resolve(path) === allowed ||
        resolve(path).startsWith(`${allowed}\\`) ||
        resolve(path).startsWith(`${allowed}/`),
    );
  const scanned = sorted(
    new Set(
      [...testScan.files, ...sourceScan.files].filter(
        (path) => !excluded(path),
      ),
    ),
  );
  const reviewContext = argv.includes("--review-context"),
    codeMarkers = reviewContext ? await markerHits(scanned, root) : [],
    testMarkers = reviewContext
      ? await markerHits(
          testScan.files.filter((path) => !excluded(path)),
          root,
        )
      : [];
  const planText = await readFile(plan, "utf8").catch(() => ""),
    designText = await readFile(design, "utf8").catch(() => "");
  const declared = new Set(
    [...`${planText}\n${designText}`.matchAll(PROCESS_ID)].map((match) =>
      match[0].replaceAll("_", "-").toUpperCase(),
    ),
  );
  const processHits = await processIdHits(scanned, root, declared);
  let testsExit: number | null = null,
    testsPass: boolean | null = null;
  if (command !== null && (typeof command === "string" || command.length > 0)) {
    testsExit = execute(command, shell, root);
    testsPass = testsExit === 0;
  }
  const requireApprovals = argv.includes("--require-approvals");
  let approvalContext: ApprovalContext | undefined;
  const approvalRequirements: ApprovalRequirement[] = [];
  if (requireApprovals) {
    approvalContext = await loadApprovalContext(root, approvalsPath, gatesPath);
    approvalRequirements.push(
      approvalRequirement(approvalContext, root, "plan.approved", plan),
    );
    const match = UI_ARTIFACT.exec(`${designText}\n${planText}`);
    if ((UI_WORK.test(planText) || MOCK_DEP.test(planText)) && match?.[1])
      approvalRequirements.push(
        approvalRequirement(
          approvalContext,
          root,
          "ux.mock.approved",
          match[1],
        ),
      );
    else if (UI_WORK.test(planText) || MOCK_DEP.test(planText))
      approvalRequirements.push({
        gate: "ux.mock.approved",
        artifact: null as unknown as string,
        scope: null,
        approved: false,
        approval_id: null,
        status: null,
        issues: [
          "UI work needs an approved mockup or prototype, but no file was listed",
        ],
      });
  }
  const workflowStateIssues = await validateWorkflowState(root);
  const gates: Record<string, boolean> = {
    workflow_state_valid: !workflowStateIssues.length,
    verification_command_passed: testsPass === true,
    source_process_ids_absent: !processHits.length,
    scan_inputs_valid: !scanInputIssues.length,
    ...(requireApprovals
      ? { required_approvals_present: approvalGatePassed(approvalRequirements) }
      : {}),
  };
  const report: Record<string, unknown> = {
    verification_command: displayCommand(command),
    verification_command_exit: testsExit,
    verification_command_passed: testsPass,
    approval_requirements: approvalRequirements,
    approval_ledger: {
      path: approvalsPath,
      exists: approvalContext?.exists ?? null,
      load_error: approvalContext?.load_error ?? null,
      invalid_records: approvalContext?.invalid_records ?? [],
    },
    scan_input_issues: scanInputIssues,
    process_id_hits: processHits,
    generated_traceability_paths: generated.map((path) => relPath(path, root)),
    workflow_state_issues: workflowStateIssues,
    gates,
    passed: Object.values(gates).filter(Boolean).length,
    total: Object.keys(gates).length,
  };
  if (reviewContext)
    report.review_context = {
      marker_candidates: codeMarkers,
      test_skip_candidates: testMarkers.filter((hit) =>
        ["SKIP", "SKIPIF", "XFAIL"].includes(String(hit.marker)),
      ),
    };
  return { report, exitCode: Object.values(gates).every(Boolean) ? 0 : 1 };
}

/* node:coverage ignore start -- subprocess adapter is covered by entrypoint integration */
/* node:coverage ignore next */
function executeCommand(
  command: string[] | string,
  shell: boolean,
  cwd: string,
): number | null {
  const result =
    typeof command === "string"
      ? spawnSync(command, { cwd, encoding: "utf8", shell })
      : spawnSync(command[0]!, command.slice(1), {
          cwd,
          encoding: "utf8",
          shell,
        });
  if (result.error) throw result.error;
  return result.status;
}
/* node:coverage ignore end */

/* node:coverage ignore start -- text CLI is covered by entrypoint integration */
/* node:coverage ignore next */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  let result: Awaited<ReturnType<typeof checkCode>>;
  try {
    result = await checkCode(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  if (argv.includes("--json")) printJson(result.report);
  else {
    const labels: Record<string, string> = {
      workflow_state_valid: "Saved work status and project settings are valid",
      verification_command_passed: "Verification command passed",
      source_process_ids_absent:
        "Product code and tests do not contain Sarathi tracking IDs",
      scan_inputs_valid: "Source and test inputs are valid",
      required_approvals_present: "Required approvals are current",
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
    for (const issue of report.scan_input_issues)
      console.log(`ERROR ${issue.path}: ${issue.reason}`);
    console.log(
      `\nVerification command: ${report.verification_command ?? "not provided"}`,
    );
    console.log(`${report.passed}/${report.total} checks passed`);
  }
  return result.exitCode;
}
/* node:coverage ignore next */
if (isDirectInvocation(import.meta.url)) process.exitCode = await main();
/* node:coverage ignore end */
