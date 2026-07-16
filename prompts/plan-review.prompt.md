---
description: Qualitatively review a work plan's simplicity, readiness, evidence reuse, learning waves, slicing, and risk.
agent: agent
---

# Plan Review

Review the target plan without editing it unless asked. Read upstream artifacts,
`.sdlc/wip.md`, available verification evidence, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/feedback-and-learning.md`. Load `docs/work-decomposition.md` and
`docs/test-ownership.md` when applicable. Stop as `Blocked-upstream` when spec/design is
unfit.

Use a fresh Qualitative Reviewer sub-agent when available. Otherwise disclose degraded
non-independent review and seek counterexamples.

## Judge

Score 1–5 and give a concrete fix below 5:

- plan type/readiness, complete intent/test allocation, touch sets, oracles, and TDD;
- cohesive independently testable/rollback-capable delivery items;
- ordered learning waves, feedback, dependency types, WIP, convergence, and stop/replan;
- selected profile and activated module work proportional to actual risk;
- complexity budget versus the user's mental model and current consumers;
- brownfield reuse of existing compatibility suites and focused changed-boundary tests;
- at most three implementation PRs for a bounded slice, unless a concise exception has
  explicit plan approval;
- absence of artificial setup, scaffold, routing, generated-output, parity, or cleanup PRs;
- no process-shaped product architecture or speculative generalization.

Start deletion-first. Identify PRs/work items, new machinery, tests, generated artifacts,
or handoffs that can be deleted, deferred, collapsed, or proven by existing evidence.
`Needs rework` must not default to more PRs or machinery. A structurally complete but
overbuilt plan fails.

Report blockers, evidence considered, scorecard, deletion/defer/reuse findings, top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not implement without explicit approval.
