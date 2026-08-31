# Required Document And Code Content

This file lists the content that Sarathi and its checkers require. It does not explain how to
write each document. Use these guides for that:

- [requirements-model.md](requirements-model.md) and [srs-authoring.md](srs-authoring.md) for
  requirements;
- [design-principles.md](design-principles.md) for designs;
- [work-decomposition.md](work-decomposition.md) for plans;
- [test-ownership.md](test-ownership.md) for tests; and
- [human-first-artifacts.md](human-first-artifacts.md) for readable documents.

Start with the smallest direct implementation that satisfies the approved behavior. Do not
add product code merely to support process records, approval, or status reporting. See
[simplicity-first.md](simplicity-first.md).

New or materially revised specs, designs, and plans use format version 3. Older formats remain
readable and keep their earlier requirements. Version 3 documents put the explanation first,
use descriptive headings, and keep machine mappings in structured comments and a final
`## Traceability` section.

## Fields For Standalone Specs, Designs, And Plans

- `Work Scope: product/system | feature/component | slice/change`
- `Ready To Implement: Yes | No`
- `Approval Policy: Human checkpoints | Automatic eligible gates`
- `Work Outcome: Product increment | Decision/evidence`
- `Extra Checks: comma-separated checks or none`

A child document also states `Parent Work Item: WORK-AREA-NAME`. Keep stable IDs when revising
a document. ID grammar is defined in [slug-id-migration.md](slug-id-migration.md).

Choose file paths using [document-locations.md](document-locations.md). Only Product/system
scope uses `spec.md`, `design.md`, and `plan.md`. Smaller scopes use the same descriptive work
slug in every document and report filename.

`Ready To Implement: Yes` means that the next code change is specific and no unresolved
product or architecture decision blocks it. The size of the scope does not decide readiness.

## Compact Slice Contract

Use a compact slice for an intentional observable behavior or protected-contract change.
Reference the accepted baseline and applicable protected authorities; do not copy them or
create a registry. A defect repair, refactor, or mechanical change needs no slice unless it
intentionally changes that behavior or contract.

The slice uses these four sections in order:

1. **Intent And Baseline**: `Baseline:`, `Change To Baseline:`, and
   `Applicable Constraints:`.
2. **Observable Delta**: the changed behavior and acceptance, plus `Exclusions:` and
   `Affected Interfaces / State:`.
3. **Delivery And Checks**: `Technical Approach:`, one or more `Delivery Unit:` values using
   `PR-AREA-NAME`, `Checks:`, `Rollback:`, and `Review Point:`.
4. **Traceability**: compact requirement and acceptance links.

This one document may authorize implementation when it is approved and code-ready. Create a
separate design or plan only when complexity or risk makes independent review materially
easier. When one slice needs several delivery units, keep the slice as the controlling delta
and name the boundaries and dependencies in its plan.

For UI work, add `UI Mock Preference: Required | Optional | Not needed | Deferred`. When it
is `Required`, name `UI Mock Artifact: <path>` or `Approved Prototype Artifact: <path>` and
preserve the `ux.mock.approved` gate before production UI code.

## Spec Contract

Version 3 Product/system specs start with **Product Overview**. Older documents may use
**Mission Statement** or **Product Crux**. The checker expects this order:

1. **User Needs**: one `UN-AREA-NAME` outcome per stakeholder need.
2. **Non-Goals**: what the work will not do.
3. **Features**: `FEAT-AREA-NAME` entries linked to needs.
4. **Use Cases**: `UC-AREA-NAME` actor and goal flows, including important alternatives and
   failures.
5. **Functional Requirements**: one testable `FR-AREA-NAME` behavior per entry.
6. **Non-Functional Requirements**: measurable `NFR-AREA-NAME` quality goals or constraints.
7. **External Interfaces & Contracts**: versions, success and error behavior, lifecycle,
   authentication, and how the real interface will be tested. State `None` when applicable.
8. **Acceptance Tests**: black-box `AT-AREA-NAME` checks linked to requirements.
9. **Journey Tests**: ordered `JT-AREA-NAME` acceptance scenarios, or a reason none are needed.
10. **Assumptions & Open Questions**: unresolved facts, deferrals, the reason for delivery
    choices, conditions that require more evidence or an earlier review point, and UI mock
    preference.
11. **Traceability**: links from needs through tests, with priority or risk when useful.

Feature/component and Slice/change specs may omit empty sections that do not apply. They must
still state the changed behavior, how it will be accepted, parent links, and open assumptions.
An internal change states which accepted behavior remains unchanged.

