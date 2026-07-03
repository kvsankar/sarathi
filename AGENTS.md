# AGENTS.md

Guidance for AI coding agents working in this repository. The workflow here is
**spec-first**: author a Software Requirements Specification, review it, then build.

## First-class source folders

This is a prompt, skill, and checker repository. Canonical source files live in:

- [docs](docs): user-facing overview pages, including
  [sarathi.html](docs/sarathi.html) and
  [review-verification-checklist.md](docs/review-verification-checklist.md). Numbered-ID
  migration guidance lives in [slug-id-migration.md](docs/slug-id-migration.md). Shared
  concern ownership lives in [cross-cutting-concerns.md](docs/cross-cutting-concerns.md);
  prompt maintenance guidance lives in [process-maintenance.md](docs/process-maintenance.md).
- [prompts](prompts): reusable stage prompt definitions. Some host tools expose these as
  slash commands; others expose them as prompt files, skills, or natural-language stages.
- [skills](skills): native skill bundles such as `sarathi`.
- [checkers](checkers): deterministic structural verification scripts used by the prompts.
  Shared checker section schemas live in [checkers/schemas.py](checkers/schemas.py).
- [scripts](scripts): installers for Windows, macOS, and WSL/Linux targets.

Do not treat `.github` as the source location in this repository. `.github/prompts`
is only an installation target for GitHub Copilot inside product workspaces.

## Stage prompts and commands

Source command prompts live in [prompts](prompts). Command verbs are deliberately split:

- `create`: author or revise the artifact.
- `verify`: collect deterministic/mechanical evidence only.
- `review`: make the qualitative adversarial judgment using available evidence.
- `assess`: run `verify` first, then `review`; this is the full gate.

- **`/spec-create`** — [prompts/spec-create.prompt.md](prompts/spec-create.prompt.md)
  Interviews the user one question per turn, then writes a requirements-engineering
  grounded SRS. Supports product/system, feature/component, and slice/change specs.
  Writes `spec.md` in the target product workspace unless another file is named.
- **`/spec-verify`** — [prompts/spec-verify.prompt.md](prompts/spec-verify.prompt.md)
  Runs deterministic structural spec checks and reports evidence only.
- **`/spec-review`** — [prompts/spec-review.prompt.md](prompts/spec-review.prompt.md)
  Qualitatively reviews spec quality using available verification evidence.
- **`/spec-assess`** — [prompts/spec-assess.prompt.md](prompts/spec-assess.prompt.md)
  Runs `/spec-verify` plus `/spec-review` as the full spec gate.
- **`/design-create`** — [prompts/design-create.prompt.md](prompts/design-create.prompt.md)
  Interviews the user one question per turn, then writes a Software Design Document
  grounded in requirements, design profiles, functional-core/imperative-shell separation,
  trade-offs, ADRs, quality attributes, interfaces, tests, and risks. Writes `design.md`
  plus a `design.html` companion in the target product workspace. Supports HLD,
  feature/component design, and slice/change LLD.
- **`/design-verify`** — [prompts/design-verify.prompt.md](prompts/design-verify.prompt.md)
  Runs upstream spec and design structural checks and reports evidence only.
- **`/design-review`** — [prompts/design-review.prompt.md](prompts/design-review.prompt.md)
  Qualitatively reviews design quality and upstream spec fitness.
- **`/design-assess`** — [prompts/design-assess.prompt.md](prompts/design-assess.prompt.md)
  Runs `/design-verify` plus `/design-review` as the full design gate.
- **`/plan-create`** — [prompts/plan-create.prompt.md](prompts/plan-create.prompt.md)
  Interviews the user one question per turn, then writes a work plan that slices spec +
  design into reviewable, Red/Green TDD pull requests with advisory LOC targets, including
  Planned Touch Sets, logging/error-handling work, documentation/build/deployment work, and
  parallel/worktree guidance. Writes `plan.md` in the target product workspace.
- **`/plan-verify`** — [prompts/plan-verify.prompt.md](prompts/plan-verify.prompt.md)
  Runs upstream artifact and plan structural checks and reports evidence only.
- **`/plan-review`** — [prompts/plan-review.prompt.md](prompts/plan-review.prompt.md)
  Qualitatively reviews plan readiness, slicing, test allocation, touch sets, and sequencing.
- **`/plan-assess`** — [prompts/plan-assess.prompt.md](prompts/plan-assess.prompt.md)
  Runs `/plan-verify` plus `/plan-review` as the full plan gate.
- **`/code-create`** — [prompts/code-create.prompt.md](prompts/code-create.prompt.md)
  Implements the plan PR-by-PR with strict Red/Green/Refactor TDD; tests reference the
  FR/AT/JT/COMP/TEST and PR they cover, suite stays green at each PR boundary, and language-aware
  pre-commit/local quality gates plus planned logging/error-handling/documentation/build/
  deployment checks are configured and run.
