# Agent-Steered SDLC

Agent-Steered SDLC is a set of reusable prompts, skills, and structural checkers for
spec-first software delivery with AI coding agents. It helps developers move from a product
request to requirements, design, planning, implementation, tests, and review without losing
traceability or skipping human review.

The workflow is intentionally artifact-driven:

```text
request -> spec -> design -> plan -> code/tests/logging/errors/docs/build/deploy -> assess
```

Each stage can be created, verified, reviewed, or assessed independently. By default, the
skill pauses for human input when important information is missing and pauses again after
generating an artifact.

## What You Get

- Slash-command prompts for specs, designs, plans, code, verification, review, and
  assessment.
- A native `agent-steered-sdlc` skill for agents that support skills.
- Structural checkers for specs, designs, plans, and code/test traceability.
- Installers for Windows, macOS, Linux, and WSL.
- User-scoped installs by default, with project-scoped installs when needed.

## Install

Run from the cloned repository root.

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

Install into a specific project workspace instead:

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

- **Codex**: installs the `agent-steered-sdlc` skill and direct prompt commands under
  `~/.codex/prompts`. Invoke direct prompts as `/prompts:spec-create`,
  `/prompts:design-create`, etc. after restarting Codex.
- **GitHub Copilot**: installs prompt files for VS Code Copilot Chat and first-class agent
  skills for Copilot CLI/agent surfaces. User scope installs prompts under the VS Code user
  prompt folder and skills under `~/.copilot/skills/agent-steered-sdlc` plus
  `~/.agents/skills/agent-steered-sdlc`. Project scope installs prompts to
  `<project>/.github/prompts` and skills to `<project>/.github/skills/agent-steered-sdlc`
  plus `<project>/.agents/skills/agent-steered-sdlc`. Copilot CLI does not treat prompt
  files as custom built-in slash commands, so the installer also creates direct stage skill
  aliases such as `code-review`, `code-verify`, and `code-assess` under the same skill roots.
- **Claude Code**: installs slash commands and the skill.
- **Gemini CLI**: installs command TOML files.
- **Claude and Pi**: exports prompt packs under `.ai-prompts/` for manual import or use.
- **Checkers**: installs `checkers/` into the target workspace unless skipped with
  `-NoCheckers` or `--no-checkers`.

Installed skill bundles are self-contained: each `agent-steered-sdlc` skill copy includes
`SKILL.md`, agent config, bundled `prompts/*.prompt.md`, and bundled `checkers/*.py`. Prompt
commands or stage skill aliases are also installed separately where host tools can expose
them directly.

Every dry or real install prints the destination folders before doing work.

If an agent reports that `spec-create`, another stage prompt, or `checkers/check_*.py` are
missing, the installed skill is incomplete or was copied from the wrong folder. A valid
skill install should contain files such as `prompts/spec-create.prompt.md` and
`checkers/check_spec.py` under the same `agent-steered-sdlc` skill directory. Re-run the
installer, or install from this repository's `skills/agent-steered-sdlc` folder after
updating to a version where that source folder is self-contained.

## Commands

The prompt set uses four verbs:

- `create`: author or revise an artifact.
- `verify`: run deterministic/mechanical checks and report evidence only.
- `review`: make the qualitative adversarial judgment using available evidence.
- `assess`: run `verify` first, then `review`; this is the full gate.

The core stage names are:

| Command | Purpose |
| --- | --- |
| `/spec-create` | Create or revise a Software Requirements Specification. |
| `/spec-verify` | Run structural spec checks and report evidence. |
| `/spec-review` | Qualitatively review spec quality. |
| `/spec-assess` | Run `/spec-verify` plus `/spec-review`. |
| `/design-create` | Create or revise a Software Design Document and ADRs as needed. |
| `/design-verify` | Run upstream spec and design structural checks. |
| `/design-review` | Qualitatively review design quality and upstream spec fitness. |
| `/design-assess` | Run `/design-verify` plus `/design-review`. |
| `/plan-create` | Create a breakdown or implementation plan with PR slices and touch sets. |
| `/plan-verify` | Run upstream artifact and plan structural checks. |
| `/plan-review` | Qualitatively review plan readiness, slicing, allocation, and sequencing. |
| `/plan-assess` | Run `/plan-verify` plus `/plan-review`. |
| `/code-create` | Implement a code-ready plan using Red/Green/Refactor TDD, including planned logging/error-handling/docs/build/deploy work. |
| `/code-verify` | Run tests, coverage, quality gates, logging/error-handling/build/docs/deployment checks, and structural code evidence. |
| `/code-review` | Qualitatively review code, tests, logging/error-handling, docs, build/deploy work, quality gates, and upstream consistency. |
| `/code-assess` | Run `/code-verify` plus `/code-review`. |

