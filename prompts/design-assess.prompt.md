---
description: Check required earlier documents, run repeatable design checks, and perform an independent review.
agent: agent
---

# Design Assess

Assess the target design using two separate passes. Load
`prompts/design-verify.prompt.md`, `prompts/design-review.prompt.md`,
`docs/review-verification-checklist.md`, and the selected review depth and extra checks from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Check pass**: in a fresh sub-agent when available, run `/design-verify`, including the
   spec checker, and return commands, IDs, metrics, failures, and approval evidence only.
2. **Review pass**: in a different fresh sub-agent when available, run `/design-review`
   using the design plus check results. Judge review depth and extra risk checks,
   requirement fitness, contracts, testability, decisions, risks, and readiness.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. A failed or unfit spec blocks the design verdict.

Report:

1. Earlier-document blocker and required revision, or check results.
2. Review scorecard with review-depth and extra-check fitness.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

Update `.sdlc/wip.md` and stop for human review. Do not start planning in the same turn
without an explicit latest-message end-to-end instruction.
