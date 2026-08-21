---
description: Independently review requirements using checker results and look for missed cases.
agent: agent
---

# Spec Review

Review the target spec without editing it unless asked. Read `.sdlc/wip.md`, available
verification evidence, `docs/artifact-contracts.md`, `docs/document-locations.md`, `docs/assurance-profiles.md`, and
`docs/simplicity-first.md`. Load `docs/requirements-model.md` and
`docs/human-first-artifacts.md`, then answer the first-page comprehension questions. Follow
`docs/result-reporting.md` for the report. Load
`docs/srs-authoring.md` for reconstructed, terse, or over-bundled requirements or when use
cases and supplementary requirements need detailed review.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and actively seek counterexamples. Passing automatic checks is useful evidence,
not proof that the requirements are good.
After issues are fixed, review only those fixes. If a fix is incomplete, leave the issue open.
After it is corrected, check only that fix again. Do not repeat the full review unless a fix
materially changes the document.
Apply the correction-closure procedure in `docs/review-verification-checklist.md`.

## Judge

State the result first, then report concrete problems. Ask: Can an engineer explain the
problem, affected users, required behavior, non-goals, success, and important failures from
the opening page? Is each requirement observable and testable? Are external contracts clear?
Do links to later work resolve? Are stronger checks limited to real risks?
For a Decision/evidence outcome, check the stated question, decision owner, evidence method,
boundaries, stop condition or timebox, and decision/next action instead of product readiness.

Check meaning, not merely section names. Do user needs justify the features? Do use cases
cover the main behavior and important failure paths? Are requirements precise? Do acceptance
tests prove each outcome? Do journeys cover important end-to-end stories? Do the links
connect these parts without replacing their explanation? Missing or cosmetic links require
`Needs rework`.

Start with simplification: identify requirements, roles, qualities, documents, or future
behaviors that can be deleted, deferred, or proven by existing evidence. A spec with every
required section still needs rework when it is overbuilt.

If identifiers interrupt the Product Overview (or legacy Product Crux), move them to
traceability and return
`Needs rework`. If an engineer must decode IDs to understand the product, rewrite it in
plain technical language even when automatic checks pass.

Report the result first. List problems by severity, explain what the checks prove, say what
can be deleted or deferred, and rank fixes by impact. Preserve
`Pass | Pass-with-fixes | Needs rework` in the saved report and internal state; follow
`docs/result-reporting.md` for chat. Write/update
the scope-appropriate report from `docs/document-locations.md`: `spec-review.md` only for
Product/system, otherwise `<work-slug>.spec-review.md`. Update WIP and stop according to the
recorded approval policy. Human checkpoints require explicit approval; automatic approval
needs an eligible local policy and explicit end-to-end continuation before design.
