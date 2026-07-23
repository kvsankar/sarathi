---
description: Check required earlier documents and code, run an independent review, and record the result.
agent: agent
---

# Code Assess

Assess the implemented change using a separate check pass and review pass. Load
`prompts/code-verify.prompt.md`, `prompts/code-review.prompt.md`,
`docs/review-verification-checklist.md`, `docs/feedback-and-learning.md`,
`docs/workflow-status.md`, and the selected delivery assurance profile and additional checks from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

Run full passes once for the current revision. After local finding corrections, rerun only
affected checks and focus review on those findings and changed boundaries unless
requirements or scope changed.

1. **Check pass**: in a fresh sub-agent when available, run `/code-verify`, including
   earlier checkers, planned tests, project checks, and additional risk checks. Return
   commands and evidence only.
2. **Review pass**: in a different fresh sub-agent when available, run `/code-review` using
   the code and check results. Judge correctness, test pass/fail checks, boundary realism,
   test-first evidence for behavior changes, plan fidelity, review evidence, production
   quality, feedback, and earlier-document changes.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. Failed or unfit earlier documents produce `Blocked-upstream`.

Report:

1. Earlier-document blocker, or automatic and project-check results.
2. Concrete review findings, including source-ID cleanliness.
3. Top fixes ranked by impact.
4. Feedback received, what it changed, and any earlier documents that need revision.
5. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

## Stored Results

For `Pass` with a known parent `WORK-*` and child implementation plan, create/update the
hash-current `.sdlc/code-assessments.yaml` record defined in
`docs/workflow-status.md`. Record the exact work item, plan path/SHA-256, UTC assessment
time, and the feedback or test result that supports the outcome. Do not record other
verdicts as Pass. This is a project record, not approval.

Close an active work group in `.sdlc/wave-checkpoints.yaml` only when every exact declared member
has reached its boundary and feedback/integration plus parent-document decisions are complete.
Do not create a checkpoint for an unscheduled child. Bind exact ordered members to the current
plan SHA-256. Do not close when required feedback, work to combine parallel changes, or
`revision-required` work remains. The checkpoint closes one group only; it does not assess the
enclosing plan, approve the next group, or prove merge/release.

Update `.sdlc/wip.md` and stop according to the recorded approval policy. Human checkpoints
require explicit approval; automatic approval needs an eligible local policy and explicit
unattended continuation. `revision-required`, `feedback-required`, release, and deployment
boundaries still block affected work.
