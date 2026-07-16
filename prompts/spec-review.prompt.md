---
description: Qualitatively and adversarially review a Software Requirements Specification using available mechanical evidence.
agent: agent
---

# Spec Review

Review the target spec without editing it unless asked. Read `.sdlc/wip.md`, available
verification evidence, `docs/artifact-contracts.md`, `docs/assurance-profiles.md`, and
`docs/simplicity-first.md`. Load `docs/srs-authoring.md` for broad, reconstructed, terse, or
over-bundled requirements.

Use a fresh Qualitative Reviewer sub-agent when available. Otherwise disclose degraded
non-independent review and actively seek counterexamples. Mechanical success is evidence,
not semantic quality.

## Judge

Score 1–5 and give a concrete fix below 5:

- problem, stakeholders, boundary, success, non-goals, and scope/readiness;
- need/feature/use-case fidelity and atomic, design-free FR/NFR quality;
- black-box AT and ordered JT quality at the declared scope;
- external contract realism and downstream real-boundary testability;
- traceability and brownfield source reconciliation;
- selected delivery profile, activated modules, escalation triggers, and proportionality;
- UX/mock preference and other module outcomes only when triggered;
- simplicity: no process requirement masquerades as product behavior, no hypothetical
  consumer drives scope, and no generic machinery is specified without concrete evidence.

Start deletion-first: identify requirements, roles, qualities, artifacts, or future
behaviors that can be deleted, deferred, or proven by existing evidence. A structurally
complete but overbuilt spec is `Needs rework`.

Report evidence considered, scorecard, deletions/deferrals/evidence reuse, top fixes, and
`Pass | Pass-with-fixes | Needs rework`. Update `.sdlc/wip.md` and stop; do not start design
without explicit user approval.
