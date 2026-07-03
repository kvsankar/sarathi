---
name: srs-authoring
description: Detailed Software Requirements Specification authoring and review guidance. Use when Codex needs to draft, revise, reconstruct, or qualitatively review an SRS/spec.md; when a Sarathi spec-create/spec-review task needs stricter requirements specificity; when brownfield baseline adoption must reconstruct current behavior from code, tests, docs, issues, or deployment evidence; or when a spec is structurally valid but may be too terse, cryptic, over-bundled, weak on use-case flows, or weak on acceptance criteria.
---

# SRS Authoring

Use this skill to produce a detailed, reviewable Software Requirements Specification rather
than a merely structurally valid one. Pair it with Sarathi `/spec-create` or `/spec-review`
when the target workspace uses Sarathi.

## Workflow

1. Determine scope: product/system, feature/component, or slice/change.
2. Determine entry mode: greenfield, brownfield baseline adoption, or brownfield delta-only.
3. Read `references/srs-quality.md` before drafting, revising, reconstructing, or reviewing
   an SRS.
4. For brownfield baseline adoption, inventory existing sources before writing and classify
   each source set as current governing source, adopted source, adapted source, background
   proposal, historical review evidence, open-decision ledger, or rejected/stale source.
5. Draft requirements from stakeholder needs to features, fully dressed use cases, atomic
   FRs/NFRs, scenario-sized ATs, and traceability. Preserve behavioral distinctions found in
   sources instead of summarizing them away.
6. Keep design decisions out unless they are true external constraints, external contracts,
   mandated platform choices, compliance constraints, or observable behavior.
7. Run the project checker, then review qualitatively for terse, bundled, or non-reviewable
   content. A green structural checker is not a pass by itself.

## Quality Bar

- One `UN-` item names one stakeholder and one outcome or pain.
- One `FR-` item states one externally observable obligation using "shall".
- One `AT-` item is one scenario or measurable quality check with a concrete oracle.
- Each `UC-` item has actor-goal flow detail: trigger, preconditions, guarantees, numbered
  main flow, alternate flows, error/exception flows, postconditions, importance, and traces.
- NFRs cover relevant performance, security, privacy, reliability, UX/accessibility,
  operability, logging/telemetry, error handling, build/deploy, migration, and documentation
  concerns, with measurable thresholds or explicit deferrals.
- Brownfield specs include source reconciliation and explicit uncertainty where behavior is
  inferred, conflicted, accidental, or undocumented.

## References

- `references/srs-quality.md`: detailed SRS authoring and review rules, brownfield source
  reconstruction, quality gates, and checker recommendations.
