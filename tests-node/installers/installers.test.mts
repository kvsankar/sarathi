import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(process.cwd());
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
