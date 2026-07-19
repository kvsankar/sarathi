---
description: Independently review whether an implementation plan is clear, simple, safe, and testable.
agent: agent
---

# Plan Review

Review the target plan without editing it unless asked. Read earlier required documents,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/feedback-and-learning.md`, plus `docs/human-first-artifacts.md` and its five
first-page comprehension questions. Load `docs/work-decomposition.md` and
`docs/test-ownership.md` when applicable. Stop as `Blocked-upstream` when spec/design is
unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.

For corrected findings, focus re-review on those findings and affected boundaries. Restart
the full review only if requirements or scope changed.

## Judge

Lead with concrete problems. Check that an engineer can understand the outcome, exact
change, non-changes, sequence, safety constraints, files likely to change, and proof of
success without decoding IDs. Delivery items should be cohesive, testable, and safe to
undo. Splits and parallel work must have a real dependency or feedback reason. The plan
must reuse existing checks and be no more complicated than the requested change.

Start with simplification. Identify PRs/work items, unnecessary machinery, tests, generated files,
or handoffs that can be deleted, deferred, collapsed, or proven by existing evidence.
`Needs rework` must not default to more PRs or machinery. A plan with every required
section still fails when it is overbuilt.
Never recommend another document layer as the default fix. Require a concrete unanswered
question before splitting the work; otherwise link the approved documents and simplify.

If an engineer must decode IDs to understand the outcome, change boundary, sequence,
safety, or verification, move metadata to traceability and return `Needs rework`, even when
automatic checks pass.

Report blockers, evidence considered, concrete findings, what can be deleted, deferred, or reused,
top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not implement without explicit approval.
