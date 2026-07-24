# Where Tests Belong

Use this policy when requirements are broken down across product/system,
feature/component, and slice/change documents.

## Core Rule

Only an Implementation plan that is ready to implement may enter `code-create`. The change being
implemented is usually a slice/change, but a sufficiently small feature may be implemented
directly. Its PR may implement production code and executable tests whose approved
requirements live in an earlier document.

Test code is code. Approved requirements plus a specific Implementation plan authorize
implementation. Earlier `AT-`, `JT-`, and design `TEST-` obligations must survive
allocation and become executable in PRs or explicitly justified non-code
verification.

## Test-First Implementation

Behavior-changing code follows a short Red-Green-Refactor loop:

1. Write or update the smallest meaningful behavioral test.
2. Run it and observe it fail for the expected reason.
3. Implement the minimum production-quality change that makes it pass.
4. Run the focused test and affected suite, then refactor while they remain green.

The failing result matters: it shows that the test can detect the missing or incorrect
behavior. A test added only after the implementation is useful regression coverage, but it
is not evidence of test-first development.

When a failing automated test is not a sensible driver—such as docs or formatting only,
generated output, build/deployment configuration validation, or characterization of
unchanged legacy behavior—name the reason and run the closest repeatable validation. Do not
use an exception for ordinary feature behavior, defect fixes, contracts, validation,
security rules, or error behavior.

## Ownership Chain

| Scope | Owns test intent | Typical executable evidence implemented by leaves |
| --- | --- | --- |
| Product/system | Representative product `AT-`, cross-feature `JT-`, system NFR and operational acceptance intent. | System acceptance, cross-feature journey/e2e/API workflow, deployment smoke, and system quality-attribute tests. |
| Feature/component | Specific feature `AT-`/`JT-` requirements and design obligations for feature composition and boundaries. | Feature acceptance, component integration, contract, API workflow, and feature journey tests. |
| Slice/change | Exact behavior-delta `AT-`/`JT-` intent and local design obligations. | Slice acceptance, unit, component, contract, adapter/infrastructure integration, and regression tests. |

An `AT-` is an externally observable acceptance criterion, not automatically an integration
test. Design chooses the executable level and records a `TEST-` obligation and pass/fail check when
needed. Plan assigns that obligation to a child `WORK-` item or `PR-`; `code-create`
implements it in the assigned change.

## Integration Placement

Do not defer all integration to one final phase. Allocate integration evidence at the
narrowest level that can prove the behavior:

1. Boundary-facing slice PRs add contract and focused adapter/infrastructure integration
   tests as the boundary is introduced.
2. Feature composition leaves verify collaboration among that feature's slices and execute
   assigned feature `AT-`/`JT-` obligations.
3. Product composition leaves verify cross-feature journeys, system acceptance, deployment
   behavior, and system quality attributes once their dependencies exist.

A Breakdown plan creates an explicit integration/acceptance `WORK-` item only when an
obligation spans multiple children and cannot be honestly owned by one existing child. That
work item follows [work-decomposition.md](work-decomposition.md): name its child scope and
minimum required document, normally one specific Implementation plan. Do not create a child
spec or design unless a named uncertainty requires one.

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