Exact invocation syntax depends on the host tool:

- Codex direct prompts: `/prompts:code-review`, `/prompts:code-assess`, and so on.
- GitHub Copilot CLI: stage names are installed as skill aliases where supported, so try
  `/code-review` or `/code-assess` after `/skills reload`. If the CLI surface rejects a
  stage slash name, invoke by natural language: "Use the agent-steered-sdlc skill to run the
  code-review stage."
- VS Code Copilot Chat: use the installed prompt file from the prompt picker, or ask in
  natural language with the stage name.
- Claude Code and Gemini: use their native command mechanisms.

## Workflow Model

Work is classified at three levels:

- **Product/system**: broad product or platform scope. Usually decomposable, not directly
  code-ready.
- **Feature/component**: one user-facing capability, subsystem, component, integration, or
  screen family.
- **Slice/change**: the smallest implementable unit, usually PR-sized.

Artifacts declare one readiness value:

- **Exploratory**: still being shaped.
- **Decomposable**: valid parent artifact, but needs child work before implementation.
- **Code-ready**: precise enough for implementation.

`/code-create` should only run from a code-ready implementation plan.

## ID Format

Specs and plans use descriptive slug-only IDs: `KIND-AREA-NAME`, for example
`FR-AUTH-SIGNIN`, `AT-AUTH-SIGNIN`, `JT-AUTH-ONBOARDING`, and `PR-AUTH-SIGNIN`. Design
entities keep the shorter `KIND-SLUG` form, for example `COMP-AUTH` and `IFACE-AUTH`.
Design test obligations use `TEST-AREA-NAME`, for example `TEST-AUTH-POLICY`. Numeric
suffixes such as `FR-AUTH-10` are rejected by the checkers.

For older numbered artifacts, see [docs/slug-id-migration.md](docs/slug-id-migration.md).

## Builds And Deployment

Builds and deployment are covered from the beginning:

- Specs capture externally relevant build, release, deployment, rollout, rollback,
  migration, smoke-check, and operational acceptance needs.
- Designs define deployable artifacts, build/package strategy, release workflow,
  environments, configuration/secrets, promotion, deployment topology, validation, and
  ownership.
- Plans assign build scripts, package manifests, generated outputs, CI/CD config, IaC or
  deployment manifests, migration scripts, smoke checks, rollback checks, and release docs
  to child work or PRs.
- Code creates and verifies the planned build/deployment pieces. It should run the build,
  verify the expected artifact, validate deployment scripts/manifests with dry-run or lint
  checks where possible, and avoid live production deployment unless explicitly requested.

Reviews stop with an upstream blocker when build or deployment intent is missing from the
artifact that should own it.

## Test Environments

The process treats test environments as design and planning decisions:

- Specs capture externally relevant environment needs or non-goals when they affect
  acceptance, release safety, data, integrations, or operations.
- Designs always define the developer test environment and recommend additional
  environments when context warrants them: shared integration/test, staging or
  pre-production, production canary/smoke, and synthetic monitoring.
- Plans assign setup, data/secrets handling, reset/cleanup, deployment validation, smoke/
  canary/rollback checks, and ownership for each planned environment.
- Code runs the planned environment checks. Live production checks require explicit user
  approval.

Not every product needs every environment. The design should explain which environments are
required now, recommended later, deliberately deferred, or unnecessary, including residual
risk.

## Context-Driven Reviews And Tests

At every phase, agents should ask what the context implies beyond the user's first words.
Depending on the domain, data, users, integrations, platform, and deployment risk, the
process may need dedicated performance/load tests, security review or threat modeling,
privacy/compliance review, accessibility audit, resilience or disaster-recovery checks,
backup/restore rehearsal, migration rehearsal, localization review, abuse/fraud/safety
review, cost guardrails, compatibility tests, or operational reviews.

Specs capture these as requirements, acceptance criteria, non-goals, assumptions, or open
questions. Designs turn them into tactics, `TEST-` obligations, ADRs, or risks. Plans assign
them to work items or PRs. Code verifies the planned checks and stops for upstream revision
if implementation reveals a material concern that was not planned.

## User And Developer Documentation

Documentation is also covered from the beginning:

- Specs capture user and developer documentation audiences, tasks, onboarding, help,
  API/reference, examples, runbooks, troubleshooting, release notes, accessibility, and
  acceptance needs.
- Designs define the documentation architecture: source locations, generated vs. written
  docs, API/reference generation, examples, diagrams, publishing/versioning, ownership, and
  validation checks.