- **`/code-verify`** — [prompts/code-verify.prompt.md](prompts/code-verify.prompt.md)
  Runs tests, coverage, upstream structural checks, `check_code.py`,
  pre-commit/equivalent gates, and planned logging/error-handling/build/docs/deployment checks.
- **`/code-review`** — [prompts/code-review.prompt.md](prompts/code-review.prompt.md)
  Qualitatively reviews implementation, tests, logging/error-handling, docs,
  build/deployment work, upstream artifact fitness, TDD evidence, planned scope, and
  quality-gate fitness.
- **`/code-assess`** — [prompts/code-assess.prompt.md](prompts/code-assess.prompt.md)
  Runs `/code-verify` plus `/code-review` as the full code gate.

## Test responsibility by command

- `/spec-create` writes `AT-` acceptance tests as requirements-level, black-box acceptance
  criteria in the spec. Specs write `AT-` items at product/system, feature/component, and
  slice/change scope, but the granularity should narrow as the scope narrows. Specs also
  write `JT-` journey tests for long ordered stories that compose multiple `AT-` scenarios.
  These are not executable unit/component/integration tests.
- `/design-create` defines the test architecture and explicit `TEST-<AREA>-<NAME>`
  executable test obligations: acceptance/e2e/journey, unit/pure-core, component, contract,
  integration, UI/accessibility/visual, quality-attribute, migration, build/deploy, docs,
  and operational checks as applicable. External-system mocks, fakes, stubs, local mirrors,
  or locally re-declared interfaces are verification risks and must be tied to
  real-boundary, official-conformance, type-conformance, generated-schema/client,
  sandbox/emulator, captured-real-fixture, or explicit user-approved mitigation.
- `/plan-create` assigns those test obligations to PRs. Each `AT-` must map to an
  executable acceptance/e2e/API workflow test PR or justified non-code verification, each
  `JT-` must map to an executable journey/e2e/API workflow test PR or justified non-code
  verification, and each design `TEST-` obligation must map to the PR or child work item
  that writes/runs it.
  Boundary-facing PRs must name the shared fixture/schema/generated-client/contract source
  used to prevent mock drift; if a real external system cannot be used in tests, the plan
  must flag the verification risk and name the mitigation or user-approved limitation.
  UI-facing PRs must assign UX/presentation checks or scope them out.
- `/code-create` writes executable tests using Red/Green/Refactor: acceptance tests for
  assigned `AT-` items, journey tests for assigned `JT-` items, plus the planned `TEST-`
  obligations. This is where unit, component, contract, integration,
  UI/accessibility/visual, quality/NFR, migration, build/deploy, docs, and operational test
  implementations are written when planned.
- Red/Green TDD is mandatory for behavior-changing code. Narrow exceptions are allowed only
  when planned or explicitly accepted: generated code only, docs-only, formatting-only,
  build/deploy config validation, and characterization before legacy refactor. Each
  exception must carry replacement verification evidence.
- For external systems, prefer tests against the real dependency or its official conformance
  surface. A test double is a liability until something ties it to reality. A primary
  integration seam must not be covered only by a self-authored double unless the user
  explicitly accepts the residual verification risk. Treat `real_boundary` and
  `type_conformance` traceability fields as declarations; verification/review must name the
  concrete command or test evidence behind them.
- `/code-create` records executable-test traceability in `.sdlc/test-traceability.yaml`.
  Test names, docstrings, and comments should stay behavior-focused and should not carry
  artifact IDs unless the project explicitly adopts inline metadata. Treat the traceability
  file as a structured local claim that reviewers must spot-check against test bodies and
  oracles.
- `/code-create` may also add implementation-local supplemental inner tests discovered
  during Red/Green/Refactor, such as helper, pure-core, parser, mapper, regression,
  characterization, table/property, adapter, or edge-case tests. These supplement, never
  replace, planned `AT-`/`JT-`/`TEST-` coverage; they must map to the nearest `PR-` plus
  relevant `FR-`/`AT-`/`JT-`/`TEST-`/`COMP-` in `.sdlc/test-traceability.yaml` when
  applicable, stay inside the Planned Touch Set, and use a concrete oracle. If they imply
  new user-visible behavior, a changed contract, a UX/NFR expectation, or broader scope,
  stop and update the upstream artifacts first.
- Verify and assess commands verify the same ownership chain. Review and assess commands
  stop if a downstream artifact exposes missing or incorrect upstream test intent.
- Test implementations are code and are reviewed as code. `/code-review` and
  `/code-assess` must judge verification oracles, assertions, fixtures, helpers, mocks,
  data, selectors, determinism, readability, maintainability, and
  false-positive/false-negative risk, not only whether the suite ran. Every test needs a
  concrete oracle for pass/fail, such as return value, state, event, API/DOM output,
  screenshot, artifact, log, metric, trace, deployment signal, or external call.
- Defect remediation is artifact-first when the defect exposes missing requirements, unclear
  boundary contracts, omitted UX quality, unrealistic tests, or mock drift. Update the
  governing spec/design/plan and record the prevention lesson in the review report, ADR,
  decision log, or retrospective note used by the target repo.

