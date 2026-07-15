---
description: Assess a Software Requirements Specification with a deterministic mechanical pass and a qualitative pass grounded in stakeholder needs, use cases, supplementary requirements, logging/error-handling, documentation/build/deploy needs, scope, and traceability.
agent: agent
---

# Spec Assess

## Workflow state

At the start of this stage, follow `docs/work-in-progress.md`: read `.sdlc/wip.md` if it
exists, verify important claims against the named artifacts, and use it only as a resume
note. Before any hard stop, blocker report, or completed stage handoff, update `.sdlc/wip.md`
with the current stage, artifact paths, decisions/assumptions, verification evidence,
blockers/open questions, bootstrap status, and next recommended action. Do not store
secrets or long command logs.

## Artifact formatting

For Markdown artifacts and reports produced or revised in this stage, follow
`docs/artifact-formatting.md`: wrap normal prose and list continuation lines at 80
characters where practical, while allowing longer lines for tables, URLs, code/logs,
paths, hashes, IDs, approval records, and syntax where wrapping would reduce correctness
or readability.

## Simplify pass

Before handoff, follow `docs/simplify-pass.md`: remove over-engineered requirements,
layers, abstractions, extension points, fixtures, checks, or code paths that are not
justified by accepted scope, risk, constraints, or evidence. Preserve necessary detail,
reviewability, traceability, and real boundaries. If simplification would change accepted
behavior, contracts, UX, NFRs, deployment posture, or public docs, stop for governing
artifact revision.

Assess a Software Requirements Specification against the same principles used to write it:
problem-first requirements, stakeholder need fidelity, use-case behavior in context,
supplementary/non-functional requirements, deliberate scope management, and end-to-end
traceability. Produce **two distinct parts**: mechanical verification and qualitative review.

Do not stop after the checker JSON. This assessment must include:

1. Verification A: structural `check_spec.py` evidence.
2. Verification B: qualitative spec assessment.

If the host exposes sub-agent capability, run these as two fresh-context sub-agent passes.
This split is mandatory for assessment stages:

- **Mechanical Verifier sub-agent**: run Verification A and return raw checker evidence.
- **Qualitative Reviewer sub-agent**: read the spec and mechanical evidence, then run
  Verification B adversarially.

If sub-agents are unavailable, state that the host lacks sub-agent capability, mark the
assessment as degraded and non-independent where applicable, and keep the two sections
separate.

Target the spec file the user provides (default `spec.md`). Do not edit it unless asked;
report findings only.

Use an adversarial assessment posture: try to refute the spec, find missing stakeholder needs,
ambiguous behavior, weak acceptance criteria, and traceability theater. If sub-agents are
unavailable and the same agent that created the spec is assessing it, state that the review
half of the assessment is not independent and actively look for counterexamples.

If the user is assessing a **feature/component spec** or **slice/change spec** (a subset,
possibly referencing a parent product spec), add `--feature` and point `--parent` at the product
spec so its IDs are not treated as orphans. Otherwise review the whole product spec.

## Verification A — Mechanical / Deterministic (run the tool)

Run the bundled checker and report its output verbatim. This is a deterministic
**structural** check: it catches section, ID format, orphan-reference, coverage-link,
unit, and banned-word issues. It does not prove requirements are correct, complete, or
semantically well tested; Verification B must judge that.

```pwsh
python checkers/check_spec.py <spec.md> --json
```

For a feature/component or slice/change spec, run: `python checkers/check_spec.py <feature-or-change.md> --feature --parent <product.md> --json`

It exits `0` only if every structural gate passes (non-zero otherwise) and emits metrics:

- **counts** per ID kind (UN/FEAT/UC/FR/NFR/AT/JT).
- **uc_at_coverage_pct** — must be **100%** (every use case ID is referenced by ≥1 AT).
- **fr_at_coverage_pct** — must be **100%** (every functional req ID is referenced by ≥1 AT).
- **uncovered_use_cases / uncovered_frs** — must be empty.
- **orphan_refs** — IDs referenced but never defined.
- **duplicates** — IDs defined more than once.
- **bad_id_format** — IDs that are not slug-only `KIND-AREA-NAME`, including trailing
  numeric IDs such as `FR-AUTH-10`.
