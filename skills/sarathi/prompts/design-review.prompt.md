---
description: Independently review a design using checker results and look for missed cases.
agent: agent
---

# Design Review

Review the target design without editing it unless asked. Read the accepted requirements,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/design-principles.md`, `docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/human-first-artifacts.md`. Answer its first-page comprehension questions. Stop
as `Blocked-upstream` when the spec is unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.
For corrected findings, focus on those findings and affected boundaries; restart the full
review only when requirements or scope changed.

## Judge

Lead with concrete problems. Check that the opening page makes the architectural drivers,
system boundary, technical model, responsibilities, consequential interfaces and data,
important decisions and trade-offs, and test approach clear. For an existing-system change,
also check the relevant current state, target state, compatibility, unchanged boundaries,
and migration. Then check that the design selects the important boundaries for its context,
using the examples in `docs/artifact-contracts.md`. Backend designs must make applicable API
and database-schema boundaries reviewable. Tests must be able to prove the design, and the
solution must be no more complicated than current needs require.

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

Report blockers, evidence considered, concrete findings, what can be deleted, deferred, or reused,
top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not start planning without explicit approval.