## Build and deployment responsibility by command

Build artifacts and deployment are first-class SDLC concerns. Do not defer them to the end
unless the artifact explicitly scopes them out.

- `/spec-create` captures externally relevant build, release, deployment, environment,
  rollout, rollback, migration, smoke-check, and operational acceptance needs as requirements
  or non-goals.
- `/design-create` defines the build/package/release architecture: deployable artifacts,
  CI/CD or release workflow, artifact storage, environments, configuration/secrets,
  promotion, deployment topology, migrations, rollout/rollback, validation, smoke checks,
  and ownership.
- `/plan-create` assigns build/deployment work to child `WORK-` items or PRs: build scripts,
  package manifests, generated outputs, CI/CD config, IaC/manifests, migration scripts,
  deployment dry runs, smoke checks, rollback checks, and release docs.
- `/code-create` implements and verifies the planned build/deployment work. It runs the
  build/package command, verifies the expected artifact, validates deployment scripts or
  manifests with dry-run/plan/lint/smoke checks where possible, and avoids live production
  deployment unless explicitly requested.
- Review commands check the same chain and stop with an upstream blocker when build or
  deployment intent is missing from the artifact that should own it.

## Test environment responsibility by command

Test environments are first-class confidence decisions. Do not assume one local test run is
enough when the product context points to integration, staging, canary, or production-smoke
risk.

- `/spec-create` captures externally relevant environment needs or non-goals when they
  affect acceptance, release safety, data, integrations, or operations.
- `/design-create` always defines the developer test environment and recommends additional
  environments when justified: shared integration/test, staging or pre-production,
  production canary/smoke, and synthetic monitoring. Record purpose, realism, data/secrets,
  external dependency mode, isolation/reset, owner, cost/risk, deployment validation, smoke/
  canary/rollback checks, and linked `TEST-` obligations.
- `/plan-create` assigns environment setup, configuration, data/secret handling, reset/
  cleanup, validation commands, and ownership to child `WORK-` items or PRs.
- `/code-create` runs or implements the planned environment checks. It must not run live
  production checks unless the user explicitly approves them.
- Review commands check the same chain and stop with an upstream blocker when a needed
  environment strategy or allocation is missing.

## Context-driven concern scan by command

Every phase should ask what the context implies beyond the user's initial wording. Depending
on domain, data sensitivity, users, integrations, platform, scale, deployment model, and
operational risk, agents should surface dedicated performance/load tests, security review or
threat modeling, privacy/compliance review, accessibility audit, resilience/DR or backup/
restore checks, migration rehearsal, localization review, abuse/fraud/safety review, cost
guardrails, compatibility tests, or operational reviews.

- `/spec-create` captures material concerns as requirements, acceptance criteria, non-goals,
  assumptions, or open questions.
- `/design-create` turns material concerns into tactics, `TEST-` obligations, ADRs, risks,
  or explicit deferrals.
- `/plan-create` assigns the resulting reviews/tests to work items or PRs.
- `/code-create` verifies the planned checks and stops for upstream revision if
  implementation reveals a material concern that was not planned.
- Review commands explicitly ask what important concern might be missing given the context.

## User and developer documentation responsibility by command

User and developer documentation are also first-class SDLC concerns. Do not leave them as a
last-minute README cleanup when users, developers, operators, support, auditors, or
integrators depend on them.

- `/spec-create` captures documentation audiences, tasks, discoverability,
  localization/accessibility, onboarding, API/reference, support, runbook, release-note, and
  acceptance needs as requirements or non-goals.
- `/design-create` defines the documentation architecture: information architecture, source
  locations, generated vs. hand-written docs, API/reference generation, examples, diagrams,
  publishing/versioning, ownership, review triggers, and validation checks.
- `/plan-create` assigns documentation work to child `WORK-` items or PRs: user guides,
  in-product help, README/API docs, examples, runbooks, troubleshooting, migration notes,
  release notes, generated reference docs, and doc build/link/accessibility checks.
- `/code-create` implements and verifies planned documentation work. It updates docs with
  the code, validates generated/reference docs and examples where practical, and avoids
  documenting unimplemented future behavior as current behavior.
- Review commands check the same chain and stop with an upstream blocker when documentation
  intent is missing from the artifact that should own it.

## Logging, telemetry, and error handling responsibility by command

Logging, telemetry, and error handling are first-class SDLC concerns for humans, agents,
debugging, support, and operations. Do not leave them as incidental implementation details.

- `/spec-create` captures externally relevant diagnostics, telemetry, support/debugging
  needs, application performance monitoring, privacy/redaction constraints, user-facing
  error behavior, and boundary error contracts as requirements or non-goals.