- Plans assign documentation work to PRs, including user guides, README/API docs, examples,
  runbooks, troubleshooting, migration notes, release notes, generated docs, and link/doc
  checks.
- Code updates and verifies the planned docs with the implementation. Public docs should
  match actual behavior and contracts, not describe unimplemented future behavior.

Reviews stop with an upstream blocker when documentation intent is missing from the artifact
that should own it.

## Logging, Telemetry, And Error Handling

Diagnostics and failure behavior are covered across the lifecycle:

- Specs capture externally relevant human/agent/operator diagnostics, telemetry,
  support/debugging needs, privacy/redaction constraints, user-facing error behavior, and
  boundary error contracts as requirements or non-goals.
- Designs define structured logging, correlation IDs, events, metrics, traces, sinks,
  retention/redaction, alert hooks, and how UI/API/domain/infrastructure errors are mapped,
  recovered, retried, degraded, or surfaced.
- Plans assign logging, telemetry, and error-handling work to PRs, including fixtures,
  verification oracles, and tests for representative success/failure paths.
- Code implements and verifies the planned diagnostics and error handling without leaking
  secrets, stack traces, raw objects, or unstable internals to users, logs, or agents.

Reviews stop with an upstream blocker when logging, telemetry, or error-handling intent is
missing from the artifact that should own it.

## Human Gates And YOLO Mode

Default behavior is human-gated:

- If important input is missing, the agent asks one focused question at a time.
- After an artifact is generated, materially revised, reviewed, or assessed, the agent stops
  for human review.
- For UI-facing products, `/spec-create` asks whether a mock UI is required. If the spec
  records `UI Mock Preference: Required`, the mock UI artifact is a hard human gate:
  downstream planning, code, and production UI work must wait for explicit user approval of
  the mock.
- Downstream reviews stop when they discover upstream spec, design, or plan issues.

The human review pause is a hard gate. A completed spec does not automatically flow into
design; a completed design does not automatically flow into planning; a completed plan does
not automatically flow into code; and a completed code slice does not automatically flow into
the next slice or release/deployment work. The agent should end its turn with artifact paths,
readiness/status, verification/review/assessment results, open questions, and the
recommended next command.

You can opt into **YOLO mode** with phrases like:

```text
yolo
use your judgment
make reasonable assumptions
proceed without questions
```

YOLO mode lets the agent make reasonable assumptions and continue, but it must record those
assumptions, risks, and trade-offs. YOLO does not bypass readiness gates, planned touch sets,
quality gates, safety constraints, or the default review pause unless you explicitly ask for
end-to-end unattended continuation.

## Deterministic Approval Gates

Projects can make human gates mechanically checkable with local YAML files:

- `.sdlc/approvals.yaml` records approved artifacts, approvers, UTC timestamps, and SHA-256
  hashes.
- `.sdlc/gates.yaml` optionally enables bounded auto-approval for low-risk modes such as
  internal prototypes.

Checkers support `--require-approvals` for downstream gate runs. The approval is valid only
when the ledger entry matches the gate, artifact path, status, UTC `approved_at`, and current
artifact hash. Stale hashes fail. No ticketing system is required.

See [docs/approval-gates.md](docs/approval-gates.md).

## Tests And Verification

Test responsibility is split by artifact:

- Specs define `AT-` acceptance criteria at product/system, feature/component, and
  slice/change scope; the criteria become narrower as the scope narrows. Specs also define
  `JT-` journey tests for long ordered stories that compose multiple `AT-` scenarios.
- Designs define the test architecture and explicit `TEST-<AREA>-<NAME>` executable test
  obligations for unit, component, contract, integration, UI, journey/e2e, quality,
  docs/build/deploy, migration, and operational checks.
- Designs also define the test environment strategy: developer environment always, plus
  shared integration/test, staging/pre-production, production canary/smoke, and synthetic
  monitoring when context warrants them.
- External systems should be tested against the real dependency or its official conformance
  surface whenever feasible. If a mock, fake, stub, local mirror, or locally re-declared
  interface replaces the real system, the artifacts must flag that as verification risk and
  name the mitigation: real-boundary smoke/integration test, official conformance harness,
  type-conformance check, generated schema/client, vendor sandbox/emulator, captured real
  fixture, or explicit user-approved limitation. A primary integration seam should not be
  covered only by a self-authored double.
- Plans assign `AT-` acceptance coverage, `JT-` journey coverage, and `TEST-` obligations
  to PRs.
- Code writes the executable tests and implementation, and records executable-test
  traceability in `.sdlc/test-traceability.yaml` rather than cluttering test code with
  artifact IDs. This is where unit, component, contract, integration, UI, journey/e2e,
  quality, migration, build/deploy, docs, and operational test implementations are created
  when planned.
