---
description: Implement a code-ready plan in bounded learning waves using Red/Green/Refactor, traceable evidence, feedback, and ancestor adaptation.
agent: agent
---

# Code Create

Implement only the eligible member(s) of the active learning wave and keep every PR
boundary shippable.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the governing spec/design/plan, current code/tests,
and repository quality commands. Load:

- `docs/artifact-contracts.md` for the Code and Evidence contract;
- `docs/simplicity-first.md` for process/product separation and upstream simplification;
- `docs/assurance-profiles.md` for selected profile/modules and escalation;
- `docs/feedback-and-learning.md` for wave eligibility and inspect/adapt;
- `docs/test-ownership.md` for assigned ancestor/local tests and traceability;
- `docs/cross-cutting-concerns.md` for activated modules only;
- `docs/cleanup-pass.md`, `docs/simplify-pass.md`, and `docs/artifact-formatting.md` for
  handoff.

Block unless the plan is Code-ready, required approvals/mock approvals exist, upstream
intent is fit, and the selected PR is a declared eligible member of the active wave. Confirm
the Planned Touch Set, Red tests, Green scope, IDs/obligations, oracles, profile/modules,
feedback target, invalidation question, WIP limit, dependencies, and stop/replan triggers.

Update `.sdlc/wip.md` with the exact active `WAVE-*` and active declared members. Never
exceed WIP. Do not start a later wave merely because an agent is available.

## Implement

For every behavior-changing step:

1. **Red**: write the smallest meaningful failing test with a concrete oracle; run it and
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

Stay inside the Planned Touch Set. Stop for upstream revision when implementation reveals
new user-visible behavior, changed contracts/UX/NFRs, material module risk, or invalidated
assumptions. Never fabricate stakeholder, real-system, TDD, or execution evidence.
If implementation exposes an overbuilt ancestor design or plan, classify it
`revision-required` and simplify upstream before continuing; do not implement process-shaped
product machinery merely because it was planned.

## Verify The Boundary

Run focused and full planned tests, coverage, formatter/linter/type/static/security checks,
pre-commit or repository equivalent, build/docs/deployment/environment checks, and all
activated module evidence assigned to this PR. Use repository thresholds; absent stricter
policy, require at least 80% line coverage overall, 70% branch where available, and 90% line
coverage for pure functional-core modules.

Do not run live production deployment or checks without explicit user approval. Report
unavailable checks and residual risk rather than treating them as passed.

Run cleanup then simplify. Remove debug leftovers, dead code, stale comments, brittle or
theatrical tests/checks, misleading docs, and unjustified abstractions within scope. Rerun
affected checks.

## Handoff

Update `.sdlc/wip.md` and report:

- PR/wave, changed paths, Red/Green/Refactor evidence, test/coverage/quality results;
- activated module evidence and unavailable checks;
- traceability updates, cleanup/simplify results, assumptions and risks;
- feedback status/evidence and ancestor impact for spec, design, remaining plan,
  code/integration, and process;
- wave members remaining or `/code-assess` readiness.

Stop for human review after the code slice. Do not start the next learning-dependent PR,
release, or deployment without explicit approval or a latest-message unattended
instruction; `revision-required` and `feedback-required` still block affected work.
