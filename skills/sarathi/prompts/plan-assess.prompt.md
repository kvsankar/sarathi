---
description: Run upstream-aware structural verification and independent qualitative review as the full plan gate.
agent: agent
---

# Plan Assess

Assess the target plan using two separate passes. Load `prompts/plan-verify.prompt.md`,
`prompts/plan-review.prompt.md`, `docs/review-verification-checklist.md`,
`docs/feedback-and-learning.md`, and selected profile/modules from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Mechanical Verifier**: in a fresh sub-agent when available, run `/plan-verify`,
   including upstream checkers, exact delivery IDs, coverage, and ordered wave membership.
   Return raw commands, metrics, IDs, failures, and approval evidence only.
2. **Qualitative Reviewer**: in a different fresh sub-agent when available, run
   `/plan-review` using artifact plus mechanical evidence. Judge slicing, oracles,
   dependencies, feedback, waves, profile/module allocation, and readiness.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. Failed/unfit upstream artifacts block the plan verdict.

Report:

1. Upstream blocker and required revision, or mechanical scorecard.
2. Qualitative scorecard with profile/module and feedback/wave fitness.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

Update `.sdlc/wip.md` and stop for human review. Do not start implementation in the same
turn without an explicit latest-message end-to-end instruction.
