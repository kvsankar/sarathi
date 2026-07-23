# Required Document And Code Shape

This reference lists the minimum content that Sarathi documents and code records must have.
Stage prompts explain what to do. Checkers enforce fields and links that a program can
check. Extra risk checks add detail only when the work needs it.

Begin with the smallest direct implementation that satisfies the approved behavior.
Apply `docs/simplicity-first.md`; do not design product machinery to satisfy process
requirement links, evidence, approval, or status needs.

New and materially revised specs use format version 3; designs use format version 2; plans
use format version 3. All follow
`docs/human-first-artifacts.md`: put the plain-language overview or approach first,
use descriptive visible headings, and keep machine mappings in structured comments and a
final `## Traceability` section. Existing version-2 specs and plans and unmarked legacy
documents retain their earlier contracts for backward compatibility.

## Common Metadata

Every controlling document states these exact machine-readable fields:

- `Work Scope: product/system | feature/component | slice/change`
- `Ready To Implement: Yes | No`
- `Delivery Assurance Profile: Lean | Standard | High-assurance`
- `Approval Policy: Human checkpoints | Automatic eligible gates`
- `Work Outcome: Product increment | Decision/evidence`
- `Extra Checks: comma-separated checks or none`

A child document also states `Parent Work Item: WORK-AREA-NAME`. Preserve stable IDs during
revision. Use descriptive uppercase slug IDs with exactly the grammar documented in
`docs/slug-id-migration.md`.

`Yes` means the next change is specific enough to implement and has no unresolved product
or architecture decision. Scope size alone does not decide this; a feature may reuse
approved requirements and architecture and proceed directly.

## Spec Contract

Specification turns a problem and stakeholder needs into an agreed, testable model of
required system behavior. Follow the hierarchy in `docs/requirements-model.md`: needs lead
to features, use cases explain behavior in context, functional and supplementary
requirements make it precise, and acceptance tests and journeys define observable proof.

Version 3 product specs use **Product Overview**. Existing documents may use the legacy
**Mission Statement** or **Product Crux** heading. Then use this checker-visible order:

1. **User Needs**: atomic `UN-AREA-NAME` stakeholder outcomes.
2. **Non-Goals**: explicit scope boundaries.
3. **Features**: `FEAT-AREA-NAME`, each linked to needs.
4. **Use Cases**: `UC-AREA-NAME` actor/goal flows, alternatives, failures, postconditions.
5. **Functional Requirements**: atomic, testable `FR-AREA-NAME` obligations.
6. **Non-Functional Requirements**: measurable supplementary `NFR-AREA-NAME`
   qualities/constraints.
7. **External Interfaces & Contracts**: exact boundaries, versions, success/errors,
   lifecycle, auth, and real-boundary testability; state `None` when applicable.
8. **Acceptance Tests**: black-box `AT-AREA-NAME` criteria mapped to requirements.
9. **Journey Tests**: ordered `JT-AREA-NAME` compositions of acceptance scenarios, or an
    explicit reason none are needed.
10. **Assumptions & Open Questions**: unresolved facts, deferrals, reason for the assurance
    profile, approval policy, work outcome, extra checks, conditions for stronger assurance,
    and UI mock preference.
11. **Traceability**: final links from needs through tests, including priority/risk where useful.

Feature and slice specs may omit irrelevant empty sections but retain common metadata,
changed intent, acceptance basis, links to parent IDs, and open assumptions. A
purely internal change states which accepted behavior remains unchanged.

Specs own externally observable intent. They do not prescribe unit/component architecture.
`AT-*` is black-box acceptance intent; `JT-*` is a long ordered story. Use
`docs/srs-authoring.md` for detailed or reconstructed requirements guidance.

## Design Contract

Design turns accepted requirements and constraints into an implementable, evolvable
technical model. It explains the system boundary, structure, responsibilities,
relationships, interfaces, data, runtime behavior, important decisions and trade-offs,
quality attributes, testability, operability, and expected evolution to the depth justified
by the work. Apply `docs/design-principles.md`; named architectural approaches require a
concrete adoption signal and do not replace contextual design judgment.

Select the boundaries that carry important contracts, ownership, state, risk, or change.
Do not reproduce every category when it is irrelevant:

| Context | Boundaries that commonly deserve explicit treatment |
| --- | --- |
| Backend or service | API contracts; database schema, data ownership, transactions and migration; service/module boundaries; events and external integrations; trust and deployment boundaries. |
| Web frontend | Route and page boundaries; component/module ownership; client/server rendering; local, shared and server-state ownership; backend and browser-platform contracts. |
| Mobile app | Screen and navigation boundaries; UI/domain/platform responsibilities; local storage, remote sync and offline conflict behavior; backend APIs; OS services, permissions and lifecycle. |
| Data or ML system | Source and sink schemas; batch/stream boundaries; transformation or model interfaces; data ownership and retention; training/serving and monitoring boundaries. |
| Library, SDK or CLI | Public API and compatibility boundary; extension points; host/runtime integration; configuration, errors and side effects. |
| Infrastructure or operations | Deployable units; network and trust boundaries; state ownership; configuration and secrets; rollout, failure isolation and rollback. |

