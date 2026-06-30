---
description: Qualitatively review a Software Requirements Specification using existing verification evidence where available.
agent: agent
---

# Spec Review

Perform the qualitative review of a Software Requirements Specification. This command
judges the substance of the spec; it does not replace `/spec-verify`. If verification
evidence is absent, state that gap and either use the latest supplied evidence or recommend
`/spec-verify`. Use `/spec-assess` when the user wants verification and review together.

Target the spec file the user provides, defaulting to `spec.md`. Do not edit it unless
explicitly asked.

Use an adversarial posture: try to refute the spec, find missing stakeholder needs,
ambiguous behavior, weak acceptance criteria, missing non-goals, missing build/deployment
or documentation intent, and traceability theater. Prefer fresh context, a separate
reviewer, or a different model/tool when available. If the same agent created the spec,
state that the review is not independent.

## Qualitative Review

Score each item 1-5 and give one concrete fix for any score below 5:

- Problem framing: mission, system boundary, stakeholders, success criteria, and root
  problem are clear before solution behavior appears.
- Stakeholder need fidelity: needs describe stakeholder goals and pains, not disguised
  implementation choices.
- Feature derivation and scope control: features trace to needs and avoid silent
  gold-plating.
- Non-goal quality: exclusions and deferred work are explicit and non-contradictory.
- Scope/readiness fit: scope is product/system, feature/component, or slice/change, and
  Implementation Readiness is realistic.
- Scope-specific completeness: the artifact carries the right level of detail for its
  scope, including build/release/deployment and user/developer documentation intent where
  relevant.
- Use-case quality: actors, goals, preconditions, flows, exceptions, postconditions, and
  actor value are behavior-focused and complete enough.
- Requirement quality: FRs are necessary, atomic, feasible, verifiable, unambiguous,
  design-free, and use "shall" consistently.
- Supplementary/NFR coverage: performance, security, privacy, reliability, usability,
  accessibility, interoperability, compliance, data, platform, operational,
  build/deployment, and documentation constraints are considered and measurable where
  applicable.
- Acceptance quality: acceptance tests are black-box, scenario-based, and verify linked
  UC/FR/NFR intent instead of restating requirements.
- Traceability and change readiness: links support validation, impact analysis, and future
  revision.

## Output

1. Verification evidence considered, or a clear note that none was available.
2. Qualitative scorecard.
3. Top fixes ranked by impact.
4. **Review verdict**: Pass / Pass-with-fixes / Needs rework.

After reporting the verdict, stop. Do not start `/design-create` or any downstream command
without explicit user approval.
