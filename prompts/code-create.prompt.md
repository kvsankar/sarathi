---
description: Implement an approved slice or plan test-first, using Red-Green-Refactor for behavior changes and recording clear results.
agent: agent
---

# Code Create

Implement the selected approved slice or plan one planned delivery unit at a time. For
conforming defect repair, refactor, or mechanical work, use the accepted baseline directly.
A passing unit may lead directly to the next planned unit in the same turn.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted baseline, controlling slice, optional
design or implementation plan, current code/tests, and repository check commands. Load
`docs/artifact-contracts.md`, `docs/test-ownership.md`, and `docs/result-reporting.md`. Load
`docs/feedback-and-learning.md` when coordinated work is active.

Load only when the trigger applies:

- assurance and cross-cutting concerns for an assigned check or risk;
- project quality gates when its configuration or hook needs work;
- `docs/work-decomposition.md` when new user input adds or redirects work during delivery;
- simplicity-first for unnecessary machinery, refactoring, or simplification.

Block unless the controlling slice or plan clearly says what to build, or baseline-only
maintenance preserves observable behavior and protected contracts. Required approvals and
authorities must be fit. A compact slice needs no separate design, plan, or `WORK-*` allocation.
When one exists, `.sdlc/wip.md` selects it. If coordinated work has a declared limit or
checkpoint, enforce it. Confirm the expected files, first failing tests, smallest intended
change, required behavior and tests, how each check will pass or fail, risks, reviewer,
dependencies, and reasons to stop or change the controlling document.
Reuse the repository's documented local gate and hook. When missing, add the smallest gate
authorized by the plan and keep slow or environment-heavy checks in CI.
Use WIP to select the current `WORK-*` and delivery unit. Enforce any group and parallel
limit; agent availability does not justify more work. Before starting a direction introduced
by the user, apply `docs/work-decomposition.md`: require a traced allocation in the
controlling graph or a separately accepted work target.

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

## Finish Each Planned Delivery Unit

Here, PR means a planned delivery unit represented by a pull request or an exact commit/range.
Internal implementation commits, test-first chronology, and review-fix amendments do not
create new Sarathi boundaries.

At each planned delivery boundary:

1. Run the unit's focused and affected tests, applicable project gate, and assigned extra
   checks. Run full, build, documentation, deployment, or environment checks here only when
   the slice, plan, or repository requires them for this unit.
2. Create an identifiable Git boundary, normally one commit. If the PR needs several commits,
   record the exact base and head range.
3. Run `code-assess` against that exact change. Its independent review stays focused on this
   unit's assigned behavior, tests, changed boundaries, and risks.
4. Correct blocking findings, rerun affected checks, and reassess the fixes. Do not restart
   unchanged checks or review unrelated earlier PRs.
5. When the unit passes, update the report selected by `docs/document-locations.md` and
   replace the WIP bookmark with the completed unit, reviewed change, result, current unit, and next
   action.

Focused and affected checks and the independent assessment must pass before dependent work
continues. Passing a unit does not require status generation, a roadmap update, a fresh
approval for unchanged documents, product-spec rewrite, or user-facing pause. Continue to the next planned unit
when policy and safety permit it.

Clean up and simplify, using the correction rule in
`docs/review-verification-checklist.md` for review fixes. Remove debug leftovers, dead code, stale comments, brittle or
theatrical tests/checks, misleading docs, and unjustified abstractions within scope. Rerun
affected checks.

At each review point declared by the slice or plan, run its integration and full applicable checks and
an independent integration assessment against the exact combined code state. Reuse the
completed focused assessments; review the interaction, accumulated risk, required feedback,
and readiness for the next planned group instead of repeating them.

## Result

Update `.sdlc/wip.md` and report:

- the product result and changed paths;
- exact test and project-check commands with a plain explanation;
- observed Red-Green-Refactor evidence, or the reason and replacement check;
- separate code, verification, and document problems; and
- assumptions, risks, feedback, earlier-document changes, and priority next actions.

Stop when the recorded policy requires approval at the current boundary. Approval of the
controlling slice or plan does not create an extra approval after every delivery unit unless
policy explicitly requires a code-slice gate. Required document changes
(`revision-required`), missing feedback, protected
actions, release, and deployment boundaries still block affected work.
For approved-prototype UI work, this stop is a mandatory stakeholder UI review after every
completed UI change.
