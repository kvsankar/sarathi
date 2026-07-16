---
description: Run upstream-aware structural verification and independent qualitative review as the full design gate.
agent: agent
---

# Design Assess

Assess the target design using two separate passes. Load
`prompts/design-verify.prompt.md`, `prompts/design-review.prompt.md`,
`docs/review-verification-checklist.md`, and the selected profile/modules from
`docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Mechanical Verifier**: in a fresh sub-agent when available, run `/design-verify`,
   including the upstream spec checker, and return raw commands, IDs, metrics, failures,
   and approval evidence only.
2. **Qualitative Reviewer**: in a different fresh sub-agent when available, run
   `/design-review` using artifact plus mechanical evidence. Judge profile/module depth,
   requirement fitness, contracts, testability, decisions, risks, and readiness.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. A failed or unfit upstream spec blocks the design verdict.

Report:

1. Upstream blocker and required revision, or mechanical scorecard.
2. Qualitative scorecard with profile/module fitness.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

Update `.sdlc/wip.md` and stop for human review. Do not start planning in the same turn
without an explicit latest-message end-to-end instruction.
