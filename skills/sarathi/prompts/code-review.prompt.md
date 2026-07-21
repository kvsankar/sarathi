---
description: Independently review implementation, tests, simplicity, evidence, feedback, and consistency with earlier documents.
agent: agent
---

# Code Review

Review code/tests without editing unless asked. Read earlier documents, the diff or
implementation, `.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`,
`docs/feedback-and-learning.md`, `docs/test-ownership.md`, `docs/cleanup-pass.md`, and
`docs/simplify-pass.md`, plus `docs/project-quality-gates.md`. For an authorized
existing-system baseline review, follow `docs/project-entry.md`; otherwise block when
approved requirements or an implementable plan are missing or unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples. Do not rerun commands unless needed to
resolve missing or contradictory evidence.

For corrected findings, focus re-review on those findings and affected boundaries. Restart
a full review only if requirements or scope changed.

## Judge

Lead with actionable findings ordered by severity and grounded in file/line references.
Check correctness, important edge cases, fit with the approved documents, meaningful tests
with clear pass/fail results, and whether external dependencies were tested credibly.
For behavior changes, inspect whether the evidence shows a meaningful test failing for the
expected reason before the implementation made it pass, followed by safe refactoring. Do
not infer test-first development merely because tests now exist or pass. Accept a non-Red
path only for a narrow case described in `docs/test-ownership.md` with credible replacement
verification.
Confirm that changed files match the plan, the committed local gate and hook are suitable
for the repository and passed, process IDs did not enter source, and the implementation is
no more complicated than the requested behavior.
Treat unexplained skips and expected failures as evidence gaps. An environment-specific
skip is acceptable when another explicit command or CI job runs that boundary successfully;
the marker inventory alone neither rejects the code nor proves the evidence sufficient.

Start with simplification. Identify code, commands, tests, files, or PR boundaries that can
be removed, collapsed, deferred, or proved by existing checks. A green, traceable implementation can still be
`Needs rework` when overbuilt. Simplification may require revision of an earlier spec,
design, or plan; do not confine it to local refactoring.

Report findings, blockers in earlier documents, evidence limits, what can be deleted,
deferred, or reused, top fixes, feedback and earlier-document changes, and
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and stop;
do not start another PR, release, or deployment without explicit approval.
