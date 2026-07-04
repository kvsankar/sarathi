---
description: Qualitatively review a Software Requirements Specification using existing verification evidence where available.
agent: agent
---

# Spec Review

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

Perform the qualitative review of a Software Requirements Specification. This command
judges the substance of the spec; it does not replace `/spec-verify`. If verification
evidence is absent, state that gap and either use the latest supplied evidence or recommend
`/spec-verify`. Use `/spec-assess` when the user wants verification and review together.

Target the spec file the user provides, defaulting to `spec.md`. Do not edit it unless
explicitly asked.

Use an adversarial posture: try to refute the spec, find missing stakeholder needs,
ambiguous behavior, terse or cryptic use cases, over-bundled needs/requirements/acceptance
criteria, weak acceptance criteria, missing non-goals, missing build/deployment
or documentation intent, missing logging/error-handling intent, context-driven concerns the
product likely needs, and traceability theater.
If the host exposes sub-agent capability, run this review in a fresh-context Qualitative
Reviewer sub-agent. This is mandatory for review stages. If sub-agents are unavailable,
state that the host lacks sub-agent capability, mark the review as degraded and
non-independent when the same agent created the spec, and actively look for counterexamples.
Load `docs/srs-authoring.md` when reviewing product/system specs, brownfield baseline specs,
or any spec suspected of passing structurally while being too terse to validate.

## Qualitative Review

Score each item 1-5 and give one concrete fix for any score below 5:

- Problem framing: mission, system boundary, stakeholders, success criteria, and root
  problem are clear before solution behavior appears.
- Stakeholder need fidelity: needs describe stakeholder goals and pains, not disguised
  implementation choices.
- Feature derivation and scope control: features trace to needs and avoid silent
  gold-plating.
- Non-goal quality: exclusions and deferred work are explicit and non-contradictory.
- Scope/readiness fit: scope is product/system, feature/component, or slice/change, and
  Implementation Readiness is realistic.
- Simplicity fit: requirements are no broader or more speculative than accepted intent, and
  roles, NFRs, acceptance criteria, and future behaviors earn their complexity.
- Scope-specific completeness: the artifact carries the right level of detail for its
  scope, including build/release/deployment and user/developer documentation intent where
  relevant.
- Use-case quality: primary actor, supporting actors/systems, goal, scope, trigger,
  preconditions, minimal guarantees, success guarantees, numbered main success scenario,
  alternate flows, error/exception flows, postconditions, frequency/importance, trace links,
  and actor value are behavior-focused and complete enough.
- Requirement quality: FRs are necessary, atomic, feasible, verifiable, unambiguous,
  design-free, and use "shall" consistently. Needs, FRs, NFRs, and ATs fail review when
  they bundle unrelated stakeholders, behaviors, qualities, or scenarios.
- Supplementary/NFR coverage: performance, security, privacy, reliability, usability,
  accessibility, interoperability, compliance, data, platform, operational,
  logging/telemetry, error handling, build/deployment, and documentation constraints are
  considered and measurable where applicable.
- Context-driven missed-concern scan: identify any performance, security, privacy,
  accessibility, compliance, resilience, migration, operational, cost, compatibility, or
  domain-specific review/test need implied by context but absent from the spec. If material,
  fail or block with the required upstream change.
- UX/presentation quality: UI-facing work has explicit expectations for baseline styling,
  layout, responsive behavior, accessibility, and readable loading/empty/error/validation
  states, or scopes them out deliberately.
- Mock UI preference: UI-facing specs record whether a mock UI is Required, Optional, Not
  needed, or Deferred; Required mocks include an explicit human approval gate before
  production UI implementation.
- Boundary contract quality: externally consumed API/event/file/SDK/CLI/webhook success and
  error shapes are defined when consumers or user-visible behavior depend on them.
- External system verification quality: material external dependencies name the real
  contract to honor and prefer acceptance criteria that can be verified against the real
  system or official conformance surface. If real-boundary testing is infeasible, the spec
  flags that verification risk; a primary integration seam cannot rely only on a mock/fake/
  stub story unless the user explicitly waives the risk.
- Logging and telemetry quality: required logs, events, metrics, traces, audit records,
  support IDs, correlation IDs, retention, and redaction/privacy constraints are captured or
  explicitly scoped out. When production performance or operations matter, APM expectations
  such as latency, throughput, error rate, saturation, critical spans, trace propagation,
  dashboards, alerts, and SLO/SLI signals are captured or explicitly deferred.
- Error-handling quality: UI, API, domain, integration, infrastructure, validation,
  authorization, timeout, offline, and unexpected-failure behavior is specified at the
  externally visible level or explicitly scoped out.
- Acceptance quality: acceptance tests are black-box, scenario-sized, and verify linked
  UC/FR/NFR intent instead of restating requirements. One AT should not cover a pile of
  loosely related requirements that need separate scenarios or a journey test.
- Acceptance granularity: product/system `AT-` items may be broad acceptance intent,
  feature/component `AT-` items should refine bounded behavior, and slice/change `AT-`
  items should be precise enough to map to executable acceptance/e2e/API tests or justified
  non-code verification.
- Journey coverage: critical multi-step stories have `JT-` items that compose multiple
  `AT-` scenarios in order, carry realistic state across steps, and name observable final
  or intermediate oracles. If the product has long workflows but no `JT-` coverage, flag the
  gap or require an explicit non-goal/deferment.
- Traceability and change readiness: links support validation, impact analysis, and future
  revision.
- Brownfield source reconciliation: retrospective baseline specs classify docs, tests, code,
  review reports, issue/TODO files, and deployment evidence as governing/adopted/adapted/
  background/historical/open-decision/stale sources, preserving useful behavioral detail and
  naming unresolved conflicts.

## Output

1. Verification evidence considered, or a clear note that none was available.
2. Qualitative scorecard.
3. Top fixes ranked by impact.
4. **Review verdict**: Pass / Pass-with-fixes / Needs rework.

After reporting the verdict, stop. Do not start `/design-create` or any downstream command
without explicit user approval.
