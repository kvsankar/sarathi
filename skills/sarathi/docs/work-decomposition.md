# Breaking Work Into Child Documents

Use this policy whenever a Breakdown plan divides parent scope into `WORK-*` items.

## Core Model

A `WORK-*` item assigns part of a parent Breakdown plan to a child. It is not itself a
Spec, Design, Plan, Code document, approval, or implementation level. The child normally
takes that work through its own Spec/Design/Plan chain. A code-ready Lean slice may instead
use the compact Lean Change Record defined in `docs/artifact-contracts.md`.

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

Lean code-ready Slice/change child
  -> WORK-SLICE-*
  -> Lean Change Record (compact Implementation plan)
  -> Code + executable tests
```

A sufficiently small feature/component may become code-ready without another slice level.
Product-level integration, acceptance, migration, release, or other cross-feature work may
also allocate directly to a slice/change child when that is the smallest coherent executable
scope. The assignment remains owned by the product plan, but every resulting document and
all code are labeled with the child scope.

## Required Allocation Fields

Every `WORK-*` item in a Breakdown plan must state:

- **Parent scope**: the plan that owns the allocation.
- **Child scope**: `Feature/component` or `Slice/change`.
- **Scope**: the bounded outcome assigned to the child.
- **Parent IDs / inherited obligations**: requirements, design entities, and test intent the
  child must preserve.
- **Required child artifacts**: the checker field listing either the standard child spec,
  design/HLD/LLD, and Breakdown or Implementation plan, or a Lean Change Record when the
  child is an eligible code-ready Lean slice.
- **Dependencies**, **readiness target**, **risks**, and **done signal**.

Breakdown plans record execution, learning, and integration dependencies for their
`WORK-*` children. They group child work into waves when work can proceed before the next
review point. A child Implementation plan lists the PRs needed for that one child; PRs do
not create or belong to waves.

The identifier itself must use exactly `WORK-AREA-NAME`. Malformed one-token,
extra-token, lowercase, or numeric-placeholder forms fail plan verification. Status views
retain malformed allocation bullets in an explicit warning for repair, but exclude them
from valid allocation counts and child workflow branches.

`check_plan.py` automatically rejects assignments missing parent scope, child scope, scope,
parent IDs/inherited obligations, or required child artifacts. Review still judges whether
the declared mapping and document chain make sense.

Child documents should reference and refine parent intent rather than copy it. Referencing
the parent keeps them concise. Standard work still needs a child spec, design, and plan; an
eligible Lean slice uses its compact Lean Change Record instead.

## Scope And Linking Rules

- The parent plan owns the `WORK-*` identifier and allocation status.
- The child spec begins a Standard child chain and records its parent plan plus a plain
  `Parent Work Item: WORK-<AREA>-<NAME>` metadata line.
- Child design and plan preserve the same plain `Parent Work Item:` line. A Lean Change
  Record also carries that line. This gives status renderers a reliable link without guessing
  the parent from prose or directories.
- Parent `AT-`, `JT-`, and `TEST-` obligations remain owned by their source documents
  but are allocated to child implementation PRs through the Coverage Map.
- `/code-create` runs only from a code-ready child Implementation plan, including a Lean
  Change Record. It never runs from a parent Breakdown plan or directly from a `WORK-*` item.
- After each assessed code-ready leaf, run the inspect-and-adapt loop in
  [feedback-and-learning.md](feedback-and-learning.md) before starting learning-dependent
  siblings. Revise affected parent documents or the remaining breakdown when new evidence
  requires it; a breakdown is not a promise to execute every originally listed item.
- Diagrams and status views show `WORK-*` as a parent-to-child assignment. Background color
  shows Spec/Design/Plan/Code; level labels show the document's own scope.

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
quality obligations. Requirement-to-test links preserve that ownership; calling the code
"product-level code" would confuse parent intent with implementation scope.
