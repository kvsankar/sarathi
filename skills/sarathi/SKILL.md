---
name: sarathi
description: Sarathi is Agent-Steered SDLC for resumable, reviewable software delivery. Use when Codex needs to create, verify, review, assess, or resume an artifact-governed software delivery lifecycle.
---

# Sarathi

Use the installed stage command, prompt, or skill when the host supports one. Treat this
`SKILL.md` as the routing kernel: decide project entry mode, select the next stage, enforce
human gates, and then load only the selected stage prompt and triggered shared docs. If a
stage is not directly invokable, use this skill bundle's `prompts/*.prompt.md` files and
follow the matching prompt exactly once that stage is selected. This skill bundle is
expected to be self-contained: `SKILL.md`, `agents/`, `prompts/*.prompt.md`, `docs/*.md`,
and `checkers/*.py` should be present together. If a required bundled stage prompt or
triggered shared doc is missing, treat the skill installation as incomplete: search the
current workspace and common user skill locations for another `sarathi` bundle
or this repository's matching `prompts/` or `docs/` file, report the incomplete install
clearly, and ask the user to reinstall if no source can be found. Do not silently continue
as though a required prompt or policy doc were optional.

GitHub Copilot CLI note: prompt files do not become arbitrary built-in CLI slash commands.
The installer creates direct stage skill aliases such as `spec-create`, `code-review`, and
`code-assess` so Copilot CLI can invoke `/code-review` where skill slash invocation is
supported. If the CLI surface rejects a stage slash name, ask in natural language instead:
"Use the sarathi skill to run the code-review stage."

Command verbs have distinct meanings:

- `create`: author or revise the artifact.
- `verify`: collect deterministic/mechanical evidence only.
- `review`: make the qualitative adversarial judgment using available evidence.
- `assess`: run `verify` first, then `review`; this is the full gate.

For project entry, progressive disclosure, resumable WIP state, bootstrap instructions,
artifact formatting, cleanup and simplify passes, cross-cutting concerns, and prompt maintenance, prefer
shared source docs in this repository
(`docs/project-entry.md`, `docs/progressive-disclosure.md`, `docs/work-in-progress.md`,
`docs/bootstrap-instructions.md`, `docs/artifact-formatting.md`,
`docs/cleanup-pass.md`, `docs/simplify-pass.md`, `docs/cross-cutting-concerns.md`,
`docs/test-ownership.md`, `docs/work-decomposition.md`,
`docs/feedback-and-learning.md`, and
`docs/process-maintenance.md`) over copying long policy blocks into every stage prompt.

## Instruction Loading

Follow `docs/progressive-disclosure.md`: load the smallest instruction set that can safely
decide the next action, then load deeper instructions only when the selected stage or risk
requires them.

- Always use this `SKILL.md` first for routing, project entry, command selection, and hard
  gates.
- Load `docs/work-in-progress.md` and read `.sdlc/wip.md` when present before choosing or
  running an SDLC stage. Update `.sdlc/wip.md` before every hard stop, blocker report, or
  completed stage handoff.
- Load `docs/project-entry.md` when a repo may be greenfield/brownfield, lacks a recorded
  entry decision, or existing code/artifacts are being adopted or reviewed.
- Load `docs/artifact-formatting.md` before creating or materially revising any Markdown
  artifact or report.
- Load `docs/cleanup-pass.md` during `/code-create`, `/code-review`, `/code-assess`, and
  whenever a stage is about to hand off work that may contain accumulated odd issues.
- Load `docs/simplify-pass.md` during `/spec-create`, `/spec-review`, `/spec-assess`,
  `/design-create`, `/design-review`, `/design-assess`, `/plan-create`, `/plan-review`,
  `/plan-assess`, `/code-create`, `/code-review`, and `/code-assess`, especially before
  handoff after cleanup when both apply.
- Load `docs/srs-authoring.md` during `/spec-create`, `/spec-review`, or `/spec-assess`
  when the user asks for a detailed SRS, when the scope is product/system, when
  brownfield baseline behavior is being reconstructed, or when a structurally valid spec
  may be too terse, over-bundled, weak on use-case flows, or weak on acceptance criteria.
