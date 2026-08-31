---
description: Check required earlier documents and code, run an independent review, and record the result.
agent: agent
---

# Code Assess

Assess one planned delivery unit or one declared integration review point using a separate
check pass and review pass. Bind the assessment to the exact reviewed commit or base/head
range. Load
`prompts/code-verify.prompt.md`, `prompts/code-review.prompt.md`,
`docs/review-verification-checklist.md`, `docs/feedback-and-learning.md`,
and the selected additional checks from `docs/assurance-profiles.md`. Load `docs/document-locations.md`,
`docs/result-reporting.md`, and `docs/simplicity-first.md`.

## Run

Follow the correction and re-review rules in `docs/review-verification-checklist.md`. They
determine whether this round is full or focused and when to stop.

1. **Check pass**: run `prompts/code-verify.prompt.md` here, including the tests, project
   checks, and additional risk checks assigned to this unit or review point. Reuse current
   checks of unchanged earlier documents. Add
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

For a delivery-unit assessment, keep the review focused on that unit's assigned behavior, tests, changed
boundaries, and risks. For a declared integration review point, reuse the completed PR
assessments and review cross-PR behavior, integration checks, accumulated risk, required
feedback, and whether the next planned group may proceed. Do not repeat completed PR reviews.

State the result first. Keep code problems, missing checks, and document problems separate.
Explain automatic and project-check results, rank actions by impact, and note feedback or
changes needed in earlier documents. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

## Stored Results

Keep one rolling code-assessment report per controlling slice or plan. For baseline-only
maintenance, use the task-slug report selected by `docs/document-locations.md`. Give each planned delivery unit a
compact section containing its reviewed commit or range, result, short check references,
reviewer, and active findings. Update that section after reviewed fixes; do not copy complete
logs or add per-unit hash ledgers. Add a separate integration section at each declared review
point. The report is not the reviewed subject: later report, WIP, or status edits do not
invalidate a code review, while a changed reviewed code range does.

Write or update the report selected by `docs/document-locations.md`. Replace `.sdlc/wip.md`'s
current bookmark with the completed or correcting unit, reviewed change, result, next unit,
and next action. A passing unit returns control to `code-create`; it does not by itself require a
user-facing pause. Stop when the recorded policy requires approval at this boundary, or for
`revision-required`, `feedback-required`, protected, release, and deployment boundaries.
