---
description: Independently review implementation, tests, simplicity, evidence, feedback, and consistency with earlier documents.
agent: agent
---

# Code Review

Review code/tests without editing unless asked. Read earlier documents, the diff or
implementation, `.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`, `docs/document-locations.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`,
`docs/feedback-and-learning.md`, `docs/test-ownership.md`, `docs/cleanup-pass.md`, and
`docs/simplify-pass.md`, plus `docs/project-quality-gates.md` and
`docs/result-reporting.md`. For an authorized
review of the current system without a plan, follow `docs/project-entry.md`; otherwise block
when approved requirements or a plan ready for implementation are missing or unfit.

When `code-assess` runs these instructions in a fresh reviewer, this context is the review
pass: do not spawn another reviewer, edit files, write reports or WIP, or decide whether work
continues. Return findings and the verdict to the coordinating assessment. For a direct
`code-review`, use a fresh reviewer when available; otherwise disclose that it is not
independent. Do not rerun commands unless needed to resolve missing or contradictory evidence.

Follow the correction and re-review rules in `docs/review-verification-checklist.md`.

## Judge

State the result first. Then report actionable findings by severity with file and line
references. Ask: Does the code behave correctly? Are important failure cases covered? Does
it match the approved requirements and plan? Do tests have clear pass/fail results? Were
important external dependencies tested through a credible interface?
For behavior changes, inspect whether the evidence shows a meaningful test failing for the
expected reason before the implementation made it pass, followed by safe refactoring. Do
not infer test-first development merely because tests now exist or pass. Accept a non-Red
path only for a narrow case described in `docs/test-ownership.md` with credible replacement
verification.
Confirm that changed files match the plan, the committed local gate and hook are suitable
for the repository and passed, process IDs did not enter source, and the implementation is
no more complicated than the requested behavior.
Decide whether earlier documents must change using `docs/feedback-and-learning.md`. A defect where the
accepted documents are right and the code is wrong is a code fix, not a required document
revision. When an earlier document is genuinely wrong or incomplete, name the exact
obligations that block code—such as behavior, scope, contracts, acceptance criteria, tests,
or risk—and continue reviewing unrelated fixes.
For a Decision/evidence outcome, confirm the code stays within the experiment's limits, the
result supports the named decision, and no product-ready or deployment claim
is made.
Treat unexplained skips and expected failures as missing proof. A test may be skipped in one
environment when another named command or CI job runs it successfully. Private scans may
help the reviewer find suspicious skips or markers, but report only real problems, not scan
output or counts.

Start with simplification. Identify code, commands, tests, files, or PR boundaries that can
be removed, collapsed, deferred, or proved by existing checks. A green, traceable implementation can still be
`Needs rework` when overbuilt. Simplification may require revision of an earlier spec,
design, or plan; do not confine it to local refactoring.

Report the result first. List problems by severity, explain what the checks prove, say what
can be deleted, deferred, or reused, rank fixes by impact, and note feedback or changes needed
in earlier documents.
Return `Pass | Pass-with-fixes | Needs rework | Blocked-upstream` to the caller. For a direct
review only, write the scope-appropriate report from `docs/document-locations.md`, update WIP,
and stop according to the recorded approval policy. The `code-assess` coordinator owns its
rolling assessment report, WIP update, and continuation decision. Release and deployment
always require explicit approval.
