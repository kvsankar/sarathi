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
`docs/test-ownership.md` and `docs/result-reporting.md`. Use `Blocked-upstream` when a required
earlier document is unfit. A Lean plan without a standalone design is not blocked merely
because that document does not exist.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples. Follow the correction and re-review rules in
`docs/review-verification-checklist.md`.

## Judge

State the result first, then report concrete problems. Ask: Can an engineer explain why this
is a Breakdown or Implementation plan? Is the intended result clear? Does the Impact Map say
what changes, not just list files? Are dependencies, order, work that can run together,
integration, safety, and tests clear without decoding IDs? Include contracts, data, tests,
operations, documentation, consumers, compatibility, ownership, and conflicts only when they
apply. Do not demand irrelevant entries or LOC estimates.

First ask whether one engineer can understand, review, test, and integrate the work safely.
For Lean or Standard, reject an unnecessary Breakdown plan. A Lean plan without a design
must still contain clear Technical Decisions. For High-assurance, require clear limits around
material risks, recovery, feedback, and integration. Accept a direct Implementation plan only
when it is already one safe change and says why. Otherwise, check that every part is
understandable, testable, and safe to integrate. Each PR needs a clear result, expected
changes, tests, and rollback when needed. With multiple PRs, require dependencies, merge
order, work that can run together, likely conflicts, where the parts must be tested together,
and the dependency chain that controls completion. A one-PR plan needs no empty dependency
fields.
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

Start with simplification. Identify PRs, work items, unnecessary machinery, tests, generated
files, or steps between stages that can be deleted, deferred, combined, or covered by
existing checks. Never remove a required approval stop.
`Needs rework` must not default to more PRs or machinery. A plan with every required
section still fails when it is overbuilt.
Never recommend another document layer merely because work was decomposed. Require it only
when a specific unanswered requirement or design question blocks a child.

If an engineer must decode IDs to understand the outcome, change boundary, sequence,
safety, or verification, move metadata to traceability and return `Needs rework`, even when
automatic checks pass.

Report the result first. List problems by severity, explain what the checks prove, say what
can be deleted, deferred, or reused, and rank fixes by impact. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat. Write/update
the scope-appropriate report from `docs/document-locations.md`: `plan-review.md` only for
Product/system, otherwise `<work-slug>.plan-review.md`. Update WIP and stop according to the
recorded approval policy. Human checkpoints require explicit approval; automatic approval
needs an eligible local policy and explicit end-to-end continuation before implementation.
