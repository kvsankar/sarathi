---
description: Independently review implementation, tests, simplicity, evidence, feedback, and consistency with earlier documents.
agent: agent
---

# Code Review

Review code/tests without editing unless asked. Read earlier documents, the diff or
implementation, `.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`,
`docs/feedback-and-learning.md`, `docs/test-ownership.md`, `docs/cleanup-pass.md`, and
`docs/simplify-pass.md`. For authorized Brownfield Baseline review, follow
`docs/project-entry.md`; otherwise block on missing/unfit code-ready intent.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples. Do not rerun commands unless needed to
resolve missing or contradictory evidence.

## Judge

Lead with actionable findings ordered by severity and grounded in file/line references.
Then score:

- implementation correctness, edge cases, accepted behavior, and design/plan fidelity;
- test bodies, clear pass/fail checks, fixtures/data/selectors, repeatability, and
  false-result risk;
- Red/Green evidence or TDD-exception eligibility, scope, and replacement evidence;
- real-boundary evidence and double drift risk;
- spot-checks that requirement-to-test links match actual test behavior;
- review-depth and extra-risk work proportional to accepted risk;
- Planned Touch Set, quality-gate, cleanup, and documentation fidelity;
- feedback evidence and decisions about parent documents;
- complexity versus the user's mental model and current consumers;
- separation of process records from product code and whether generic machinery has
  concrete justification;
- reuse of existing compatibility tests before new harnesses or generated contract systems.

Start deletion-first. Identify code, abstractions, commands, generators, manifests,
registries, schemas, fixtures, tests, or PR boundaries that can be removed, collapsed,
deferred, or proven by existing evidence. A green, traceable implementation can still be
`Needs rework` when overbuilt. Simplification may require revision of an earlier spec,
design, or plan; do not confine it to local refactoring.

Report findings, blockers in earlier documents, evidence limits, scorecard, what can be
deleted, deferred, or reused, top fixes, feedback and parent-document changes, and
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and stop;
do not start another PR, release, or deployment without explicit approval.