- **nfr_missing_units** — NFRs without a number+unit.
- **nfr_unit_mismatches** — NFRs whose obvious quality dimension does not match the unit.
- **ats_missing_scenario_shape** — ATs that do not contain Given/When/Then or an equivalent
  observable/measurable verification shape. This is a presence check; qualitative review
  must still judge whether the acceptance test is meaningful.
- **jts_missing_sequence** — JTs that do not compose multiple `AT-` items in an ordered
  sequence with an observable oracle.
- **vague_hits** — count of "etc.", "and/or", "tbd", "as appropriate", "fast", "easy".
- **gates** + `passed/total`.

If `python` is unavailable or fails because the launcher is missing, retry the same command
with `python3`; if that is unavailable, retry with `uv run python`. Only fall back to manual
checks after all three runners fail, and report the runner failures.
Present the JSON, then the `passed/total` and both coverage percentages. List every
uncovered/orphan/duplicate ID explicitly.

## Verification B — Qualitative

Reasoned judgment, scored 1–5 with one concrete fix each:

- **Problem framing** — mission, system boundary, stakeholders, success criteria, and root
  problem are clear before solution behavior appears.
- **Stakeholder need fidelity** — needs describe stakeholder goals/pains, not features,
  implementation, or UI wishes disguised as needs.
- **Feature derivation and scope control** — features are externally visible, trace to needs,
  and are prioritized or scoped without silent gold-plating.
- **Non-goal quality** — explicit exclusions and deferred work prevent accidental scope creep
  and do not contradict user needs, requirements, or acceptance tests.
- **Simplicity fit** — requirements are no broader or more speculative than accepted intent,
  and roles, NFRs, acceptance criteria, and future behaviors earn their complexity.
- **Change-sized scope control** — slice/change specs are limited to the requirement delta,
  reference parent IDs, and clearly state unchanged parent behavior when the change is internal.
- **Scope and readiness fit** — the spec declares product/system, feature/component, or
  slice/change scope and a realistic Implementation Readiness. Parent specs may pass as
  Decomposable; only slice/change or sufficiently detailed feature/component specs should be
  marked Code-ready.
- **Scope-specific content completeness** — product/system specs carry mission,
  stakeholders, boundaries, product needs, non-goals, capabilities, representative use
  cases, major NFRs, logging/telemetry and error-handling expectations,
  build/release/deployment expectations, broad acceptance intent, user/developer
  documentation expectations, and child-artifact needs; feature/component specs carry
  parent references, local behavior, FR/NFR/AT/JT coverage, dependencies, edge cases,
  logging/error-handling constraints, build/deployment constraints, documentation
  constraints, and non-goals;
  slice/change specs carry the exact requirement delta, parent IDs, changed/unchanged
  behavior, logging/error-handling, build/deployment, and documentation deltas when
  relevant, and code-ready acceptance criteria.
- **Use-case quality** — actors, goals, preconditions, main flow, alternatives/exceptions,
  postconditions, and actor value are complete and behavior-focused.
- **Requirement quality** — FRs are necessary, atomic, feasible, verifiable, unambiguous,
  design-free, and use "shall" consistently.
- **Supplementary/NFR coverage** — performance, security, privacy, reliability, usability,
  accessibility, interoperability, compliance, data, platform, logging/telemetry, error
  handling, build/release/deployment, and operational constraints are considered and
  measurable where applicable.
- **Context-driven missed-concern scan** — given the product domain, users, data,
  integrations, deployment model, and risk profile, the spec has considered likely
  performance/load, security/threat-model, privacy, accessibility, compliance, resilience,
  disaster-recovery, backup/restore, migration, localization, abuse/fraud/safety, cost,
  compatibility, and operational needs. Material concerns are captured as requirements,
  acceptance criteria, non-goals, assumptions, or open questions; otherwise this is a spec
  defect or upstream blocker.
