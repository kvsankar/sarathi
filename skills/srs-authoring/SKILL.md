---
name: srs-authoring
description: Detailed Software Requirements Specification authoring and review guidance. Use when Codex needs to draft, revise, reconstruct, or qualitatively review an SRS/spec.md; when a Sarathi spec-create/spec-review task needs stricter requirements specificity; when brownfield baseline adoption must reconstruct current behavior from code, tests, docs, issues, or deployment evidence; or when a spec is structurally valid but may be too terse, cryptic, over-bundled, weak on use-case flows, or weak on acceptance criteria.
---

# SRS Authoring

Use this skill to produce a detailed, reviewable Software Requirements Specification rather
than a merely structurally valid one. Pair it with Sarathi `/spec-create` or `/spec-review`
when the target workspace uses Sarathi.

Use Sarathi's needs-to-evidence requirements model: understand the problem and stakeholders,
derive features from stakeholder needs, describe behavior through use cases where useful,
make it precise with functional and relevant supplementary requirements, and validate it
with acceptance tests and journeys where order matters. The model is principally influenced
by Leffingwell/Widrig. Other requirements approaches are optional techniques for concrete
gaps, not modes or required sections. Traceability preserves the reasoning; it does not
replace it.

## Workflow

1. Determine scope: product/system, feature/component, or slice/change.
2. Determine entry mode: greenfield, brownfield baseline adoption, or brownfield delta-only.
3. Read `references/srs-quality.md` before drafting, revising, reconstructing, or reviewing
   an SRS.
4. For brownfield baseline adoption, inventory existing sources before writing and classify
   each source set as current governing source, adopted source, adapted source, background
   proposal, historical review evidence, open-decision ledger, or rejected/stale source.
5. Draft requirements from stakeholder needs to features, proportionate use cases, atomic
   functional and supplementary requirements, scenario-sized acceptance tests, important
   journeys, and traceability. Preserve behavioral distinctions found in sources instead
   of summarizing them away.
6. Keep design decisions out unless they are true external constraints, external contracts,
   mandated platform choices, compliance constraints, or observable behavior.
7. Run the project checker, then review qualitatively for terse, bundled, or non-reviewable
   content. A green structural checker is not a pass by itself.

## Quality Bar

- One stakeholder need names one stakeholder and one outcome or pain.
- One functional requirement states one externally observable obligation using "shall".
- One acceptance test is one scenario or measurable quality check with a concrete result.
- Use cases include only the actor-goal flow detail needed to make material behavior,
  alternatives, failures, and outcomes clear.
- Supplementary requirements cover only relevant qualities and constraints, with measurable
  thresholds where possible.
- Brownfield specs include source reconciliation and explicit uncertainty where behavior is
  inferred, conflicted, accidental, or undocumented.

Visible headings and prose use descriptive language. Put process IDs in structured comments
or the final traceability section, never in headings merely to satisfy a checker.

## References

- `references/srs-quality.md`: detailed SRS authoring and review rules, brownfield source
  reconstruction, quality gates, and checker recommendations.
