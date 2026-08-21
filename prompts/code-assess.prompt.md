---
description: Check required earlier documents and code, run an independent review, and record the result.
agent: agent
---

# Code Assess

Assess the implemented change using a separate check pass and review pass. Load
`prompts/code-verify.prompt.md`, `prompts/code-review.prompt.md`,
`docs/review-verification-checklist.md`, `docs/feedback-and-learning.md`,
`docs/workflow-status.md`, and the selected delivery assurance profile and additional checks from
`docs/assurance-profiles.md`. Load `docs/document-locations.md`,
`docs/result-reporting.md`, and `docs/simplicity-first.md`.

## Run

Follow the correction and re-review rules in `docs/review-verification-checklist.md`. They
determine whether this round is full or focused and when to stop.

1. **Check pass**: run `prompts/code-verify.prompt.md` here, including earlier
   checkers, planned tests, project checks, and additional risk checks. Add
   `--review-context` to `check_code.mjs`; keep its candidate matches private.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/code-review.prompt.md` using the code and check results. Judge
   correctness, test results, credible external-dependency testing, test-first evidence for
   behavior changes, fit with the plan, production quality, feedback, and changes needed in
   earlier documents.

Pass the private review context to the reviewer. It reports only candidates that become
actionable findings; do not publish candidates, counts, or a warning section. If sub-agents
are unavailable, disclose that the review was not independent and keep the passes separate.
Use `Blocked-upstream` only when the assessment depends on specific wrong or incomplete
obligations in an earlier document, such as behavior, scope, contracts, acceptance criteria,
tests, or risk. Name them and the affected work; assess unrelated corrective code against
the unchanged accepted documents.

State the result first. Keep code problems, missing checks, and document problems separate.
Explain automatic and project-check results, rank actions by impact, and note feedback or
changes needed in earlier documents. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

## Stored Results

After a `Pass`, create or update a `code_assessment` entry only when the work has a known
parent `WORK-*` item and child Implementation plan. Follow `docs/workflow-status.md` for the
exact work item, current plan path and SHA-256, UTC assessment time, supporting feedback or
test result, and other matching fields. Never record another result as `Pass`. This record is
not an approval.

Record a completed work group's `wave_checkpoint` only when every exact scheduled member has
reached its boundary, the applicable feedback or integration review is complete, and all
parent-document decisions are complete. Do not create a checkpoint for unscheduled work.
Match the ordered members and current plan SHA-256 exactly. Do not close a group while
required feedback, work to combine parallel changes, or `revision-required` work remains. A
checkpoint does not assess the whole plan, approve the next group, merge, release, or deploy
work.

Write or update the report selected by `docs/document-locations.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and explicit unattended
continuation. `revision-required`, `feedback-required`, release, and deployment boundaries
still block affected work.
