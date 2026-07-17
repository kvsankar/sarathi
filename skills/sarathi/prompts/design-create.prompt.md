---
description: Create or revise a proportionate Software Design Document with explicit interfaces, decisions, test obligations, and risks.
agent: agent
---

# Design Create

Translate accepted requirements into a testable design at HLD, feature, or LLD depth.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted spec, existing design/code evidence,
and relevant ADRs. Block when requirements are materially ambiguous or unfit.

Load:

- `docs/artifact-contracts.md` for the Design contract and IDs;
- `docs/simplicity-first.md` for the complexity budget and precedence of existing tests;
- `docs/assurance-profiles.md` for selected review depth and extra risk checks;
- `docs/cross-cutting-concerns.md` for ownership of those extra checks only;
- `docs/test-ownership.md` when parent or cross-child test intent is involved;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md` before handoff.

Use the recorded profile unless new scope or risk evidence requires stronger review.
Record the profile, extra risk checks, reason, and conditions for stronger review in the
design. High-assurance strengthens evidence and review at important boundaries; it does
not require designing distant work before nearer feedback arrives.

Ask one focused question per turn only for a decision that materially changes architecture,
contracts, risk, or readiness. In YOLO mode, record assumptions and trade-offs; do not
invent external contracts or user approval.

## Design

Follow the Design contract in `docs/artifact-contracts.md`. Keep labels readable. Put
machine IDs in compact link records, glossaries, tables, test obligations, and exact
references.

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

Write `design.md` and deterministic `design.html` unless other paths are named. Child
designs include `Parent Work Item: WORK-AREA-NAME`.

If `UI Mock Preference: Required`, create or update `mock-ui.html` with required screens,
states, flows, responsiveness, and accessibility intent. Record approval status; production
UI implementation remains blocked until explicit user approval.

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
