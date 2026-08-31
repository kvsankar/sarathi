# Decomposing Work

Decomposition reduces mental load. Ask one question first:

> Can a competent engineer understand, explain, review, and safely plan this work as one
> coherent unit?

If yes, keep it together. If no, decompose it.

Use the coherence test directly. Named delivery profiles do not decide the document path.

## Find A Natural Boundary

Split along a boundary that makes each part easier to understand, such as:

- a useful product capability or observable outcome;
- a component, responsibility, or data owner;
- an interface or external dependency;
- a material risk or migration step; or
- a feedback or integration point.

Stop splitting when each part is understandable, testable, and can be integrated safely.
Size alone is not the test: large but coherent work may stay together, while a smaller
change with tangled responsibilities may need decomposition.

## Choose The Delivery Boundaries

One slice normally maps to one planned delivery unit. Here, PR means that planned unit: it
may be a pull request or an exact commit/range in a direct-to-main workflow. Internal
implementation commits, test-first chronology, and review-fix amendments do not create
additional Sarathi boundaries.

Keep one compact slice document when it can name the observable delta, technical approach,
delivery unit, checks, rollback, and review point clearly. Create an Implementation plan
when reviewability, risk, migration, dependency feedback, or learning requires several
delivery units or more detailed sequencing. Keep one controlling slice delta and name each
delivery boundary in the plan.

Use a Breakdown plan only when broad work must first be divided into independently useful child
outcomes. Each child states what will work when it is complete, what it depends on, and
where it rejoins through feedback or integration. The Breakdown plan organizes the children;
it does not authorize code.

An unanswered requirement, contract, or design question does not by itself require a
Breakdown plan. Resolve that question where it belongs, then plan the implementation.

## Add Documents Only When Needed

Decomposing work does not automatically mean creating more specifications or designs. A
child uses the accepted baseline and controlling slice unless a specific unanswered question
prevents safe implementation. Any new document answers only that question and does not
repeat the parent inventory.

## Check Existing Work

Before planning, inspect the current system and relevant sibling services. For each
substantial item, say briefly whether it will:

- `reuse directly`;
- `extract then reuse`;
- `target-owned implementation`;
- `new behavior`; or
- `deferred cleanup`.

Explain only the categories that apply. A small change needs a few sentences, not a matrix.

## Describe Breakdown Children

A `WORK-*` item is an allocation, not a mandatory document layer. Give every child:

- an observable outcome and clear scope;
- the accepted parent intent it inherits;
- the minimum documents it needs, which may be the controlling slice alone;
- an owner, dependencies, important risks, and a done signal; and
- its feedback or integration point.

Use a work group only when near-term children share a real feedback or integration
checkpoint. Do not use one merely to group sequential PRs. Unscheduled children need no
group.

The `code-create` command starts from an approved code-ready slice or, when one is needed, its
specific Implementation plan. After each assessed delivery unit, use the evidence to confirm
or revise the remaining work and controlling documents.
