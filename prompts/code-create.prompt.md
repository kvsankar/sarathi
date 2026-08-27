---
description: Implement an approved plan test-first, using Red-Green-Refactor for behavior changes and recording clear results.
agent: agent
---

# Code Create

Implement the selected approved plan one reviewable PR at a time. A passing PR may lead
directly to the next planned PR in the same turn.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, approved earlier documents, the implementation plan,
current code/tests, and repository check commands. A compact plan may link approved parent
documents instead of repeating them. Load `docs/artifact-contracts.md` for the Code and
Evidence contract, `docs/test-ownership.md` for test-first implementation, and
`docs/feedback-and-learning.md` when coordinated work is active. Load
`docs/result-reporting.md` for the final report.

Load only when the trigger applies:

- assurance profiles and cross-cutting concerns for an assigned check, escalation, or risk;
- project quality gates when its configuration or hook needs work;
- simplicity-first for unnecessary machinery, refactoring, or simplification; and
- cleanup, simplify, and formatting guidance immediately before reporting.

Block unless the plan clearly says what to build, required approvals exist, and required
earlier documents are fit. A feature/component plan may authorize code directly without a
`WORK-*` allocation.
When one exists, `.sdlc/wip.md` selects it. If coordinated work has a declared limit or
checkpoint, enforce it. Confirm the expected files, first failing tests, smallest intended
change, required behavior and tests, how each check will pass or fail, risks, reviewer,
dependencies, and reasons to stop or change the plan.
For a `Decision/evidence` outcome, stay within its limits, record its result and next action,
and do not claim product readiness or deploy without new product-increment requirements.

Reuse the repository's documented local gate and hook. When missing, add the smallest gate
authorized by the plan and keep slow or environment-heavy checks in CI.
Use `.sdlc/wip.md` to select the current `WORK-*` item and planned PR. When coordinated work
is active, enforce its group and parallel-work limit. Do not start additional work merely
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
status `revision-required` only for the exact obligations that make affected implementation
unsafe to continue; unrelated fixes may proceed. When the accepted document is right and
the code is wrong, fix the code without reopening the document. Do not add product machinery
merely to satisfy the process.

## Finish Each Planned PR

At each planned PR boundary:

1. Run the PR's focused and affected tests, applicable project gate, and assigned extra
   checks. Run full, build, documentation, deployment, or environment checks here only when
   the plan or repository requires them for this PR.
2. Create an identifiable Git boundary, normally one commit. If the PR needs several commits,
   record the exact base and head range.
3. Run `code-assess` against that exact change. Its independent review stays focused on this
   PR's assigned behavior, tests, changed boundaries, and risks.
4. Correct blocking findings, rerun affected checks, and reassess the fixes. Do not restart
   unchanged checks or review unrelated earlier PRs.
5. When the PR passes, update the plan's rolling code-assessment report and replace the WIP
   bookmark with the completed PR, reviewed commit or range, result, current PR, and next
   action.

Focused and affected checks and the independent assessment must pass before dependent work
continues. Passing a PR does not require status generation, a roadmap update, a fresh
approval for unchanged documents, or a user-facing pause. Continue to the next planned PR
when policy and safety permit it.

Do not run live production deployment or checks without explicit user approval. Report
unavailable checks and remaining risk rather than treating them as passed.

Clean up and simplify, using the correction rule in
`docs/review-verification-checklist.md` for review fixes. Remove debug leftovers, dead code, stale comments, brittle or
theatrical tests/checks, misleading docs, and unjustified abstractions within scope. Rerun
affected checks.

At each review point declared by the plan, run its integration and full applicable checks and
an independent integration assessment against the exact combined code state. Reuse the
completed PR assessments; review the interaction, accumulated risk, required feedback, and
readiness for the next planned group instead of reviewing every PR again.

## Result

Update `.sdlc/wip.md` and report:

- the product result and changed paths;
- exact test and project-check commands with a plain explanation;
- observed Red-Green-Refactor evidence, or the reason and replacement check;
- separate code, verification, and document problems; and
- assumptions, risks, feedback, earlier-document changes, and priority next actions.

Stop when the recorded policy requires approval at the current boundary. A plan approval does
not create an extra approval after every PR unless the plan or policy explicitly requires a
code-slice gate. Required document changes (`revision-required`), missing feedback, protected
actions, release, and deployment boundaries still block affected work.
For approved-prototype UI work, this stop is a mandatory stakeholder UI review after every
completed UI change.
