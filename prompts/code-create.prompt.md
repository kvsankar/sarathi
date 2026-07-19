---
description: Implement an approved plan that is ready to implement, with behavioral tests and clear check results.
agent: agent
---

# Code Create

Implement the selected approved plan and keep each delivery item usable and testable.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, approved earlier documents, the implementation plan,
current code/tests, and repository check commands. A compact plan may link approved parent
documents instead of repeating them. Load `docs/artifact-contracts.md` for the Code and
Evidence contract and `docs/feedback-and-learning.md` when coordinated work is active.

## Triggered References

Load only when the trigger applies:

- `docs/test-ownership.md`: the plan maps inherited `AT-*`, `JT-*`, or `TEST-*` obligations;
- `docs/assurance-profiles.md` and `docs/cross-cutting-concerns.md`: an assigned additional
  check, escalation, or new risk needs interpretation;
- `docs/simplicity-first.md`: implementation exposes unnecessary machinery, a refactor, or a
  simplification decision;
- `docs/cleanup-pass.md`, `docs/simplify-pass.md`, and `docs/artifact-formatting.md`:
  immediately before handoff.

Block unless the plan is specific enough to implement, required approvals exist, and earlier documents are
fit. A feature/component plan may authorize code directly without a `WORK-*` allocation.
When one exists, `.sdlc/wip.md` selects it. If coordinated work has a declared limit or
checkpoint, enforce it. Confirm the expected files, first failing tests, smallest intended
implementation, required behavior/tests, pass/fail checks, risks, who or what will review the result,
dependencies, and reasons to stop or replan.

Update `.sdlc/wip.md` with the exact active `WORK-*` item and, when applicable, its active
`WAVE-*`. Do not exceed its declared parallel-work limit. Do not start additional work merely
because an agent is available.

## Implement

For every behavior-changing step, add or update the smallest meaningful test with a clear
pass/fail check, implement the minimum production-quality change, and rerun the focused test
and affected suite. Refactor only after behavior is protected by that verification.

Implement assigned `AT-*`, `JT-*`, and `TEST-*` obligations at their planned levels. Add
supplemental inner tests when discovered, but do not use them to replace accepted coverage.
Keep test names and bodies behavior-focused. Never put process IDs in production or test
names, comments, docstrings, decorators, annotations, runtime values, logs, metrics, API
responses, or generated source merely for traceability. A justified test-link inventory is
external to source; Sarathi does not require one.

Stay inside the expected file scope. Stop to revise earlier documents when implementation reveals
new user-visible behavior, changed contracts/UX/NFRs, material module risk, or invalidated
assumptions. Never fabricate stakeholder, real-system, or execution evidence.
If implementation exposes an overbuilt parent design or plan, record the exact machine
status `revision-required` and simplify that document before continuing. Do not add product
machinery merely to satisfy the process.

## Verify The Boundary

Run focused and full planned tests, formatter/linter/type/static/security checks, pre-commit
or repository equivalent, build/docs/deployment/environment checks, and all additional checks
assigned to this PR. Run coverage only when the repository policy or accepted risk profile
requires it.

Do not run live production deployment or checks without explicit user approval. Report
unavailable checks and remaining risk rather than treating them as passed.

Run cleanup then simplify. Remove debug leftovers, dead code, stale comments, brittle or
theatrical tests/checks, misleading docs, and unjustified abstractions within scope. Rerun
affected checks.

## Handoff

Update `.sdlc/wip.md` and report:

- changed paths and what they now do;
- exact test and project-check commands with results;
- unavailable checks, assumptions, risks, and relevant feedback;
- changes needed in the spec, design, remaining plan, or code, and whether `/code-assess`
  can start.

Stop for human review after the code change. Do not start the next feedback-dependent PR,
release, or deployment without explicit approval or a latest-message unattended
instruction; required document changes (`revision-required`) or missing feedback
(`feedback-required`) still block affected work.
For approved-prototype UI work, this stop is a mandatory stakeholder UI review after every
completed UI change.
