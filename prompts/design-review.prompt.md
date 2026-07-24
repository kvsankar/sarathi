---
description: Independently review a design using checker results and look for missed cases.
agent: agent
---

# Design Review

Review the target design without editing it unless asked. Read the accepted requirements,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`, `docs/document-locations.md`,
`docs/design-principles.md`, `docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/human-first-artifacts.md`. Follow `docs/result-reporting.md` for the report. Answer
its first-page comprehension questions. Stop
as `Blocked-upstream` when the spec is unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.
For corrected findings, focus on those findings and affected boundaries; restart the full
review only when requirements or scope changed.

## Judge

After the plain-language review result, report concrete problems. Check that the opening page makes the architectural drivers,
system boundary, technical model, responsibilities, consequential interfaces and data,
important decisions and trade-offs, and test approach clear. For an existing-system change,
also check the relevant current state, target state, compatibility, unchanged boundaries,
and migration. Then check that the design selects the important boundaries for its context,
using the examples in `docs/artifact-contracts.md`. Backend designs must make applicable API
and database-schema boundaries reviewable. Tests must be able to prove the design, and the
solution must be no more complicated than current needs require.
For a Decision/evidence outcome, judge whether the method can credibly answer the stated
question and preserve its decision boundary; do not require a shippable implementation.

Apply the enduring principles in `docs/design-principles.md`. Treat named approaches as
conditional: require a concrete adoption signal, justified extent, simpler alternative,
cost, and verification strategy. Flag ceremonial DDD, ports, layers, interfaces, CQRS,
event sourcing, BDD tooling, unjustified vertical slices, or SOLID-driven factories,
inheritance, and indirection that do not solve a present problem. Confirm the design has an
explicit decision/effect boundary even when it uses different vocabulary.
Check whether a missing diagram leaves an important relationship, dependency, runtime
interaction, state transition, data flow, or deployment decision hard to review. Also flag
diagrams that add no information or disagree with the design.

Start with simplification. Name parts, commands, generated files, tests, or diagrams that
can be removed, deferred, collapsed, or proved by existing checks. A design with every
required section can still be `Needs rework` when it is overbuilt.

If identifiers interrupt the Technical Approach (or legacy Technical Crux), architectural
model, boundaries, decisions, trade-offs, or change-specific explanation, move them to
traceability and return `Needs rework`. If an
engineer must decode IDs to understand the architecture, rewrite it in plain language.

Report one plain-language result, categorized findings, interpreted evidence, what can be
deleted, deferred, or reused, and impact-ranked fixes. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` only as the explained secondary
process status. Write/update
the scope-appropriate report from `docs/document-locations.md`: `design-review.md` only for
Product/system, otherwise `<work-slug>.design-review.md`. Update WIP and stop according to
the recorded approval policy. Human checkpoints require explicit approval; automatic approval
needs an eligible local policy and explicit end-to-end continuation before planning.
