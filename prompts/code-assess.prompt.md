---
description: Run upstream-aware code verification and independent qualitative review, then record evidence-backed slice and wave outcomes.
agent: agent
---

# Code Assess

Assess the implemented slice using separate mechanical and qualitative passes. Load
`prompts/code-verify.prompt.md`, `prompts/code-review.prompt.md`,
`docs/review-verification-checklist.md`, `docs/feedback-and-learning.md`,
`docs/workflow-status.md`, and selected profile/modules from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Mechanical Verifier**: in a fresh sub-agent when available, run `/code-verify`,
   including upstream checkers, tests, coverage, traceability, repository quality gates,
   and planned activated-module checks. Return raw commands and evidence only.
2. **Qualitative Reviewer**: in a different fresh sub-agent when available, run
   `/code-review` using artifact/code plus mechanical evidence. Judge correctness, test
   oracles, boundary realism, plan fidelity, profile/module evidence, production quality,
   feedback, and ancestor impact.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. Failed or unfit upstream artifacts produce `Blocked-upstream`.

Report:

1. Upstream blocker, or mechanical and local-quality scorecards.
2. Qualitative scorecard with profile/module fitness.
3. Top fixes ranked by impact.
4. Feedback status/evidence, invalidation result, and ancestor-impact decisions for spec,
   design, remaining plan, code/integration, and process.
5. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

## Evidence Ledgers

For `Pass` with a known parent `WORK-*` and child implementation plan, create/update the
hash-current `.sdlc/code-assessments.yaml` record defined in
`docs/workflow-status.md`. Record the exact work item, plan path/SHA-256, UTC assessment
time, and evidence-backed learning mapping. Do not record other verdicts as Pass. This is an
agent/project assessment claim, not approval.

Close an active wave in `.sdlc/wave-checkpoints.yaml` only when every exact declared member
has reached its boundary and feedback/integration plus ancestor-impact decisions are
complete. Bind exact ordered members to the current plan SHA-256. Do not close when required
feedback, convergence, or `revision-required` work remains. The checkpoint closes one wave
only; it does not assess the enclosing plan, approve the next wave, or prove merge/release.

Update `.sdlc/wip.md` and stop. Do not start the next PR, release, or deployment in the same
turn without an explicit latest-message unattended instruction; `revision-required` and
`feedback-required` still block affected work.
