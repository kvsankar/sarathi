# Required Document And Code Shape

This reference lists the minimum content that Sarathi documents and code records must have.
Stage prompts explain what to do. Checkers enforce fields and links that a program can
check. Extra risk checks add detail only when the work needs it.

Begin with the smallest direct implementation that satisfies current accepted behavior.
Apply `docs/simplicity-first.md`; do not design product machinery to satisfy process
requirement links, evidence, approval, or status needs.

New and materially revised specs, designs, and plans follow
`docs/human-first-artifacts.md`: mark format version 2, put the plain-language crux first,
use descriptive visible headings, and keep machine mappings in structured comments and a
final `## Traceability` section. Unmarked legacy documents retain the contracts below for
backward compatibility.

## Common Metadata

Every controlling document states these exact machine-readable fields:

- `Work Scope: product/system | feature/component | slice/change`
- `Implementation Readiness: Exploratory | Decomposable | Code-ready`
- `Delivery Profile: Lean | Standard | High-assurance | Exploratory`
- `Assurance Modules: comma-separated module names or none`

A child document also states `Parent Work Item: WORK-AREA-NAME`. Preserve stable IDs during
revision. Use descriptive uppercase slug IDs with exactly the grammar documented in
`docs/slug-id-migration.md`.

Code-ready means the next reviewable increment is bounded and has no unresolved product or
architecture decision. Scope size alone does not determine readiness; a feature/component
may inherit accepted intent and architecture and become code-ready directly.

## Spec Contract

Version 2 Product/system specs use **Product Crux** instead of the legacy Mission Statement,
then use this checker-visible order:

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

Product/system designs begin with **Technical Crux**, then use this checker-visible order:

1. **Overview**: context, scope, depth (`HLD | Feature | LLD`), readiness, review depth, and extra risk checks.
2. **Tech Stack**: accepted choices and versions/constraints where material.
3. **Drivers & Constraints**: requirements, quality attributes, boundaries, risks.
4. **Layers**: readable names and responsibilities.
5. **Components**: readable names, responsibilities, dependencies, and `COMP-*` IDs.
6. **Interfaces**: contracts, errors, compatibility, ownership, and `IFACE-*` IDs.
7. **Core vs. Shell / Equivalent Separation**: pure decisions vs. side effects.
8. **Key Flows**: success, failure, state, concurrency, and integration flows.
9. **Data Model**: ownership, lifecycle, validation, migration, privacy where triggered.
10. **Design Decisions**: `DEC-*`, alternatives, rationale, consequences; ADRs for material
    decisions.
11. **Test Strategy**: executable `TEST-AREA-NAME` obligations, environment, pass/fail check,
    real-boundary strategy, and responsible scope.
12. **Risks & Trade-offs**: `RISK-*`, mitigations, remaining risk, and when to strengthen review.
13. **Traceability**: final links from requirements to components, interfaces, tests, and decisions.

Include the `## Complexity Budget` section from `docs/simplicity-first.md` only when the
design proposes new machinery. Do not create a design merely to record a budget.

Feature designs and slice LLDs may reference parent architecture and include only changed
boundaries. Human-facing headings remain readable; machine IDs live in annotations and the
final traceability appendix. Diagrams use readable labels.

The design defines test architecture, build/release shape, environments, docs architecture,
observability/error behavior, and other extra risk checks only when triggered by accepted
intent or context. A primary external boundary needs real or official conformance evidence
or explicit acceptance of the remaining risk.

Write `design.md` plus a reviewable `design.html` for Product/system designs. For a
Feature/component or Slice/change design, create `design.html` only when diagrams or another
visual review surface materially help the decision. `design.md` remains the source of truth;
the HTML view must stay aligned with it. An inherited-intent plan does not create a separate
design document. When the spec says a UI mock is Required and no approved prototype exists,
produce/update `mock-ui.html` and
stop for explicit approval before production UI implementation.
An existing approved prototype may instead be referenced as
`Approved Prototype Artifact: path`; the same `ux.mock.approved` gate applies.

## Plan Contract

Plans declare `Plan Type: Breakdown | Implementation`. They begin with **Implementation
Crux**. Then record the direct-to-code decision from `docs/simplicity-first.md`: inherited
sources, reviewable increment, unresolved blocker or `none`, and smallest additional
artifact or `none`. Plans use this checker-visible order:

1. **Overview**: goal, common metadata, plan type, branch/CI context.
2. **Strategy**: delivery approach, planned verification, extra risk checks, integration cadence, review
   depth, cleanup/simplify, and feedback cadence.
