import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(process.cwd());
const promptReference = /prompts\/[A-Za-z0-9._-]+\.prompt\.md/gu;
const modifiedLegacySchemas = Buffer.from(
  "IiIiU2hhcmVkIHN0cnVjdHVyYWwgc2NoZW1hcyBmb3IgU2FyYXRoaSBjaGVja2VyIHNjcmlwdHMuIiIiCgppbXBvcnQgcmUKCiMgVHdvIHRvIDMyIHVwcGVyY2FzZSBhbHBoYW51bWVyaWNzIHdpdGggYXQgbGVhc3Qgb25lIGxldHRlci4gVGhpcyBwZXJtaXRzCiMgZG9tYWluIHRlcm1zIHN1Y2ggYXMgMkZBIGFuZCAzRFMgd2hpbGUgcmVqZWN0aW5nIG51bWVyaWMgcGxhY2Vob2xkZXJzLgpTTFVHX1RPS0VOID0gciIoPz1bQS1aMC05XXsyLDMyfSg/IVtBLVowLTldKSkoPz1bQS1aMC05XSpbQS1aXSlbQS1aMC05XXsyLDMyfSIKUExBTl9JRF9QQVRURVJOID0gcmYiKE1JTEV8V09SS3xQUiktKHtTTFVHX1RPS0VOfSktKHtTTFVHX1RPS0VOfSkiClBMQU5fSUQgPSByZS5jb21waWxlKHJmIig/PCFbQS1aYS16MC05LV0pe1BMQU5fSURfUEFUVEVSTn0oPyFbQS1aYS16MC05LV0pIikKUExBTl9JRF9GVUxMID0gcmUuY29tcGlsZShQTEFOX0lEX1BBVFRFUk4pClBMQU5fSURfQllfS0lORCA9IHsKICAgIGtpbmQ6IHJlLmNvbXBpbGUoCiAgICAgICAgcmYiKD88IVtBLVphLXowLTktXSl7a2luZH0te1NMVUdfVE9LRU59LXtTTFVHX1RPS0VOfSg/IVtBLVphLXowLTktXSkiCiAgICApCiAgICBmb3Iga2luZCBpbiAoIk1JTEUiLCAiV09SSyIsICJQUiIpCn0KUExBTl9JRF9DQU5ESURBVEUgPSByZS5jb21waWxlKAogICAgciIoPzwhW0EtWmEtejAtOS1dKSg/Ok1JTEV8V09SS3xQUiktW0EtWmEtejAtOV0rIgogICAgciIoPzotW0EtWmEtejAtOV0rKSooPyFbQS1aYS16MC05LV0pIiwKICAgIHJlLkksCikKV0FWRV9JRF9QQVRURVJOID0gcmYiV0FWRS0oe1NMVUdfVE9LRU59KS0oe1NMVUdfVE9LRU59KSIKV0FWRV9JRF9GVUxMID0gcmUuY29tcGlsZShXQVZFX0lEX1BBVFRFUk4pCldBVkVfSURfQ0FORElEQVRFID0gcmUuY29tcGlsZSgKICAgIHIiKD88IVtBLVphLXowLTktXSlXQVZFLVtBLVphLXowLTldKyg/Oi1bQS1aYS16MC05XSspKig/IVtBLVphLXowLTktXSkiLAogICAgcmUuSSwKKQoKCmRlZiBpc19wbGFuX2lkKGlkZW50aWZpZXI6IHN0ciwga2luZDogc3RyIHwgTm9uZSA9IE5vbmUpIC0+IGJvb2w6CiAgICAiIiJSZXR1cm4gd2hldGhlciBhbiBpZGVudGlmaWVyIGZvbGxvd3MgS0lORC1BUkVBLU5BTUUgcGxhbiBncmFtbWFyLiIiIgogICAgbWF0Y2ggPSBQTEFOX0lEX0ZVTEwuZnVsbG1hdGNoKGlkZW50aWZpZXIpCiAgICByZXR1cm4gYm9vbChtYXRjaCBhbmQgKGtpbmQgaXMgTm9uZSBvciBtYXRjaC5ncm91cCgxKSA9PSBraW5kKSkKCgpkZWYgaXNfd2F2ZV9pZChpZGVudGlmaWVyOiBzdHIpIC0+IGJvb2w6CiAgICAiIiJSZXR1cm4gd2hldGhlciBhbiBpZGVudGlmaWVyIGZvbGxvd3MgV0FWRS1BUkVBLU5BTUUgZ3JhbW1hci4iIiIKICAgIHJldHVybiBXQVZFX0lEX0ZVTEwuZnVsbG1hdGNoKGlkZW50aWZpZXIpIGlzIG5vdCBOb25lCgoKU1BFQ19TRUNUSU9OUyA9IFsKICAgICJNaXNzaW9uIFN0YXRlbWVudCIsCiAgICAiVXNlciBOZWVkcyIsCiAgICAiTm9uLUdvYWxzIiwKICAgICJGZWF0dXJlcyIsCiAgICAiVXNlIENhc2VzIiwKICAgICJGdW5jdGlvbmFsIFJlcXVpcmVtZW50cyIsCiAgICAiTm9uLUZ1bmN0aW9uYWwgUmVxdWlyZW1lbnRzIiwKICAgICJFeHRlcm5hbCBJbnRlcmZhY2VzICYgQ29udHJhY3RzIiwKICAgICJBY2NlcHRhbmNlIFRlc3RzIiwKICAgICJKb3VybmV5IFRlc3RzIiwKICAgICJUcmFjZWFiaWxpdHkgTWF0cml4IiwKICAgICJBc3N1bXB0aW9ucyAmIE9wZW4gUXVlc3Rpb25zIiwKXQoKTEVHQUNZX0hVTUFOX0ZJUlNUX1NQRUNfU0VDVElPTlMgPSBbCiAgICAoIlByb2R1Y3QgT3ZlcnZpZXciLCAiUHJvZHVjdCBDcnV4IiksCiAgICAiVHJhY2VhYmlsaXR5IiwKXQoKSFVNQU5fRklSU1RfU1BFQ19TRUNUSU9OUyA9IFsKICAgICgiUHJvZHVjdCBPdmVydmlldyIsICJQcm9kdWN0IENydXgiKSwKICAgICJVc2VyIE5lZHMiLAogICAgIk5vbi1Hb2FscyIsCiAgICAiRmVhdHVyZXMiLAogICAgIlVzZSBDYXNlcyIsCiAgICAiRnVuY3Rpb25hbCBSZXF1aXJlbWVudHMiLAogICAgIk5vbi1GdW5jdGlvbmFsIFJlcXVpcmVtZW50cyIsCiAgICAiRXh0ZXJuYWwgSW50ZXJmYWNlcyAmIENvbnRyYWN0cyIsCiAgICAiQWNjZXB0YW5jZSBUZXN0cyIsCiAgICAiSm91cm5leSBUZXN0cyIsCiAgICAiQXNzdW1wdGlvbnMgJiBPcGVuIFF1ZXN0aW9ucyIsCiAgICAiVHJhY2VhYmlsaXR5IiwKXQoKREVTSUdOX1NFQ1RJT05TID0gWwogICAgIk92ZXJ2aWV3IiwKICAgICJUZWNoIFN0YWNrIiwKICAgICJEcml2ZXJzICYgQ29uc3RyYWludHMiLAogICAgIkxheWVycyIsCiAgICAiQ29tcG9uZW50cyIsCiAgICAiSW50ZXJmYWNlcyIsCiAgICAoIkNvcmUgdnMuIFNoZWxsIiwgIkNvcmUgdnMuIFNoZWxsIC8gRXF1aXZhbGVudCBTZXBhcmF0aW9uIiksCiAgICAiS2V5IEZsb3dzIiwKICAgICJEYXRhIE1vZGVsIiwKICAgICJEZXNpZ24gRGVjaXNpb25zIiwKICAgICJUZXN0IFN0cmF0ZWd5IiwKICAgICJSaXNrcyAmIFRyYWRlLW9mZnMiLAogICAgIlRyY2VhYmlsaXR5IE1hdHJpeCIsCl0KCkhVTUFOX0ZJUlNUX0RFU0lHTl9TRUNUSU9OUyA9IFsKICAgICgiVGVjaG5pY2FsIEFwcHJvYWNoIiwgIlRlY2huaWNhbCBDcnV4IiksCiAgICAiVHJhY2VhYmlsaXR5IiwKXQoKUExBTl9TRUNUSU9OUyA9IFsKICAgICJPdmVydmlldyIsCiAgICAiU3RyYXRlZ3kiLAogICAgIk1pbGVzdG9uZXMiLAogICAgKCJQdWxsIFJlcXVlc3RzIiwgIlB1bGwgUmVxdWVzdHMgLyBDaGlsZCBXb3JrIEl0ZW1zIiksCiAgICAiQ292ZXJhZ2UgTWFwIiwKICAgICJTZXF1ZW5jaW5nICYgUmlza3MiLApdCgpIVU1BTl9GSVJTVF9QTEFOX1NFQ1RJT05TID0gWwogICAgIkltcGxlbWVudGF0aW9uIEFwcHJvYWNoIiwKICAgICJUcmFjZWFiaWxpdHkiLApdCgpQUk9EVUNUX0ZJUlNUX1BMQU5fU0VDVElPTlMgPSBbCiAgICAiSW1wbGVtZW50YXRpb24gQXBwcm9hY2giLAogICAgIkJhc2VsaW5lIFJldXNlIiwKICAgICJUcmFjZWFiaWxpdHkiLApdCg==",
  "base64",
);
const legacySchemas = Buffer.from(
  String.raw`"""Shared structural schemas for Sarathi checker scripts."""

import re

# Two to 32 uppercase alphanumerics with at least one letter. This permits
# domain terms such as 2FA and 3DS while rejecting numeric placeholders.
SLUG_TOKEN = r"(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}"
PLAN_ID_PATTERN = rf"(MILE|WORK|PR)-({SLUG_TOKEN})-({SLUG_TOKEN})"
PLAN_ID = re.compile(rf"(?<![A-Za-z0-9-]){PLAN_ID_PATTERN}(?![A-Za-z0-9-])")
PLAN_ID_FULL = re.compile(PLAN_ID_PATTERN)
PLAN_ID_BY_KIND = {
    kind: re.compile(
        rf"(?<![A-Za-z0-9-]){kind}-{SLUG_TOKEN}-{SLUG_TOKEN}(?![A-Za-z0-9-])"
    )
    for kind in ("MILE", "WORK", "PR")
}
PLAN_ID_CANDIDATE = re.compile(
    r"(?<![A-Za-z0-9-])(?:MILE|WORK|PR)-[A-Za-z0-9]+"
    r"(?:-[A-Za-z0-9]+)*(?![A-Za-z0-9-])",
    re.I,
)
WAVE_ID_PATTERN = rf"WAVE-({SLUG_TOKEN})-({SLUG_TOKEN})"
WAVE_ID_FULL = re.compile(WAVE_ID_PATTERN)
WAVE_ID_CANDIDATE = re.compile(
    r"(?<![A-Za-z0-9-])WAVE-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![A-Za-z0-9-])",
    re.I,
)


def is_plan_id(identifier: str, kind: str | None = None) -> bool:
    """Return whether an identifier follows KIND-AREA-NAME plan grammar."""
    match = PLAN_ID_FULL.fullmatch(identifier)
    return bool(match and (kind is None or match.group(1) == kind))


def is_wave_id(identifier: str) -> bool:
    """Return whether an identifier follows WAVE-AREA-NAME grammar."""
    return WAVE_ID_FULL.fullmatch(identifier) is not None


SPEC_SECTIONS = [
    "Mission Statement",
    "User Needs",
    "Non-Goals",
    "Features",
    "Use Cases",
    "Functional Requirements",
    "Non-Functional Requirements",
    "External Interfaces & Contracts",
    "Acceptance Tests",
    "Journey Tests",
    "Traceability Matrix",
    "Assumptions & Open Questions",
]

LEGACY_HUMAN_FIRST_SPEC_SECTIONS = [
    ("Product Overview", "Product Crux"),
    "Traceability",
]

HUMAN_FIRST_SPEC_SECTIONS = [
    ("Product Overview", "Product Crux"),
    "User Needs",
    "Non-Goals",
    "Features",
    "Use Cases",
    "Functional Requirements",
    "Non-Functional Requirements",
    "External Interfaces & Contracts",
    "Acceptance Tests",
    "Journey Tests",
    "Assumptions & Open Questions",
    "Traceability",
]

DESIGN_SECTIONS = [
    "Overview",
    "Tech Stack",
    "Drivers & Constraints",
    "Layers",
    "Components",
    "Interfaces",
    ("Core vs. Shell", "Core vs. Shell / Equivalent Separation"),
    "Key Flows",
    "Data Model",
    "Design Decisions",
    "Test Strategy",
    "Risks & Trade-offs",
    "Traceability Matrix",
]

HUMAN_FIRST_DESIGN_SECTIONS = [
    ("Technical Approach", "Technical Crux"),
    "Traceability",
]

PLAN_SECTIONS = [
    "Overview",
    "Strategy",
    "Milestones",
    ("Pull Requests", "Pull Requests / Child Work Items"),
    "Coverage Map",
    "Sequencing & Risks",
]

HUMAN_FIRST_PLAN_SECTIONS = [
    "Implementation Approach",
    "Traceability",
]

PRODUCT_FIRST_PLAN_SECTIONS = [
    "Implementation Approach",
    "Baseline Reuse",
    "Traceability",
]
`,
  "utf8",
);

interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function run(command: string, args: string[], cwd: string): CommandResult {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.error, undefined);
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function installerCommand(
  bundleRoot: string,
  target: string,
  extra: string[] = [],
  tool = "copilot",
): [string, string[]] {
  if (process.platform === "win32")
    return [
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        join(bundleRoot, "scripts", "install.ps1"),
        "-TargetRoot",
        target,
        "-Scope",
        "project",
        "-Tool",
        tool,
        "-NoCrossInstall",
        ...extra,
      ],
    ];
  return [
    "bash",
    [
      join(bundleRoot, "scripts", "install.sh"),
      "--target",
      target,
      "--scope",
      "project",
      "--tools",
      tool,
      "--no-cross-install",
      ...extra,
    ],
  ];
}

function install(
  bundleRoot: string,
  target: string,
  extra: string[] = [],
  tool = "copilot",
): CommandResult {
  const [command, args] = installerCommand(bundleRoot, target, extra, tool);
  return run(command, args, repositoryRoot);
}

async function filesBelow(root: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await filesBelow(path)));
    else result.push(path);
  }
  return result;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeLegacyAlias(
  skillRoot: string,
  stage: string,
  extra = "",
): Promise<string> {
  const retired = join(skillRoot, stage);
  await mkdir(join(retired, "prompts", "nested"), { recursive: true });
  await mkdir(join(retired, "checkers", "nested"), { recursive: true });
  await writeFile(
    join(retired, "SKILL.md"),
    `---
name: ${stage}
description: user-modified legacy alias
---

This is a direct GitHub Copilot CLI skill alias for the Sarathi ${stage} stage.
${extra}`,
  );
  await writeFile(
    join(retired, "prompts", "nested", "fixture.txt"),
    `prompt:${stage}`,
  );
  await writeFile(
    join(retired, "checkers", "nested", "fixture.json"),
    JSON.stringify({ stage }),
  );
  await writeFile(join(retired, "local-notes.md"), `notes:${stage}`);
  return retired;
}

