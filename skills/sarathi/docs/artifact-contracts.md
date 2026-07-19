# Required Document And Code Shape

This reference lists the minimum content that Sarathi documents and code records must have.
Stage prompts explain what to do. Checkers enforce fields and links that a program can
check. Extra risk checks add detail only when the work needs it.

Begin with the smallest direct implementation that satisfies the approved behavior.
Apply `docs/simplicity-first.md`; do not design product machinery to satisfy process
requirement links, evidence, approval, or status needs.

New and materially revised specs, designs, and plans follow
`docs/human-first-artifacts.md`: mark format version 2, put the plain-language overview or
approach first,
use descriptive visible headings, and keep machine mappings in structured comments and a
final `## Traceability` section. Unmarked legacy documents retain the contracts below for
backward compatibility.

## Common Metadata

Every controlling document states these exact machine-readable fields:

- `Work Scope: product/system | feature/component | slice/change`
- `Ready To Implement: Yes | No`
- `Review Level: Lean | Standard | High-assurance | Exploratory`
- `Extra Checks: comma-separated checks or none`

A child document also states `Parent Work Item: WORK-AREA-NAME`. Preserve stable IDs during
revision. Use descriptive uppercase slug IDs with exactly the grammar documented in
`docs/slug-id-migration.md`.

`Yes` means the next change is specific enough to implement and has no unresolved product
or architecture decision. Scope size alone does not decide this; a feature may reuse
approved requirements and architecture and proceed directly.

## Spec Contract

Version 2 product specs use **Product Overview**. Existing documents may use the legacy
**Mission Statement** or **Product Crux** heading. Then use this checker-visible order:

1. **User Needs**: atomic `UN-AREA-NAME` stakeholder outcomes.
2. **Non-Goals**: explicit scope boundaries.
3. **Features**: `FEAT-AREA-NAME`, each linked to needs.
4. **Use Cases**: `UC-AREA-NAME` actor/goal flows, alternatives, failures, postconditions.
5. **Functional Requirements**: atomic, testable `FR-AREA-NAME` obligations.
6. **Non-Functional Requirements**: measurable `NFR-AREA-NAME` qualities/constraints.
7. **External Interfaces & Contracts**: exact boundaries, versions, success/errors,
   lifecycle, auth, and real-boundary testability; state `None` when applicable.
8. **Acceptance Tests**: black-box `AT-AREA-NAME` criteria mapped to requirements.
9. **Journey Tests**: ordered `JT-AREA-NAME` compositions of acceptance scenarios, or an
    explicit reason none are needed.
10. **Assumptions & Open Questions**: unresolved facts, deferrals, reason for review depth,
    extra risk checks, conditions for stronger review, and UI mock preference.
11. **Traceability**: final links from needs through tests, including priority/risk where useful.

Feature and slice specs may omit irrelevant empty sections but retain common metadata,
changed intent, acceptance basis, links to parent IDs, and open assumptions. A
purely internal change states which accepted behavior remains unchanged.

Specs own externally observable intent. They do not prescribe unit/component architecture.
`AT-*` is black-box acceptance intent; `JT-*` is a long ordered story. Use
`docs/srs-authoring.md` for broad or reconstructed requirements.

## Design Contract

Product designs begin with **Technical Approach**. Existing documents may use the legacy
**Technical Crux** heading. Then use this checker-visible order:

1. **Overview**: context, scope, readiness, review level, and extra checks.
2. **Tech Stack**: accepted choices and versions/constraints where material.
3. **Drivers & Constraints**: requirements, quality attributes, boundaries, risks.
4. **Layers**: readable names and responsibilities.
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
final traceability appendix. Diagrams use readable labels.

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

Plans declare `Plan Type: Breakdown | Implementation`. They begin with **Implementation
Approach**; existing documents may use the legacy **Implementation Crux** heading. Then
record whether the approved requirements and design are enough to begin, or name the
specific unanswered question that requires another document. Plans use this
checker-visible order:

1. **Overview**: goal, common metadata, plan type, branch/CI context.
2. **Strategy**: delivery approach, planned verification, extra risk checks, integration cadence, review
   depth, cleanup/simplify, and feedback cadence.
3. **Milestones**: `MILE-AREA-NAME` outcome groups.
4. **Pull Requests / Child Work Items**.
5. **Coverage Map**: parent/local intent and `TEST-*` obligations assigned completely.
6. **Work Groups**: optional near-term child-work coordination for Breakdown plans.
7. **Sequencing & Risks**: dependency types, critical path, conflicts, rollback,
   ownership for combining parallel work, and stop/replan conditions.
8. **Traceability**: final compact allocations for milestones, work items, PRs, inherited
   intent, and test obligations.

A Breakdown plan defines `WORK-AREA-NAME` allocations. Each names parent/child scope,
inherited IDs and test obligations, minimum required documents, dependencies, readiness target,
risks, and done signal. It never authorizes code directly.

An Implementation plan defines `PR-AREA-NAME` items. Each PR states:

- specific scope and the files expected to change;
- assigned FR/AT/JT/COMP/TEST IDs, focused verification, and clear pass/fail checks;
- test levels and real-boundary/fixture strategy;
- extra risk work (build/release, docs, observability, errors, environments,
  security/privacy/UI/migration/etc.) when applicable;
- what the change should demonstrate, who or what will judge it, how feedback will be
  gathered, and what result would change the plan;
- execution, learning, and integration dependencies;
- UI stakeholder review point when the PR completes an approved-prototype UI slice;
- a concise reason the PR is cohesive and independently reviewable.

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
implementation plan that reuses earlier documents. It stays within the files expected to
change and keeps the suite green at each PR boundary. It records the exact test and
verification commands run, their observed results, and any unavailable evidence. Test names
remain behavior-focused.

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
