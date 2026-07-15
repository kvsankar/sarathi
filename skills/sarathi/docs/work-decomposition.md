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

`check_plan.py` mechanically rejects allocations missing parent scope, child scope, scope,
parent IDs/inherited obligations, or required child artifacts. Review still judges whether
the declared mapping and artifact chain are semantically appropriate.

Child artifacts should reference and refine parent intent rather than copy it. Referencing
the parent keeps them concise; it does not remove the requirement for a child spec, design,
and plan at the level that will authorize implementation.

## Scope And Traceability Rules

- The parent plan owns the `WORK-*` identifier and allocation status.
- The child spec begins the child artifact chain and records its parent plan and `WORK-*`
  identifier.
- Child design and plan preserve the same ancestry.
- Ancestor `AT-`, `JT-`, and `TEST-` obligations remain owned by their governing artifacts
  but are allocated to child implementation PRs through the Coverage Map.
- `/code-create` runs only from a code-ready child Implementation plan. It never runs from
  a parent Breakdown plan or directly from a `WORK-*` item.
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
