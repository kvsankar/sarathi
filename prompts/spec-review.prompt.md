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
For corrected findings, focus on those findings and affected boundaries; restart the full
review only when requirements or scope changed.

## Judge

After the plain-language review result, report concrete problems. Check that the opening page lets an engineer explain the
problem, affected users, required behavior, non-goals, success, and important failures.
Then check that each requirement is observable and testable, external contracts are
credible, links to later work resolve, and stronger checks are limited to real risks.
For a Decision/evidence outcome, check the stated question, decision owner, evidence method,
boundaries, stop condition or timebox, and decision/next action instead of product readiness.

Check the requirements derivation, not merely the presence of sections: stakeholder needs
must justify features; use cases must explain the main behavior plus meaningful alternate
and failure paths; functional and supplementary requirements must make the behavior and
qualities precise; acceptance tests must prove individual outcomes; journeys must cover
important ordered stories; and traceability must connect the chain without replacing its
meaning. Missing or cosmetic links require `Needs rework`.

Start with simplification: identify requirements, roles, qualities, documents, or future
behaviors that can be deleted, deferred, or proven by existing evidence. A spec with every
required section still needs rework when it is overbuilt.

If identifiers interrupt the Product Overview (or legacy Product Crux), move them to
traceability and return
`Needs rework`. If an engineer must decode IDs to understand the product, rewrite it in
plain technical language even when automatic checks pass.

Report one plain-language result, categorized findings, interpreted evidence, what can be
deleted, deferred, or proved by existing evidence, and impact-ranked fixes. Preserve
`Pass | Pass-with-fixes | Needs rework` only as the explained secondary process status. Write/update
the scope-appropriate report from `docs/document-locations.md`: `spec-review.md` only for
Product/system, otherwise `<work-slug>.spec-review.md`. Update WIP and stop according to the
recorded approval policy. Human checkpoints require explicit approval; automatic approval
needs an eligible local policy and explicit end-to-end continuation before design.
