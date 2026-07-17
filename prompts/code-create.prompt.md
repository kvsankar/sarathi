---
description: Implement a code-ready plan in small learning waves using Red/Green/Refactor, linked test evidence, feedback, and revision of parent documents when needed.
agent: agent
---

# Code Create

Implement only the eligible member(s) of the active learning wave and keep every PR
boundary shippable.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted spec/design/plan, current code/tests,
and repository quality commands. Load:

- `docs/artifact-contracts.md` for the Code and Evidence contract;
- `docs/simplicity-first.md` for keeping process machinery out of product code and revising
  overbuilt earlier documents;
- `docs/assurance-profiles.md` for review depth, extra risk checks, and escalation;
- `docs/feedback-and-learning.md` for wave eligibility and inspect/adapt;
- `docs/test-ownership.md` for assigned parent/local tests and requirement-to-test links;
- `docs/cross-cutting-concerns.md` for extra checks required by this work;
- `docs/cleanup-pass.md`, `docs/simplify-pass.md`, and `docs/artifact-formatting.md` for
  handoff.

Block unless the plan is Code-ready, required approvals/mock approvals exist, earlier
intent is fit, and the selected PR is a declared eligible member of the active wave. Confirm
the Planned Touch Set, Red tests, Green scope, IDs/obligations, pass/fail checks, review
depth and extra checks, feedback target, what result would change the plan, WIP limit,
dependencies, and conditions for stopping or replanning.

Update `.sdlc/wip.md` with the exact active `WAVE-*` and active declared members. Never
exceed WIP. Do not start a later wave merely because an agent is available.

## Implement

For every behavior-changing step:

1. **Red**: write the smallest meaningful failing test with a clear pass/fail check; run it and
   preserve failure evidence.
2. **Green**: implement the minimum production-quality change; rerun the focused test and
   affected suite.
3. **Refactor**: improve structure without changing behavior; keep tests green.

Narrow exceptions are generated-only, docs-only, formatting-only, build/deploy config
validation, or characterization before legacy refactor. Use the exact TDD-exception fields
and safety rules in `docs/artifact-contracts.md`. Exceptions never cover new/changed product
behavior, bug fixes, contracts, validation, security/privacy behavior, errors,
logging/telemetry, or UI behavior. Record and run the replacement evidence.

Implement assigned `AT-*`, `JT-*`, and `TEST-*` obligations at their planned levels. Add
supplemental inner tests when discovered, but do not use them to replace accepted coverage.
Map executable tests in `.sdlc/test-traceability.yaml`; keep test names and bodies
behavior-focused.

Stay inside the Planned Touch Set. Stop to revise earlier documents when implementation reveals
new user-visible behavior, changed contracts/UX/NFRs, material module risk, or invalidated
assumptions. Never fabricate stakeholder, real-system, TDD, or execution evidence.
If implementation exposes an overbuilt parent design or plan, classify it
`revision-required` and simplify that document before continuing. Do not add product
machinery merely to satisfy the process.

## Verify The Boundary

Run focused and full planned tests, coverage, formatter/linter/type/static/security checks,
pre-commit or repository equivalent, build/docs/deployment/environment checks, and all
extra risk checks assigned to this PR. Use repository thresholds; absent stricter
policy, require at least 80% line coverage overall, 70% branch where available, and 90% line
coverage for pure functional-core modules.

Do not run live production deployment or checks without explicit user approval. Report
unavailable checks and remaining risk rather than treating them as passed.

Run cleanup then simplify. Remove debug leftovers, dead code, stale comments, brittle or
theatrical tests/checks, misleading docs, and unjustified abstractions within scope. Rerun
affected checks.

## Handoff

Update `.sdlc/wip.md` and report:

- PR/wave, changed paths, Red/Green/Refactor evidence, test/coverage/quality results;
- extra risk-check evidence and unavailable checks;
- requirement-to-test link updates, cleanup/simplify results, assumptions and risks;
- feedback status/evidence and changes needed in the spec, design, remaining plan,
  code/integration, and process;
- wave members remaining or `/code-assess` readiness.

Stop for human review after the code slice. Do not start the next learning-dependent PR,
release, or deployment without explicit approval or a latest-message unattended
instruction; `revision-required` and `feedback-required` still block affected work.
