---
description: Write or revise clear, testable requirements from the user's needs.
agent: agent
---

# Spec Create

Create or revise the accepted product baseline or one focused slice delta. Requirements
define observable intent; a compact slice may also carry the delivery details needed for code.

## Load

Read `.sdlc/wip.md`, `.sdlc/process-decisions.yaml`, existing documents, and relevant
repository evidence. Load `docs/artifact-contracts.md`, `docs/document-locations.md`, and
`docs/human-first-artifacts.md` for the Spec contract, narrative, and traceability layers.
Load `docs/requirements-model.md` for requirements and `docs/result-reporting.md` for the report.

## Triggered References

Load only when the trigger applies:

- `docs/project-entry.md`: starting in an unfamiliar or existing codebase;
- `docs/srs-authoring.md`: reconstructed behavior, detailed use cases, measurable
  supplementary requirements, or terse requirements risk;
- `docs/assurance-profiles.md`: deciding whether risk needs separate design, planning, or extra checks;
- `docs/approval-gates.md`: selecting approval policy or using explicit YOLO;
- `docs/simplicity-first.md`: proposed implementation machinery, reuse, or a refactor affects
  the requirement boundary;
- `docs/cross-cutting-concerns.md`: an identified risk needs additional checks;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: immediately before reporting.

If a required reference cannot be found in the active skill bundle or canonical repo,
report an incomplete installation instead of recreating policy from memory.

## Establish Intent

Infer whether the work is a Product/system baseline, Feature/component refinement, or
Slice/change delta. At project entry, confirm approval policy and work outcome when they are
not already recorded. Under explicit YOLO, infer eligible internal decisions without
stopping, following `docs/approval-gates.md`. Describe important risks and checks in ordinary
language.

Before writing, understand the problem, affected stakeholders, success, non-goals,
observable behavior, external boundaries, acceptance basis, and material constraints. Ask
one focused question per turn only when the missing answer materially changes accepted
intent or risk. In YOLO mode, proceed with explicit assumptions.

Research current external facts when requirements depend on changing standards,
regulation, vendor contracts, or specialized domain facts. Cite authoritative sources in
the spec when they control intent.

Do not create a slice for a defect repair, refactor, or mechanical change unless it
intentionally changes observable behavior or a protected contract. For an intentional
change, reference the accepted baseline and applicable protected authorities instead of
repeating them.

## Author

Follow the Spec contract in `docs/artifact-contracts.md` exactly for product/system work.
Feature specs contain only refined behavior and local decisions. A compact slice follows the
four-section Slice contract: baseline and constraints, observable delta and exclusions,
delivery and checks, then traceability. It may contain the technical approach, planned
delivery unit, rollback, and review point. Never reproduce the baseline inventory or create
a registry of slices.

Apply these requirements rules:

- Start new or materially revised specs with
  `<!-- sarathi:artifact-format version="3" -->` and `## Product Overview`.
  Accept `## Product Crux` in existing documents.
  Keep its plain-language problem, users, outcomes, non-goals, success, failures, and
  constraints free of process IDs. Use descriptive headings; put IDs in comments and the
  final `## Traceability` appendix.
- Follow the needs-to-evidence rules in `docs/requirements-model.md`; make non-goals,
  failures, measurable constraints, black-box acceptance, and ordered journeys explicit when
  they matter.
- Name the source of each external contract and how it will be tested through the real
  dependency or its official test interface. If only a mock is available, state what
  remains untested.
- For UI-facing work, record presentation/accessibility intent, `UI Mock Preference`, and the
  required mock or approved prototype path. Include only checks this work needs.
- Preserve stable IDs during revision and record changes needed in parent documents.
- Do not turn process links, evidence, approval, or status needs into product requirements.
  Do not specify hypothetical future consumers.

Use the name for this scope from `docs/document-locations.md`: `spec.md` for Product/system,
`<work-slug>.spec.md` for a Feature/component spec, and `<work-slug>.slice.md` for a focused
delta, unless another path is named. Child specs
include `Parent Work Item: WORK-AREA-NAME`. Do not create a standalone child spec when
approved parent documents and one short plan are enough.

## Check And Report

Run the repeatable format and link checker and fix failures:

```pwsh
node checkers/check_spec.mjs <spec-path> --json
```

For a compact slice, run:

```pwsh
node checkers/check_spec.mjs <slice-path> --slice --json
```

Retry launchers when needed. Use the result for one assessment under
`prompts/spec-assess.prompt.md`; do not rerun unchanged checks. Follow the correction and
re-review rules in `docs/review-verification-checklist.md`.
Use the report selected by `docs/document-locations.md`. If a fix requires any material
revision, stop instead of changing approved requirements. Report the current result even
when it is `Needs rework`; do not accept `Pass-with-fixes`.

Update `.sdlc/wip.md` with the path, machine status, checks, assumptions, blockers, and next action.

Stop according to the recorded approval policy. Human checkpoints require explicit approval;
automatic approval needs an eligible local policy and explicit end-to-end continuation.
State the result first. Give the path, check and review results, problems by severity, and
next actions. Recommend `code-create` when a compact slice is code-ready. Recommend
`design-create` or `plan-create` only when the named complexity or risk needs that separate
review.
