---
description: Qualitatively review implementation, tests, simplicity, evidence, feedback, and upstream consistency.
agent: agent
---

# Code Review

Review code/tests without editing unless asked. Read upstream artifacts, diff/implementation,
`.sdlc/wip.md`, available verification evidence, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`,
`docs/feedback-and-learning.md`, `docs/test-ownership.md`, `docs/cleanup-pass.md`, and
`docs/simplify-pass.md`. For authorized Brownfield Baseline review, follow
`docs/project-entry.md`; otherwise block on missing/unfit code-ready intent.

Use a fresh Qualitative Reviewer sub-agent when available. Otherwise disclose degraded
non-independent review and seek counterexamples. Do not rerun commands unless needed to
resolve missing or contradictory evidence.

## Judge

Lead with actionable findings ordered by severity and grounded in file/line references.
Then score:

- implementation correctness, edge cases, accepted behavior, and design/plan fidelity;
- test bodies, concrete oracles, fixtures/data/selectors, determinism, and false-result risk;
- real-boundary evidence and double drift risk;
- traceability spot-checks against actual test behavior;
- profile/module implementation and production fitness proportional to accepted risk;
- Planned Touch Set, quality-gate, cleanup, and documentation fidelity;
- feedback evidence and ancestor-impact decisions;
- complexity versus the user's mental model and current consumers;
- process/product firewall and whether generic machinery has concrete justification;
- brownfield compatibility reuse before new harnesses or generated contract systems.

Start deletion-first. Identify code, abstractions, commands, generators, manifests,
registries, schemas, fixtures, tests, or PR boundaries that can be removed, collapsed,
deferred, or proven by existing evidence. A green, traceable implementation can still be
`Needs rework` when overbuilt. Simplification may require upstream spec/design/plan
revision; do not confine it to local refactoring.

Report findings, upstream blockers, evidence limits, scorecard, deletion/defer/reuse
opportunities, top fixes, feedback/ancestor impact, and
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and stop;
do not start another PR, release, or deployment without explicit approval.
