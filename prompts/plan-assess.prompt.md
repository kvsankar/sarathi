---
description: Check required earlier documents, run repeatable plan checks, and perform an independent review.
agent: agent
---

# Plan Assess

Assess the target plan using two separate passes. Load `prompts/plan-verify.prompt.md`,
`prompts/plan-review.prompt.md`, `docs/review-verification-checklist.md`,
`docs/feedback-and-learning.md`, and the selected additional checks from
`docs/assurance-profiles.md`. Load `docs/document-locations.md`,
`docs/result-reporting.md`, and `docs/simplicity-first.md`.

## Run

Follow the correction and re-review rules in `docs/review-verification-checklist.md`. They
determine whether this round is full or focused and when to stop.

1. **Check pass**: run `prompts/plan-verify.prompt.md` here, including required earlier
   checks. Keep commands, IDs, results, failures, and approval records separate from quality
   judgment.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/plan-review.prompt.md` using the plan plus check results. Judge
   whether the work is split well, tests have clear results, dependencies and parallel work
   are safe, feedback is planned, and implementation can start. For an Implementation plan
   with several PRs, judge whether its declared integration review points occur before
   feedback, contract, risk, or integration results could make later work unsafe or wasteful.
   Use engineering judgment; do not impose a PR-count rule or pretend a checker can score
   proportionality.

If sub-agents are unavailable, disclose that the review was not independent and keep the
passes separate. Failed checks or an unfit required earlier document block the plan verdict.
A plan may contain the technical decisions needed for delivery; do not require a standalone
design when those decisions remain clear and reviewable. Plans may rely on the controlling
slice and accepted baseline; do not require unnecessary child spec/design files.

State the result first. List problems by severity, explain the check results, and rank next
actions by impact. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

Write or update the report selected by `docs/document-locations.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before implementation.
