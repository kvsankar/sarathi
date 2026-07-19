---
description: Explain how the system will change, including important interfaces, decisions, tests, and risks.
agent: agent
---

# Design Create

Translate approved requirements into a testable design at the level of detail this change
needs.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted spec, existing design/code evidence,
and relevant ADRs. Block when requirements are materially ambiguous or unfit.

Load `docs/artifact-contracts.md` and `docs/human-first-artifacts.md` for the Design
contract, narrative, and traceability layers.

## Triggered References

Load only when the trigger applies:

- `docs/simplicity-first.md`: a new abstraction, reuse decision, or refactor is in scope;
- `docs/assurance-profiles.md`: selecting or changing review depth or additional checks;
- `docs/cross-cutting-concerns.md`: an identified risk needs an owner and checks;
- `docs/test-ownership.md`: parent or cross-child test intent is involved;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: immediately before handoff.

Use the recorded review level unless new scope or risk evidence requires stronger review.
Keep exact process fields in metadata. In the design, explain important risks and their
checks in ordinary language. High-assurance requires stronger proof at important
boundaries, not distant design work.

Ask one focused question per turn only for a decision that materially changes architecture,
contracts, risk, or readiness. In YOLO mode, record assumptions and trade-offs; do not
invent external contracts or user approval.

Before creating a child design, ask whether the approved architecture and one short plan
already make implementation safe. If so, do not create another design. Otherwise explain
only the specific unresolved decision and changed boundary.

## Design

Start new or materially revised designs with the version marker and
`## Technical Approach`. Accept `## Technical Crux` in existing documents.
Explain current/target state, essential model, ownership, changes/non-changes, hard parts,
and migration order without process IDs. Use descriptive visible headings; keep IDs in
comments and the final `## Traceability` appendix. Follow the remaining Design contract in
`docs/artifact-contracts.md`.

- Explain how required behavior maps to components, interfaces, decisions, and tests. Keep
  `TEST-*` IDs in traceability.
- Keep side effects isolated where that makes the design clearer and easier to test.
- Design success, failure, state, concurrency, lifecycle, compatibility, and recovery at
  material interfaces.
- Compare realistic alternatives for material decisions and create/update ADRs.
- For external systems, name the contract source and how it will be tested through the real
  dependency or its official test interface. If only a mock is available, state what
  remains untested.
- Define developer verification and only the additional environments/module tactics
  justified by the chosen review depth and context.
- Keep logging, errors, deployment, docs, security/privacy, UI/accessibility, migration,
  resilience, performance/cost, and operations proportional to the risks actually present.
- Do not add reusable machinery without a current need. Prefer the direct solution.
- For refactors in an existing system, reuse existing functional, acceptance,
  schema/OpenAPI, CI, build, and deployment tests; add only focused proof for the changed
  boundary.

Write `design.md` and, for Product/system scope, its reviewable `design.html` unless other
paths are named. For Feature/component or Slice/change scope, create `design.html` only
when visual review materially helps the decision. Child designs include
the exact machine field `Parent Work Item: WORK-AREA-NAME`. Do not repeat parent
architecture or create a separate design when approved parent documents and one short plan
are sufficient.

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

Run simplify, update `.sdlc/wip.md`, and stop for human review. Report changed paths, the
approach, important decisions and risks, checks run, open questions, and recommended
`/plan-create`. Do not start planning in the same turn without an explicit end-to-end
instruction.
