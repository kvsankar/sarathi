---
description: Check a requirements document and review it independently.
agent: agent
---

# Spec Assess

Assess the target spec using two separate passes. Load `prompts/spec-verify.prompt.md`,
`prompts/spec-review.prompt.md`, `docs/review-verification-checklist.md`, and the selected
delivery assurance profile and additional checks from `docs/assurance-profiles.md`. Load
`docs/document-locations.md` and `docs/result-reporting.md`. Apply
`docs/simplicity-first.md`.

## Run

Run full passes once per revision. After issues are fixed, rerun affected checks and review
only those fixes. If a fix is incomplete, leave the issue open. After it is corrected, check
only that fix again. Repeat the full assessment only when a fix materially changes the document.

1. **Check pass**: run `prompts/spec-verify.prompt.md` here. Keep its command, IDs, results,
   failures, and approval records separate from quality judgment.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/spec-review.prompt.md` using the spec and check results. Judge
   the spec against the selected assurance profile and additional checks. Do not apply a list
   of risks that do not affect this work.

If sub-agents are unavailable, disclose that the review was not independent, keep the
passes separate, and actively look for counterexamples. Never treat checker JSON as proof
that the requirements are good.

Use `Blocked-upstream` when missing or unreliable requirements prevent a responsible review.
State the result first. List problems by severity, explain the check results, and rank next
actions by impact. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

Write the scope-appropriate report from `docs/document-locations.md`: `spec-assessment.md`
only for Product/system, otherwise `<work-slug>.spec-assessment.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before design.
