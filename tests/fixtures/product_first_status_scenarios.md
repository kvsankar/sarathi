# Product-first Status Regression Scenarios

These scenarios use neutral service boundaries. They test the reporting model, not a
particular product or architecture.

## Scenario A: existing capability, partial extraction, new target

Given an established service that already generates CSV and PDF reports, tracks jobs,
retries failures, and supports cancellation; a shared package that contains only the file
renderers; and a target service with no export-job persistence or API:

- the established service's report capability is working today;
- the file renderers are reusable today;
- job coordination is `extract then reuse`;
- target job persistence and API routes are `target-owned implementation`;
- broader shared extraction is incomplete; and
- target report implementation has not started.

Forbidden: `The export refactor is complete`, `Build job status` without acknowledging the
baseline, treating all target work as new, or leading with approvals and checker totals.

## Scenario B: completed prerequisite, incomplete feature

A completed shared-renderer prerequisite is reported by its exact scope and names the target
work it unlocks. The target report feature remains incomplete until its target-owned work is
implemented and checked.

## Scenario C: deferred cleanup

Migrating historical export records is deferred and non-blocking. It does not appear under
work required before target coding unless a later requirement or risk makes it necessary.

## Scenario D: status request

The answer starts with an identifier-free product snapshot: goal, working capability,
reusable capability, current increment, remaining shared work, target-owned work, deferred
work, coding blockers, and one next action. Process evidence follows only when useful.

## Before and after

Before: `Plan approved; renderer extraction complete; next stage is code-create.`

After: `Shared renderer extraction: complete. Report exports still work only in the
established service. Job coordination remains to be extracted, and target persistence and
API implementation have not started. Review the target persistence design next.`
