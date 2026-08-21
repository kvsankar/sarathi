# Where Tests Belong

Use this policy when requirements are broken down across product/system,
feature/component, and slice/change documents.

## Core Rule

Only an Implementation plan that is ready to implement may enter `code-create`. The change being
implemented is usually a slice/change, but a sufficiently small feature may be implemented
directly. Its PR may implement production code and executable tests whose approved
requirements live in an earlier document.

Test code is code. Approved requirements plus a specific Implementation plan authorize it.
Every earlier `AT-`, `JT-`, and design `TEST-` item must be assigned to a PR and become an
executable check, unless the plan gives a clear reason to verify it without code.

## Test-First Implementation

Behavior-changing code follows a short Red-Green-Refactor loop:

1. Write or update the smallest meaningful behavioral test.
2. Run it and observe it fail for the expected reason.
3. Implement the minimum production-quality change that makes it pass.
4. Run the focused test and affected suite, then refactor while they remain green.

The failing result matters: it shows that the test can detect the missing or incorrect
behavior. A test added only after the implementation is useful regression coverage, but it
is not evidence of test-first development.

Sometimes a failing automated test is not a useful starting point, such as for prose,
formatting, generated output, build configuration, or recording unchanged legacy behavior.
State why and run the closest repeatable check. This exception does not apply to normal
feature behavior, defect fixes, contracts, validation, security rules, or error behavior.

For parsers, decoders, protocol handlers, or highly variable untrusted input, use
property-based or fuzz testing when example cases cannot credibly cover the input space;
retain the seed or minimized failing input so failures are reproducible.

When a change affects shared state or concurrent work, test the relevant interleavings or
sustained contention at the narrowest realistic boundary and verify invariants such as no
lost or duplicate work, deadlock, ordering corruption, or broken idempotency.

## What Each Scope Defines

| Scope | Defines | Tests normally run for that scope |
| --- | --- | --- |
| Product/system | Representative product `AT-`, cross-feature `JT-`, system NFR, and operational acceptance criteria. | System acceptance, cross-feature journeys, API workflows, deployment smoke tests, and system quality tests. |
| Feature/component | Feature `AT-` and `JT-` requirements plus design tests for how the feature's parts work together. | Feature acceptance, component integration, contracts, API workflows, and feature journeys. |
| Slice/change | The exact changed behavior and its local design tests. | Acceptance, unit, component, contract, adapter or infrastructure integration, and regression tests. |

An `AT-` is an observable acceptance criterion, not automatically an integration test. The
design chooses the right test level and records a `TEST-` item that says what counts as pass or fail when
needed. The plan assigns that test to a child `WORK-` item or `PR-`; `code-create` implements
it in that change.

## Integration Placement

Do not leave all integration until the end. Run integration tests at the smallest level that
can prove the behavior:

1. Boundary-facing slice PRs add contract and focused adapter/infrastructure integration
   tests as the boundary is introduced.
2. Feature-level changes test how that feature's slices work together and run assigned
   feature `AT-` and `JT-` checks.
3. Product-level changes test cross-feature journeys, system acceptance, deployment, and
   system quality once their dependencies exist.

A Breakdown plan creates an integration or acceptance `WORK-` item only when a required test
spans several children and does not belong to one of them. That
work item follows [work-decomposition.md](work-decomposition.md): name its child scope and
minimum required document, normally one specific Implementation plan. Do not create a child
spec or design unless a named uncertainty requires one.

## Assigning And Running Tests

Every parent `AT-`, `JT-`, and design `TEST-` item must be assigned to one or more child work
items, PRs, or a justified non-code check. A child Implementation plan keeps the parent IDs
in its Coverage Map and states the test level, environment, fixtures or contracts, and what
counts as pass or fail.

Keep these states distinct:

- **Declared**: the spec or design names the required test.
- **Allocated**: a Breakdown or Implementation plan assigns an owner.
- **Implemented**: executable test code exists and links to the source requirement.
- **Executed**: the test was run and its result was recorded.
- **Passing/blocked**: observed results establish the current outcome.

A project may maintain a requirement-to-test inventory for audit or assurance needs. It does
not by itself prove execution, correctness, or a passing result and is not required by
Sarathi.
