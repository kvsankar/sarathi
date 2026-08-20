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

Run full passes once per revision. After issues are fixed, rerun affected checks and review
only those fixes. If a fix is incomplete, correct it and check it again. Repeat the full
assessment only when a fix materially changes the document.

1. **Check pass**: execute `prompts/design-verify.prompt.md` inline, including the spec
   checker, and preserve commands, IDs, metrics, failures, and approval evidence only.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/design-review.prompt.md` using the design plus check results.
   Judge delivery assurance and additional checks, whether the requirements are sufficient,
   contracts, testability, decisions, risks, and readiness.

If sub-agents are unavailable, disclose that the review was not independent and keep the
passes separate. A failed or unfit spec blocks the design verdict.

Report one plain-language assessment result, the main engineering consequence, categorized
findings, interpreted check results, and impact-ranked actions. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

Write the scope-appropriate report from `docs/document-locations.md`: `design-assessment.md`
only for Product/system, otherwise `<work-slug>.design-assessment.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before planning.