- Red/Green TDD is mandatory for behavior-changing code. Narrow exceptions are allowed only
  when planned or explicitly accepted: generated code only, docs-only, formatting-only,
  build/deploy config validation, and characterization before legacy refactor. Each
  exception needs replacement verification evidence.
- Code may also add implementation-local supplemental inner tests discovered during
  Red/Green/Refactor, such as helper, pure-core, parser, mapper, regression,
  characterization, table/property, adapter, or edge-case tests. These supplement, never
  replace, planned `AT-`/`JT-`/`TEST-` coverage; they stay within the current `PR-` and
  Planned Touch Set, map to the nearest trace IDs in `.sdlc/test-traceability.yaml` when
  applicable, and use a concrete oracle.
  If they imply new externally visible behavior, contract, UX/NFR, or scope, revise the
  upstream artifact first.
- Test implementations are reviewed as code in `/code-review` and `/code-assess`: assertions,
  fixtures, helpers, mocks, data, selectors, determinism, readability, maintainability, and
  false-positive/false-negative risk are judged, not just whether the tests pass.
- Every executable test needs a concrete verification oracle: return value, state, persisted
  record, event, API response, DOM/accessibility output, screenshot/visual baseline,
  artifact, structured log, metric, trace, deployment signal, or captured external call as
  appropriate.
- Defect remediation updates upstream artifacts first when the defect reveals missing UX
  quality, unclear boundary contracts, missing logging/telemetry/error-handling intent,
  unrealistic mocks, or other latent spec/design/plan gaps.
- Documentation, logging/telemetry, error-handling, build, and deployment checks are
  assigned through the same spec/design/plan chain and verified during code creation,
  `/code-verify`, or `/code-assess` when planned. The same is true for environment-specific
  checks and context-driven reviews/tests such as performance, security, privacy,
  accessibility, resilience, migration, compatibility, cost, and operational checks.

Use `/code-verify` when you simply want a confidence run after a change: test suite,
coverage, pre-commit/equivalent gates, logging/error-handling checks, build checks,
documentation checks, deployment dry-runs or smoke checks where planned, and `check_code.py`.
Use `/code-review` when you want qualitative judgment. Use `/code-assess` when you want both
in one gate.

The checkers provide deterministic structural evidence:

```powershell
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --json
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
python checkers/check_code.py --plan plan.md --tests-argv '["pytest","-q"]' --cov-min 80 --json
```

If `python` is unavailable, try `python3`, then `uv run python`.

`check_code.py` reads executable-test traceability from `.sdlc/test-traceability.yaml` by
default. Use `--traceability <file>` for a project-specific map location. Use
`--allow-inline-test-traceability` only as a temporary migration flag for older repos that
still carry artifact IDs in test comments or docstrings.
Traceability entries may also include `boundary`, `level`, `uses_double`, `real_boundary`,
and `type_conformance`. If tests for a boundary use a double, at least one test for that
same boundary must be marked as a real-boundary or type-conformance check.
Module size is advisory by default. Use `--enforce-max-loc` only when a project explicitly
opts into a hard module-size gate; otherwise review oversized modules as maintainability
signals and avoid mechanical file splitting.
TODO/FIXME/XXX/skip/xfail markers are surfaced with file, line, marker, and text. Do not
add SDLC-specific annotations to app code. If markers remain, downstream progress requires
explicit human approval through `code.markers.approved`.

The checkers do not prove semantic correctness. Assessment commands pair verification
evidence with qualitative review of requirements, design, plan quality, test implementation
quality, verification-oracle rigor, implementation fitness, logging/error-handling,
documentation/build/deployment
completeness, and upstream/downstream consistency.

## Repository Layout

```text
docs/      user-facing documentation and review notes
prompts/   source stage prompt definitions
skills/    native skill bundles
checkers/  structural verification scripts
scripts/   installers for Windows, macOS, Linux, and WSL
tests/     checker tests
```

Do not treat `.github/prompts` as source in this repository. It is only an install target
for GitHub Copilot project-scoped prompts.

## More Detail

- Overview page: [docs/agent-steered-sdlc.html](docs/agent-steered-sdlc.html)
- Review checklist: [docs/review-verification-checklist.md](docs/review-verification-checklist.md)
- Slug ID migration: [docs/slug-id-migration.md](docs/slug-id-migration.md)
- Approval gates: [docs/approval-gates.md](docs/approval-gates.md)
- Agent-facing repository guidance: [AGENTS.md](AGENTS.md)
