# Execution-First Work Boundaries

Use this policy at every planning boundary and whenever a Breakdown plan is considered.

## Default Path

Accepted parent requirements, acceptance tests, design decisions, risks, interfaces, and
approved prototypes are inherited by reference. Ask whether those artifacts plus one
bounded Implementation plan safely authorize the next reviewable increment. If they do,
make the feature/component or slice/change code-ready and proceed to code.

One cohesive Implementation plan may contain several sequential UI slices when they share
accepted behavior and architecture. Each completed UI slice still stops for stakeholder
review. Many screens, a large feature, High-assurance delivery, easier traceability, or the
habit of creating child documents do not justify decomposition.

## Permitted Decomposition

Create a Breakdown plan or child artifact only when at least one concrete condition exists:

1. A material product decision is unresolved.
2. A new or unclear external contract is introduced.
3. A material security, privacy, safety, migration, or irreversible-data risk lacks an
   accepted design.
4. Independently valuable outcomes require separate feedback.
5. Touch ownership or integration conflicts make one implementation increment unsafe.
6. Accepted artifacts do not define observable behavior or acceptance.

Use the matching checker value:
`unresolved-product-decision`, `new-or-unclear-external-contract`,
`unaccepted-material-risk`, `independent-feedback-outcomes`,
`touch-or-integration-conflict`, or
`missing-observable-behavior-or-acceptance`.

Apply the Ceremony Budget from `docs/simplicity-first.md`. Create only the smallest delta
artifact that resolves the named uncertainty, then return immediately to an Implementation
plan and code. Do not expand an isolated external-contract question into new UI, storage,
or unrelated component documentation.

## Inherited Intent And Delta Documents

Child documents never rebuild the parent inventory. They contain only changed or refined
behavior, unresolved local decisions, slice-specific acceptance, new risks or boundaries,
and explicit exceptions to parent intent. A child design describes only a changed boundary;
a child plan uses concise allocation/reference instead of copying inherited IDs into prose.

When no child spec or design is needed, use an Inherited-Intent Implementation Record in the
bounded plan. It states the inherited sources, reviewable outcome, acceptance/verification,
planned touch set, UI review point where applicable, and escalation conditions. The legacy
`Lean Change Record: Yes` marker remains accepted for existing records.

## Breakdown Allocations

A `WORK-*` item assigns work; it is not a document, approval, implementation level, or
instruction to create a document chain. Every allocation states:

- **Parent scope**, **Child scope**, and bounded **Scope**;
- **Parent IDs / inherited obligations** by concise reference;
- **Required child artifacts**, normally `bounded Implementation plan`; name an additional
  delta artifact only with its concrete decomposition reason;
- dependencies, readiness target, risks, and done signal.

Breakdown plans may use `WAVE-*` only when near-term children share a real feedback or
integration checkpoint. Unscheduled children have no wave. Do not create a wave merely to
record sequential PRs or UI slices inside one Implementation plan.

## Code Boundary

`/code-create` runs from accepted intent plus a code-ready bounded Implementation plan. It
may implement a feature/component directly. Parent `AT-*`, `JT-*`, and `TEST-*` obligations
remain owned by their source artifacts and are allocated by reference to planned PRs.

After each assessed slice, inspect new evidence before learning-dependent work. Approved
prototype work stops for stakeholder UI review after each completed UI slice. Revise parent
artifacts only when evidence changes their intent or boundaries.
