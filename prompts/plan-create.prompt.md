---
description: Create or revise a feedback-driven Breakdown or Implementation plan with ordered learning waves and reviewable delivery items.
agent: agent
---

# Plan Create

Turn accepted spec/design intent into either child-work allocation or a code-ready,
test-first implementation sequence.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, accepted spec/design/ADRs, existing plan, and repo
delivery conventions. Load:

- `docs/artifact-contracts.md` for the Plan contract, item fields, IDs, and wave grammar;
- `docs/simplicity-first.md` for complexity budget, PR default, and deletion/defer rules;
- `docs/assurance-profiles.md` for review depth and extra risk checks;
- `docs/work-decomposition.md` for Breakdown plans;
- `docs/test-ownership.md` for parent and integration-test assignment;
- `docs/feedback-and-learning.md` for learning targets, waves, feedback, and parallelism;
- `docs/cross-cutting-concerns.md` for the extra risk checks this work needs;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md` before handoff.

Block on unfit requirements or design. Select `Plan Type: Breakdown` for Decomposable work
and `Plan Type: Implementation` only when the scope is code-ready. Preserve or escalate the
recorded profile; do not silently remove accepted obligations.

Ask one focused question per turn only when missing information materially changes slicing,
dependency, verification, feedback, or risk. In YOLO mode, state assumptions and default to
Standard when Lean is not evidenced.

## Plan

Follow the Plan contract in `docs/artifact-contracts.md`.

For Breakdown plans:

- assign coherent `WORK-*` children with inherited intent and required child documents;
- preserve product/feature AT/JT/TEST ownership and add explicit integration children where
  evidence spans several children;
- never imply that a `WORK-*` item or Breakdown plan authorizes code.

For Implementation plans:

- make every `PR-*` independently reviewable, testable, and shippable;
- state a narrow Planned Touch Set and a clear pass/fail check for every planned test;
- use Red/Green/Refactor for behavior changes; allow only documented narrow exceptions with
  replacement evidence;
- assign each extra risk check to the PR that implements or verifies it;
- name real/official boundary evidence or disclose and mitigate double risk;
- prefer one cohesive PR over artificial scaffold, routing, generated-output, or parity
  PRs; judge reviewability by purpose, touch scope, tests, rollback, and mental model.

For Implementation plans, assign every `PR-*` exactly once to an ordered `WAVE-*`.
Breakdown plans allocate `WORK-*` children and dependencies but do not declare waves.
Prefer one-item waves when feedback can change later work. Running PRs together requires
clear execution, learning, and integration dependencies, a WIP cap, a named owner for
combining the work, a checkpoint, and conditions for stopping or replanning. Later waves
stay tentative and less detailed.

For a bounded slice, default to at most three implementation PRs. Prefer one cohesive PR to
setup/scaffold/routing/generated-output/parity splits. More than three requires a
`Complexity Budget Exception:`. After draft verification, stop for explicit user approval
and record a `plan.complexity-approved` approval that matches the current plan. Do not run `/plan-assess`
until that targeted approval exists. Final `plan.approved` remains separate.

Write `plan.md` and deterministic `plan.html` unless other paths are named. Child plans
include `Parent Work Item: WORK-AREA-NAME`.

## Verify And Handoff

Run the checkers for earlier documents, then:

```pwsh
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

Use feature/parent options for child plans and retry available Python launchers. If the
bounded-slice PR exception applies, perform the targeted approval stop above. Then run
`/plan-assess` with one fresh sub-agent for checks and another for independent review when
available. Revise the plan or earlier documents until Pass or explicitly accepted
Pass-with-fixes.

Run simplify, update `.sdlc/wip.md`, and stop for human review. Report paths, plan type,
readiness, review depth and extra checks, item/wave counts, assessment, feedback targets,
risks, and the
recommended `/code-create`. Do not implement in the same turn without an explicit
end-to-end instruction.