- **UX/presentation quality** — UI-facing work captures baseline styling/layout,
  responsive behavior, accessibility, and readable loading/empty/error/validation states as
  measurable requirements or explicitly scopes them out.
- **Mock UI preference** — UI-facing specs record whether a mock UI is Required, Optional,
  Not needed, or Deferred. If Required, the spec includes a hard human approval gate before
  production UI implementation.
- **Boundary contract quality** — externally visible APIs/events/files/SDKs/CLIs/webhooks
  define success and error shapes that consumers rely on, including validation vs. domain
  error variants when relevant.
- **External system verification quality** — every external dependency names the real
  contract the system must honor: data shape, required fields, errors/exceptions,
  lifecycle/ordering, auth/env/secrets, and version assumptions. At least one acceptance
  criterion should be verifiable against the real system or official conformance surface for
  each material seam. If real-boundary verification is infeasible, the spec must flag that
  as a verification risk. A mock/fake/stub-only acceptance story is a spec defect for a
  primary integration seam unless explicitly waived by the user.
- **Logging and telemetry acceptance** — externally relevant logs, events, metrics, traces,
  audit records, support IDs, correlation IDs, retention, redaction, and debugging signals
  are either expressed as requirements/acceptance criteria or explicitly scoped out. When
  production performance or operations matter, APM/application-performance expectations
  such as latency, throughput, error rate, saturation/resource use, critical spans, trace
  propagation, dashboards, alerts, and SLO/SLI signals are captured or explicitly deferred.
- **Error-handling acceptance** — UI, API, domain, integration, infrastructure, validation,
  authorization, timeout, offline, and unexpected-failure behavior is either expressed as
  requirements/acceptance criteria or explicitly scoped out.
- **Release/deployment acceptance** — externally relevant artifact, environment, promotion,
  rollout, migration, rollback, smoke-check, operator-facing, or uptime constraints are
  either expressed as requirements/acceptance criteria or explicitly scoped out.
- **Documentation acceptance** — externally relevant user guidance, onboarding, help,
  API/developer reference, examples, runbooks, troubleshooting, release notes, migration
  notes, accessibility, freshness, or discoverability needs are either expressed as
  requirements/acceptance criteria or explicitly scoped out.
- **Acceptance quality** — tests are black-box, scenario-based, and verify the linked UC/FR/NFR
  rather than restating the requirement. They are requirements-level acceptance criteria,
  not unit/component/integration test designs.
- **Acceptance granularity by scope** — product/system `AT-` items are broad representative
  acceptance intent, feature/component `AT-` items refine bounded behavior, and
  slice/change `AT-` items are precise enough to map to executable acceptance/e2e/API tests
  or justified non-code verification.
- **Cross-scope test ownership** — product and feature acceptance/journey intent is precise
  enough to survive decomposition and remains available for allocation to executable
  descendant evidence rather than disappearing at the parent boundary.
- **Journey coverage** — critical multi-step stories have `JT-` items that compose multiple
  `AT-` scenarios in order, carry realistic state across steps, and name observable final
  or intermediate oracles. Missing `JT-` coverage for a long workflow is a spec gap unless
  explicitly scoped out.
- **Traceability and change readiness** — need → feature → use case → requirement →
  acceptance → journey links support validation, impact analysis, and future revision.

## Report format

1. Mechanical scorecard (✅/❌ + IDs + totals).
2. Qualitative scorecard (1–5 + fixes).
3. **Top fixes** ranked by impact.
4. **Verdict**: Pass / Pass-with-fixes / Needs rework.

## Human review gate (hard stop)

After reporting the spec assessment verdict, **stop**. Do not start `/design-create` or any
downstream artifact in the same turn. The next stage requires explicit user approval or an
explicit unattended end-to-end instruction in the user's latest message.