- `/design-create` defines structured logging, correlation IDs, event/metric/trace
  contracts, APM instrumentation, service/resource names, latency/throughput/error/
  saturation metrics, dashboards, SLO/SLI signals, exporter/provider choices such as
  OpenTelemetry or New Relic, sinks, retention/redaction, alert hooks, and layer-specific
  error mapping, recovery, retry, fallback, and degradation strategy.
- `/plan-create` assigns logging, telemetry, and error-handling work to child `WORK-` items
  or PRs, including APM setup, dashboards/alerts, representative failure-path tests, and
  verification oracles.
- `/code-create` implements and verifies the planned diagnostics and error handling without
  leaking secrets, stack traces, raw objects, or unstable internals to users, logs, APM
  providers, or agents.
- Review commands check the same chain and stop with an upstream blocker when logging,
  telemetry, or error-handling intent is missing from the artifact that should own it.

## UI mock responsibility by command

Mock UIs are first-class gates for UI-facing products when the user wants them.

- `/spec-create` asks whether a mock UI is Required, Optional, Not needed, or Deferred, and
  records the answer in the spec.
- `/design-create` creates or updates `mock-ui.html` or the repo's established mock artifact
  when the spec says `UI Mock Preference: Required`.
- `/plan-create` references the approved mock artifact for UI-facing PRs.
- `/code-create` blocks production UI implementation when a required mock is missing or not
  explicitly approved.
- Review commands check the same chain and stop with an upstream blocker when required mock
  approval is missing.

## Work scope and readiness

Commands use a deliberately small work hierarchy:

- **Product/system**: broad problem, system boundary, major capabilities, HLD. Usually not
  code-ready.
- **Feature/component**: coherent user-facing feature, component, subsystem, or integration.
  May need child slices before implementation.
- **Slice/change**: smallest implementable unit, normally PR-sized or a small PR cluster.
  This is the usual code-ready scope.

Artifacts declare `Implementation Readiness: Exploratory | Decomposable | Code-ready`.
Parent specs/designs/plans may pass review or assessment while Decomposable; that means the
next step is a breakdown plan, child spec, LLD, ADR/interface contract, or implementation
plan. `/code-create` must block unless it has a code-ready implementation plan for a
slice/change or sufficiently small feature/component.

## ID format

Specs and plans use descriptive slug-only IDs: `KIND-AREA-NAME`, for example
`FR-AUTH-SIGNIN`, `AT-AUTH-SIGNIN`, `JT-AUTH-ONBOARDING`, and `PR-AUTH-SIGNIN`. Design
entities keep the shorter `KIND-SLUG` form, for example `COMP-AUTH` and `IFACE-AUTH`.
Design test obligations use `TEST-AREA-NAME`, for example `TEST-AUTH-POLICY`. Numeric
suffixes such as `FR-AUTH-10` are invalid and should be migrated using
[docs/slug-id-migration.md](docs/slug-id-migration.md).

Design artifacts must preserve machine-checkable IDs without making prose or diagrams hard
to read. Human-facing layer/component/interface headings and primary bullets use readable
display names first, not trace IDs. Put exact IDs in `sarathi:entity` Markdown annotations,
collapsed Machine-readable trace anchors, compact Design ID Glossaries, traceability
matrices, test obligations, decision/risk identifiers, and required owner/cross-reference
fields. Diagrams use readable rendered labels as primary text; Mermaid node IDs may encode
stable IDs, but rendered labels should not be ID-only.

## Lightweight track

For spikes, throwaway prototypes, exploratory data/ML work, proof-of-concept integrations,
or infrastructure investigations where full SDLC ceremony would create more noise than
signal, use a documented lightweight track instead of bypassing the process silently:

- Record the work as `Implementation Readiness: Exploratory`.
- Write a short spike note or lightweight plan with goal, timebox, assumptions, non-goals,
  risks, experiment steps, disposal/productionization criteria, and what evidence would
  justify moving into the normal spec/design/plan/code flow.
- Do not mark lightweight artifacts Code-ready and do not treat prototype code as production
  implementation unless a follow-up slice/change spec, design/LLD, and implementation plan
  are created or explicitly accepted by the user.

## Brownfield baseline adoption semantics

Brownfield baseline adoption reconstructs accepted intent; it is not a blind transcript of
current code. The SRS expresses reconstructed accepted intent from specs, docs, tests, code,
and user clarification. The design describes the current accepted architecture constrained
by that SRS; adoption may name risks and improvement candidates, but redesign requires an
explicit user-approved delta. Existing tests are evidence, while SRS `AT-`/`JT-` items and
design `TEST-` obligations are normative once accepted.

A planless baseline `/code-review` is a baseline conformance audit, not a generic code
review. It reports code gaps against SRS behavior and test gaps against SRS/design
obligations. Classify each finding as `fix-code`, `add-or-strengthen-tests`,
`revise-artifact`, or `defer-delta`.

## Verification, review, and assessment independence

Review prompts must be run with an adversarial posture. Use fresh-context sub-agents for
verification, review, and assessment whenever the host exposes sub-agent capability. If a
host lacks sub-agent capability and the same agent performs creation and review, it must say
that review was not independent and actively look for counterexamples, missing upstream
changes, traceability theater, and unverified claims before passing.

