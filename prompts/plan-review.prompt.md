---
description: Independently review whether an implementation plan is clear, simple, safe, and testable.
agent: agent
---

# Plan Review

Review the target plan without editing it unless asked. Read earlier required documents,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`, `docs/document-locations.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/feedback-and-learning.md`, plus `docs/human-first-artifacts.md` and its first-page
comprehension questions, plus `docs/work-decomposition.md`. Load
`docs/test-ownership.md`. Stop as `Blocked-upstream` when spec/design is unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.

For corrected findings, focus re-review on those findings and affected boundaries. Restart
the full review only if requirements or scope changed.

## Judge

Lead with concrete problems. Check that an engineer can understand why this is a Breakdown
or Implementation plan, the outcomes, Impact Map, dependency graph, sequence, parallel
paths, integration points, safety constraints, and proof without decoding IDs. The Impact
Map must identify the nature and useful extent of changes—not just filenames—including
affected contracts, data/schema, tests, delivery/operations, documentation, consumers,
compatibility, ownership, and conflicts when applicable. Do not demand irrelevant entries
or LOC estimates.

First ask whether a competent engineer could understand, explain, review, and safely plan
the work as one coherent unit. If so, reject an unnecessary Breakdown plan. If not, check
that the chosen boundaries make every child understandable, testable, and safe to
integrate. For an Implementation plan, check that PR nodes have coherent outcomes, impact
allocation, verification, and applicable rollback. When there is more than one PR, require
meaningful graph edges, merge order, safe parallel paths, critical path, conflicts, and
integration points. A one-PR plan is a one-node graph and omits empty topology fields.
For a Decision/evidence outcome, judge the evidence method, decision owner, boundaries,
timebox or stop condition, and next action rather than demanding a shippable result.

For every behavior-changing PR, require a credible Red-Green-Refactor sequence: the first
meaningful behavioral test and expected failure, the minimum implementation that should
make it pass, then safe cleanup with focused and affected tests green. Accept a non-Red path
only for a narrow case in `docs/test-ownership.md` with replacement verification.

Check the baseline before accepting claims of new implementation. Every substantial item
must say whether it reuses, extracts, stays target-owned, adds new behavior, or defers
cleanup. Reject plans that hide existing capability, omit the shared-versus-target boundary,
or call a prerequisite a completed feature. Breakdown items must state the observable
capability they leave working.

Start with simplification. Identify PRs/work items, unnecessary machinery, tests, generated files,
or handoffs that can be deleted, deferred, collapsed, or proven by existing evidence.
`Needs rework` must not default to more PRs or machinery. A plan with every required
section still fails when it is overbuilt.
Never recommend another document layer merely because work was decomposed. Require it only
when a specific unanswered requirement or design question blocks a child.

If an engineer must decode IDs to understand the outcome, change boundary, sequence,
safety, or verification, move metadata to traceability and return `Needs rework`, even when
automatic checks pass.

Report blockers, evidence considered, concrete findings, what can be deleted, deferred, or reused,
top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Write/update
the scope-appropriate report from `docs/document-locations.md`: `plan-review.md` only for
Product/system, otherwise `<work-slug>.plan-review.md`. Update WIP and stop according to the
recorded approval policy. Human checkpoints require explicit approval; automatic approval
needs an eligible local policy and explicit end-to-end continuation before implementation.
