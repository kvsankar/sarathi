---
description: Implement an explicitly selected code-ready plan using Red/Green/Refactor, linked test evidence, feedback, and revision of parent documents when needed.
agent: agent
---

# Code Create

Implement only the explicitly selected code-ready child and keep every PR boundary shippable.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted parent intent and code-ready child plan,
current code/tests, and repository quality commands. A Lean Change Record is that child plan
and replaces separate child spec/design documents. Load `docs/artifact-contracts.md` for the
Code and Evidence contract and `docs/feedback-and-learning.md` for active-wave eligibility.

## Triggered References

Load only when the trigger applies:

- `docs/test-ownership.md`: the plan maps inherited `AT-*`, `JT-*`, or `TEST-*` obligations;
- `docs/assurance-profiles.md` and `docs/cross-cutting-concerns.md`: an assigned extra risk
  check, escalation, or new risk needs interpretation;
- `docs/simplicity-first.md`: implementation exposes unnecessary machinery, a refactor, or a
  simplification decision;
- `docs/cleanup-pass.md`, `docs/simplify-pass.md`, and `docs/artifact-formatting.md`:
  immediately before handoff.

Block unless the plan is Code-ready, required approvals/mock approvals exist, earlier intent
is fit, and `.sdlc/wip.md` explicitly selects the owning `WORK-*` child. If that child belongs
to a declared wave, also enforce the wave WIP limit and checkpoint rules. Confirm the Planned
Touch Set, Red tests, Green scope, IDs/obligations, pass/fail checks, review depth and extra
checks, feedback target, what result would change the plan, dependencies, and conditions for
stopping or replanning.

Update `.sdlc/wip.md` with the exact active `WORK-*` item and, when applicable, its active
`WAVE-*`. Do not exceed a declared wave's WIP limit. Do not start additional work merely
because an agent is available.

## Implement

For every behavior-changing step, add or update the smallest meaningful test with a clear
pass/fail check, implement the minimum production-quality change, and rerun the focused test
and affected suite. Refactor only after behavior is protected by that verification.

Implement assigned `AT-*`, `JT-*`, and `TEST-*` obligations at their planned levels. Add
supplemental inner tests when discovered, but do not use them to replace accepted coverage.
Keep test names and bodies behavior-focused. A project may keep a test-link inventory when
its audit or assurance needs justify it, but Sarathi does not require one.

Stay inside the Planned Touch Set. Stop to revise earlier documents when implementation reveals
new user-visible behavior, changed contracts/UX/NFRs, material module risk, or invalidated
assumptions. Never fabricate stakeholder, real-system, or execution evidence.
If implementation exposes an overbuilt parent design or plan, classify it
`revision-required` and simplify that document before continuing. Do not add product
machinery merely to satisfy the process.

## Verify The Boundary

Run focused and full planned tests, formatter/linter/type/static/security checks, pre-commit
or repository equivalent, build/docs/deployment/environment checks, and all extra risk checks
assigned to this PR. Run coverage only when the repository policy or accepted risk profile
requires it.

Do not run live production deployment or checks without explicit user approval. Report
unavailable checks and remaining risk rather than treating them as passed.

Run cleanup then simplify. Remove debug leftovers, dead code, stale comments, brittle or
theatrical tests/checks, misleading docs, and unjustified abstractions within scope. Rerun
affected checks.

## Handoff

Update `.sdlc/wip.md` and report:

- PR, owning work item/wave, changed paths, test/verification/quality results;
- extra risk-check evidence and unavailable checks;
- optional test-link inventory updates, cleanup/simplify results, assumptions and risks;
- feedback status/evidence and changes needed in the spec, design, remaining plan,
  code/integration, and process;
- wave members remaining or `/code-assess` readiness.

Stop for human review after the code slice. Do not start the next learning-dependent PR,
release, or deployment without explicit approval or a latest-message unattended
instruction; `revision-required` and `feedback-required` still block affected work.
