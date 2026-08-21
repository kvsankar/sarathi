---
description: Independently review a design using checker results and look for missed cases.
agent: agent
---

# Design Review

Review the target design without editing it unless asked. Read the accepted requirements,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`, `docs/document-locations.md`,
`docs/design-principles.md`, `docs/assurance-profiles.md`, `docs/simplicity-first.md`, and
`docs/human-first-artifacts.md`. Follow `docs/result-reporting.md` for the report. Answer
its first-page comprehension questions. Use `Blocked-upstream` when the spec is unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.
After issues are fixed, review only those fixes. If a fix is incomplete, leave the issue open.
After it is corrected, check only that fix again. Do not repeat the full review unless a fix
materially changes the document.
Apply the correction-closure procedure in `docs/review-verification-checklist.md`.

## Judge

State the result first, then report concrete problems. Ask: Can an engineer explain why this
design was chosen? Are component responsibilities, interfaces, data, important decisions,
trade-offs, and tests clear? For an existing system, are the current state, intended change,
compatibility, unchanged parts, and migration clear? Can tests prove the important behavior?
Is the solution any more complicated than it needs to be? Use the relevant examples in
`docs/artifact-contracts.md`; backend designs must make applicable APIs and database schemas
clear enough to review.
For a Decision/evidence outcome, judge whether the method can credibly answer the stated
question and preserve its decision boundary; do not require a shippable implementation.

Apply `docs/design-principles.md`. For each named approach, ask what current problem requires
it, how much is needed, whether a simpler option works, what it costs, and how it will be
tested. Flag ceremonial DDD, ports, layers, interfaces, CQRS,
event sourcing, BDD tooling, unjustified vertical slices, or SOLID-driven factories,
inheritance, and indirection that do not solve a present problem. Confirm the design has an
clear separation between decisions and side effects, even if it uses different words.
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

Report the result first. List problems by severity, explain what the checks prove, say what
can be deleted, deferred, or reused, and rank fixes by impact. Preserve
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream` in the saved report and internal
state; follow `docs/result-reporting.md` for chat. Write/update
the scope-appropriate report from `docs/document-locations.md`: `design-review.md` only for
Product/system, otherwise `<work-slug>.design-review.md`. Update WIP and stop according to
the recorded approval policy. Human checkpoints require explicit approval; automatic approval
needs an eligible local policy and explicit end-to-end continuation before planning.