If the host exposes sub-agent capability, split every assessment into two fresh-context
sub-agent passes:

- **Mechanical Verifier**: runs deterministic/structural checkers and returns raw command
  evidence, metrics, IDs, and failures.
- **Qualitative Reviewer**: starts from the artifact plus mechanical evidence and produces
  the adversarial judgment, upstream blockers, top fixes, and verdict.

If sub-agents are unavailable, disclose that limitation, state that the result is
degraded/non-independent, and still keep the mechanical and qualitative sections separate.

## Verification and review checklist

Every assessment must pair structural/mechanical evidence with qualitative review. If the
host exposes sub-agent capability, use the two fresh-context sub-agent passes above. Do not
stop after checker JSON. The canonical checklist is
[docs/review-verification-checklist.md](docs/review-verification-checklist.md):

| Assessment | Mechanical verification | Qualitative review |
| --- | --- | --- |
| `/spec-assess` | `/spec-verify`: `check_spec.py` on the target spec. | `/spec-review`: spec quality, problem framing, needs, non-goals, scope/readiness, use cases, requirements, NFRs, acceptance tests, UI mock preference, external contracts and real-boundary testability, logging/error-handling intent, build/deployment intent, documentation intent, context-driven missed concerns, traceability. |
| `/design-assess` | `/design-verify`: `check_spec.py` on upstream spec, then `check_design.py` on design. | `/design-review`: first judge upstream spec fitness; then judge design quality, UI mock artifact/approval when required, logging/telemetry/APM and error-handling design, build/deployment design, test-environment strategy, context-driven review/test recommendations, documentation design, decisions, risks, external-double verification risk/mitigation, testability, verification-oracle design, and traceability. |
| `/plan-assess` | `/plan-verify`: `check_spec.py` + `check_design.py` on upstream artifacts, then `check_plan.py` on plan. | `/plan-review`: first judge upstream spec/design fitness; then judge plan slicing, TDD, touch sets, test allocation, test-environment allocation, context-driven review/test allocation, verification-oracle allocation, external-double mitigation allocation, UI mock approval allocation, logging/error-handling allocation, build/deployment allocation, documentation allocation, sequencing, and worktrees. |
| `/code-assess` | `/code-verify`: `check_spec.py` + `check_design.py` + `check_plan.py`, `check_code.py`, pre-commit/equivalent gate, and planned logging/telemetry/APM/error-handling/build/docs/deployment/environment/context-driven checks. | `/code-review`: first judge upstream code-readiness; then judge implementation correctness, test implementation quality, verification-oracle rigor, external-double verification risk, mock UI fidelity when required, logging/telemetry/APM and error-handling verification, build/deployment verification, test-environment execution, context-driven concern verification, documentation verification, TDD evidence, scope fidelity, production quality, and quality-gate fitness. |

Agents should infer the likely scope from the user's request and state it explicitly:
broad product/platform/app requests map to Product/system, one capability/subsystem maps to
Feature/component, and bug fixes, PR-sized changes, or local behavior deltas map to
Slice/change. Ask only when the mapping is ambiguous or materially changes the artifact.

## Human-gated skill flow

When the `sarathi` skill is invoked generally instead of a specific stage,
agents should run only the next appropriate SDLC stage by default. After creating or
materially revising any spec, design, ADR, plan, code slice, assessment report, or review
report, stop for human review before starting the next downstream stage, even if mechanical
checks pass.

This is a **hard execution gate**. The agent must end its turn after the stopping response
and must not start the next command in the same turn. A completed spec gates
`/design-create`; a completed design gates `/plan-create`; a completed plan gates
`/code-create`; a completed code slice gates the next code slice or release/deployment
activity.

The stopping response should name the artifact path, readiness/status,
verification/review/assessment result, key open questions, and the recommended next command.
Continue automatically across
multiple artifact stages only when the user's latest message explicitly asks for an
end-to-end, unattended, or "continue through all stages" run. YOLO mode does not bypass this
human-review gate.

The skill and creation commands are also input-gated by default. If important information is
missing before a spec, design, plan, or code slice can be created or revised responsibly,
pause and ask one focused question at a time. The user may opt into **YOLO mode** with
phrases such as "yolo", "use your judgment", "make reasonable assumptions", or "proceed
without questions". In YOLO mode, agents may continue with their best decisions, but must
record assumptions, trade-offs, and risks in the artifact or report. YOLO mode does not
bypass readiness gates, Planned Touch Sets, upstream-blocker stops, safety constraints, or
the default human-review pause after each generated artifact unless the user separately asks
for end-to-end continuation.

## Approval attestation gates

Gate attestations can be made mechanically checkable with project-local YAML files:

- `.sdlc/approvals.yaml` records `gate`, `scope`, artifact `path`, artifact `sha256`,
  `status`, `approved_by`, and UTC `approved_at` timestamps such as
  `2026-07-01T14:32:18Z`.
