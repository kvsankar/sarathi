---
description: Independently review a design using checker results and look for missed cases.
agent: agent
---

# Design Review

Review the target design without editing it unless asked. Read the accepted requirements,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/human-first-artifacts.md`. Answer its five first-page comprehension questions. Stop
as `Blocked-upstream` when the spec is unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.
For corrected findings, focus on those findings and affected boundaries; restart the full
review only when requirements or scope changed.

## Judge

Lead with concrete problems. Check that the opening page makes the current state, target
state, ownership, changes, non-changes, difficult parts, and implementation order clear.
Then check that interfaces cover important success and failure behavior, decisions match
the requirements, tests can prove the design, and the solution is no more complicated
than current needs require.

Start with simplification. Name parts, commands, generated files, tests, or diagrams that
can be removed, deferred, collapsed, or proved by existing checks. A design with every
required section can still be `Needs rework` when it is overbuilt.

If identifiers interrupt the Technical Approach (or legacy Technical Crux), current/target
state, ownership, change boundaries, hard parts,
or implementation order, move them to traceability and return `Needs rework`. If an
engineer must decode IDs to understand the architecture, rewrite it in plain language.

Report blockers, evidence considered, concrete findings, what can be deleted, deferred, or reused,
top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not start planning without explicit approval.