These are review prompts, not a universal checklist. A design names the few boundaries that
shape the solution and explains their contracts, ownership, failure behavior, and means of
verification. For backend work, applicable database-schema and API boundaries must never be
left implicit.

Product designs begin with **Technical Approach**. Existing documents may use the legacy
**Technical Crux** heading. Then use this checker-visible order:

1. **Overview**: context, scope, readiness, delivery assurance, approval policy, work outcome, and extra checks.
2. **Tech Stack**: accepted choices and versions/constraints where material.
3. **Drivers & Constraints**: requirements, quality attributes, boundaries, risks.
4. **Structure / Layers when applicable**: explain decomposition and dependency direction;
   use named layers only for a real separation, otherwise describe the direct structure.
5. **Components**: readable names, responsibilities, dependencies, and `COMP-*` IDs.
6. **Interfaces**: contracts, errors, compatibility, ownership, and `IFACE-*` IDs.
7. **Decision and I/O boundaries**: where decisions are made and where external effects occur.
8. **Key Flows**: success, failure, state, concurrency, and integration flows.
9. **Data Model**: ownership, lifecycle, validation, migration, privacy where triggered.
10. **Design Decisions**: `DEC-*`, alternatives, rationale, consequences; ADRs for material
    decisions.
11. **Test Strategy**: executable `TEST-AREA-NAME` obligations, environment, pass/fail check,
    real-boundary strategy, and responsible scope.
12. **Risks & Trade-offs**: `RISK-*`, mitigations, remaining risk, and when to strengthen review.
13. **Traceability**: final links from requirements to components, interfaces, tests, and decisions.

Feature and change designs may reference parent architecture and include only changed
boundaries. Human-facing headings remain readable; machine IDs live in annotations and the
final traceability appendix. Select suitable diagrams using `docs/design-principles.md`
when they materially improve understanding; diagrams use readable labels and remain aligned
with the written design.

The design defines test architecture, build/release shape, environments, docs architecture,
observability/error behavior, and other extra risk checks only when triggered by accepted
intent or context. A primary external boundary needs real or official conformance evidence
or explicit acceptance of the remaining risk.

Write `design.md` plus a reviewable `design.html` for Product/system designs. For a
Feature/component or Slice/change design, create `design.html` only when diagrams or another
visual review surface materially help the decision. `design.md` remains the source of truth;
the HTML view must stay aligned with it. Reusing approved earlier documents does not require a separate
design document. When the spec says a UI mock is Required and no approved prototype exists,
produce/update `mock-ui.html` and
stop for explicit approval before production UI implementation.
An existing approved prototype may instead be referenced as
`Approved Prototype Artifact: path`; the same `ux.mock.approved` gate applies.

## Plan Contract

Planning turns an approved technical model into an executable delivery structure. Every
plan makes the outcomes, impacted areas, dependencies, sequence, integration points,
verification, safety, and feedback visible. It uses one of two shapes.

Plan shape and work outcome are independent. A product increment uses the delivery structure
below to reach working behavior. A decision/evidence plan records its question, decision
owner, method, boundaries, stop condition or timebox, evidence, and decision/next action; it
does not claim product readiness. It uses code/PR structure only when an experiment or
prototype actually needs it.

Choose the shape by asking whether a competent engineer can understand, explain, review,
and safely plan the work as one coherent unit.

- A **Breakdown plan** structures broad work as independently useful child outcomes, with
  ownership, dependencies, readiness needs, and feedback or integration points.
- An **Implementation plan** structures one code-ready outcome as a graph of reviewable PRs,
  with their impacts, dependencies, merge order, tests, integration, and rollback. A
  cohesive one-PR change is a valid graph with one node; do not split it merely to create
  more process structure.

Every new plan contains a proportionate **Impact Map**. Name the affected product and
delivery surfaces—for example modules, files, APIs, database schemas or migrations, data,
tests, configuration, build/deployment, observability, and documentation—and say what is
added, changed, removed, or deliberately untouched. State the extent far enough to expose
affected consumers, owners, compatibility concerns, cross-area work, and likely conflicts;
do not use LOC estimates as a substitute. A small local change needs only a few lines.

Plans declare `Plan Type: Breakdown | Implementation`. They begin with **Implementation
Approach**; existing documents may use the legacy **Implementation Crux** heading. Then
record why that plan shape fits the approved requirements and design. Plans use this
checker-visible order:

1. **Impact Map**: affected areas, nature and extent of change, consumers/owners, and
   allocation to child work or PRs.
2. **Baseline Reuse**: what works in the current or sibling system, what becomes shared,
   what stays target-owned, what is new, and what is deferred.
3. **Overview**: goal, common metadata, plan type, branch/CI context.
4. **Strategy**: delivery approach, planned verification, extra risk checks, integration cadence, review
   depth, cleanup/simplify, and feedback cadence.
