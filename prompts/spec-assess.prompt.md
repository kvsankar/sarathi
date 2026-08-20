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
only those fixes. If a fix is incomplete, correct it and check it again. Repeat the full
assessment only when a fix materially changes the document.

1. **Check pass**: execute `prompts/spec-verify.prompt.md` inline and preserve its command,
   IDs, metrics, failures, and approval evidence without judging overall quality.
2. **Review pass**: in a fresh sub-agent when available, execute the review
   instructions from `prompts/spec-review.prompt.md` using the spec and check results. Judge
   depth against the selected assurance profile and additional checks, not a universal concern
   list.

If sub-agents are unavailable, disclose that the review was not independent, keep the
passes separate, and actively look for counterexamples. Never treat checker JSON as proof
that the requirements are good.

Stop as `Blocked-upstream` when the spec cannot be judged responsibly. Report one
plain-language assessment result, the main engineering consequence, categorized findings,
interpreted check results, and impact-ranked actions. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat.

Write the scope-appropriate report from `docs/document-locations.md`: `spec-assessment.md`
only for Product/system, otherwise `<work-slug>.spec-assessment.md`. Update `.sdlc/wip.md`
and stop according to the recorded approval policy. Human checkpoints require explicit
approval; automatic approval needs an eligible local policy and an explicit end-to-end
instruction before design.
