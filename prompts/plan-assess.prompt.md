---
description: Check required earlier documents, run repeatable plan checks, and perform an independent review.
agent: agent
---

# Plan Assess

Assess the target plan using two separate passes. Load `prompts/plan-verify.prompt.md`,
`prompts/plan-review.prompt.md`, `docs/review-verification-checklist.md`,
`docs/feedback-and-learning.md`, and the selected review depth and extra checks from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Check pass**: in a fresh sub-agent when available, run `/plan-verify`, including the
   earlier checkers, exact delivery IDs, coverage, and ordered wave membership. Return
   commands, metrics, IDs, failures, and approval evidence only.
2. **Review pass**: in a different fresh sub-agent when available, run `/plan-review` using
   the plan plus check results. Judge slicing, pass/fail checks, dependencies, feedback,
   waves, review-depth allocation, and readiness.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. Failed or unfit earlier documents block the plan verdict. For a Lean Change
Record, assess the approved parent intent plus the compact record; do not require separate
child spec/design files.

For a bounded Slice/change plan with more than three implementation PRs, block assessment
until the concise exception has a `plan.complexity-approved` approval that matches the
current plan. This
targeted approval is not final `plan.approved` and does not authorize implementation.

Report:

1. Earlier-document blocker and required revision, or check results.
2. Review scorecard with review-depth, extra-check, feedback, and wave fitness.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

Update `.sdlc/wip.md` and stop for human review. Do not start implementation in the same
turn without an explicit latest-message end-to-end instruction.
