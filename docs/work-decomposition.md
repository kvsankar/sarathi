# Work Decomposition And Child Artifacts

Use this policy whenever a Breakdown plan divides parent scope into `WORK-*` items.

## Core Model

A `WORK-*` item is an allocation record inside a parent Breakdown plan. It is not a Spec,
Design, Plan, Code artifact, approval gate, or implementation level. It names work that a
child scope must take through its own artifact chain.

The normal recursive mapping is:

```text
Product/system Breakdown plan
  -> WORK-FEATURE-*
  -> Feature/component spec
  -> Feature/component design
  -> Feature Breakdown or Implementation plan

Feature/component Breakdown plan
  -> WORK-SLICE-*
  -> Slice/change spec
  -> Slice/change design / LLD
  -> Slice/change Implementation plan
  -> Code + executable tests
```

A sufficiently small feature/component may become code-ready without another slice level.
Product-level integration, acceptance, migration, release, or other cross-feature work may
also allocate directly to a slice/change child when that is the smallest coherent executable
scope. The allocation remains owned by the product plan, but every resulting artifact and
all code are labeled with the child scope.

## Required Allocation Fields

Every `WORK-*` item in a Breakdown plan must state:

- **Parent scope**: the plan that owns the allocation.
- **Child scope**: `Feature/component` or `Slice/change`.
- **Scope**: the bounded outcome assigned to the child.
- **Parent IDs / inherited obligations**: requirements, design entities, and test intent the
  child must preserve.
- **Required child artifacts**: child spec, child design/HLD/LLD, and child Breakdown or
  Implementation plan as applicable.
- **Dependencies**, **readiness target**, **risks**, and **done signal**.

For work that can advance in parallel, also record the learning controls from
[feedback-and-learning.md](feedback-and-learning.md):

- learning target and feedback target;
- execution, learning, and integration dependencies as applicable;
- the invalidation question for sibling work;
- learning wave, WIP limit, integration/feedback checkpoint, and stop/replan trigger.

These controls distinguish useful agent parallelism from a speculative batch. Plan review
must reject a wave when feedback from one active slice could materially invalidate another
and the plan has no containment or cancellation strategy.

The identifier itself must use exactly `WORK-AREA-NAME`. Malformed one-token,
extra-token, lowercase, or numeric-placeholder forms fail plan verification. Status views
retain malformed allocation bullets in an explicit warning for repair, but exclude them
from valid allocation counts and child workflow branches.

`check_plan.py` mechanically rejects allocations missing parent scope, child scope, scope,
parent IDs/inherited obligations, or required child artifacts. Review still judges whether
the declared mapping and artifact chain are semantically appropriate.

Child artifacts should reference and refine parent intent rather than copy it. Referencing
the parent keeps them concise; it does not remove the requirement for a child spec, design,
and plan at the level that will authorize implementation.

## Scope And Traceability Rules

- The parent plan owns the `WORK-*` identifier and allocation status.
- The child spec begins the child artifact chain and records its parent plan plus a plain
  `Parent Work Item: WORK-<AREA>-<NAME>` metadata line.
- Child design and plan preserve the same plain `Parent Work Item:` line. This gives status
  renderers a deterministic link without inferring ancestry from prose or directories.
- Ancestor `AT-`, `JT-`, and `TEST-` obligations remain owned by their governing artifacts
  but are allocated to child implementation PRs through the Coverage Map.
- `/code-create` runs only from a code-ready child Implementation plan. It never runs from
  a parent Breakdown plan or directly from a `WORK-*` item.
- After each assessed code-ready leaf, run the inspect-and-adapt loop in
  [feedback-and-learning.md](feedback-and-learning.md) before starting learning-dependent
  siblings. Revise affected ancestors or the remaining breakdown when new evidence requires
  it; decomposition is not a promise to execute every originally listed allocation.
- Diagrams and status views show `WORK-*` as a parent-to-child allocation link. Artifact
  background encodes Spec/Design/Plan/Code; level labels encode the artifact's own scope.

## Integration Example

```text
Product Breakdown plan
  -> WORK-SYSTEM-INTEGRATION (parent allocation)
  -> Integration slice spec
  -> Integration slice design / LLD
  -> Integration slice Implementation plan
  -> System integration test code
```

The slice may implement product-owned acceptance, journey, integration, deployment, and
quality obligations. Traceability preserves that ownership; calling the code
"product-level code" would confuse governing intent with implementation scope.
