---
description: Independently review implementation, tests, simplicity, evidence, feedback, and consistency with earlier documents.
agent: agent
---

# Code Review

Review code/tests without editing unless asked. Read earlier documents, the diff or
implementation, `.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`,
`docs/feedback-and-learning.md`, `docs/test-ownership.md`, `docs/cleanup-pass.md`, and
`docs/simplify-pass.md`. For an authorized existing-system baseline review, follow
`docs/project-entry.md`; otherwise block when approved requirements or an implementable plan are missing or unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples. Do not rerun commands unless needed to
resolve missing or contradictory evidence.

For corrected findings, focus re-review on those findings and affected boundaries. Restart
a full review only if requirements or scope changed.

## Judge

Lead with actionable findings ordered by severity and grounded in file/line references.
Check correctness, important edge cases, fit with the approved documents, meaningful tests
with clear pass/fail results, and whether external dependencies were tested credibly.
Confirm that changed files match the plan, project checks passed, process IDs did not enter
source, and the implementation is no more complicated than the requested behavior.

Start with simplification. Identify code, commands, tests, files, or PR boundaries that can
be removed, collapsed, deferred, or proved by existing checks. A green, traceable implementation can still be
`Needs rework` when overbuilt. Simplification may require revision of an earlier spec,
design, or plan; do not confine it to local refactoring.

Report findings, blockers in earlier documents, evidence limits, what can be deleted,
deferred, or reused, top fixes, feedback and earlier-document changes, and
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and stop;
do not start another PR, release, or deployment without explicit approval.
