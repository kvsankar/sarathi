---
description: Check required earlier documents, run repeatable design checks, and perform an independent review.
agent: agent
---

# Design Assess

Assess the target design using two separate passes. Load
`prompts/design-verify.prompt.md`, `prompts/design-review.prompt.md`,
`docs/review-verification-checklist.md`, and the selected delivery assurance profile and additional checks from
`docs/assurance-profiles.md`. Load `docs/document-locations.md`. Apply `docs/simplicity-first.md`.

## Run

Run full passes once per revision. After local finding corrections, rerun affected checks
and focus review on those findings unless requirements or scope changed.

1. **Check pass**: in a fresh sub-agent when available, run `/design-verify`, including the
   spec checker, and return commands, IDs, metrics, failures, and approval evidence only.
2. **Review pass**: in a different fresh sub-agent when available, run `/design-review`
   using the design plus check results. Judge delivery assurance and additional checks,
   whether the requirements are sufficient, contracts, testability, decisions, risks, and readiness.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. A failed or unfit spec blocks the design verdict.

Report:

1. Earlier-document blocker and required revision, or check results.
2. Concrete review findings and whether an engineer can understand the opening page.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`.

Write the scope-appropriate report from `docs/document-locations.md`: `design-assessment.md`
only for Product/system, otherwise `<work-slug>.design-assessment.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before planning.
