# Detailed SRS Quality Rules

Use these rules when drafting, reconstructing, or reviewing a Software Requirements
Specification. They extend Sarathi's required SRS format with a stricter quality bar.

Start with the [needs-to-evidence model](requirements-model.md). These rules add atomicity,
detailed use cases where the behavioral complexity warrants them, measurable supplementary
requirements, and source reconstruction without replacing that organizing model.

## Research Basis

- [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html) is the
  current requirements-engineering standard and covers requirements processes, required
  information items, required contents, and information item format guidance. The ISO
  listing says the 2018 edition was confirmed in 2024 and is current as of this writing.
- [NASA-HDBK-2203](https://swehb.nasa.gov/) frames the NASA Software Engineering and
  Assurance Handbook as practical guidance for NPR 7150.2 and NASA-STD-8739.8, with
  emphasis on safe, reliable software, objective evidence, traceability, and lessons
  learned.
- Martin Fowler's use-case guidance emphasizes that the value of use cases is in the text,
  not diagrams, and that use cases organize and elicit requirements:
  <https://martinfowler.com/bliki/UseCase.html>
- Cockburn-style fully dressed use cases are a useful template when actor-goal flows need
  detail: primary actor, scope, goal, trigger, preconditions, guarantees, main success
  scenario, and extensions or variations.
- Cucumber's Gherkin reference treats examples/scenarios as executable specifications,
  recommends short examples, and uses Given/When/Then to express initial context, event, and
  expected observable outcome: <https://cucumber.io/docs/gherkin/reference/>

## Atomicity

User needs:

- Write one `UN-` per stakeholder and one outcome or pain.
- Avoid joining two actors, two pains, or a goal plus a solution in one need.
- Good: `UN-OPS-TRACE Operators need enough diagnostic context to explain a failed import.`
- Split: "Admins and support staff need secure login and audit history."

Functional requirements:

- Write one externally observable obligation per requirement. Attach its `FR-*` identifier
  in a structured comment or the final traceability appendix.
- Use "shall"; avoid "and" when it joins separate obligations.
- Split separate create/read/update/delete behavior, separate user-visible states, separate
  validation rules, and separate integration outcomes unless the combined behavior is one
  indivisible business rule.
- Avoid implementation language unless the technology is an external constraint or contract.

Acceptance tests:

- Write one scenario, rule example, or measurable quality check per acceptance item. Attach
  its `AT-*` identifier outside the visible heading.
- Prefer Given/When/Then or an equivalent setup/action/expected-result shape.
- Map each `AT-` to one `UC-` and a small set of `FR-`/`NFR-` IDs. If one `AT-` needs many
  requirements, split it or make it a `JT-` journey.
- The expected result must be externally observable: UI/API output, event, file,
  log/metric/trace,
  deployment artifact, notification, support ID, or measurable threshold.

## Detailed Use Cases

When a use case needs detailed actor-goal analysis, include the fields that clarify its
behavior; do not expand a simple flow merely to complete a template:

- Primary actor
- Supporting actors/systems
- Goal
- Scope
- Trigger
- Preconditions
- Minimal guarantees
- Success guarantees
- Main success scenario as numbered actor/system steps
- Alternate flows
- Error/exception flows
- Postconditions
- Frequency or importance where known
- Trace links to `UN-`, `FEAT-`, `FR-`, `NFR-`, `AT-`, and `JT-` IDs where applicable

Use-case review rules:

- The main success scenario must be more than a one-paragraph summary. It should show the
  ordered actor/system interaction at the right abstraction level.
- Alternate flows must cover meaningful choices, variants, empty states, retries, partial
  success, or alternate actors when relevant.
- Error/exception flows must cover validation, authorization, unavailable dependency,
  timeout/offline, conflict, malformed input, and unexpected failure when relevant.
- Do not replace alternate/error flows with "handled normally" or "standard error."
- Frequency/importance may be qualitative when unknown, but it must help prioritization.

## Supplementary Requirements

Use the categories below only when the accepted scope, stakeholder need, external contract,
or identified risk makes them relevant. Write measurable supplementary requirements for
the relevant categories; do not require a universal checklist or explicit `None`/deferred
entry for every category.

- Performance: latency, throughput, capacity, resource use, startup time, batch duration.
- Security: authentication, authorization, audit, secrets, abuse resistance, dependency risk.
- Privacy/compliance: data minimization, retention, consent, export/delete, regional rules.
- Reliability/resilience: availability, retry, fallback, idempotency, recovery, backup/DR.
- UX/accessibility: readability, responsive behavior, keyboard use, contrast, screen reader
  behavior, loading/empty/error states.
- Operability: health checks, runbooks, support IDs, dashboards, alerts, SLO/SLI signals.
- Logging/telemetry/APM: structured events, metrics, traces, correlation, retention,
  redaction, provider constraints.
- Error handling: user/API messages, error categories, recovery actions, escalation.
- Build/deploy/release: artifacts, environments, rollout, rollback, migrations, smoke checks.
- Migration/compatibility: data transition, backward compatibility, version support.
- Documentation: user guides, developer/API docs, examples, troubleshooting, release notes.

## Reconstructing Requirements For An Existing System

Before writing a retrospective baseline SRS, inventory source sets:

- Existing specs, design docs, ADRs, README files, runbooks, deployment docs, CI config.
- Tests, fixtures, golden outputs, screenshots, examples, generated clients/schemas.
- Source code behavior, public API routes, CLI commands, config files, migrations.
- Issues, TODO/FIXME lists, review reports, incident notes, support notes, release notes.
- Operational evidence such as dashboards, logs, traces, alerts, smoke checks, deployment
  scripts, and environment configuration.

Classify each source set:

- Current controlling source: authoritative behavior or policy to preserve.
- Adopted source: non-authoritative but accepted as current intended behavior.
- Adapted source: useful but revised to match current intent.
- Background proposal: informative but not current requirement intent.
- Historical review evidence: useful defect/risk evidence, not itself controlling behavior.
- Open-decision ledger: unresolved conflict or decision still needing human choice.
- Rejected/stale source: explicitly not used.

Existing-system SRS rules:

- Add a `Source Reconciliation` section or equivalent subsection.
- Preserve useful detail from existing behavior, tests, and docs. Do not collapse separate
  modes, roles, states, errors, or external contracts into one vague requirement.
- Mark inferred requirements and name the evidence behind them.
- Mark conflicts and gaps as open decisions; do not silently choose between sources when the
  choice changes behavior, support risk, compliance, or compatibility.
- Separate current behavior from desired future deltas.

## Review Failure Conditions

Fail or require rework even if the automatic checker passes when the SRS is:

- Terse: use cases or requirements are too short for a human to validate behavior.
- Cryptic: domain terms, states, actors, or outcomes are not explained.
- Over-bundled: one need, FR, NFR, or AT carries multiple unrelated behaviors.
- Under-scenarioed: important alternate/error paths are absent.
- Under-sourced in existing-system work: current behavior was summarized without source
  reconciliation.
- Empty linking: IDs are linked, but the linked content does not actually verify or
  derive the behavior.
- Design-heavy: implementation choices appear where external behavior or constraints are
  required.
- Design-avoidant: "no design in requirements" is used as an excuse to omit precise behavior.

## Checker Recommendations

Automatic checks can catch likely problems, not prove quality. Useful checks:

- Missing use-case detail needed to understand a material flow, alternative, or failure.
- Main success scenario without numbered steps.
- Missing or placeholder alternate/error flows.
- `UN-`/`FR-` items with multiple sentences, semicolons, repeated "shall", or obvious
  conjunction bundling.
- `AT-` items that reference more than one `UC-` or too many `FR-`/`NFR-` IDs.
- Existing-system specs without `Source Reconciliation` and source classification terms.
- NFRs lacking numeric thresholds, units, scope, or verification method.
- Vague terms such as "etc.", "as appropriate", "fast", "easy", and "TBD".