Specs describe observable behavior, not internal component design. `AT-*` describes one
black-box acceptance check. `JT-*` describes an ordered user or system journey.

## Design Contract

A design explains the structure, responsibilities, interfaces, data, important flows,
decisions, risks, and tests needed for the current work. It covers only the parts that matter.
For backend work, applicable API and database changes must be explicit.

Choose the boundaries that carry important contracts, ownership, state, risk, or change.
Use these as prompts, not as a checklist:

- **Backend or service:** APIs; database schema, ownership, transactions, and migration;
  services or modules; events and external systems; trust and deployment boundaries.
- **Web frontend:** routes and pages; component ownership; client and server rendering; local,
  shared, and server state; backend and browser interfaces.
- **Mobile app:** screens and navigation; UI, domain, and platform responsibilities; local
  storage, remote sync, and offline conflicts; backend APIs; OS services, permissions, and
  lifecycle.
- **Data or ML system:** source and destination schemas; batch and stream boundaries;
  transformations or model interfaces; data ownership and retention; training, serving, and
  monitoring.
- **Library, SDK, or CLI:** public API and compatibility; extension points; host or runtime
  integration; configuration, errors, and side effects.
- **Infrastructure or operations:** deployable units; network and trust boundaries; state
  ownership; configuration and secrets; rollout, failure isolation, and rollback.

Describe only the few boundaries that shape the solution. Explain their contracts, owners,
failure behavior, and how they will be checked.

Product/system designs start with **Technical Approach**. Older documents may use
**Technical Crux**. The checker expects this order:

1. **Overview**: context, scope, readiness, delivery choices, and extra checks.
2. **Tech Stack**: relevant choices, versions, and constraints.
3. **Drivers & Constraints**: requirements, quality goals, limits, and risks.
4. **Structure / Layers when applicable**: components and dependency direction. Do not add
   named layers when the design is direct.
5. **Components**: readable names, responsibilities, dependencies, and `COMP-*` IDs.
6. **Interfaces**: contracts, errors, compatibility, ownership, and `IFACE-*` IDs.
7. **Decision and I/O boundaries**: where decisions occur and where external effects occur.
8. **Key Flows**: important success, failure, state, concurrency, and integration flows.
9. **Data Model**: ownership, lifecycle, validation, migration, and privacy when relevant.
10. **Design Decisions**: `DEC-*` choices, alternatives, reasons, and consequences. Use an ADR
    for a decision that must stand alone.
11. **Test Strategy**: executable `TEST-AREA-NAME` checks, environment, what counts as pass
    or fail, real-system strategy, and owner.
12. **Risks & Trade-offs**: `RISK-*`, mitigations, remaining risk, and triggers for more review.
13. **Traceability**: links from requirements to components, interfaces, tests, and decisions.

If a design changes a public contract, name affected consumers and say whether the change is
compatible. For a breaking change, state supported versions, migration steps, how consumers
will be notified, and when old behavior may be removed.

Feature/component and Slice/change designs may link to the parent design and describe only
what changes. Use diagrams only when they make an important relationship easier to understand.

Cover build and release, environments, documentation, monitoring, errors, security, privacy,
reliability, performance, accessibility, and migration only when accepted requirements or
identified risks make them relevant. An important external dependency needs a test through
the real system or its official test interface, or explicit acceptance of what remains
untested.

Product/system designs include `design.html`. Smaller designs include it only when a visual
view helps review. Markdown remains the source of truth; keep the HTML view aligned with it.
If the spec requires a UI mock and no approved prototype exists, create or update
`mock-ui.html` and stop for explicit approval before writing production UI code. An existing prototype may be recorded as
`Approved Prototype Artifact: path`; the `ux.mock.approved` gate still applies.

## Plan Contract

A plan says what will change, in what order, what depends on what, how pieces will be combined,
how failure will be handled, and how success will be checked. Create one only when those
details are easier to review separately from the controlling slice.

Plan type and work outcome are separate choices. A Decision/evidence plan states the
question, decision owner, method, limits, stopping point or timebox, results, decision, and
next action. It does not claim that the product is ready to ship. It lists PRs only when an
experiment or prototype needs code.

Plans declare `Plan Type: Breakdown | Implementation` and start with **Implementation
Approach**. Older documents may use **Implementation Crux**.

- A **Breakdown plan** splits broad work into useful child outcomes. It does not authorize
  code.
- An **Implementation plan** describes one code-ready outcome as one or more reviewable PRs.
  A small change may have one PR.

The checker expects this order:

1. **Impact Map**: what changes, how it changes, who may be affected, and which child or PR
   owns it. A small change needs only a few bullets.
