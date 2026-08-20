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

Run full passes once for the current revision. After issues are fixed, rerun affected checks
and review only those fixes. If a fix is incomplete, correct it and check it again. Repeat
the full assessment only when a fix materially changes the implementation.

1. **Check pass**: execute `prompts/code-verify.prompt.md` inline, including earlier
   checkers, planned tests, project checks, and additional risk checks. Add
   `--review-context` to `check_code.py`; keep its candidate matches private.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/code-review.prompt.md` using the code and check results. Judge
   correctness, test pass/fail checks, boundary realism, test-first evidence for behavior
   changes, plan fidelity, review evidence, production quality, feedback, and
   earlier-document changes.

Pass the private review context to the reviewer. It reports only candidates that become
actionable findings; do not publish candidates, counts, or a warning section. If sub-agents
are unavailable, disclose that the review was not independent and keep the passes separate.
Use `Blocked-upstream` only when the assessment depends on specific wrong or incomplete
obligations in an earlier document. Name those obligations and the affected work; assess
unrelated corrective code against the unchanged accepted documents.

Report one plain-language assessment result and the main engineering consequence. Keep
product/code problems, missing verification, and process/documentation problems separate;
interpret automatic and project-check results; rank actions by impact; and include feedback
and earlier-document changes. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

## Stored Results

For `Pass` with a known parent `WORK-*` and child implementation plan, create/update the
hash-current `code_assessment` entry in `.sdlc/delivery-records.yaml` as defined in
`docs/workflow-status.md`. Record the exact work item, plan path/SHA-256, UTC assessment
time, and the feedback or test result that supports the outcome. Do not record other
verdicts as Pass. This is a project record, not approval.

Close an active work group with a `wave_checkpoint` entry in
`.sdlc/delivery-records.yaml` only when every exact declared member
has reached its boundary and feedback/integration plus parent-document decisions are complete.
Do not create a checkpoint for an unscheduled child. Bind exact ordered members to the current
plan SHA-256. Do not close when required feedback, work to combine parallel changes, or
`revision-required` work remains. The checkpoint closes one group only; it does not assess the
enclosing plan, approve the next group, or prove merge/release.

Write the scope-appropriate report from `docs/document-locations.md`: `code-assessment.md`
only for Product/system, otherwise `<work-slug>.code-assessment.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and explicit unattended
continuation. `revision-required`, `feedback-required`, release, and deployment boundaries
still block affected work.
