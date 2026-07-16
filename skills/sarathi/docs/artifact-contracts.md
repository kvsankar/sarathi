# Artifact Contracts

This reference defines the minimum authoring contract for Sarathi artifacts. Stage prompts
own procedure; checkers own deterministic structure; assurance modules add only
context-triggered depth.

Begin with the smallest direct implementation that satisfies current accepted behavior.
Apply `docs/simplicity-first.md`; do not design product machinery to satisfy process
traceability, evidence, approval, or status needs.

## Common Metadata

Every governing artifact states:

- `Work Scope: product/system | feature/component | slice/change`
- `Implementation Readiness: Exploratory | Decomposable | Code-ready`
- `Delivery Profile: Lean | Standard | High-assurance | Exploratory`
- `Assurance Modules: comma-separated module names or none`

A child artifact also states `Parent Work Item: WORK-AREA-NAME`. Preserve stable IDs during
revision. Use descriptive uppercase slug IDs with exactly the grammar documented in
`docs/slug-id-migration.md`.

Broad work is normally Decomposable. Code-ready means the next implementation step is
bounded and does not require unresolved product or architecture decisions.

## Spec Contract

Product/system specs use this checker-visible order:

1. **Mission Statement**: problem, stakeholders, value, boundary, common metadata.
2. **User Needs**: atomic `UN-AREA-NAME` stakeholder outcomes.
3. **Non-Goals**: explicit scope boundaries.
4. **Features**: `FEAT-AREA-NAME`, each linked to needs.
5. **Use Cases**: `UC-AREA-NAME` actor/goal flows, alternatives, failures, postconditions.
6. **Functional Requirements**: atomic, testable `FR-AREA-NAME` obligations.
7. **Non-Functional Requirements**: measurable `NFR-AREA-NAME` qualities/constraints.
8. **External Interfaces & Contracts**: exact boundaries, versions, success/errors,
   lifecycle, auth, and real-boundary testability; state `None` when applicable.
9. **Acceptance Tests**: black-box `AT-AREA-NAME` criteria mapped to requirements.
10. **Journey Tests**: ordered `JT-AREA-NAME` compositions of acceptance scenarios, or an
    explicit reason none are needed.
11. **Traceability Matrix**: needs through tests, including priority/risk where useful.
12. **Assumptions & Open Questions**: unresolved facts, deferrals, profile rationale,
    module triggers, escalation triggers, and UI mock preference.

Feature and slice specs may omit irrelevant empty sections but retain common metadata,
changed intent, acceptance basis, traceability to parent IDs, and open assumptions. A
purely internal change states which accepted behavior remains unchanged.

Specs own externally observable intent. They do not prescribe unit/component architecture.
`AT-*` is black-box acceptance intent; `JT-*` is a long ordered story. Use
`docs/srs-authoring.md` for broad or reconstructed requirements.

## Design Contract

Product/system designs use this checker-visible order:

1. **Overview**: context, scope, depth (`HLD | Feature | LLD`), readiness, profile/modules.
2. **Tech Stack**: accepted choices and versions/constraints where material.
3. **Drivers & Constraints**: requirements, quality attributes, boundaries, risks.
4. **Layers**: readable names and responsibilities.
5. **Components**: readable names, responsibilities, dependencies, `COMP-*` trace anchors.
6. **Interfaces**: contracts, errors, compatibility, ownership, `IFACE-*` trace anchors.
7. **Core vs. Shell / Equivalent Separation**: pure decisions vs. side effects.
8. **Key Flows**: success, failure, state, concurrency, and integration flows.
9. **Data Model**: ownership, lifecycle, validation, migration, privacy where triggered.
10. **Design Decisions**: `DEC-*`, alternatives, rationale, consequences; ADRs for material
    decisions.
11. **Test Strategy**: executable `TEST-AREA-NAME` obligations, environment, oracle,
    real-boundary strategy, and responsible scope.
12. **Risks & Trade-offs**: `RISK-*`, mitigations, residual risk, escalation.
13. **Traceability Matrix**: requirements to components/interfaces/tests/decisions.

Include the exact `## Complexity Budget` section from `docs/simplicity-first.md`, using its
five design fields. A prose mention, differently named section, or fenced example is not
the contract.

Feature designs and slice LLDs may reference parent architecture and include only changed
boundaries. Human-facing headings remain readable; machine IDs live in annotations,
glossaries, matrices, obligations, and exact references. Diagrams use readable labels.