2. **Baseline Reuse**: what can be reused, what must be extracted, what stays local, what is
   new, and what is deferred.
3. **Overview**: goal, common fields, plan type, and branch or CI context.
4. **Strategy**: implementation, checks, extra risk work, integration, cleanup, and feedback.
5. **Milestones**: `MILE-AREA-NAME` outcome groups.
6. **Pull Requests / Child Work Items**: each with one `Work Classification:` value:
   `reuse directly`, `extract then reuse`, `target-owned implementation`, `new behavior`, or
   `deferred cleanup`.
7. **Coverage Map**: assigns all parent and local requirements and `TEST-*` checks.
8. **Work Groups**: optional coordination for near-term child work in a Breakdown plan.
9. **Sequencing & Risks**: dependencies, order, safe parallel work, conflicts, integration,
   rollback, ownership, and reasons to stop or change the plan.
10. **Traceability**: compact links among milestones, work items, PRs, inherited requirements,
    and tests.

For each `WORK-AREA-NAME` in a Breakdown plan, state what will work when it is done, its scope,
parent requirements, owner, dependencies, risks, required documents, readiness goal, how it
will be combined or reviewed, and what counts as done.

For each `PR-AREA-NAME` in an Implementation plan, state:

- the result and files, modules, or contracts expected to change;
- assigned requirement and test IDs;
- focused checks that state what counts as pass or fail;
- test level and real-system or fixture approach;
- applicable work for build, release, docs, errors, operations, security, privacy, UI, or
  migration;
- what the change should demonstrate, who or what can judge it, and what result would change
  the plan, including how feedback will be gathered;
- dependencies and integration needs; and
- the stakeholder UI review point when the PR completes a UI change based on an approved
  prototype; and
- why the PR is a coherent review unit.

When a plan has several PRs, state their dependencies, order, critical path, safe parallel
work, conflicts, and integration points. For a one-PR plan, say that there is only one PR and
omit empty dependency and parallel-work fields.

Also state the planned integration review points. Put one before feedback, contract,
integration, or risk results could materially change dependent PRs. A review point may cover
several related PRs, but it does not replace the focused assessment of each PR and must not be
delayed until the end of work too large to judge safely.

When no separate design exists, include only the structure, interfaces, data or state
behavior, trade-offs, and test approach needed for the change. Map `AT-*` and `JT-*`
directly to executable checks. If those decisions cannot stay short and clear, create and
assess a separate design.

When a Breakdown plan schedules near-term child work, each scheduled `WORK-*` appears once in
a `WAVE-AREA-NAME` block under `## Work Groups`:

```markdown
### WAVE-AREA-NAME
Order: 1
Expected Result: ...
Members: WORK-AREA-NAME
Parallel Limit: 1
Review Point: ...
Stop Conditions: ...
```

The block must be real Markdown, not a fenced example. Unscheduled work needs no group.
Implementation plans do not declare work groups.

Write the plan as Markdown in the selected document area. The workflow-status page is the
shared HTML view; do not create `plan.html` by default.

Older short-plan fields remain readable, but new plans do not need them.

## Code And Evidence Contract

`code-create` requires an approved code-ready slice or, when one exists, its explicitly
selected Implementation plan with `Ready To Implement: Yes`. A defect repair, refactor, or
mechanical change may work directly from the accepted baseline only when it intentionally
preserves observable behavior and protected contracts. For behavior changes, follow
the Red-Green-Refactor loop in
[test-ownership.md](test-ownership.md): see the smallest meaningful test fail for the expected
reason, make it pass with the minimum production-quality change, then improve the code while
the affected tests stay green.

Stay within the files expected to change. Record the exact commands run, their observed
results, and anything that could not be checked. Test names describe behavior. Sarathi IDs do
not belong in production or test source merely for traceability; keep those mappings in the
plan, assessment, or an optional external traceability record.

At each planned delivery boundary, create an identifiable Git change, run the planned focused
and affected checks, and assess that exact change independently. A delivery unit may be a
pull request or an exact commit/range; internal commits and review fixes do not create new
boundaries. Before a declared integration review
point, run its planned full and integration checks, cleanup, and simplification. Report
missing results as unavailable, never as passing.
Use a coverage or detailed test-link inventory only when the project or identified risk
requires one. At every planned delivery boundary, keep the planned test suite passing and
replace the short WIP position. Passing work continues automatically unless a protected gate,
invalidated intent, blocker, or required decision stops it. Do not regenerate product specs,
roadmaps, status, approvals, or unrelated process records at the boundary.

Keep the focused result in the rolling assessment report and current WIP position. Do not
create a delivery-result ledger at each boundary.
