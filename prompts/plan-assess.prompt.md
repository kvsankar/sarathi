---
description: Check required earlier documents, run repeatable plan checks, and perform an independent review.
agent: agent
---

# Plan Assess

Assess the target plan using two separate passes. Load `prompts/plan-verify.prompt.md`,
`prompts/plan-review.prompt.md`, `docs/review-verification-checklist.md`,
`docs/feedback-and-learning.md`, and the selected delivery assurance profile and additional checks from
`docs/assurance-profiles.md`. Load `docs/document-locations.md`. Apply `docs/simplicity-first.md`.

## Run

Run full passes once for the current revision. After local finding corrections, rerun only
affected checks and focus review on those findings and changed boundaries unless
requirements or scope changed.

1. **Check pass**: in a fresh sub-agent when available, run `/plan-verify`, including the
   earlier checkers, exact delivery IDs, coverage, and ordered work-group membership. Return
   commands, metrics, IDs, failures, and approval evidence only.
2. **Review pass**: in a different fresh sub-agent when available, run `/plan-review` using
   the plan plus check results. Judge slicing, pass/fail checks, dependencies, feedback,
   parallel work, delivery assurance, and readiness.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. Failed or unfit earlier documents block the plan verdict. A compact plan
may rely on approved parent documents; do not require unnecessary child spec/design files.

Report:

1. Earlier-document blocker and required revision, or check results.
2. Concrete review findings and whether an engineer can understand the opening page.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

Write the scope-appropriate report from `docs/document-locations.md`: `plan-assessment.md`
only for Product/system, otherwise `<work-slug>.plan-assessment.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before implementation.