3. **Milestones**: `MILE-AREA-NAME` outcome groups.
4. **Pull Requests / Child Work Items**.
5. **Coverage Map**: parent/local intent and `TEST-*` obligations assigned completely.
6. **Waves**: optional near-term child-work coordination for Breakdown plans.
7. **Sequencing & Risks**: dependency types, critical path, conflicts, rollback,
   ownership for combining parallel work, and stop/replan conditions.
8. **Traceability**: final compact allocations for milestones, work items, PRs, inherited
   intent, and test obligations.

Plans that introduce machinery include the exact `## Complexity Budget` section from
`docs/simplicity-first.md`, including `Implementation PR Count`. An inherited-intent record
uses its shorter required fields instead. Slice/change Implementation plans default to
at most three PRs. An exception requires a concise reason plus a
`plan.complexity-approved` approval that matches the current plan before assessment; this is
distinct from final `plan.approved`.

A Breakdown plan defines `WORK-AREA-NAME` allocations. Each names parent/child scope,
inherited IDs and test obligations, minimum required artifacts, dependencies, readiness target,
risks, and done signal. It never authorizes code directly.

An Implementation plan defines `PR-AREA-NAME` items. Each PR states:

- bounded scope and Planned Touch Set;
- assigned FR/AT/JT/COMP/TEST IDs, focused verification, and clear pass/fail checks;
- test levels and real-boundary/fixture strategy;
- extra risk work (build/release, docs, observability, errors, environments,
  security/privacy/UI/migration/etc.) when applicable;
- learning target, feedback target/method, and what result would change the plan;
- execution, learning, and integration dependencies;
- UI stakeholder review point when the PR completes an approved-prototype UI slice;
- a concise reason the PR is cohesive and independently reviewable.

In an Inherited-Intent Implementation Record, each `PR-*` states the Planned Touch Set, focused verification,
inherited IDs and pass/fail checks, and any risk evidence that actually applies. The record
as a whole owns the concise Lean rationale, acceptance/verification, and escalation fields.

When a Breakdown plan schedules near-term work, it declares one or more waves. Each scheduled
`WORK-*` appears exactly once in:

```markdown
## Waves

### WAVE-AREA-NAME
Order: 1
Learning Target: ...
Members: WORK-AREA-NAME
WIP Limit: 1
Feedback/Integration Checkpoint: ...
Stop/Replan Triggers: ...
```

The declaration must be real Markdown structure; a fenced example does not satisfy it.

Implementation plans do not declare waves; they list the PRs needed for one child. A
Breakdown-plan `WORK-*` may remain unscheduled. Later waves stay at the least detail justified
by current evidence. Use a wave only when one or more near-term children share a real
feedback or integration checkpoint.

Write `plan.md`. Markdown remains the source of truth. The generated workflow-status page is
the shared HTML view for delivery progress, allocated work, waves, and PRs; do not create a
separate `plan.html` by default.

## Inherited-Intent Implementation Record

A code-ready Feature/component or Slice/change in any delivery profile may use one compact
Implementation plan when accepted parent intent and architecture are sufficient. Mark it
`Inherited Intent Record: Yes`. The legacy `Lean Change Record: Yes` marker remains valid.
It remains a plan for approval, code assessment, and status; "record" is not a new artifact
kind.

The record uses the Direct-To-Code Decision fields and adds only:

- `Why Direct`: why inherited intent and architecture are sufficient;
- `Acceptance & Verification`: pass/fail checks, including real-boundary evidence when
  applicable;

`Inherited Sources` names parent intent and obligations; `Reviewable Increment` names the
changed behavior; `Unresolved Blocker` and `Smallest Additional Artifact` carry escalation.

It still has a bounded `PR-*` list with focused verification, a Planned Touch Set, and clear
pass/fail checks. Escalate only an unresolved boundary or risk and leave unrelated work on
the direct path.

## Code And Evidence Contract

`/code-create` implements only an explicitly selected bounded code-ready plan, including an
Inherited-Intent Implementation Record, respects the Planned Touch Set, and keeps the suite green at each PR
boundary. It records the exact test and verification commands run, their observed results,
and any unavailable evidence. Test names remain behavior-focused.

Sarathi process IDs never go into production or test names, comments, docstrings,
decorators, annotations, runtime values, logs, or generated source merely for traceability.
Keep accepted-intent-to-code mappings in the plan, assessment, or an external ledger.

Before handoff, run planned tests, repository quality gates, applicable extra-risk checks,
cleanup, and simplify. Coverage or detailed test-link inventories are used only when the
project or accepted risk profile calls for them. Report unavailable evidence as unavailable,
not passing.

`/code-assess` may write a `.sdlc/code-assessments.yaml` Pass record that matches the current plan using the
schema in `docs/workflow-status.md`. When every exact wave member, feedback/integration
checkpoint, and parent-document decision is complete, it may write a
`.sdlc/wave-checkpoints.yaml` record that matches the current plan. Neither file is human
approval.
