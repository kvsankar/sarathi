---
description: Implement an approved plan test-first, using Red-Green-Refactor for behavior changes and recording clear results.
agent: agent
---

# Code Create

Implement the selected approved plan and keep each delivery item usable and testable.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, approved earlier documents, the implementation plan,
current code/tests, and repository check commands. A compact plan may link approved parent
documents instead of repeating them. Load `docs/artifact-contracts.md` for the Code and
Evidence contract, `docs/test-ownership.md` for test-first implementation, and
`docs/feedback-and-learning.md` when coordinated work is active.

## Triggered References

Load only when the trigger applies:

- `docs/assurance-profiles.md` and `docs/cross-cutting-concerns.md`: an assigned additional
  check, escalation, or new risk needs interpretation;
- `docs/project-quality-gates.md`: inspect the project gate before implementation and load
  the policy when its configuration or hook is missing or needs to change;
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

For a `Decision/evidence` outcome, implement only the planned experiment or prototype within
its stated boundaries. Record the evidence, decision, and next action; do not claim product
readiness or deploy the result without new product-increment requirements.

Inspect the repository's documented local gate and hook. Reuse them when present. When
missing, configure and document the smallest ecosystem-appropriate gate authorized by the
plan, install it in the working checkout, and keep slow or environment-heavy checks in CI.

Update `.sdlc/wip.md` with the exact active `WORK-*` item and, when applicable, its active
`WAVE-*`. Do not exceed its declared parallel-work limit. Do not start additional work merely
because an agent is available.

## Implement

For every behavior-changing step, use Red-Green-Refactor: add or update the
smallest meaningful test of the behavior. Run it and observe it fail for the expected
reason, then implement the minimum production-quality change that makes it pass. Rerun the
focused test and affected suite. Refactor only while they remain green.

If a failing automated test is not a sensible driver, use only the narrow cases and
replacement verification in `docs/test-ownership.md`. State the reason and observed result;
do not describe post-hoc regression coverage as test-first evidence.

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

Run focused and full planned tests, the project gate required by
`docs/project-quality-gates.md`, build/docs/deployment/environment checks, and all additional checks
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
- the observed Red-Green-Refactor evidence, or the narrow reason and replacement check when
  a failing test was not a sensible driver;
- unavailable checks, assumptions, risks, and relevant feedback;
- changes needed in the spec, design, remaining plan, or code, and whether `/code-assess`
  can start.

Stop according to the recorded approval policy after the code change. Human checkpoints
require explicit approval; automatic approval needs an eligible local policy and a
latest-message unattended instruction. Required document changes (`revision-required`),
missing feedback, release, and deployment boundaries still block affected work.
For approved-prototype UI work, this stop is a mandatory stakeholder UI review after every
completed UI change.