- `.sdlc/gates.yaml` optionally enables bounded `status: auto-approved` policy for low-risk
  modes such as internal prototypes. Auto-approval must have an expiry, allowed scopes,
  allowed gates, and forbidden gates.

Use checker `--require-approvals` on downstream gate checks. Approval is valid only when the
ledger entry matches the gate and current artifact hash; changed artifacts make approvals
stale. Do not require approvals while drafting the artifact that is about to be reviewed by
the user. The ledger proves only that a local attestation record is well-formed and
hash-current; it does not prove human intent, identity, or external consent. Reports must
make the approval source visible, including any `status: auto-approved` policy use.

When the user explicitly approves an artifact or mock, create or update the matching
approval record immediately. Use `spec.approved` for specs, `design.approved` for designs,
`plan.approved` for plans, `ux.mock.approved` for required mock UI artifacts, and
`code.markers.approved` when TODO/FIXME/XXX/skip/xfail markers remain in the current code
slice, and
`code_slice.approved` for optional code-slice handoffs. Compute the SHA-256 from the current
file bytes and use the current UTC timestamp ending in `Z`. Use `status: auto-approved`
only when `.sdlc/gates.yaml` allows that gate and scope.

Default gate ownership:

- `spec.approved` before downstream design gate checks.
- `design.approved` before downstream plan gate checks.
- `plan.approved` before downstream code gate checks.
- `ux.mock.approved` before planning or production UI work when
  `UI Mock Preference: Required`.
- `code.markers.approved` before downstream progress when TODO/FIXME/XXX/skip/xfail
  markers remain in the current code slice.
- Release/deployment/security/privacy gates must not be auto-approved unless a project
  explicitly defines and accepts that policy.

## Artifact matrix

| Scope | Spec carries | Design carries | Plan carries |
| --- | --- | --- | --- |
| Product/system | Mission, stakeholders, boundary, product needs, non-goals, major capabilities, representative use cases, major NFRs, UI mock preference, logging/telemetry and error-handling expectations, build/release/deployment expectations, user/developer documentation expectations, broad acceptance intent, child-artifact needs. | HLD: context, major containers/services/modules, drivers, boundaries, data ownership, quality tactics, mock UI artifact/approval when required, logging/telemetry strategy, error-handling strategy, build/package/release strategy, deployment/operations strategy, documentation strategy, ADRs, risks, decomposition candidates. | Breakdown plan: milestones, feature/component `WORK-` items, dependencies, required child specs/designs/ADRs, research/decision needs, mock approval, logging/error-handling tracks, build/deployment tracks, documentation tracks, parallel tracks, readiness targets. |
| Feature/component | Parent refs, local goal, actors, concrete behavior, FR/NFR/AT/JT coverage, edge cases, integration/business rules, UI mock preference, logging/telemetry and error-handling constraints, build/deployment constraints, documentation constraints, dependencies, non-goals. | Feature/component design: responsibilities, contracts, local state/data, runtime flows, core/shell split, dependencies, UX/API contracts, mock UI artifact/approval when required, logging/error-handling impacts, build/deployment impacts, documentation impacts, decisions, risks, explicit `TEST-` obligations. | Breakdown or implementation plan: child slice/change work or PRs, child artifact needs, integration order, `AT-`/`JT-`/`TEST-` allocation, mock approval, logging/error-handling allocation, build/deployment allocation, documentation allocation, touch-scope risks. |
| Slice/change | Exact requirement delta, parent IDs refined/preserved, changed and unchanged behavior, edge cases, UI mock preference/delta, logging/error-handling delta, build/deployment delta, documentation delta, executable or justified non-code acceptance/journey criteria. | LLD: touched components/modules, API/schema/data deltas, failure paths, validation/policy logic, mock UI artifact/approval when required, logging/telemetry deltas, error mapping/recovery paths, build/deployment script or artifact changes, documentation changes, migration/rollback, side effects, `TEST-` obligations/doubles, likely touch candidates. | Implementation plan: `PR-` items, Planned Touch Sets, Red/Green steps, `AT-`/`JT-`/`TEST-` allocation, LOC estimates, quality gates, mock approval, logging/error-handling verification, build/deployment verification, documentation checks, rollback, dependencies, worktree guidance. |

## Local quality gates

This repository uses `uv` for tool and environment management. Do not install lint tools
through pre-commit remote hook repositories, npm, pipx, or global package managers.

Install the Git hook in a valid Git checkout with:

```pwsh
uv run pre-commit install
```

Run the configured hooks manually with:

```pwsh
uv run pre-commit run --all-files
```

The local hooks invoke:

- `uv run ruff check` for Python linting.
- `uv run ruff format --check` for Python format checks.
- `uv run pymarkdown --enable-extensions front-matter,markdown-tables -d md013 scan`
  for Markdown linting.

## Mechanical checkers

