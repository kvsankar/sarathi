---
description: Turn accepted requirements and constraints into an implementable, evolvable technical model.
agent: agent
---

# Design Create

Translate accepted requirements and constraints into an implementable, evolvable technical
model at the level of detail the work needs.

## Load And Gate

Read `.sdlc/wip.md`, process decisions, the accepted spec, existing design/code evidence,
and relevant ADRs. Block when requirements are materially ambiguous or unfit.

Load `docs/artifact-contracts.md`, `docs/document-locations.md`, `docs/assurance-profiles.md`, `docs/design-principles.md`, and
`docs/human-first-artifacts.md` for the Design contract, architectural judgment, narrative,
and traceability layers. Load `docs/result-reporting.md` for the handoff.

## Triggered References

Load only when the trigger applies:

- `docs/simplicity-first.md`: a new abstraction, reuse decision, or refactor is in scope;
- `docs/cross-cutting-concerns.md`: an identified risk needs an owner and checks;
- `docs/test-ownership.md`: parent or cross-child test intent is involved;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: immediately before handoff.

Use the recorded assurance profile, approval policy, and work outcome unless new evidence
requires a change. Keep exact process fields in metadata. For decision/evidence work, design
only the method, boundaries, and credible proof needed for its decision; do not imply a
shippable product increment. High-assurance requires stronger proof at important boundaries,
not distant design work.

Ask one focused question per turn only for a decision that materially changes architecture,
contracts, risk, or readiness. In YOLO mode, record assumptions and trade-offs; do not
invent external contracts or user approval.

Before creating a child design, ask whether the approved architecture and one short plan
already make implementation safe. If so, do not create another design. Otherwise explain
only the specific unresolved decision and changed boundary.

## Design

Start new or materially revised designs with the version marker and
`## Technical Approach`. Accept `## Technical Crux` in existing documents.
Explain the architectural drivers, system boundary, structure, responsibilities,
relationships, interfaces, data, runtime behavior, decisions, quality-attribute trade-offs,
testability, and evolution without process IDs. For changes to an existing system, also
explain the relevant current state, target state, unchanged boundaries, compatibility, and
migration. Use descriptive visible headings; keep IDs in comments and the final
`## Traceability` appendix. Follow the Design contract and its context-specific boundary
guidance in `docs/artifact-contracts.md`.

- Explain how required behavior maps to components, interfaces, decisions, and tests. Keep
  `TEST-*` IDs in traceability.
- Select and define the consequential boundaries for this kind of system. For a backend,
  database schema/data ownership and API contracts are primary review surfaces whenever
  they apply. Do not inventory irrelevant boundaries.
- Choose the smallest useful set of diagrams from `docs/design-principles.md` when visual
  explanation materially improves review; do not produce a diagram catalogue.
- Separate deterministic decisions from side effects using functional core/imperative shell
  or an equivalent explicit boundary. Use vocabulary suited to the system; the boundary
  itself is required.
- Design success, failure, state, concurrency, lifecycle, compatibility, and recovery at
  material interfaces.
- Compare realistic alternatives for material decisions and create/update ADRs.
- For external systems, name the contract source and how it will be tested through the real
  dependency or its official test interface. If only a mock is available, state what
  remains untested.
- Define developer verification and only the additional environments/module tactics
  justified by the chosen delivery assurance profile and context.
- Keep logging, errors, deployment, docs, security/privacy, UI/accessibility, migration,
  resilience, performance/cost, and operations proportional to the risks actually present.
- Do not add reusable machinery without a current need. Prefer the direct solution.
- For refactors in an existing system, reuse existing functional, acceptance,
  schema/OpenAPI, CI, build, and deployment tests; add only focused proof for the changed
  boundary.

Use the scope-appropriate name from `docs/document-locations.md`: `design.md` only for
Product/system, otherwise `<work-slug>.design.md`; for Product/system also write its
reviewable `design.html` unless other paths are named. For Feature/component or Slice/change,
create `design.html` only when visual review materially helps the decision. Child designs
include the exact machine field `Parent Work Item: WORK-AREA-NAME`. Do not repeat parent
architecture or create a separate design when approved parent documents and one short plan are
sufficient.

If `UI Mock Preference: Required` and no approved prototype exists, create or update `mock-ui.html` with required screens,
states, flows, responsiveness, and accessibility intent. Record approval status; production
UI implementation remains blocked until explicit user approval.
When a prototype already exists, reference it as `Approved Prototype Artifact: path` and
reuse its existing `ux.mock.approved` record instead of creating another mock.

## Verify And Handoff

Run:

```pwsh
python checkers/check_spec.py <spec-path> --json
python checkers/check_design.py <design-path> --spec <spec-path> --json
```

Retry launchers when needed. For child documents, use checker feature/parent options. Then
execute the assessment instructions from `prompts/design-assess.prompt.md`, with one fresh
sub-agent for checks and another for independent review when available. Revise the design or
requirements until Pass or explicitly accepted Pass-with-fixes.

Run simplify, update `.sdlc/wip.md`, and stop according to the recorded approval policy.
Human checkpoints require explicit approval; automatic approval needs an eligible local policy
and an explicit end-to-end instruction before planning. Give one plain-language handoff
result, then changed paths, interpreted evidence, categorized problems, impact-ranked
actions, assumptions, risks, open questions, and recommended next stage `plan-create` using
the current host's explicit invocation form.