- Load `docs/bootstrap-instructions.md` when offering, adding, updating, or recording a
  project bootstrap instruction in files such as `AGENTS.md` or `CLAUDE.md`.
- Load exactly one selected `prompts/<stage>.prompt.md` when a stage is invoked or chosen.
  Do not preload all stage prompts just because the workflow contains them.
- Load `docs/cross-cutting-concerns.md`, `docs/review-verification-checklist.md`,
  `docs/approval-gates.md`, or checker source/help only when the current stage reaches that
  concern.
- Load `docs/test-ownership.md` when decomposable work carries product/feature acceptance,
  journey, integration, or quality obligations into code-ready descendants.
- Load `docs/work-decomposition.md` when a Breakdown plan creates, reviews, visualizes, or
  implements parent `WORK-*` allocations and child artifact chains.
- Load `docs/feedback-and-learning.md` for plan/code create, review, and assess stages, and
  whenever parallel slices, stakeholder feedback, or post-slice revisions are involved.
- Load `docs/process-maintenance.md` when modifying the SDLC process itself.
- Load `docs/workflow-status.md` and the static `docs/sarathi.html` process guide when
  rendering or explaining the read-only workflow expansion/status page.
- Load `docs/release-process.md` when preparing a Sarathi changelog entry, version bump, or
  release tag.

## Workflow

Before selecting a stage, determine the project entry mode when the repo is not already
operating under a recorded SDLC decision:

- **Greenfield Adoption**: the project starts under this SDLC process. Use the normal
  spec-first sequence.
- **Brownfield Baseline Adoption**: the project already exists and the user wants
  retrospective spec/design creation and review of the current system. A baseline
  `/code-review` may skip `/plan-create` and `/plan-review` only when the decision is
  recorded and the review clearly says it is judging already-written code against
  reconstructed intent. Baseline review is a conformance audit: accepted SRS/design
  artifacts are normative, existing code/tests are evidence, and findings are classified as
  code gaps, test gaps, artifact revisions, or explicit future deltas.
- **Brownfield Delta-Only Adoption**: the project already exists and the user wants SDLC
  control only for new changes. Discover enough baseline context, then create or revise
  slice/change artifacts for the requested delta. Existing behavior outside the delta is
  accepted as baseline unless touched or explicitly reviewed.

Existing specs, designs, plans, ADRs, tickets, tests, docs, CI, or deployment files are
discovered inputs in any mode, not a fourth mode. Classify them as `adopt`, `adapt`,
`supersede`, `background`, or `none_found` according to `docs/project-entry.md`.

Record the user's adoption decision in `.sdlc/process-decisions.yaml` when they choose a
mode, approve an inferred mode, or explicitly accept a plan-skipping retrospective baseline
review. This file records process scope and rationale; `.sdlc/approvals.yaml` remains the
approval attestation ledger.

Maintain `.sdlc/wip.md` as the resumable workflow handoff. At the start of SDLC work, read
it if present and verify important claims against the named artifacts. Create or update it
when SDLC work starts, after material artifact/review/check changes, and before every hard
human gate or blocker stop. Keep it concise, link to artifacts, and never store secrets.
If WIP conflicts with governing artifacts or the user's latest instruction, the governing
artifact or latest instruction wins and WIP should be corrected.

