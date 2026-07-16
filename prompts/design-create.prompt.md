---
description: Create or revise a proportionate Software Design Document with explicit interfaces, decisions, test obligations, and risks.
agent: agent
---

# Design Create

Translate accepted requirements into a testable design at HLD, feature, or LLD depth.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the governing spec, existing design/code evidence,
and relevant ADRs. Block when upstream intent is materially ambiguous or unfit.

Load:

- `docs/artifact-contracts.md` for the Design contract and IDs;
- `docs/simplicity-first.md` for the complexity budget and brownfield oracle precedence;
- `docs/assurance-profiles.md` for selected depth and modules;
- `docs/cross-cutting-concerns.md` for ownership of activated modules only;
- `docs/test-ownership.md` when ancestor or cross-child test intent is involved;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md` before handoff.

Use the recorded profile unless scope/risk evidence requires escalation. Record profile,
modules, rationale, and escalation triggers in the design. High-assurance strengthens
boundary evidence and review; it does not require designing distant learning-dependent
work up front.

Ask one focused question per turn only for a decision that materially changes architecture,
contracts, risk, or readiness. In YOLO mode, record assumptions and trade-offs; do not
invent external contracts or user approval.

## Design

Follow the Design contract in `docs/artifact-contracts.md`. Keep human-facing labels
readable and machine IDs in trace anchors, glossaries, matrices, obligations, and exact
references.

- Trace requirements and quality attributes into components, interfaces, decisions, and
  executable `TEST-*` obligations.
- Separate pure decisions from side effects using functional core/imperative shell or an
  equivalent explicit boundary.
- Design success, failure, state, concurrency, lifecycle, compatibility, and recovery at
  material interfaces.
- Compare realistic alternatives for material decisions and create/update ADRs.
- For external systems, name the contract source and real/official conformance strategy.
  Treat self-authored doubles as residual risk until tied to reality.
- Define developer verification and only the additional environments/module tactics
  justified by the selected profile and context.
- Keep logging, errors, deployment, docs, security/privacy, UI/accessibility, migration,
  resilience, performance/cost, and operations proportional to activated modules.
- Require accepted behavior, two concrete consumers, measured inadequacy, or material risk
  before adding generic frameworks, registries, generators, manifests, schema systems,
  extension points, or harnesses.
- For brownfield refactors, reuse existing functional, acceptance, schema/OpenAPI, CI,
  build, and deployment tests; add only focused changed-boundary evidence.

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

Retry launchers when needed. For child artifacts, use checker feature/parent options. Then
run `/design-assess`, with fresh Mechanical Verifier and Qualitative Reviewer sub-agents
when available. Revise design or upstream intent until Pass or explicitly accepted
Pass-with-fixes.

Run simplify, update `.sdlc/wip.md`, and stop for human review. Report design/ADR/mock paths,
depth, readiness, profile/modules, assessment, key decisions/risks, and recommended
`/plan-create`. Do not start planning in the same turn without an explicit end-to-end
instruction.