The design defines test architecture, build/release shape, environments, docs architecture,
observability/error behavior, and other assurance-module tactics only when triggered by
accepted intent or context. A primary external seam needs real/official conformance or an
explicit residual-risk decision.

Write `design.md` plus deterministic `design.html`. When the spec says a UI mock is
Required, produce/update `mock-ui.html` and stop for explicit approval before production UI
implementation.

## Plan Contract

Plans declare `Plan Type: Breakdown | Implementation` and use this checker-visible order:

1. **Overview**: goal, common metadata, plan type, branch/CI context.
2. **Strategy**: delivery/TDD approach, selected modules, integration cadence, profile
   depth, cleanup/simplify, and feedback cadence.
3. **Milestones**: `MILE-AREA-NAME` outcome groups.
4. **Pull Requests / Child Work Items**.
5. **Coverage Map**: ancestor/local intent and `TEST-*` obligations allocated completely.
6. **Learning Waves**: exact ordered wave declarations.
7. **Sequencing & Risks**: dependency types, critical path, conflicts, rollback,
   convergence ownership, and stop/replan conditions.

Include the exact `## Complexity Budget` section from `docs/simplicity-first.md`, including
`Implementation PR Count`. Slice/change Implementation plans default to at most three PRs.
An exception requires concise rationale plus hash-current `plan.complexity-approved`
attestation before assessment; this is distinct from final `plan.approved`.

A Breakdown plan defines `WORK-AREA-NAME` allocations. Each names parent/child scope,
inherited IDs and test obligations, required child Spec/Design/Plan artifacts, dependencies,
readiness target, risks, and done signal. It never authorizes code directly.

An Implementation plan defines `PR-AREA-NAME` items. Each PR states:

- bounded scope and Planned Touch Set;
- Red test and Green implementation, or a narrow TDD exception with replacement evidence;
- assigned FR/AT/JT/COMP/TEST IDs and concrete verification oracles;
- test levels and real-boundary/fixture strategy;
- activated module work (build/release, docs, observability, errors, environments,
  security/privacy/UI/migration/etc.) or a concise applicable rationale;
- learning target, feedback target/method, invalidation question;
- execution, learning, and integration dependencies;
- learning wave, checkpoint, and stop/replan trigger;
- a concise reason the PR is cohesive and independently reviewable.

Every implementation PR uses labeled `Red:` and `Green:` steps. A PR that truly cannot use
Red/Green instead declares all three fields:

```markdown
TDD Exception: docs-only
Exception Scope: exact files/behavior and why Red/Green cannot apply
Replacement Evidence: exact deterministic command or observed oracle
```

Allowed categories are `generated-only`, `docs-only`, `formatting-only`,
`build/deploy-config`, and `legacy-characterization`. Exceptions never authorize new or
changed product behavior, bug fixes, contracts, validation, security/privacy behavior,
error handling, logging/telemetry, or UI behavior. Generated output needs downstream
validation; docs/formatting must not change executable behavior; build/deploy configuration
needs validator/dry-run/build/smoke evidence; characterization captures existing behavior
only and cannot cover the subsequent intentional change. Mechanical verification checks
the fields/category; qualitative review judges eligibility and evidence fitness.

Every delivery item appears exactly once in:

```markdown
## Learning Waves

### WAVE-AREA-NAME
Order: 1
Learning Target: ...
Members: PR-AREA-NAME
WIP Limit: 1
Feedback/Integration Checkpoint: ...
Stop/Replan Triggers: ...
```

The declaration must be real Markdown structure; a fenced example does not satisfy it.

Breakdown waves contain `WORK-*`; Implementation waves contain `PR-*`. Later waves stay at
the least detail justified by current evidence. Prefer one-item waves when learning from one
slice can invalidate the next.

Write `plan.md` plus deterministic `plan.html` with readable dependency/wave views and
touch-set/coverage tables. Markdown remains the source of truth.

## Code And Evidence Contract

`/code-create` implements only a code-ready plan's eligible active-wave members, respects
the Planned Touch Set, and keeps the suite green at each PR boundary. It records executable
test claims in `.sdlc/test-traceability.yaml`; test names remain behavior-focused.

Before handoff, run planned tests, coverage, quality gates, activated assurance-module
checks, cleanup, and simplify. Report unavailable evidence as unavailable, not passing.

`/code-assess` may write a hash-current `.sdlc/code-assessments.yaml` Pass record using the
schema in `docs/workflow-status.md`. When every exact wave member, feedback/integration
checkpoint, and ancestor-impact decision is complete, it may write a hash-current
`.sdlc/wave-checkpoints.yaml` record. Neither ledger is human approval.