5. **Milestones**: `MILE-AREA-NAME` outcome groups.
6. **Pull Requests / Child Work Items**. Each item has one `Work Classification:` value:
   `reuse directly`, `extract then reuse`, `target-owned implementation`, `new behavior`,
   or `deferred cleanup`.
7. **Coverage Map**: parent/local intent and `TEST-*` obligations assigned completely.
8. **Work Groups**: optional near-term child-work coordination for Breakdown plans.
9. **Sequencing & Risks**: dependency graph, merge/delivery order, parallel paths, critical
   path, integration points, conflicts, rollback,
   ownership for combining parallel work, and stop/replan conditions.
10. **Traceability**: final compact allocations for milestones, work items, PRs, inherited
   intent, and test obligations.

A Breakdown plan defines a dependency graph of `WORK-AREA-NAME` allocations. Each names the
observable child outcome, affected areas at the useful level of detail, parent/child scope,
inherited obligations, minimum required documents, owner, dependencies, readiness target,
risks, integration or feedback point, and done signal. It never authorizes code directly.

An Implementation plan defines `PR-AREA-NAME` items. Each PR states:

- specific outcome and the files/modules/contracts expected to change;
- its part of the Impact Map, including the nature and extent of the change;
- assigned FR/AT/JT/COMP/TEST IDs, focused verification, and clear pass/fail checks;
- test levels and real-boundary/fixture strategy;
- extra risk work (build/release, docs, observability, errors, environments,
  security/privacy/UI/migration/etc.) when applicable;
- what the change should demonstrate, who or what will judge it, how feedback will be
  gathered, and what result would change the plan;
- execution, learning, and integration dependencies;
- UI stakeholder review point when the PR completes an approved-prototype UI slice;
- a concise reason the PR is cohesive and independently reviewable.

When an Implementation plan has more than one PR, define the graph edges, predecessor and
successor PRs, merge order, safe parallel paths, critical path, conflicts, and integration
points. A one-PR plan states that it is a one-node graph and omits empty dependency,
parallelism, merge-order, and integration-topology fields.

In a short implementation plan that reuses earlier documents, each `PR-*` states the files
expected to change, focused verification, inherited IDs and pass/fail checks, and any risk
evidence that actually applies. The plan also records why the earlier documents are enough,
how success will be checked, and what would require more design work.

When a Breakdown plan schedules near-term work, it declares one or more work groups. Each scheduled
`WORK-*` appears exactly once in:

```markdown
## Work Groups

### WAVE-AREA-NAME
Order: 1
Expected Result: ...
Members: WORK-AREA-NAME
Parallel Limit: 1
Review Point: ...
Stop Conditions: ...
```

The declaration must be real Markdown structure; a fenced example does not satisfy it.

Implementation plans do not declare work groups; they list the PRs needed for one child. A
Breakdown-plan `WORK-*` may remain unscheduled. Later groups stay at the least detail justified
by current evidence. Use a group only when one or more near-term children share a real
feedback or integration checkpoint.

Write `plan.md`. Markdown remains the source of truth. The generated workflow-status page is
the shared HTML view for delivery progress, assigned work, work groups, and PRs; do not create a
separate `plan.html` by default.

## Short Implementation Plan

A feature or change may use one compact Implementation plan when approved earlier
requirements and architecture are sufficient. It references those documents instead of
copying them, explains the outcome and exact change, names the files expected to change,
and gives focused verification with clear pass/fail checks. Add another design document
only when a specific unresolved boundary or risk blocks implementation.

Older short-plan fields remain readable, but new plans do not need or advertise them.

## Code And Evidence Contract

`/code-create` implements only an explicitly selected plan that is ready to implement, including a short
implementation plan that reuses earlier documents. For behavior changes it uses the
Red-Green-Refactor loop in `docs/test-ownership.md`: observe the smallest meaningful test
fail for the expected reason, make the minimum production-quality change that passes it,
then improve the code while focused and affected tests stay green. It stays within the
files expected to change and keeps the suite green at each PR boundary. It records the
exact test and verification commands run, their observed results, and any unavailable
evidence. Test names remain behavior-focused.

Sarathi process IDs never go into production or test names, comments, docstrings,
decorators, annotations, runtime values, logs, or generated source merely for traceability.
Keep accepted-intent-to-code mappings in the plan, assessment, or an external ledger.

Before handoff, run planned tests, required project checks, applicable extra checks,
cleanup, and simplify. Coverage or detailed test-link inventories are used only when the
project or accepted risk profile calls for them. Report unavailable evidence as unavailable,
not passing.

`/code-assess` may write a `.sdlc/code-assessments.yaml` Pass record that matches the current plan using the
schema in `docs/workflow-status.md`. When every exact group member, review point, and
earlier-document decision is complete, it may write a
`.sdlc/wave-checkpoints.yaml` record that matches the current plan. Neither file is human
approval.