When a project is loaded into the process, offer to add a short bootstrap block to the
project's agent guidance file so future contexts know to load the SDLC process and
`.sdlc/wip.md`. Do not modify `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
`.github/copilot-instructions.md`, `.codex/instructions.md`, or similar bootstrap files
without the user's explicit consent. Record accepted, declined, or deferred bootstrap status
in `.sdlc/wip.md` and, when present, `.sdlc/process-decisions.yaml`.

Select the narrowest command that matches the user's current artifact:

- `/spec-create`: create or revise `spec.md`, including product/system,
  feature/component, and slice/change specs.
- `/spec-verify`: run structural spec checks and report evidence.
- `/spec-review`: qualitatively review requirements and stop if the spec has material issues.
- `/spec-assess`: run `/spec-verify` plus `/spec-review` as the full spec gate.
- `/design-create`: create or revise `design.md`, diagrams, and ADRs from the spec.
- `/design-verify`: run upstream spec and design structural checks.
- `/design-review`: qualitatively review design and stop if upstream spec ambiguity or design risk blocks safe progress.
- `/design-assess`: run `/design-verify` plus `/design-review` as the full design gate.
- `/plan-create`: create `plan.md`, planned touch sets, PR slices, TDD order, and worktree/parallel-work guidance.
- `/plan-verify`: run upstream artifact and plan structural checks.
- `/plan-review`: qualitatively review plan and stop if spec/design issues or planned scope issues block implementation.
- `/plan-assess`: run `/plan-verify` plus `/plan-review` as the full plan gate.
- `/code-create`: implement within the planned touch set using Red/Green/Refactor TDD,
  configured quality gates, planned logging/error-handling work, and planned
  documentation/build/deployment verification.
- `/code-verify`: run tests, coverage, structural code checks, pre-commit/equivalent gates,
  and planned logging/error-handling/build/docs/deployment verification.
- `/code-review`: qualitatively review implementation, tests, traceability, quality gates,
  logging/error-handling fitness, and upstream consistency.
- `/code-assess`: run `/code-verify` plus `/code-review` as the full code gate.
- `/workflow-status`: render deterministic HTML of gates, decomposition, PRs, evidence, and
  explicit learning/feedback state using the linked process guide, without advancing a gate.

`/workflow-status` is a read-only projection command, not an SDLC creation or assessment
stage. It may run at any point, including when only a spec exists. It does not require or
create an approval and does not trigger the post-artifact human gate by itself.

When the user invokes this skill generally instead of naming a specific stage,
operate in human-gated mode by default. Choose and run only the next appropriate SDLC stage.
For creation stages, generate or revise the artifact, run the corresponding `*-assess` gate
when practical, and then stop for human review. Report the artifact path, readiness/status,
key open questions, and the recommended next command. Do not continue automatically to the
next artifact type unless the user explicitly asks for an end-to-end, unattended, or
"continue through all stages" run.

## Hard Human Gates

These gates are mandatory execution stops, not suggestions.

- After creating, materially revising, or reviewing a spec, design, ADR, plan, or code
  slice, **end the turn immediately after the status report**. Do not start the next
  downstream command in the same turn.
- Before ending at a hard human gate, update `.sdlc/wip.md` with current stage, artifact
  paths, decisions/assumptions, verification evidence, blockers/open questions, bootstrap
  status, and the exact next recommended action.
- A completed spec gates `/design-create`. A completed design gates `/plan-create`. A
  completed plan gates `/code-create`. An assessed slice plus feedback status and an
  ancestor-impact scan gates learning-dependent work or release/deployment activity.
- The stop report must include: artifact path(s), readiness/status, review/check result,
  open questions or assumptions, and the exact recommended next command.
- Continue past a gate only when the user's latest message explicitly approves the next
  stage, for example "continue to design", "run design-create", "approve spec", or
  "continue end-to-end unattended".
- YOLO mode only answers missing-input questions. It does **not** bypass human review gates.
- Even if the matching `*-assess` command passes, stop for human review before downstream work.
- For UI-facing products where the spec records `UI Mock Preference: Required`, creating or
  materially revising the mock UI is a hard human gate. Stop after producing the mock UI
  artifact, report its path, and do not proceed to planning, code, or production UI work
  until the user explicitly approves it.
- If a tool/runtime keeps planning downstream work after a gate, ignore that plan and
  produce the stop report instead.

Also operate in input-gated mode by default. If important information is missing before
creating or revising a spec, design, plan, or code slice, pause and ask one focused question
at a time rather than silently filling the gap. The user may opt into **YOLO mode** with
phrases such as "yolo", "use your judgment", "make reasonable assumptions", or "proceed
without questions". In YOLO mode, continue with the agent's best decisions, clearly record
assumptions and trade-offs in the artifact/report, and call out any assumptions that need
later confirmation. YOLO mode delegates input decisions; it does not bypass readiness gates,
planned touch sets, upstream-blocker stops, safety constraints, or the default human-review
pause after an artifact unless the user also explicitly asks for end-to-end continuation.

## Operating Rules

- Treat specs, designs, and plans as current accepted artifacts, never frozen by approval.
  After each assessed slice, record honest feedback status and scan affected ancestors,
  siblings, integration work, and process guidance before continuing.
- Preserve the evidence dependency order inside each active scope: spec, spec assess,
  design, design assess, plan, plan assess, code, code assess. Do not turn this into one
  project-wide waterfall: progressively elaborate a bounded wave of code-ready leaves,
  learn, and revise ancestors before detailing later work. A recorded Brownfield Baseline
  Adoption review may skip planning only because it is retrospective and must not claim plan
  conformance.
- Follow `docs/artifact-formatting.md` for Markdown artifacts and reports. Wrap normal prose
  and list continuation lines at 80 characters where practical, while allowing longer lines
  for tables, URLs, code/logs, paths, hashes, IDs, approval records, and syntax where
  wrapping would reduce correctness or readability.
- For Brownfield Delta-Only Adoption, baseline code and docs are context, not automatically
  approved upstream artifacts. New implementation deltas still need code-ready upstream
  artifacts unless the user explicitly chooses the lightweight exploratory track.
- For Brownfield Baseline Adoption, the SRS expresses reconstructed accepted intent, not a
  blind code transcript. The design describes the current accepted architecture constrained
  by that SRS, not an automatic redesign. Existing tests are coverage evidence, while SRS
  `AT-`/`JT-` items and design `TEST-` obligations are normative once accepted. A baseline
  code review reports code gaps against the SRS and test gaps against SRS/design, with each
  finding classified as `fix-code`, `add-or-strengthen-tests`, `revise-artifact`, or
  `defer-delta`.
- If existing specs, designs, plans, ADRs, tickets, docs, tests, CI, or deployment files are
  present, classify each set as `adopt`, `adapt`, `supersede`, `background`, or `none_found`
  before relying on it. Only `adopt`ed or `adapt`ed artifacts can satisfy upstream gates.
- After creating or materially revising any spec, design, ADR, plan, code slice, or review
  report, pause for human review before starting the next downstream stage. The pause is a
  hard collaboration boundary, even when the generated artifact passes mechanical checks.
- Use `.sdlc/approvals.yaml` as the hash-current local attestation ledger and run downstream
  checkers with `--require-approvals`; do not require the approval being drafted. Follow
  `docs/approval-gates.md` for fields and gate names. The ledger does not prove human intent,
  identity, external consent, correctness, or end-user feedback; expose its source.
- Approval permits the next learning step. Consider available appropriate feedback and
  record missing feedback separately; approval never freezes an artifact.
- When the user explicitly approves an artifact or mock, create or update the matching
  ledger record immediately with the matching gate, current file SHA-256, and current UTC
  timestamp ending in `Z`. Use `status: auto-approved` only when `.sdlc/gates.yaml` allows
  that gate and scope.
- When `/code-assess` returns `Pass` for a known `WORK-*` item, record it in
  `.sdlc/code-assessments.yaml` against the child plan hash with its explicit learning,
  feedback, and ancestor-impact evidence. This is an assessment claim; only a separate
  `code_slice.approved` record marks the handoff completed.
- Never represent policy-bounded auto-approval as human approval.
- Use the three-scope model: product/system, feature/component, slice/change. Every artifact
  should declare Implementation Readiness as Exploratory, Decomposable, or Code-ready.
  Parent artifacts may pass as Decomposable; `/code-create` must only proceed from a
  code-ready implementation plan for a slice/change or sufficiently small feature/component.
- Treat `WORK-*` as a parent Breakdown-plan allocation, never as an artifact type or code
  level. Product plans normally allocate feature/component children; feature plans normally
  allocate slice/change children. Cross-feature integration or acceptance work may allocate
  directly to a slice/change child. Every allocation names parent scope, child scope,
  inherited obligations, and required child artifact chain before implementation.
- Prefer intra-slice parallelism. Independent slices need a bounded wave with dependency
  types, WIP cap, checkpoints, convergence owner, and stop/replan triggers. Speculative
  downstream work is reversible and timeboxed; agent availability proves no independence.
- Use slug-only IDs. Specs and plans use `KIND-AREA-NAME`, for example
  `FR-AUTH-SIGNIN`, `AT-AUTH-SIGNIN`, `JT-AUTH-ONBOARDING`, and `PR-AUTH-SIGNIN`.
  Design entities use `KIND-SLUG`, for example `COMP-AUTH` and `IFACE-AUTH`. Design test
  obligations use `TEST-AREA-NAME`, for example `TEST-AUTH-POLICY`. Numeric suffixes such
  as `FR-AUTH-10` are invalid.
- Design artifacts preserve machine-checkable IDs without making prose or diagrams hard to
  read. Human-facing layer/component/interface headings and primary bullets use readable
  display names first, not trace IDs. Put exact IDs in `sarathi:entity` Markdown
  annotations, collapsed Machine-readable trace anchors, compact Design ID Glossaries,
  traceability matrices, test obligations, decision/risk identifiers, and required
  owner/cross-reference fields. Diagrams use readable rendered labels as primary text;
  Mermaid node IDs may encode stable IDs, but rendered labels should not be ID-only.
- Infer the likely scope from the user's request and state it explicitly. Broad
  product/platform/app requests map to product/system, one capability/subsystem maps to
  feature/component, and bug fixes, PR-sized changes, or local behavior deltas map to
  slice/change. Ask only when the mapping is ambiguous or materially changes the artifact.
- Apply the artifact matrix:
  - Product/system spec carries mission, stakeholders, boundary, product needs, non-goals,
    major capabilities, representative use cases, major NFRs, logging/telemetry and
    error-handling expectations, UI mock preference for UI-facing products,
    build/release/deployment expectations, user/developer documentation expectations, broad
    acceptance intent, and child-artifact needs; design
    carries HLD context, major containers/services/modules, drivers, boundaries, data
    ownership, quality tactics, mock UI artifact/approval when required, logging/telemetry
    strategy, error-handling strategy, build/package/release strategy, deployment/
    operations, documentation strategy, ADRs, risks, and decomposition candidates; plan is
    normally a Breakdown plan with feature/component `WORK-` allocations, explicit child
    scopes and child artifact chains, dependencies, mock approval, logging/error-handling
    tracks, build/deployment tracks, documentation tracks, parallel tracks, and readiness
    targets.
  - Feature/component spec carries parent references, local behavior, FR/NFR/AT/JT
    coverage, edge cases, UI mock preference, logging/telemetry and error-handling constraints,
    build/deployment constraints, documentation constraints, dependencies, and non-goals;
    design carries responsibilities, contracts, local state/data, runtime flows, core/shell
    split, dependencies, mock UI artifact/approval when required, logging/error-handling
    impacts, build/deployment impacts, documentation impacts, decisions, risks, and explicit
    `TEST-` obligations; plan carries child slice/change work allocations or PRs and
    integration order; child allocations name slice/change scope and required artifact chains;
    `AT-`/`JT-`/`TEST-` allocation, mock approval, logging/error-handling allocation,
    build/deployment allocation, documentation allocation, and touch-scope risks.
  - Slice/change spec carries the exact requirement delta, parent IDs refined/preserved,
    changed/unchanged behavior, UI mock preference/delta, logging/error-handling deltas,
    documentation deltas, and acceptance/journey criteria; design carries LLD-level local changes,
    API/schema/data deltas, failure paths, validation/policy logic, mock UI artifact/
    approval when required, logging/telemetry changes, build/deployment script or artifact
    changes, documentation changes, migration/rollback, side effects, `TEST-` obligations/
    doubles, and likely touch candidates;
    plan carries concrete `PR-` items, Planned Touch Sets, Red/Green steps,
    `AT-`/`JT-`/`TEST-` allocation, LOC estimates, quality gates, mock approval,
    logging/error-handling verification,
    build/deployment verification, documentation checks, rollback, dependencies, and
    worktree guidance.
- Treat test ownership as part of artifact ownership: specs define `AT-` acceptance
  criteria at product/system, feature/component, and slice/change scope, and `JT-` journey
  tests for long ordered stories that compose multiple `AT-` scenarios; designs define
  explicit `TEST-` executable test obligations for lower-level, workflow, and journey
  checks; plans assign each `AT-`, `JT-`, and `TEST-` to PRs or child work; code writes
  acceptance and journey tests plus the planned `TEST-` obligations using TDD. Code may also add implementation-local
  supplemental inner tests discovered during Red/Green/Refactor, such as helper, pure-core,
  parser, mapper, regression, characterization, table/property, adapter, or edge-case
  tests. These supplement, never replace, planned `AT-`/`JT-`/`TEST-` coverage. They must
  stay within the current `PR-` and Planned Touch Set, map to the nearest `PR-` plus
  relevant `FR-`/`AT-`/`JT-`/`TEST-`/`COMP-` in `.sdlc/test-traceability.yaml` when
  applicable, and use a concrete oracle. Treat the traceability file as a structured local
  claim that reviewers must spot-check against test bodies and oracles. Keep artifact IDs
  out of test names, docstrings, and comments unless the project explicitly adopts inline
  metadata. If a supplemental test
  implies new externally visible behavior, a changed contract, a UX/NFR expectation, or
  broader scope, stop and revise the spec/design/plan before coding it. Executable tests are
  implementation code: their verification oracles, assertions, fixtures, helpers, mocks,
  data, selectors, determinism, and maintainability must be reviewed in `/code-review` and
  `/code-assess`, not merely executed in `/code-verify`. Every test should have a concrete
  oracle for pass/fail: return value, state, persisted record, event, API response,
  DOM/accessibility output, screenshot/visual baseline, artifact, structured log, metric,
  trace, deployment signal, or captured external call as appropriate.
- Treat external-system doubles as verification risk. Prefer tests against the real
  dependency or official conformance surface. If a mock, fake, stub, local mirror, or
  locally re-declared interface replaces the real external system, the spec/design/plan/code
  evidence must flag the residual risk and tie the double back to reality through a
  real-boundary smoke/integration test, official conformance harness, type-conformance
  check, generated schema/client, vendor sandbox/emulator, captured real fixture, or
  explicit user-approved limitation. Treat `real_boundary` and `type_conformance` fields as
  declarations; verification/review must name the concrete command or test evidence behind
  them. A primary integration seam must not be covered only by a self-authored double unless
  the user explicitly accepts that risk.
- Red/Green TDD is mandatory for behavior-changing code. Narrow exceptions are allowed only
  when planned or explicitly accepted: generated code only, docs-only, formatting-only,
  build/deploy config validation, and characterization before legacy refactor. Generated
  output must not be hand-edited; docs/format/config exceptions need their replacement
  verification checks; characterization tests may pass first only to pin existing legacy
  behavior before refactoring. Any intentional behavior change returns to normal Red/Green.
- Run a general cleanup pass at suitable handoff points, and always before ending a
  `/code-create` code slice. The pass looks for odd issues in touched code, tests, docs,
  config, and traceability: dead code, debug leftovers, stale comments, duplication, brittle
  tests, misleading claims, and test/security/observability/traceability theater. Fix
  in-scope issues within the planned touch set, rerun affected checks, and report any
  out-of-scope cleanup as a follow-up or upstream artifact revision need.
- Run a simplify pass after cleanup when both apply, and before handoff for specs, designs,
  plans, and code slices. Remove over-engineered requirements, layers, abstractions,
  extension points, fixtures, checks, or code paths that are not justified by accepted
  scope, risk, constraints, or evidence. Preserve necessary detail and reviewability; if
  simplification changes accepted behavior, contracts, UX, NFRs, deployment posture, or
  public docs, stop for governing artifact revision instead of hiding the change.
- Treat build and deployment ownership as part of artifact ownership: specs define
  externally relevant build/release/deployment needs or non-goals; designs define artifact,
  package, release, environment, deployment, validation, smoke, and rollback strategy; plans
  assign build/deployment files and checks to work items or PRs; code runs the planned build
  and deployment validation, without live production deployment unless explicitly requested.
- Treat test environments as part of artifact ownership: specs capture externally relevant
  environment needs or non-goals; designs always define a developer test environment and
  recommend shared integration/test, staging/pre-production, production canary/smoke, or
  synthetic-monitor environments when risk warrants them; plans assign setup, data/secrets,
  reset/cleanup, validation, smoke/canary/rollback, and ownership; code runs planned
  environment checks and never runs live production checks without explicit approval.
- Treat context-driven concern scanning as part of every phase. Based on domain, data,
  users, integrations, platform, scale, deployment model, and operational risk, surface
  likely performance/load, security/threat-model, privacy/compliance, accessibility,
  resilience/DR, backup/restore, migration, localization, abuse/fraud/safety, cost,
  compatibility, and operational reviews/tests. Capture them as requirements, tactics,
  `TEST-` obligations, ADRs, risks, PRs, checks, or explicit deferrals. If code/review
  reveals a material unplanned concern, stop for upstream artifact revision.
- Treat user and developer documentation ownership as part of artifact ownership: specs
  define documentation audiences, needs, acceptance criteria, or non-goals; designs define
  documentation architecture, source locations, generated/reference docs, publishing,
  ownership, and validation checks; plans assign documentation files and checks to work
  items or PRs; code updates docs with implementation and validates them where practical.
- Treat UI mock ownership as part of artifact ownership for UI-facing products: specs ask
  the user whether a mock UI is required, optional, not needed, or deferred; designs create
  or update `mock-ui.html` or the repo's established mock location when required, covering
  representative screens, states, flows, and error/empty/loading behavior; plans assign
  mock-driven UI implementation and visual/accessibility checks to PRs; code must block if
  a required mock UI has not been approved by the user.
- Treat logging, telemetry, and error handling as part of artifact ownership: specs define
  externally relevant human/agent/operator diagnostics, privacy/redaction constraints,
  telemetry events/metrics/traces, APM/application-performance signals, error categories,
  user-facing error behavior, and support/debugging needs or non-goals; designs define
  structured logging, correlation IDs, event/metric/trace contracts, APM instrumentation,
  service/resource names, latency/throughput/error/saturation metrics, dashboards,
  SLO/SLI signals, exporter/provider choices such as OpenTelemetry or New Relic, sinks/
  retention, redaction, alert hooks, and layer-specific error mapping/recovery/degradation
  strategy; plans assign that work and verification to PRs; code implements and tests it
  without leaking secrets, stack traces, raw objects, or unstable internals to users, logs,
  APM providers, or agents.
- Treat downstream assessment/review as an upstream validation point. If design, plan, or
  code assessment/review reveals a latent issue in an earlier artifact, stop and tell the user which
  upstream artifact needs revision.
- For defect remediation, reconcile artifacts before treating the work as code-only. If a
  defect exposes missing requirements, unclear boundary contracts, omitted UX quality,
  missing logging/telemetry/error-handling intent, unrealistic tests, or mock drift, update
  the spec/design/plan and record the prevention lesson in the review report, ADR, decision
  log, or retrospective note used by the target repo.
- Use an adversarial review posture. Use fresh-context sub-agents for verification, review,
  assessment, and create-stage self-assessment loops whenever the host exposes sub-agent
  capability. If sub-agents are unavailable and the same agent performs creation and review,
  say the review was not independent and actively seek counterexamples, traceability theater,
  and unverified claims before passing.
- If the host exposes sub-agent capability, split every assessment into two fresh-context
  sub-agent passes. The Mechanical Verifier runs deterministic/structural checkers and
  returns raw command evidence, metrics, IDs, and failures. The Qualitative Reviewer starts
  from the artifact plus mechanical evidence and produces the adversarial judgment,
  upstream blockers, top fixes, and verdict. If sub-agents are unavailable, disclose that
  limitation, state that the result is degraded/non-independent, and keep the verification
  and review sections separate.
- Never stop an assessment at checker JSON. Apply the verification/review checklist:
  - `/spec-verify`: run `check_spec.py`; `/spec-review`: qualitatively review spec quality;
    `/spec-assess`: do both.
  - `/design-verify`: run upstream `check_spec.py` and `check_design.py`; `/design-review`:
    qualitatively review upstream spec fitness and design quality; `/design-assess`: do both.
  - `/plan-verify`: run upstream `check_spec.py`, `check_design.py`, and `check_plan.py`;
    `/plan-review`: qualitatively review upstream fitness and plan quality; `/plan-assess`:
    do both.
  - `/code-verify`: run upstream checkers, `check_code.py`, pre-commit/equivalent gates,
    and planned logging/error-handling/build/docs/deployment/environment/context-driven
    checks; `/code-review`:
    qualitatively review code-readiness, implementation quality, test implementation
    quality, verification-oracle rigor, logging/telemetry/error-handling fitness,
    test-environment execution, context-driven concern verification, TDD evidence, scope
    fidelity, and gate fitness; `/code-assess`: do both.
- Use the lightweight track for spikes, throwaway prototypes, exploratory data/ML work,
  proof-of-concept integrations, or infrastructure investigations. Mark these artifacts
  Exploratory, timebox them, record goal/non-goals/risks/evidence/disposal criteria, and do
  not treat prototype code as production without follow-up code-ready artifacts or explicit
  user acceptance.
- Ask one focused question at a time when required information is missing. In YOLO mode,
  make the narrowest reasonable assumption, proceed, and record the assumption and its risk.
- Offer internet research for spec and design creation when current standards,
  regulations, platform behavior, APIs, or domain facts may matter.
- Keep implementation inside the plan's planned touch set. If code work needs files
  outside that scope, stop and ask the user to update or approve the plan.
- Run deterministic structural checkers after creating, verifying, or assessing artifacts. Prefer the
  checkers bundled in this skill at `checkers/check_*.py`; otherwise use the target
  workspace's `checkers/check_*.py` or this repository's `checkers/check_*.py`. Try `python`
  first, then `python3`, then `uv run python`. If no checker scripts can be found, treat
  that as an incomplete installation or missing project tooling. Report the exact checker
  that is missing, search likely installed skill/workspace locations, and stop for user
  direction or reinstall unless the user explicitly approves a qualitative-only pass.
- Treat checker results as structural evidence, not proof of correctness. The checkers catch
  missing sections, malformed IDs, orphan references, missing trace links, large declared
  PRs, missing Red/Green step text, unlabeled coverage output, missing same-test-block
  assertion trace IDs, large advisory git diffs against the resolved review base, and
  obvious skip/TODO markers. Test traceability should come from
  `.sdlc/test-traceability.yaml`, not artifact ID comments in test code. Treat that file,
  approval ledgers, and boundary flags as structured claims, not proof of semantic
  correctness or human consent. LOC, module size,
  and diff size are reviewability signals, not hard quality gates unless the project
  explicitly opts into `--enforce-max-loc` or a stricter repo standard. Agents must not cut
  useful comments, tests, docs, JSDoc/docstrings, readable structure, or cohesive module
  boundaries merely to fit the target. TODO/FIXME/XXX/skip/xfail markers are rejected unless
  the user explicitly approves them for the current code slice. Do not add SDLC-specific
  annotations to app code. If markers remain, surface their file, line, marker, and text,
  then require `code.markers.approved` keyed to the current marker inventory before
  downstream progress. Git diff-size is reported by default
  in code verify/assess; TDD evidence is required by default. Use allow-missing flags only
  when the repo cannot provide that evidence and the report states the limitation. Red/Green
  text, AT scenario shape, and commit-message TDD evidence are presence checks; they do not
  prove semantic correctness, test implementation quality, or true TDD history. Qualitative
  review must judge those from artifact content, code, tests, and available review/git
  evidence.
- Configure and run language-appropriate local quality gates for code work. Prefer
  repository-native tooling and pre-commit hooks where practical. For code-ready work, also
  run planned build/package commands and deployment dry-run/lint/plan/smoke/rollback checks
  where available, plus planned documentation build/generation/link/readability checks.

## Checkers

Use the bundled or installed `checkers/check_*.py` scripts when present:

- `check_spec.py` for specs.
- `check_design.py` for designs.
- `check_plan.py` for plans.
- `check_code.py` for code/test traceability and quality gates.

If the scripts are missing from the skill bundle, target workspace, and repository fallback,
do not frame deterministic verification as merely unavailable. Report that the SDLC install
or workspace is incomplete, name the missing checker, and ask the user to reinstall or point
you at the checker location. Continue with qualitative-only review only after the user
explicitly accepts that degraded mode, and state the limitation in the report.
