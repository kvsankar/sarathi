---
description: Check required earlier documents and code, run an independent review, then record slice and wave outcomes backed by evidence.
agent: agent
---

# Code Assess

Assess the implemented slice using a separate check pass and review pass. Load
`prompts/code-verify.prompt.md`, `prompts/code-review.prompt.md`,
`docs/review-verification-checklist.md`, `docs/feedback-and-learning.md`,
`docs/workflow-status.md`, and the selected review depth and extra checks from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Check pass**: in a fresh sub-agent when available, run `/code-verify`, including
   earlier checkers, planned tests, repository quality gates, and extra risk checks. Return
   commands and evidence only.
2. **Review pass**: in a different fresh sub-agent when available, run `/code-review` using
   the code and check results. Judge correctness, test pass/fail checks, boundary realism,
   plan fidelity, review-depth evidence, production quality, feedback, and parent-document
   changes.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. Failed or unfit earlier documents produce `Blocked-upstream`.

Report:

1. Earlier-document blocker, or automatic and local-quality check results.
2. Review scorecard with review-depth and extra-check fitness.
3. Top fixes ranked by impact.
4. Feedback status/evidence, what it changed, and decisions for the spec,
   design, remaining plan, code/integration, and process.
5. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

## Evidence Ledgers

For `Pass` with a known parent `WORK-*` and child implementation plan, create/update the
hash-current `.sdlc/code-assessments.yaml` record defined in
`docs/workflow-status.md`. Record the exact work item, plan path/SHA-256, UTC assessment
time, and evidence-backed learning mapping. Do not record other verdicts as Pass. This is an
agent/project assessment claim, not approval.

Close an active wave in `.sdlc/wave-checkpoints.yaml` only when every exact declared member
has reached its boundary and feedback/integration plus parent-document decisions are complete.
Do not create a checkpoint for an unscheduled child. Bind exact ordered members to the current
plan SHA-256. Do not close when required feedback, work to combine parallel changes, or
`revision-required` work remains. The checkpoint closes one wave only; it does not assess the
enclosing plan, approve the next wave, or prove merge/release.

Update `.sdlc/wip.md` and stop. Do not start the next PR, release, or deployment in the same
turn without an explicit latest-message unattended instruction; `revision-required` and
`feedback-required` still block affected work.
