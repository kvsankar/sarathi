---
description: Independently review requirements using checker results and look for missed cases.
agent: agent
---

# Spec Review

Review the target spec without editing it unless asked. Read `.sdlc/wip.md`, available
verification evidence, `docs/artifact-contracts.md`, `docs/assurance-profiles.md`, and
`docs/simplicity-first.md`. Load `docs/human-first-artifacts.md` and answer its five
first-page comprehension questions. Load `docs/srs-authoring.md` for broad, reconstructed,
terse, or over-bundled requirements.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and actively seek counterexamples. Passing automatic checks is useful evidence,
not proof that the requirements are good.
For corrected findings, focus on those findings and affected boundaries; restart the full
review only when requirements or scope changed.

## Judge

Lead with concrete problems. Check that the opening page lets an engineer explain the
problem, affected users, required behavior, non-goals, success, and important failures.
Then check that each requirement is observable and testable, external contracts are
credible, links to later work resolve, and stronger checks are limited to real risks.

Start with simplification: identify requirements, roles, qualities, documents, or future
behaviors that can be deleted, deferred, or proven by existing evidence. A spec with every
required section still needs rework when it is overbuilt.

If identifiers interrupt the Product Overview (or legacy Product Crux), move them to
traceability and return
`Needs rework`. If an engineer must decode IDs to understand the product, rewrite it in
plain technical language even when automatic checks pass.

Report evidence considered, concrete findings, what can be deleted, deferred, or proved by
existing evidence, top fixes, and
`Pass | Pass-with-fixes | Needs rework`. Update `.sdlc/wip.md` and stop; do not start design
without explicit user approval.
