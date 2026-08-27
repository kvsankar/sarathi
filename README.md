# sarathi — Build Production Software with AI Agents

<!--- pyml disable-next-line no-inline-html --->
<p align="center">
  <a href="https://github.com/kvsankar/sarathi/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/kvsankar/sarathi/ci.yml?branch=master&amp;style=flat-square" alt="CI" />
  </a>
  <a href="https://github.com/kvsankar/sarathi/releases/latest">
    <img src="https://img.shields.io/github/v/release/kvsankar/sarathi?style=flat-square" alt="Latest release" />
  </a>
  <a href="https://www.npmjs.com/package/sarathi-sdlc">
    <img src="https://img.shields.io/npm/v/sarathi-sdlc?style=flat-square" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/sarathi-sdlc">
    <img src="https://img.shields.io/node/v/sarathi-sdlc?style=flat-square" alt="Node.js versions" />
  </a>
  <a href="https://www.npmjs.com/package/sarathi-sdlc">
    <img src="https://img.shields.io/npm/dm/sarathi-sdlc?style=flat-square" alt="npm downloads" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/kvsankar/sarathi?style=flat-square" alt="MIT license" />
  </a>
  <a href="https://github.com/kvsankar/sarathi/stargazers">
    <img src="https://img.shields.io/github/stars/kvsankar/sarathi?style=flat-square" alt="GitHub stars" />
  </a>
</p>

<!--- pyml disable-next-line no-inline-html --->
<p align="center">
  <img src="docs/assets/sarathi-chariot-hero.png" alt="Sarathi guiding Arjuna's chariot" width="50%" />
</p>

Sarathi helps coding agents turn approved requirements into the smallest safe working change
through clear requirements, design, planning, coding, automatic checks, and independent
review. It keeps the next step clear and adjusts the remaining work from real feedback.

## Why sarathi?

In the Mahabharata, Krishna serves as Arjuna's _sarathi_—his charioteer and counsel. He does
not replace Arjuna's agency; he helps him see the situation clearly, reason through doubt,
and act with purpose. sarathi takes its name from that partnership: it helps engineers and
AI agents navigate complex software decisions and reach production with evidence,
discipline, and human judgment intact.

Its basic loop is:

```text
approved requirements -> smallest safe change -> checks and review -> feedback -> adapt
```

