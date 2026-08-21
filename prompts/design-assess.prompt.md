---
description: Check required earlier documents, run repeatable design checks, and perform an independent review.
agent: agent
---

# Design Assess

Assess the target design using two separate passes. Load
`prompts/design-verify.prompt.md`, `prompts/design-review.prompt.md`,
`docs/review-verification-checklist.md`, and the selected delivery assurance profile and additional checks from
`docs/assurance-profiles.md`. Load `docs/document-locations.md`,
`docs/result-reporting.md`, and `docs/simplicity-first.md`.

## Run

Follow the correction and re-review rules in `docs/review-verification-checklist.md`. They
determine whether this round is full or focused and when to stop.

1. **Check pass**: run `prompts/design-verify.prompt.md` here, including the spec checker.
   Keep commands, IDs, results, failures, and approval records separate from quality judgment.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/design-review.prompt.md` using the design plus check results.
   Ask whether the requirements are sufficient and whether contracts, tests, decisions, and
   risks are clear enough to continue. Apply only the extra checks this work needs.

If sub-agents are unavailable, disclose that the review was not independent and keep the
passes separate. Failed spec checks or an unfit spec block the verdict.

State the result first. List problems by severity, explain the check results, and rank next
actions by impact. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

Write or update the report selected by `docs/document-locations.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before planning.