[checkers/check_spec.py](checkers/check_spec.py) enforces structural spec hygiene:
slug-only `KIND-AREA-NAME` ID format, duplicates, orphan refs, UC→AT and FR→AT reference coverage,
NFR unit presence, obvious NFR unit/quality mismatches, AT scenario shape, JT
sequence/composition, the required external-interface contract section, and banned vague terms.

```pwsh
python checkers/check_spec.py spec.md --json
```

If `python` is unavailable or fails because the launcher is missing, retry the same checker
command with `python3`; if that is unavailable, retry with `uv run python`.

Flags: `--json`, `--feature` (focused feature/component or slice/change mode), `--parent <file>`
(validate refs against a parent spec). Exits non-zero on any gate failure.

[checkers/check_design.py](checkers/check_design.py) enforces structural design hygiene:
ID format, duplicates, orphan refs, component→requirement references, explicit `TEST-`
obligation coverage, single interface ownership, interface-derived dependency cycles, and
banned vague terms. If a design mentions mocked/faked/stubbed or locally mirrored external
interfaces, it must also include drift-risk and real-boundary/type-conformance mitigation
evidence.

```pwsh
python checkers/check_design.py design.md --json
```

If `python` is unavailable or fails because the launcher is missing, retry the same checker
command with `python3`; if that is unavailable, retry with `uv run python`.

Flags: `--json`, `--component` (single-component mode), `--parent <file>` (parent
design), `--spec <file>` (resolve FR/UC/JT refs). Exits non-zero on any gate failure.

[checkers/check_plan.py](checkers/check_plan.py) enforces structural plan hygiene:
slug-only `KIND-AREA-NAME` plan ID format, duplicates, orphan refs, FR/AT/JT/COMP/TEST
reference coverage, advisory PR LOC estimates, Red/Green step text, no forward dependencies,
external-double mitigation allocation, and banned vague terms.