Requirements, designs, plans, and code may change as the team learns. Lean combines design
with planning. Standard keeps a separate design. High-assurance splits risky work into
smaller changes with more review points. Every stage that remains is checked and independently
reviewed. Approval rules are chosen separately.
See [sarathi's enduring model](docs/enduring-model.md) and
[delivery assurance profiles](docs/assurance-profiles.md).

## What You Get

- Slash-command prompts for specs, designs, plans, code, verification, review, and
  assessment.
- A native `sarathi` skill for agents that support skills.
- Automatic checkers for specs, designs, plans, and links from requirements to tests.
- A repeatable HTML project-status view showing current work, linked tests, feedback, and
  approvals.
- Installers for Windows, macOS, Linux, and WSL.
- User-scoped installs by default, with project-scoped installs when needed.
- Change history in [CHANGELOG.md](CHANGELOG.md) and release/tagging guidance in
  [docs/release-process.md](docs/release-process.md).

Extra checks for specific risks are listed in
[docs/cross-cutting-concerns.md](docs/cross-cutting-concerns.md). Prompt authors should use
[docs/process-maintenance.md](docs/process-maintenance.md) to keep shared rules from bloating
every command prompt.

## Quick Install

Install Sarathi for the current user with one command:

```sh
npx --yes sarathi-sdlc install
```

`npx` runs the installer temporarily; the installed skills and prompts remain available.
Restart or reload your agent tools after installation. A user install skips the separate
project-local `checkers/` copy by default because every installed Sarathi skill already
contains its checkers.

When an update notice appears, review and explicitly approve the reported version before
installing it. Replace `X.Y.Z` with that exact approved version:

```sh
npx --yes sarathi-sdlc@X.Y.Z install
```

Verify `manifest.json` reports the approved version, then restart or reload the agent tools.
Agents must never update Sarathi automatically.

Preview the destinations without writing files:

```sh
npx --yes sarathi-sdlc install --dry-run
```

Add `-v` or `--verbose` to show destinations, per-tool actions, companion-install details,
reload guidance, and informational notes.

Install project-local assets, including a top-level `checkers/` copy, or select tools:

```sh
npx --yes sarathi-sdlc install \
  --target /path/to/product --scope project
npx --yes sarathi-sdlc install --tools codex,claude-code
```

## Optional: Keep The Installer Command

Install `sarathi-sdlc` permanently when you want its installer, checker, status, version, and
update commands on your `PATH`:

```sh
npm install --global sarathi-sdlc
sarathi-sdlc install
sarathi-sdlc --version
sarathi-sdlc check-update
sarathi-sdlc check plan docs/plan.md --json
sarathi-sdlc status
sarathi-sdlc status --check
sarathi-sdlc status --write
```

After upgrading with `npm update --global sarathi-sdlc`, rerun `sarathi-sdlc install` to
refresh copied skills and prompts. Installed skills check npm at
most once per 24 hours and report newer releases without blocking work or updating
automatically. Set `SARATHI_UPDATE_CHECK=0` to disable that check.

An upgrade rebuilds Sarathi's bundled `docs/`, `prompts/`, and `checkers/` folders while
preserving other files in the installed `sarathi` folder. It removes the retired
`srs-authoring` bundle only when that bundle exactly matches Sarathi's historical files. It
moves recognized older unprefixed stage aliases, unchanged, to a sibling
`sarathi-retired-stage-skills/` archive outside skill discovery. It does not move unrelated
generic skills.

## Install From A Source Checkout

Clone the repository and run from its root when developing or testing an unreleased change.

Install development dependencies and build the Node runtime:

```sh
npm ci
npm run build
```

Preview the install without writing files:

```powershell
.\scripts\install.ps1 -DryRun
```

```sh
scripts/install.sh --dry-run
```

Install for the current user:

```powershell
.\scripts\install.ps1
```

```sh
scripts/install.sh
```

Installers report only the target, selected tools, scope, and completion status by default.
Use `-v` in PowerShell or `-v`/`--verbose` in a shell to show destination paths, per-tool
actions, companion-install details, reload guidance, and informational notes.

Install into a specific project workspace from the checkout instead:

```powershell
.\scripts\install.ps1 -TargetRoot D:\path\to\product -Scope project
```

```sh
scripts/install.sh --target /path/to/product --scope project
```

Install only selected tools:

```powershell
.\scripts\install.ps1 -Tool codex,claude-code
```

```sh
scripts/install.sh --tools codex,claude-code
```

By default, Windows installs also refresh WSL targets when WSL is available, and WSL installs
also refresh Windows targets when `powershell.exe` is available. Use `-NoCrossInstall` or
`--no-cross-install` to stay in the current environment.

## Supported Targets

- **Codex**: installs the `sarathi` skill and direct prompt commands under
  `~/.codex/prompts`. Invoke direct prompts as `/prompts:spec-create`,
  `/prompts:design-create`, etc. after restarting Codex.
- **GitHub Copilot**: installs prompt files for VS Code Copilot Chat and first-class agent
  skills for Copilot CLI/agent surfaces. User scope installs prompts under the VS Code user
  prompt folder and skills under `~/.copilot/skills/sarathi` plus
  `~/.agents/skills/sarathi`. Project scope installs prompts to
  `<project>/.github/prompts` and skills to `<project>/.github/skills/sarathi`
  plus `<project>/.agents/skills/sarathi`. The installer also creates agent-neutral,
  explicit-only command skills such as `sarathi-code-review`, `sarathi-code-verify`, and
  `sarathi-code-assess` under the same skill roots.
- **Claude Code**: installs slash commands and the `sarathi` skill.
- **Gemini CLI**: installs command TOML files.
- **Claude and Pi**: exports prompt packs under `.ai-prompts/` for manual import or use.
- **Checkers**: project-scoped package installs copy `checkers/` into the target workspace.
  Implicit user-scoped package installs skip that separate copy unless `--with-checkers` is
  provided; every installed skill still contains its self-contained checker bundle. Source
  installers retain `-NoCheckers` and `--no-checkers` for explicitly skipping the copy.

Installed skill bundles are self-contained: the installer assembles each `sarathi` skill copy
from canonical `docs/`, `prompts/`, and compiled TypeScript checker sources, plus `SKILL.md` and agent
config. Prompt commands or explicit command skills are also installed separately where host
tools can expose them directly. Only the top-level `sarathi` skill permits implicit
invocation, and only for Sarathi or managed delivery-workflow intent—not an ordinary
code-generation request. Every `sarathi-*` command skill must be named explicitly.

Every dry or real install prints the destination folders before doing work.

Prefixed command skills are expected only on agent skill surfaces where the installer exposes
them; Codex-only, Claude Code, and Gemini installations use their native explicit commands.
If an agent reports that bundled `prompts/spec-create.prompt.md`,
`checkers/check_spec.mjs`, or another required file under the main `sarathi` skill is missing,
the bundle is incomplete or was copied from the wrong folder. Re-run the installer, or install
from a source checkout after running `npm ci` and `npm run build`.

## Commands

Commands combine a stage (`spec`, `design`, `plan`, or `code`) with one of four actions:

- `create`: write or revise a document or code slice.
- `verify`: run repeatable checks and report what they prove and do not prove.
- `review`: independently judge quality and look for counterexamples.
- `assess`: run automatic checks, then an independent review.

The core stage names are:

| Explicit command skill     | Purpose                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `$sarathi-spec-create`     | Define the problem, needs, features, use cases, functional and supplementary requirements, acceptance tests, and journeys.       |
| `$sarathi-spec-verify`     | Run automatic spec checks and report evidence.                                                                                   |
| `$sarathi-spec-review`     | Independently review spec quality.                                                                                               |
| `$sarathi-spec-assess`     | Run specification checks plus independent review.                                                                                |
| `$sarathi-design-create`   | Create or revise a Software Design Document and ADRs as needed.                                                                  |
| `$sarathi-design-verify`   | Run spec and design checks.                                                                                                      |
| `$sarathi-design-review`   | Independently review design quality and whether the spec is sufficient.                                                          |
| `$sarathi-design-assess`   | Run design checks plus independent review.                                                                                       |
| `$sarathi-plan-create`     | Plan the impact, dependencies, order, integration, safety, and proof for a Breakdown or Implementation plan.                     |
| `$sarathi-plan-verify`     | Run checks for the spec, design, and plan.                                                                                       |
| `$sarathi-plan-review`     | Independently review whether the plan is clear, safe, testable, and ordered well.                                                |
| `$sarathi-plan-assess`     | Run plan checks plus independent review.                                                                                         |
| `$sarathi-code-create`     | Implement an approved plan with focused tests and any planned logging, error-handling, documentation, build, or deployment work. |
| `$sarathi-code-verify`     | Run planned tests, required project checks, and applicable logging/error-handling/build/docs/deployment checks.                  |
| `$sarathi-code-review`     | Independently review code, tests, operational work, required project checks, and fit with earlier documents.                     |
| `$sarathi-code-assess`     | Run code checks plus independent review.                                                                                         |
| `$sarathi-workflow-status` | Report project status without writing; explicitly check or write the HTML view.                                                    |

Report status without writing, or explicitly generate the HTML page and linked guide:

```pwsh
sarathi-sdlc status
sarathi-sdlc status --write
```

See [docs/workflow-status.md](docs/workflow-status.md) for details. The page starts with what
works, what can be reused, what remains, what blocks coding, and the next action. It then
shows document, approval, and review status. Every completion claim says exactly what is
complete.

Exact invocation syntax depends on the host tool:

- Agent skill surfaces: explicitly invoke `$sarathi-code-review`,
  `$sarathi-code-assess`, or another prefixed command skill. Ordinary coding requests do not
  activate these skills.
- Codex direct prompts: `/prompts:code-review`, `/prompts:code-assess`, and so on.
- GitHub Copilot CLI: reload skills with `/skills reload`, then explicitly select the
  prefixed Sarathi command skill using the syntax supported by that version.
- VS Code Copilot Chat: use the installed prompt file from the prompt picker, or ask in
  natural language with the stage name.
- Claude Code and Gemini: use their native command mechanisms.

## Workflow Model

The core model is [approved requirements, useful changes, checks, review, and
feedback](docs/enduring-model.md). Requirements explain the problem, user needs, behavior,
constraints, acceptance tests, and important user journeys. Designs explain how the system
will meet them. Plans say what will change, in what order, and how it will be tested. Code is
built in short Red-Green-Refactor cycles. Each stage is checked and independently reviewed
before the work moves on.

Work uses three levels. The paired terms below are retained as machine-readable values for
compatibility:

- **Product/system**: broad product or platform scope.
- **Feature/component**: one user-facing capability, subsystem, component, integration, or
  screen family.
- **Slice/change**: the smallest implementable unit, usually PR-sized.

Documents say plainly whether the work is ready to implement and, when it is not, what
specific question remains.

`$sarathi-code-create` runs from approved requirements and a specific implementation plan that is
ready to implement.

Start implementation when the approved requirements, design, and one specific plan make the
next change clear and safe. If the work is too complex to understand and review as one
unit, split it along a natural product or technical boundary until each part is clear,
testable, and safe to integrate. A split does not automatically require another spec or
design. See
[docs/work-decomposition.md](docs/work-decomposition.md).

## ID Format

Specs and plans use descriptive slug-only IDs: `KIND-AREA-NAME`, for example
`FR-AUTH-SIGNIN`, `AT-AUTH-SIGNIN`, `JT-AUTH-ONBOARDING`, `PR-AUTH-SIGNIN`, and
`WAVE-AUTH-BOUNDARY`. Design
entities keep the shorter `KIND-SLUG` form, for example `COMP-AUTH` and `IFACE-AUTH`.
Design test obligations use `TEST-AREA-NAME`, for example `TEST-AUTH-POLICY`. Numeric
placeholders such as `FR-AUTH-10` are rejected by the checkers; meaningful digit-first terms
such as `FR-AUTH-2FA` and `FR-PAY-3DS` are valid.

For older numbered IDs, see [docs/slug-id-migration.md](docs/slug-id-migration.md).

## Policy And Evidence

Detailed workflow behavior is owned by the command prompts and shared documents rather than
repeated here:

- [project entry](docs/project-entry.md), [delivery assurance](docs/assurance-profiles.md),
  and [approval/YOLO policy](docs/approval-gates.md);
- [document contracts](docs/artifact-contracts.md), [locations](docs/document-locations.md),
  and [human-first formatting](docs/human-first-artifacts.md);
- [work decomposition](docs/work-decomposition.md), [feedback and learning](docs/feedback-and-learning.md),
  and [work-in-progress state](docs/work-in-progress.md);
- [test ownership](docs/test-ownership.md), [risk-triggered checks](docs/cross-cutting-concerns.md),
  and [review/verification](docs/review-verification-checklist.md); and
- [simplicity](docs/simplicity-first.md), [cleanup](docs/cleanup-pass.md),
  [simplification](docs/simplify-pass.md), and [result reporting](docs/result-reporting.md).

The selected command prompt says which references apply. Checkers provide repeatable evidence
about structure, links, approval-record freshness, and declared test results; they do not prove
correct meaning, stakeholder consent, or production readiness.

## Repository Layout

```text
docs/      user-facing documentation and review notes
prompts/   source command prompt definitions
skills/    skill-specific definitions and metadata
src/       TypeScript CLI, checkers, status renderer, updater, and package assembly
scripts/   installers for Windows, macOS, Linux, and WSL
tests-node/ Node unit, contract, package, and installer tests
tests/     browser layout tests
```

Do not treat `.github/prompts` as source in this repository. It is only an install target
for GitHub Copilot project-scoped prompts.

## More Detail

- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Release process: [docs/release-process.md](docs/release-process.md)
- Static process guide and example tree: [docs/sarathi.html](docs/sarathi.html)
- Cross-scope test and integration ownership: [docs/test-ownership.md](docs/test-ownership.md)
- Review checklist: [docs/review-verification-checklist.md](docs/review-verification-checklist.md)
- Document locations and persistent review records: [docs/document-locations.md](docs/document-locations.md)
- Slug ID migration: [docs/slug-id-migration.md](docs/slug-id-migration.md)
- Approval gates: [docs/approval-gates.md](docs/approval-gates.md)
- Agent-facing repository guidance: [AGENTS.md](AGENTS.md)
