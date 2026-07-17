---
description: Independently review a work plan's simplicity, readiness, evidence reuse, learning waves, slicing, and risk.
agent: agent
---

# Plan Review

Review the target plan without editing it unless asked. Read earlier required documents,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/feedback-and-learning.md`. Load `docs/work-decomposition.md` and
`docs/test-ownership.md` when applicable. Stop as `Blocked-upstream` when spec/design is
unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.

## Judge

Score 1–5 and give a concrete fix below 5:

- plan type/readiness, complete intent/test assignment, touch sets, pass/fail checks, and TDD;
- cohesive independently testable/rollback-capable delivery items;
- ordered learning waves, feedback, dependency types, WIP, ownership for combining work,
  and stop/replan rules;
- selected review depth and extra risk checks proportional to actual risk;
- complexity budget versus the user's mental model and current consumers;
- reuse of existing compatibility suites and focused changed-boundary tests;
- at most three implementation PRs for a bounded slice, unless a concise exception has
  `plan.complexity-approved` approval that matches the current plan;
- valid Red/Green plans or a genuinely eligible TDD exception with exact scope and useful
  replacement evidence under `docs/artifact-contracts.md`;
- absence of artificial setup, scaffold, routing, generated-output, parity, or cleanup PRs;
- no process-shaped product architecture or speculative generalization.

Start with simplification. Identify PRs/work items, new machinery, tests, generated files,
or handoffs that can be deleted, deferred, collapsed, or proven by existing evidence.
`Needs rework` must not default to more PRs or machinery. A plan with every required
section still fails when it is overbuilt.

Report blockers, evidence considered, scorecard, what can be deleted, deferred, or reused,
top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not implement without explicit approval.
