# Cross-Scope Test Ownership

Use this policy when requirements are broken down across product/system,
feature/component, and slice/change documents.

## Core Rule

Only a code-ready Implementation plan may invoke `/code-create`. The implementation leaf
is usually a slice/change, but a sufficiently small feature/component may itself be the
leaf. A leaf PR may implement production code and executable tests whose accepted intent
lives in any parent scope.

Test code is code. Product and feature documents therefore do not directly authorize
implementation, but their `AT-`, `JT-`, and design `TEST-` obligations must survive
the breakdown and become executable in child PRs or explicitly justified non-code
verification.

## Ownership Chain

| Scope | Owns test intent | Typical executable evidence implemented by leaves |
| --- | --- | --- |
| Product/system | Representative product `AT-`, cross-feature `JT-`, system NFR and operational acceptance intent. | System acceptance, cross-feature journey/e2e/API workflow, deployment smoke, and system quality-attribute tests. |
| Feature/component | Bounded feature `AT-`/`JT-` intent and design obligations for feature composition and boundaries. | Feature acceptance, component integration, contract, API workflow, and feature journey tests. |
| Slice/change | Exact behavior-delta `AT-`/`JT-` intent and local design obligations. | Slice acceptance, unit, component, contract, adapter/infrastructure integration, and regression tests. |

An `AT-` is an externally observable acceptance criterion, not automatically an integration
test. Design chooses the executable level and records a `TEST-` obligation and pass/fail check when
needed. Plan assigns that obligation to a child `WORK-` item or `PR-`; `/code-create`
implements it in the assigned code-ready leaf.

## Integration Placement

Do not defer all integration to one final phase. Allocate integration evidence at the
narrowest level that can prove the behavior:

1. Boundary-facing slice PRs add contract and focused adapter/infrastructure integration
   tests as the boundary is introduced.
2. Feature composition leaves verify collaboration among that feature's slices and execute
   assigned feature `AT-`/`JT-` obligations.
3. Product composition leaves verify cross-feature journeys, system acceptance, deployment
   behavior, and system quality attributes once their dependencies exist.

A Breakdown plan must create an explicit integration/acceptance `WORK-` item when an
obligation spans multiple children and cannot be honestly owned by one existing child. That
work item must follow [work-decomposition.md](work-decomposition.md): name its child scope
and required child documents, then reach a code-ready child Implementation plan before
`/code-create`. Standard child documents should reference clear parent requirements and design
rather than duplicate them. An eligible Lean slice may instead use its one Lean Change Record
at the scope that authorizes implementation.

## Planning And Evidence

Every parent `AT-`, `JT-`, and design `TEST-` obligation must be mapped to one or more child
work items, implementation PRs, or justified non-code verification. A child implementation
plan must preserve parent IDs in its Coverage Map and assign concrete test levels,
environments, fixtures/contracts, and pass/fail checks.

Keep these states distinct:

- **Declared**: the spec or design names the obligation.
- **Allocated**: a Breakdown or Implementation plan assigns an owner.
- **Implemented**: executable test code exists and its requirement link names the source obligation.
- **Executed**: a command or environment run produced evidence.
- **Passing/blocked**: observed results establish the current outcome.

A project may maintain a requirement-to-test inventory for audit or assurance needs. It does
not by itself prove execution, correctness, or a passing result and is not required by
Sarathi.