async function assertNodeBundle(
  checkers: string,
  projectRoot: string,
): Promise<void> {
  for (const relative of [
    "check_plan.mjs",
    join("lib", "approvals.mjs"),
    join("status", "cli.mjs"),
    "render_workflow_status.mjs",
  ])
    assert.equal(
      (await readFile(join(checkers, relative))).length > 0,
      true,
      `${relative} was not installed under ${checkers}`,
    );

  const checker = run(
    process.execPath,
    [join(checkers, "check_plan.mjs"), "plan.md", "--json"],
    projectRoot,
  );
  assert.equal(checker.status, 1, checker.stderr);
  assert.match(checker.stdout, /"has_delivery_items": false/u);
}

test("native installer dry-run preserves the quiet public output", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-install-dry-run-"));
  const dryRun = process.platform === "win32" ? "-DryRun" : "--dry-run";
  const noCheckers =
    process.platform === "win32" ? "-NoCheckers" : "--no-checkers";
  try {
    const result = install(
      repositoryRoot,
      target,
      [noCheckers, dryRun],
      "codex",
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.deepEqual(result.stdout.trim().split(/\r?\n/u), [
      `Dry run complete for target: ${target}`,
      "Tools: codex (project scope)",
    ]);
    assert.deepEqual(await readdir(target), []);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("verbose installer dry-run includes destination details", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-install-verbose-"));
  const dryRun = process.platform === "win32" ? "-DryRun" : "--dry-run";
  const noCheckers =
    process.platform === "win32" ? "-NoCheckers" : "--no-checkers";
  const verbose = process.platform === "win32" ? "-v" : "--verbose";
  try {
    const result = install(
      repositoryRoot,
      target,
      [noCheckers, dryRun, verbose],
      "codex",
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Destination folders:/u);
    assert.match(result.stdout, /Would install Codex skill/u);
    assert.match(result.stdout, /Dry run complete for target:/u);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("source checkout installs the compiled checker tree", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-source-install-"));
  try {
    await writeFile(join(target, "plan.md"), "# Invalid Plan\n", "utf8");
    const result = install(repositoryRoot, target, [], "codex");
    assert.equal(result.status, 0, result.stderr);
    await assertNodeBundle(join(target, "checkers"), target);
    const skill = join(target, ".codex", "skills", "sarathi");
    await assertNodeBundle(join(skill, "checkers"), target);
    assert.equal(
      (await readFile(join(skill, "scripts", "check_update.mjs"))).length > 0,
      true,
    );
    assert.equal(
      (
        await Promise.all([
          filesBelow(join(target, "checkers")),
          filesBelow(join(skill, "checkers")),
          filesBelow(join(skill, "scripts")),
        ])
      )
        .flat()
        .some((path) => path.endsWith(".py")),
      false,
    );
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("packaged installer leaves self-contained Node copies after its origin is removed", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "sarathi-package-install-"));
  const origin = join(temporary, "unpacked-bundle");
  const target = join(temporary, "project");
  await mkdir(target);
  await cp(join(repositoryRoot, "bundle"), origin, { recursive: true });
  assert.deepEqual(
    (await filesBelow(origin)).filter(
      (path) => path.endsWith(".py") || path.endsWith(".pyc"),
    ),
    [],
  );
  await writeFile(join(target, "plan.md"), "# Invalid Plan\n", "utf8");

  try {
    const first = install(origin, target);
    assert.equal(first.status, 0, first.stderr);

    const mainSkill = join(target, ".agents", "skills", "sarathi");
    const githubMainSkill = join(target, ".github", "skills", "sarathi");
    const explicitSkill = join(
      target,
      ".agents",
      "skills",
      "sarathi-plan-assess",
    );
    await writeFile(join(target, "checkers", "schemas.py"), legacySchemas);
    await writeFile(
      join(target, "checkers", "check_plan.py"),
      modifiedLegacySchemas,
    );
    await writeFile(join(target, "checkers", "unrelated.py"), "# keep\n");
    await writeFile(join(target, "checkers", "local-check.mjs"), "// keep\n");
    await writeFile(join(mainSkill, "local-notes.md"), "keep\n");
    await writeFile(join(mainSkill, "checkers", "retired.py"), "# remove\n");
    await writeFile(
      join(githubMainSkill, "scripts", "check_update.py"),
      "# user-modified; keep\n",
    );
    await writeFile(
      join(explicitSkill, "checkers", "retired.py"),
      "# remove\n",
    );

    const second = install(origin, target);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(
      await readFile(join(target, "checkers", "local-check.mjs"), "utf8"),
      "// keep\n",
    );
    await assert.rejects(readFile(join(target, "checkers", "schemas.py")));
    assert.deepEqual(
      await readFile(join(target, "checkers", "check_plan.py")),
      modifiedLegacySchemas,
    );
    assert.equal(
      await readFile(join(target, "checkers", "unrelated.py"), "utf8"),
      "# keep\n",
    );
    assert.equal(
      await readFile(join(mainSkill, "local-notes.md"), "utf8"),
      "keep\n",
    );
    await assert.rejects(readFile(join(mainSkill, "checkers", "retired.py")));
    await assert.rejects(
      readFile(join(explicitSkill, "checkers", "retired.py")),
    );

    await rm(origin, { recursive: true, force: true });

    for (const checkers of [
      join(target, "checkers"),
      join(mainSkill, "checkers"),
      join(explicitSkill, "checkers"),
    ])
      await assertNodeBundle(checkers, target);

    const statusOutput = join(target, "docs", "sdlc-status.html");
    const status = run(
      process.execPath,
      [
        join(target, "checkers", "render_workflow_status.mjs"),
        target,
        "--write",
        "--output",
        statusOutput,
        "--guide-source",
        join(mainSkill, "docs", "sarathi.html"),
      ],
      target,
    );
    assert.equal(status.status, 0, status.stderr);
    assert.match(
      await readFile(statusOutput, "utf8"),
      /Sarathi project status/u,
    );

    const updater = join(mainSkill, "scripts", "check_update.mjs");
    const manifest = join(mainSkill, "manifest.json");
    assert.equal((await readFile(updater)).length > 0, true);
    assert.equal((await readFile(manifest)).length > 0, true);
    await assert.rejects(
      readFile(join(mainSkill, "scripts", "check_update.py")),
    );
    assert.equal(
      await readFile(
        join(githubMainSkill, "scripts", "check_update.py"),
        "utf8",
      ),
      "# user-modified; keep\n",
    );
    await assert.rejects(readFile(join(explicitSkill, "manifest.json")));
    await assert.rejects(readFile(join(target, "manifest.json")));

    const activeRuntimeFiles = (
      await Promise.all([
        filesBelow(join(target, "checkers")),
        filesBelow(join(mainSkill, "checkers")),
        filesBelow(join(mainSkill, "scripts")),
        filesBelow(join(explicitSkill, "checkers")),
      ])
    ).flat();
    assert.deepEqual(
      activeRuntimeFiles
        .filter((path) => path.endsWith(".py") || path.endsWith(".pyc"))
        .sort(),
      [
        join(target, "checkers", "check_plan.py"),
        join(target, "checkers", "unrelated.py"),
      ].sort(),
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("upgrade archives recognized legacy aliases without losing user files", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-archive-upgrade-"));
  try {
    const first = install(repositoryRoot, target, [], "copilot");
    assert.equal(first.status, 0, first.stderr);
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ]) {
      await writeLegacyAlias(
        skillRoot,
        "code-create",
        "User-added instructions must survive migration.\n",
      );
      const unrelated = join(skillRoot, "code-verify");
      await mkdir(unrelated);
      await writeFile(
        join(unrelated, "SKILL.md"),
        "---\nname: code-verify\ndescription: unrelated\n---\nNot a Sarathi alias.\n",
      );
    }

    const second = install(repositoryRoot, target, [], "copilot");
    assert.equal(second.status, 0, second.stderr);
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ]) {
      const archived = join(
        skillRoot,
        "..",
        "sarathi-retired-stage-skills",
        "code-create",
      );
      assert.equal(await exists(join(skillRoot, "code-create")), false);
      assert.match(
        await readFile(join(archived, "SKILL.md"), "utf8"),
        /User-added instructions must survive migration/u,
      );
      assert.equal(
        await readFile(
          join(archived, "prompts", "nested", "fixture.txt"),
          "utf8",
        ),
        "prompt:code-create",
      );
      assert.equal(
        await readFile(join(archived, "local-notes.md"), "utf8"),
        "notes:code-create",
      );
      assert.equal(
        await exists(join(skillRoot, "code-verify", "SKILL.md")),
        true,
      );
      assert.equal(
        await exists(join(skillRoot, "sarathi-code-create", "SKILL.md")),
        true,
      );
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("archive naming is collision-free and dry-run does not move aliases", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-archive-collision-"));
  try {
    const skillRoot = join(target, ".agents", "skills");
    const retired = await writeLegacyAlias(skillRoot, "code-review");
    const archiveRoot = join(target, ".agents", "sarathi-retired-stage-skills");
    await mkdir(join(archiveRoot, "code-review"), { recursive: true });
    await writeFile(
      join(archiveRoot, "code-review", "earlier-copy.md"),
      "keep",
    );

    const dryRunFlag = process.platform === "win32" ? "-DryRun" : "--dry-run";
    const preview = install(repositoryRoot, target, [dryRunFlag], "codex");
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(
      preview.stdout,
      /Would archive retired unprefixed Sarathi command skill -> .*code-review-1/u,
    );
    assert.equal(await exists(retired), true);
    assert.equal(await exists(join(archiveRoot, "code-review-1")), false);

    const installed = install(repositoryRoot, target, [], "codex");
    assert.equal(installed.status, 0, installed.stderr);
    assert.equal(await exists(retired), false);
    assert.equal(
      await exists(join(archiveRoot, "code-review-1", "SKILL.md")),
      true,
    );
    assert.equal(
      await readFile(
        join(archiveRoot, "code-review", "earlier-copy.md"),
        "utf8",
      ),
      "keep",
    );
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("Codex-only upgrades archive legacy aliases from both shared skill roots", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-codex-archive-"));
  try {
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ])
      await writeLegacyAlias(skillRoot, "code-review");

    const result = install(repositoryRoot, target, [], "codex");
    assert.equal(result.status, 0, result.stderr);
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ]) {
      assert.equal(await exists(join(skillRoot, "code-review")), false);
      assert.equal(
        await exists(
          join(
            skillRoot,
            "..",
            "sarathi-retired-stage-skills",
            "code-review",
            "SKILL.md",
          ),
        ),
        true,
      );
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("invalid tools fail before archiving or copying", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-invalid-tool-"));
  try {
    const retired = await writeLegacyAlias(
      join(target, ".agents", "skills"),
      "code-review",
    );
    const result = install(repositoryRoot, target, [], "codxe");
    assert.notEqual(result.status, 0);
    assert.equal(await exists(retired), true);
    assert.equal(await exists(join(target, "checkers")), false);
    assert.equal(
      await exists(join(target, ".agents", "sarathi-retired-stage-skills")),
      false,
    );
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("project upgrade rebuilds owned bundle folders and preserves local files", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-bundle-upgrade-"));
  try {
    let result = install(repositoryRoot, target, [], "copilot");
    assert.equal(result.status, 0, result.stderr);
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ]) {
      const bundle = join(skillRoot, "sarathi");
      await writeFile(join(bundle, "docs", "retired.md"), "retired");
      await writeFile(join(bundle, "prompts", "retired.prompt.md"), "retired");
      await writeFile(join(bundle, "checkers", "retired.mjs"), "retired");
      await writeFile(join(bundle, "local-notes.md"), "keep");
    }

    result = install(repositoryRoot, target, [], "copilot");
    assert.equal(result.status, 0, result.stderr);
    const expectedDocs = (await readdir(join(repositoryRoot, "docs")))
      .filter((name) => !["research", "reviews"].includes(name))
      .sort();
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ]) {
      const bundle = join(skillRoot, "sarathi");
      assert.deepEqual(
        (await readdir(join(bundle, "docs"))).sort(),
        expectedDocs,
      );
      assert.equal(await exists(join(bundle, "docs", "retired.md")), false);
      assert.equal(
        await exists(join(bundle, "prompts", "retired.prompt.md")),
        false,
      );
      assert.equal(
        await exists(join(bundle, "checkers", "retired.mjs")),
        false,
      );
      assert.equal(
        await readFile(join(bundle, "local-notes.md"), "utf8"),
        "keep",
      );

      for (const command of ["spec-create", "plan-assess", "workflow-status"]) {
        const alias = join(skillRoot, `sarathi-${command}`);
        const skill = await readFile(join(alias, "SKILL.md"), "utf8");
        const agent = await readFile(
          join(alias, "agents", "openai.yaml"),
          "utf8",
        );
        assert.match(skill, new RegExp(`name: sarathi-${command}`));
        assert.match(agent, /allow_implicit_invocation:\s*false/u);
        for (const reference of skill.match(promptReference) ?? [])
          assert.equal(await exists(join(alias, reference)), true);
      }
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("project install copies canonical docs byte-for-byte", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-canonical-docs-"));
  try {
    const result = install(repositoryRoot, target, [], "copilot");
    assert.equal(result.status, 0, result.stderr);
    const expected = (
      await readdir(join(repositoryRoot, "docs"), {
        withFileTypes: true,
      })
    ).filter(({ name }) => !["research", "reviews"].includes(name));
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ])
      for (const entry of expected) {
        const installed = join(skillRoot, "sarathi", "docs", entry.name);
        if (entry.isDirectory()) assert.equal(await exists(installed), true);
        else
          assert.deepEqual(
            await readFile(installed),
            await readFile(join(repositoryRoot, "docs", entry.name)),
          );
      }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("every generated command skill is explicit, agent-neutral, and complete", async () => {
  const target = await mkdtemp(join(tmpdir(), "sarathi-command-skills-"));
  try {
    const result = install(repositoryRoot, target, [], "copilot");
    assert.equal(result.status, 0, result.stderr);
    const commands = [
      ...["spec", "design", "plan", "code"].flatMap((stage) =>
        ["create", "verify", "review", "assess"].map(
          (action) => `${stage}-${action}`,
        ),
      ),
      "workflow-status",
    ];
    for (const skillRoot of [
      join(target, ".github", "skills"),
      join(target, ".agents", "skills"),
    ])
      for (const command of commands) {
        const alias = join(skillRoot, `sarathi-${command}`);
        const skill = await readFile(join(alias, "SKILL.md"), "utf8");
        const agent = await readFile(
          join(alias, "agents", "openai.yaml"),
          "utf8",
        );
        assert.match(skill, new RegExp(`name: sarathi-${command}`));
        assert.match(skill, /description:\s*\S/u);
        assert.match(agent, /allow_implicit_invocation:\s*false/u);
        assert.match(agent, /default_prompt:\s*\S/u);
        assert.equal(await exists(join(skillRoot, command)), false);
        for (const reference of skill.match(promptReference) ?? [])
          assert.equal(await exists(join(alias, reference)), true);
      }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test(
  "Bash cleanup removes only exact retired srs-authoring variants",
  { skip: process.platform === "win32" },
  async () => {
    const target = await mkdtemp(join(tmpdir(), "sarathi-retired-srs-"));
    try {
      const script = await readFile(
        join(repositoryRoot, "scripts", "install.sh"),
        "utf8",
      );
      const start = script.indexOf("remove_retired_srs_authoring() {");
      const end = script.indexOf("\n}\n\ncopy_skill_folder", start) + 2;
      assert.ok(start >= 0 && end > start);
      const cleanup = join(target, "remove-retired-srs.sh");
      await writeFile(
        cleanup,
        `#!/usr/bin/env bash
set -euo pipefail
${script.slice(start, end)}
remove_retired_srs_authoring "$1"
`,
      );
      await chmod(cleanup, 0o755);

      const fakeBin = join(target, "bin");
      await mkdir(fakeBin);
      const fakeSha = join(fakeBin, "sha256sum");
      await writeFile(
        fakeSha,
        `#!/usr/bin/env bash
case "$1" in
  */SKILL.md) value="$SARATHI_TEST_SKILL_HASH" ;;
  */agents/openai.yaml) value="$SARATHI_TEST_AGENT_HASH" ;;
  */references/srs-quality.md) value="$SARATHI_TEST_REFERENCE_HASH" ;;
  *) exit 1 ;;
esac
printf '%s  %s\\n' "$value" "$1"
`,
      );
      await chmod(fakeSha, 0o755);
      const variants = [
        [
          "cd6f56c6759a2ab9c1f15e926b1f0f254a12fe7d7ceecb3b574794345d6a0647",
          "092fa2f148f507e84b1cb6374d272c94ad9e7f9dce9d7974ebd7354910c7969b",
        ],
        [
          "2e9aa5cb0c985397b5ecdfcdf74985fbef4205e8e81aa2d73bbefbbeea6550ee",
          "824c0bbc14f8fc0788a6ec78d6c4f88a9c416473b9f7fd2d5be2c9133aa520b2",
        ],
      ];
      const agentHash =
        "960503fe7ddf3a3bd675cc2373438eb271e29bcef84eaf65eb3914e5640a3c0b";
      for (const [index, [skillHash, referenceHash]] of variants.entries()) {
        const root = join(target, `variant-${String(index)}`);
        const retired = join(root, "srs-authoring");
        await mkdir(join(retired, "agents"), { recursive: true });
        await mkdir(join(retired, "references"));
        await writeFile(join(retired, "SKILL.md"), "fixture");
        await writeFile(join(retired, "agents", "openai.yaml"), "fixture");
        await writeFile(
          join(retired, "references", "srs-quality.md"),
          "fixture",
        );
        const result = spawnSync("bash", [cleanup, root], {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ""}`,
            SARATHI_TEST_SKILL_HASH: skillHash,
            SARATHI_TEST_AGENT_HASH: agentHash,
            SARATHI_TEST_REFERENCE_HASH: referenceHash,
          },
        });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(await exists(retired), false);
      }
    } finally {
      await rm(target, { recursive: true, force: true });
    }
  },
);
