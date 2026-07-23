---
description: Write or revise clear, testable requirements from the user's needs.
agent: agent
---

# Spec Create

Create or revise the requirements document that controls the work. Requirements define
intent, not implementation architecture.

## Load

Read `.sdlc/wip.md`, `.sdlc/process-decisions.yaml`, existing documents, and relevant
repository evidence. Load `docs/artifact-contracts.md`, `docs/document-locations.md`, and
`docs/human-first-artifacts.md` for the Spec contract, narrative, and traceability layers.
Load `docs/requirements-model.md` for the requirements hierarchy.

## Triggered References

Load only when the trigger applies:

- `docs/project-entry.md`: starting in an unfamiliar or existing codebase;
- `docs/srs-authoring.md`: reconstructed behavior, detailed use cases, measurable
  supplementary requirements, or terse requirements risk;
- `docs/assurance-profiles.md`: selecting or changing delivery assurance or additional checks;
- `docs/simplicity-first.md`: proposed implementation machinery, reuse, or a refactor affects
  the requirement boundary;
- `docs/cross-cutting-concerns.md`: an identified risk needs additional checks;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: immediately before handoff.

If a required reference cannot be found in the active skill bundle or canonical repo,
report an incomplete installation instead of recreating policy from memory.

## Establish Intent

Infer and state Product/system, Feature/component, or Slice/change scope. At project entry or
the first requirements for a feature, present a contextual recommendation and ask the user to
select or confirm: Delivery Assurance Profile (Lean, Standard, High-assurance), Approval
Policy (Human checkpoints, Automatic eligible gates), and Work Outcome (Product increment,
Decision/evidence). Record the explicit choice or confirmed default in process metadata; never
infer automatic approval from YOLO or unattended wording. Describe important risks and checks
in ordinary language.

Before writing, understand the problem, affected stakeholders, success, non-goals,
observable behavior, external boundaries, acceptance basis, and material constraints. Ask
one focused question per turn only when the missing answer materially changes accepted
intent or risk. In YOLO mode, proceed with explicit assumptions; default to Standard when
Lean is not supported by evidence.

Research current external facts when requirements depend on changing standards,
regulation, vendor contracts, or specialized domain facts. Cite authoritative sources in
the spec when they control intent.

Before creating a child spec, ask whether the approved requirements and one short plan are
already enough to implement safely. If so, do not create another spec. If not, write only
what is needed to answer the specific unresolved question.

## Author

Follow the Spec contract in `docs/artifact-contracts.md` exactly for product/system work.
Feature and slice specs contain only changed/refined behavior, unresolved local decisions,
slice-specific acceptance, new risks/boundaries, and exceptions to parent intent. Never
reproduce the complete parent requirement inventory.

Apply these requirements rules:

- Start new or materially revised specs with
  `<!-- sarathi:artifact-format version="3" -->` and `## Product Overview`.
  Accept `## Product Crux` in existing documents.
  Keep its plain-language problem, users, outcomes, non-goals, success, failures, and
  constraints free of process IDs. Use descriptive headings; put IDs in comments and the
  final `## Traceability` appendix.
- Derive features from stakeholder needs; use cases then describe actor-goal behavior in
  context, including meaningful alternate and failure flows.
- Make non-goals explicit enough to prevent accidental scope.
- Write each functional requirement as one necessary, feasible, testable behavior. Write
  measurable supplementary requirements for relevant qualities and constraints. Keep
  `FR-*` and `NFR-*` IDs in traceability.
- Define black-box acceptance tests for required behavior and qualities. Define journey
  tests when confidence depends on an ordered end-to-end story. Keep `AT-*` and `JT-*` IDs
  in traceability.
- Preserve the derivation from problem and needs through features, use cases, requirements,
  acceptance tests, and journeys in the final traceability section.
- Name the source of each external contract and how it will be tested through the real
  dependency or its official test interface. If only a mock is available, state what
  remains untested.
- For UI-facing work, record presentation/accessibility intent and
  `UI Mock Preference: Required | Optional | Not needed | Deferred`.
- Include only the additional checks this work needs. Do not paste a universal concern list
  or add `None` fields for risks the context does not suggest.
- Preserve stable IDs during revision and record changes needed in parent documents.
- Do not turn process links, evidence, approval, or status needs into product requirements.
  Do not specify hypothetical future consumers.

Use the scope-appropriate name from `docs/document-locations.md`: `spec.md` only for
Product/system, otherwise `<work-slug>.spec.md`, unless another path is named. Child specs
include `Parent Work Item: WORK-AREA-NAME`. Do not create a standalone child spec when
approved parent documents and one short plan are enough.

## Verify And Handoff

Run the repeatable format and link checker and fix failures:

```pwsh
python checkers/check_spec.py <spec-path> --json
```

Retry with `python3` or `uv run python` when needed. Then run `/spec-assess`; use one fresh
sub-agent for checks and another for independent review when available. Without sub-agents,
say that the review is not independent and keep the passes separate.

Revise until the result is Pass or an explicitly accepted Pass-with-fixes. Update
`.sdlc/wip.md` with the path, exact machine status fields, checks run, assumptions,
blockers, and next action.

Stop according to the recorded approval policy. Human checkpoints require explicit approval;
automatic approval needs an eligible local policy and explicit end-to-end continuation before
design. Report the spec path, what it defines, checks run, open questions, and recommended
`/design-create`.
