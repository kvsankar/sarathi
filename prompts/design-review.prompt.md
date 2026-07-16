---
description: Qualitatively and adversarially review a Software Design Document using available mechanical evidence.
agent: agent
---

# Design Review

Review the target design without editing it unless asked. Read upstream intent, `.sdlc/wip.md`,
available verification evidence, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, and `docs/simplicity-first.md`. Stop as `Blocked-upstream`
when the spec is unfit.

Use a fresh Qualitative Reviewer sub-agent when available. Otherwise disclose degraded
non-independent review and seek counterexamples.

## Judge

Score 1–5 and give a concrete fix below 5:

- upstream fit, scope/depth/readiness, and requirement traceability;
- cohesive responsibilities, minimal coupling, readable architecture, and core/shell or
  equivalent separation;
- interfaces, lifecycle/errors/data/side effects, compatibility, and real-boundary realism;
- decisions, alternatives, risks, verification oracles, and `TEST-*` architecture;
- profile/module tactics and environments proportional to accepted risk;
- complexity budget versus the user's mental model;
- brownfield reuse of functional, acceptance, schema/OpenAPI, CI, build, deployment, and
  operational evidence;
- process/product firewall and concrete evidence for each framework, generator, registry,
  manifest, schema system, extension point, or generic harness;
- current-consumer need: generalization normally requires a second concrete use case.

Start deletion-first. Name components, abstractions, commands, generated artifacts, tests,
or diagrams that can be removed, deferred, collapsed, or proven by existing evidence. A
structurally valid but overbuilt design is `Needs rework`, often with
`revision-required` ancestor impact.

Report blockers, evidence considered, scorecard, deletion/defer/reuse findings, top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not start planning without explicit approval.
