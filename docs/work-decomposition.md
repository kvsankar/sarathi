# When Another Document Is Needed

Use this policy whenever another requirements, design, or planning document is considered.

## Default Path

Refer to approved earlier requirements, acceptance tests, design decisions, risks,
interfaces, and prototypes instead of copying them. If those documents plus one specific
implementation plan make the next change clear and safe, proceed to code.

One cohesive Implementation plan may contain several sequential UI slices when they share
accepted behavior and architecture. Each completed UI slice still stops for stakeholder
review. Many screens, a large feature, High-assurance delivery, easier traceability, or the
habit of creating child documents do not justify decomposition.

## Classify existing and new work

Before planning implementation, inspect the current system and relevant sibling services.
Do not call a capability new merely because the target service does not contain it. Classify
each substantial delivery item as exactly one of:

- `reuse directly`: existing code or a contract can be consumed without extraction;
- `extract then reuse`: working baseline behavior must first move behind a shared boundary;
- `target-owned implementation`: the target needs its own adapter, persistence, API, or
  domain behavior;
- `new behavior`: the capability does not exist in the baseline or shared code; or
- `deferred cleanup`: useful follow-up that does not block the stated goal.

A new or materially revised plan starts with a short `## Baseline Reuse` section and gives
each delivery item one `Work Classification:` line. Explain what exists today, what moves
to shared code, what remains target-owned and why, what is newly written, and what is
deferred. Use `none` where a category does not apply; a small change needs only a few
sentences, not a matrix.

For every Breakdown-plan slice, state the observable capability after that slice. Name
delivery slices for the result and boundary: for example, `Reuse job status with target
persistence`, not `Add job status` when another service already provides the behavior.

## Reasons To Split The Work

Create a Breakdown plan or child document only when at least one concrete condition exists:

1. A material product decision is unresolved.
2. A new or unclear external contract is introduced.
3. A material security, privacy, safety, migration, or irreversible-data risk lacks an
   accepted design.
4. Independently valuable outcomes require separate feedback.
5. Touch ownership or integration conflicts make one implementation increment unsafe.
6. Approved documents do not define observable behavior or acceptance.

For compatibility, use the matching checker value:
`unresolved-product-decision`, `new-or-unclear-external-contract`,
`unaccepted-material-risk`, `independent-feedback-outcomes`,
`touch-or-integration-conflict`, or
`missing-observable-behavior-or-acceptance`.

Create another document only when a specific unanswered question blocks implementation.
Keep it focused on that question, then return to the implementation plan and code. Do not
expand an isolated external-contract question into new UI, storage, or unrelated component
documentation.

## Keep New Documents Focused

New documents never rebuild the earlier inventory. They contain only changed or refined
behavior, unresolved local decisions, slice-specific acceptance, new risks or boundaries,
and explicit exceptions to parent intent. A child design describes only a changed boundary;
a child plan uses concise allocation/reference instead of copying inherited IDs into prose.

When no child spec or design is needed, use a short implementation plan. It references the
earlier documents and states the outcome, checks, files expected to change, UI review point
where applicable, and conditions that require more design work. Older marker fields remain
readable, but new plans do not need them.

## Assigning Split Work

A `WORK-*` item assigns work; it is not a document, approval, implementation level, or
instruction to create a document chain. Every allocation states:

- **Parent scope**, **Child scope**, and specific **Scope**;
- **Parent IDs / inherited obligations** by concise reference;
- **Required child documents**, normally one specific Implementation plan; name an
  additional document only with its concrete reason;
- dependencies, readiness target, risks, and done signal.

Breakdown plans may use a work group only when near-term children share a real feedback or
integration checkpoint. Unscheduled children have no group. Do not create a group merely to
record sequential PRs or UI slices inside one Implementation plan.

## Starting Implementation

`/code-create` runs from approved requirements plus a specific plan that is ready to
implement. It may implement a feature directly. Earlier `AT-*`, `JT-*`, and `TEST-*` obligations
remain owned by their source documents and are allocated by reference to planned PRs.

After each assessed slice, inspect new evidence before learning-dependent work. Approved
prototype work stops for stakeholder UI review after each completed UI slice. Revise parent
documents only when results change their requirements or boundaries.