```pwsh
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

If `python` is unavailable or fails because the launcher is missing, retry the same checker
command with `python3`; if that is unavailable, retry with `uv run python`.

Flags: `--json`, `--feature` (focused feature/component or slice/change mode), `--parent <file>`,
`--spec <file>`, `--design <file>`. Exits non-zero on any gate failure.

[checkers/check_code.py](checkers/check_code.py) runs the test suite and enforces structural
code/test hygiene: tests pass, labeled coverage output ≥ threshold, PR-ID and
FR/AT/JT/COMP/TEST traceability, advisory per-module LOC reporting, no unjustified
TODO/FIXME/XXX/skip/xfail markers, external-boundary double-to-reality evidence, and
human-approved remaining markers.

```pwsh
python checkers/check_code.py --plan plan.md --tests-argv '["pytest","-q"]' --cov-min 80 --json
```

If `python` is unavailable or fails because the launcher is missing, retry the same checker
command with `python3`; if that is unavailable, retry with `uv run python`.

Flags: `--json`, `--tests-argv <json-array>`, `--tests <cmd>`, `--tests-shell`,
`--cov-min <n>`, `--tests-dir <dir>`, `--src <dir>`, `--max-loc <n>`,
`--enforce-max-loc`, `--max-diff-loc <n>`, `--diff-base <ref>`,
`--allow-missing-git-evidence`, `--allow-missing-tdd-evidence`, `--traceability <file>`,
`--allow-inline-test-traceability`, `--spec <file>`, `--design <file>`. Test traceability
defaults to `.sdlc/test-traceability.yaml`; inline test traceability is a migration-only
compatibility flag. Git diff-size is reported as advisory reviewability evidence. TDD
evidence is required by default; use the allow flags only when the repository cannot provide
that evidence and the verification/assessment report will state the limitation. Exits
non-zero on any gate failure.

Checker limits: these scripts are deterministic structural gates. They catch missing
sections, malformed IDs, orphan references, missing trace links, large declared PRs,
missing Red/Green step text, unlabeled coverage output, missing same-test-block assertion
trace IDs, large advisory git diffs against the resolved review base, and obvious skip/TODO
markers. Do not add SDLC-specific marker annotations to app code. If markers remain, the
checker surfaces their file, line, marker, and text; downstream progress requires explicit
approval attestation through `code.markers.approved`, keyed to the current marker inventory.
Test traceability should come from
`.sdlc/test-traceability.yaml`, not artifact ID comments in test code. Treat that file,
approval ledgers, and boundary flags as structured claims, not proof of semantic correctness
or human consent. LOC, module size, and
diff size are reviewability signals, not hard quality gates unless the project explicitly
opts into `--enforce-max-loc` or a stricter repo standard. Agents must not cut useful
comments, tests, docs, JSDoc/docstrings, readable structure, or cohesive module boundaries
merely to fit the target. Red/Green text, AT
scenario shape, and commit-message TDD evidence are presence checks; they do not prove
semantic correctness, test implementation quality, or true TDD history. The qualitative
review prompts must judge those concerns from the artifact content, code, tests, and
available review/git evidence.

## Installation

Canonical source prompts live in [prompts](prompts), skills live in [skills](skills),
and checker code lives in [checkers](checkers). Use the install scripts to copy/adapt
them into tool-specific locations.

The default install is **user-scoped** for tools that support user/global commands, so it
applies across projects:

Both dry and real installs print the destination folders for each selected tool before
doing any work.

Preview the install without writing files:

```pwsh
.\scripts\install.ps1 -DryRun
```

```sh
scripts/install.sh --dry-run
```

Run the install:

```pwsh
.\scripts\install.ps1
```

```sh
scripts/install.sh
```

Use project scope when a product workspace should carry its own command copies:

```pwsh
.\scripts\install.ps1 -TargetRoot D:\path\to\product -Scope project
```

```sh
scripts/install.sh --target /path/to/product --scope project
```

On Windows, `install.ps1` also installs the matching WSL targets when WSL is available.
Inside WSL, `install.sh` also installs the matching Windows targets when `powershell.exe`
is available. Use `-NoCrossInstall` or `--no-cross-install` to install only in the current
environment.

Install targets:

- Codex: `<target>/.codex/skills/sarathi` or
  `$CODEX_HOME/skills/sarathi` / `~/.codex/skills/sarathi`, plus
  direct prompt commands in `<target>/.codex/prompts` or `$CODEX_HOME/prompts` /
  `~/.codex/prompts`. Restart Codex, then invoke them as `/prompts:spec-create`,
  `/prompts:design-create`, etc. Codex documents custom prompts as deprecated in favor of
  skills, but this installer writes both so commands are directly accessible.
- GitHub Copilot: user scope installs VS Code user prompt files under
  `%APPDATA%\Code\User\prompts` on Windows, `~/Library/Application Support/Code/User/prompts`
  on macOS, or `${XDG_CONFIG_HOME:-~/.config}/Code/User/prompts` on Linux. It also installs
  the `sarathi` skill under `~/.copilot/skills/sarathi` and
  `~/.agents/skills/sarathi` for Copilot CLI/agent skill loading. Project scope
  installs prompts to `<target>/.github/prompts/*.prompt.md` and skills to
  `<target>/.github/skills/sarathi` plus
  `<target>/.agents/skills/sarathi`. Set `SARATHI_COPILOT_PROMPTS_DIR` to
  override the user prompt folder for another VS Code profile or distribution; legacy
  `AGENT_SDLC_COPILOT_PROMPTS_DIR` remains a fallback. Copilot
  prompt exports are written with `mode: agent` and no `tools:` allowlist, but Copilot CLI
  does not treat prompt files as arbitrary built-in slash commands. The installer therefore
  also creates direct stage skill aliases such as `code-review`, `code-verify`, and
  `code-assess` beside the main skill bundle. After skill install, restart Copilot CLI or
  run `/skills reload`, then verify with `/skills info sarathi` and, where
  supported, `/skills info code-review`.
- Claude Code: `<target>/.claude/commands/*.md` or `~/.claude/commands/*.md`, plus
  the `sarathi` skill under `<target>/.claude/skills/` or `~/.claude/skills/`.
- Gemini CLI: `<target>/.gemini/commands/*.toml` or `~/.gemini/commands/*.toml`.
- Claude and Pi: exported prompt packs under `.ai-prompts/` because they do not expose a
  stable local slash-command folder. The export also includes the `sarathi`
  skill bundle for manual import/adaptation.
- Checkers: copied to `<target>/checkers` unless `--no-checkers` / `-NoCheckers` is used.

Every installed `sarathi` skill bundle should be self-contained: `SKILL.md`,
agent config, bundled `prompts/*.prompt.md`, and bundled `checkers/*.py`. The prompts,
stage skill aliases, and checkers are also installed separately where the host tool or
target workspace expects direct access.

The source bundle at `skills/sarathi` is also expected to be self-contained so
generic skill installers can copy it directly. If an agent reports that stage prompts or
checker scripts are missing, treat that as an incomplete install or stale checkout, not as a
normal qualitative-only mode. Verify that the installed skill contains files such as
`prompts/spec-create.prompt.md` and `checkers/check_spec.py`, then rerun the installer or
refresh the source bundle.

If the target is this commands repository itself, the installer warns because project-local
artifacts such as `.github/prompts` and `checkers` may be written into the source checkout;
that is acceptable for dogfooding, but product installs should pass `-TargetRoot` /
`--target`.

## Repository layout

This repository is for the prompt/checker command definitions themselves. Do not keep
product-specific specs, designs, plans, generated companion HTML, or implementation code at
the root of this command repository.

When using these commands for a real product, run them in that product workspace or create a
sibling workspace under `D:\stellantis\batch-1`. Product artifacts should live there as
`spec.md`, `design.md`, `design.html`, `plan.md`, `plan.html`, source code, tests, and
tooling config.

The previous sample tic-tac-toe product artifacts were moved to
`D:\stellantis\batch-1\ttt-python-from-commands`.
