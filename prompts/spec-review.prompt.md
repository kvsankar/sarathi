---
description: Independently review a Software Requirements Specification using checker results and look for counterexamples.
agent: agent
---

# Spec Review

Review the target spec without editing it unless asked. Read `.sdlc/wip.md`, available
verification evidence, `docs/artifact-contracts.md`, `docs/assurance-profiles.md`, and
`docs/simplicity-first.md`. Load `docs/srs-authoring.md` for broad, reconstructed, terse, or
over-bundled requirements.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and actively seek counterexamples. Passing automatic checks is useful evidence,
not proof that the requirements are good.

## Judge

Score 1–5 and give a concrete fix below 5:

- problem, stakeholders, boundary, success, non-goals, and scope/readiness;
- need/feature/use-case fidelity and atomic, design-free FR/NFR quality;
- black-box AT and ordered JT quality at the declared scope;
- external contract realism and whether the real boundary can be tested;
- links from requirements to later work and reconciliation with existing-system sources;
- selected review depth, extra risk checks, conditions for stronger review, and
  proportionality;
- UX/mock preference and other module outcomes only when triggered;
- simplicity: no process requirement masquerades as product behavior, no hypothetical
  consumer drives scope, and no generic machinery is specified without concrete evidence.

Start with simplification: identify requirements, roles, qualities, documents, or future
behaviors that can be deleted, deferred, or proven by existing evidence. A spec with every
required section still needs rework when it is overbuilt.

Report evidence considered, scorecard, what can be deleted, deferred, or proved by existing
evidence, top fixes, and
`Pass | Pass-with-fixes | Needs rework`. Update `.sdlc/wip.md` and stop; do not start design
without explicit user approval.
