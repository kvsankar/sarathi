# sarathi's Enduring Model

Sarathi turns agreed requirements into the smallest safe working change. It keeps the
decisions and results needed for review, splits work only when one change would be too hard
to understand safely, and changes the remaining plan when real feedback arrives.

The name comes from the Mahabharata, where Krishna serves as Arjuna's *sarathi*—his
charioteer and counsel. Krishna helps Arjuna see clearly and act with purpose without
replacing his agency. In the same spirit, sarathi guides engineers and AI agents through
complex software decisions while keeping human judgment responsible for the destination.

This is the stable model. Formatting rules, status fields, identifiers, ledgers, and
checker behavior support it; they are not the identity of the process.

## 1. Deliver In A Learning Loop

```text
accepted baseline + focused delta -> smallest safe increment -> evidence -> feedback -> adapt
```

The accepted baseline says what already must work. A focused slice says what intentionally
changes and how people can observe success. Defect repairs, refactors, and mechanical work
need a slice only when they intentionally change observable behavior or a protected contract.

Create a separate design only when a technical decision or risk is easier to review on its
own.

A simple slice may also contain the technical approach, delivery boundary, checks, rollback,
and review point. Create a separate plan only when decomposition, dependency, migration, or
risk makes independent planning useful.

Code and tests make the change work through short Red-Green-Refactor cycles: see a meaningful
test fail, make the smallest change that passes it, then improve the code while tests stay
green.

The result may confirm or change what comes next. Documents preserve useful decisions; they
are not a mandatory stage sequence.

## 2. Decompose When It Improves Delivery

Ask whether a competent engineer can understand, explain, review, and safely plan the work
as one coherent unit. If not, split it along a natural product or technical boundary.

Stop when each planned delivery unit is understandable, testable, independently reviewable,
and safe to integrate. A delivery unit is represented by a pull request or an exact Git
commit/range. Internal commits, test-first steps, and review fixes do not create new Sarathi
boundaries. Size alone is not the test, and splitting work does not automatically require
more documents. Use
[work-decomposition.md](work-decomposition.md) for the practical rule.

## 3. Separate Checks From Judgment

Each stage can be created, verified, reviewed, or assessed:

- **Create** writes or revises the work.
- **Verify** runs repeatable checks and states their limits.
- **Review** independently judges whether the result is clear, correct, simple, and safe.
- **Assess** combines verification and review.

This happens where it protects a real decision or delivery boundary, not after every internal
step. Every genuine delivery unit receives focused and affected checks, an exact Git identity,
and an independent focused assessment before dependent work continues.

Testing runs through the whole delivery loop: intent defines observable acceptance, optional
design or planning assigns special evidence when needed, and code develops behavior
test-first and records exact results.

Automatic checks establish only the facts they can observe. They never manufacture human
approval, stakeholder feedback, semantic correctness, or evidence from a real system.

## 4. Make Work Easy To Resume

Accepted baseline and slice documents keep the intent and decisions. Tests and assessment
records keep observed results. After each delivery unit, replace the short WIP note with the
completed Git identity, result, current work, and next action. This lets a new engineer or
agent resume without chat history and does not create a history ledger.

## 5. Match Review Timing And Evidence To Risk

All production work keeps approved intent, meaningful tests, honest feedback, required
approvals, and safety limits. Risk decides which extra checks are needed, where work must be
split, and whether design or planning needs separate review. It does not impose a named
document path. Protected privacy, safety, authority, migration, external-effect, release,
and production gates remain in force.

At meaningful release, feature-family, interdependency, contradiction, or material-staleness
boundaries, deliberately reconcile the baseline and accumulated deltas. Resolve
contradictions, superseded intent, temporary prototype behavior, and accidental
implementation details. Never reconcile after a fixed number of slices. A slice becomes
historical only after an approved coherent replacement baseline links it.

## 6. Keep Supporting Rules In Their Place

Documents lead with the product or technical explanation. Status leads with engineering
reality. Existing behavior is reused when appropriate. Traceability metadata stays
available without entering production code or interrupting the explanation. These rules
make the enduring model easier to use; they do not replace the model itself.
