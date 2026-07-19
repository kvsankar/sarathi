---
description: Create or revise a proportionate Software Design Document with explicit interfaces, decisions, test obligations, and risks.
agent: agent
---

# Design Create

Translate accepted requirements into a testable design at HLD, feature, or LLD depth.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted spec, existing design/code evidence,
and relevant ADRs. Block when requirements are materially ambiguous or unfit.

Load `docs/artifact-contracts.md` and `docs/human-first-artifacts.md` for the Design
contract, narrative, and traceability layers.

## Triggered References

Load only when the trigger applies:

- `docs/simplicity-first.md`: a Standard complexity budget, new abstraction, reuse decision,
  or refactor is in scope;
- `docs/assurance-profiles.md`: selecting or changing review depth or extra checks;
- `docs/cross-cutting-concerns.md`: a concrete risk module needs an owner;
- `docs/test-ownership.md`: parent or cross-child test intent is involved;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: immediately before handoff.

Use the recorded profile unless new scope or risk evidence requires stronger review.
Record the profile, extra risk checks, reason, and conditions for stronger review in the
design. High-assurance strengthens evidence and review at important boundaries; it does
not require designing distant work before nearer feedback arrives.

Ask one focused question per turn only for a decision that materially changes architecture,
contracts, risk, or readiness. In YOLO mode, record assumptions and trade-offs; do not
invent external contracts or user approval.

Before creating a child design, apply the direct-to-code decision in
`docs/simplicity-first.md`. Reuse accepted architecture. If no boundary decision is
unresolved, do not create the design. Otherwise state the ceremony budget and design only
the changed boundary.

## Design

Start new or materially revised designs with the version marker and `## Technical Crux`.
Explain current/target state, essential model, ownership, changes/non-changes, hard parts,
and migration order without process IDs. Use descriptive visible headings; keep IDs in
comments and the final `## Traceability` appendix. Follow the remaining Design contract in
`docs/artifact-contracts.md`.

- Trace requirements and quality attributes into components, interfaces, decisions, and
  executable `TEST-*` obligations.
- Separate pure decisions from side effects using functional core/imperative shell or an
  equivalent explicit boundary.
- Design success, failure, state, concurrency, lifecycle, compatibility, and recovery at
  material interfaces.
- Compare realistic alternatives for material decisions and create/update ADRs.
- For external systems, name the contract source and real/official conformance strategy.
  Treat self-authored doubles as a remaining risk until tied to reality.
- Define developer verification and only the additional environments/module tactics
  justified by the chosen review depth and context.
- Keep logging, errors, deployment, docs, security/privacy, UI/accessibility, migration,
  resilience, performance/cost, and operations proportional to the risks actually present.
- Require accepted behavior, two concrete consumers, measured inadequacy, or material risk
  before adding generic frameworks, registries, generators, manifests, schema systems,
  extension points, or harnesses.
- For refactors in an existing system, reuse existing functional, acceptance,
  schema/OpenAPI, CI, build, and deployment tests; add only focused proof for the changed
  boundary.

Write `design.md` and, for Product/system scope, its reviewable `design.html` unless other
paths are named. For Feature/component or Slice/change scope, create `design.html` only
when visual review materially helps the decision. Child designs include
`Parent Work Item: WORK-AREA-NAME`. Do not repeat parent architecture or create a separate
design when an Inherited-Intent Implementation Record is sufficient.

If `UI Mock Preference: Required` and no approved prototype exists, create or update `mock-ui.html` with required screens,
states, flows, responsiveness, and accessibility intent. Record approval status; production
UI implementation remains blocked until explicit user approval.
When a prototype already exists, reference it as `Approved Prototype Artifact: path` and
reuse its existing `ux.mock.approved` record instead of creating another mock.

## Verify And Handoff

Run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
```

Retry launchers when needed. For child documents, use checker feature/parent options. Then
run `/design-assess`, with one fresh sub-agent for checks and another for independent review
when available. Revise the design or requirements until Pass or explicitly accepted
Pass-with-fixes.

Run simplify, update `.sdlc/wip.md`, and stop for human review. Report design/ADR/mock paths,
depth, readiness, review depth and extra checks, assessment, key decisions/risks, and recommended
`/plan-create`. Do not start planning in the same turn without an explicit end-to-end
instruction.
