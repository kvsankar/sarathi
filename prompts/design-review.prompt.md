---
description: Qualitatively review a Software Design Document using existing verification evidence where available.
agent: agent
---

# Design Review

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

Perform the qualitative review of a Software Design Document. This command judges design
substance; it does not replace `/design-verify`. If verification evidence is absent, state
that gap and either use the latest supplied evidence or recommend `/design-verify`. Use
`/design-assess` when the user wants verification and review together.

Target the design file the user provides, defaulting to `design.md`. Do not edit it unless
explicitly asked.

Before judging the design itself, check whether the upstream spec is fit to design from. If
spec ambiguity, missing acceptance criteria, incorrect NFRs, missing logging/error-handling
intent, missing build/deployment or documentation needs, or scope issues block fair design
review, stop with an upstream spec blocker.

Use an adversarial posture: try to refute the design, find missing upstream changes,
unowned interfaces, weak trade-offs, excessive coupling, testability gaps, missing
test-environment strategy, context-driven concerns the system likely needs, and
traceability theater. If the host exposes sub-agent capability, run this review in a
fresh-context Qualitative Reviewer sub-agent. This is mandatory for review stages. If
sub-agents are unavailable, state that the host lacks sub-agent capability, mark the review
as degraded and non-independent when the same agent created the design, and actively look
for counterexamples.

## Qualitative Review

Score each item 1-5 and give one concrete fix for any score below 5:

- Upstream spec fitness: requirements are clear enough to design against.
- Scope/readiness fit: HLD, feature/component design, or slice/change LLD depth matches the
  artifact scope and declared readiness.
- Requirement fit and traceability: design decisions and components trace to FR/NFR/AT/JT
  intent without inventing hidden requirements.
- Architecture views: context, logical/runtime/deployment/data views are present at the
  right depth.
- Functional core / imperative shell: pure policy/decision logic is separated from I/O,
  orchestration, framework, and side-effect code where practical.
- Responsibility design: components have cohesive responsibilities, clear ownership, and
  manageable coupling.
- Interfaces and contracts: APIs, schemas, events, errors, versioning, and compatibility
  are explicit, including representative success/error variants and the fixture/schema/
  generated-client source of truth for tests.
- Contract realism: boundary tests and mocks are tied to documented producer/consumer
  contracts, shared fixtures, schemas, generated clients, or contract tests, not invented
  convenient shapes.
- External double verification risk: any mock/fake/stub/test double/local mirror for an
  external system is flagged as verification risk and tied to real-boundary, official
  conformance, type-conformance, generated-schema/client, sandbox/emulator, captured-real
  fixture, or explicit user-approved mitigation. A primary integration seam covered only by
  a self-authored double is a blocking design defect.
- UI presentation and feedback: UI-facing designs define baseline styling/layout,
  responsive behavior, accessibility, and readable loading/empty/error/validation states, or
  deliberately scope them out.
- Mock UI gate: when the spec requires a mock UI, the design references a concrete mock UI
  artifact, covers representative screens/states/flows, and stops for explicit user
  approval before downstream production UI work.
- Data and side effects: state ownership, persistence, transactions, idempotency,
  concurrency, migrations, and rollback are addressed where relevant.
- Quality attributes: performance, security, privacy, reliability, accessibility,
  observability, operations, build/release/deployment, and documentation tactics fit the
  spec.
- Context-driven missed-concern scan: identify any dedicated performance/load, security/
  threat-model, privacy/compliance, accessibility, resilience/DR, migration, localization,
  abuse/fraud/safety, cost, compatibility, or operational review/test implied by context but
  absent from the design. If material, fail or block with the required upstream/design change.
- Logging and telemetry design: structured logs, events, metrics, traces, audit/support IDs,
  correlation, sinks, retention/sampling, redaction/privacy, alert hooks, and human/agent
  consumers are explicit where relevant. For production-facing systems, APM instrumentation
  is explicit: service/resource names, spans, trace propagation, latency/throughput/error/
  saturation metrics, dashboards, alerts, SLO/SLI signals, and exporter/provider strategy.
- Error-handling design: UI, API, domain, integration, infrastructure, validation,
  authorization, timeout, offline, and unexpected-failure categories have clear mapping,
  retry/fallback/degraded behavior, escalation, and safe user/API messages.
- Trade-offs and ADRs: meaningful options, selected decisions, rejected alternatives, and
  consequences are surfaced and documented.
- Testability: explicit `TEST-` obligations sensibly cover acceptance/e2e/journey,
  unit/pure-core, component, contract, integration, UI, migration, operational, and
  quality-attribute tests. Critical `JT-` stories from the spec are mapped to executable
  journey/e2e/workflow obligations with ordered steps, state handoff, environment, and
  oracle details.
- Test environment strategy: developer test environment is defined; shared integration/test,
  staging/pre-production, production canary/smoke, or synthetic-monitor environments are
  recommended or deferred with rationale based on risk, data, integrations, and deployment
  model.
- Verification-oracle design: each `TEST-` obligation names the observable evidence that
  will prove pass/fail, such as return value, state, event, API response, DOM/accessibility
  output, screenshot, artifact, log, metric, trace, deployment signal, or external call.
- Risks: open risks, assumptions, and follow-up decisions are visible.

## Output

1. Upstream blockers, if any.
2. Verification evidence considered, or a clear note that none was available.
3. Qualitative scorecard.
4. Top fixes ranked by impact.
5. **Review verdict**: Pass / Pass-with-fixes / Needs rework / Blocked-upstream.

After reporting the verdict, stop. Do not start `/plan-create` or any downstream command
without explicit user approval.
