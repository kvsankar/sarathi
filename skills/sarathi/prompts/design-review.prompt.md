---
description: Independently review a Software Design Document using checker results and look for counterexamples.
agent: agent
---

# Design Review

Review the target design without editing it unless asked. Read the accepted requirements,
`.sdlc/wip.md`, available check results, `docs/artifact-contracts.md`,
`docs/assurance-profiles.md`, and `docs/simplicity-first.md`. Stop as `Blocked-upstream`
when the spec is unfit.

Use a fresh reviewer sub-agent when available. Otherwise say that the review is not
independent and seek counterexamples.
For corrected findings, focus on those findings and affected boundaries; restart the full
review only when scope or controlling intent changed materially.

## Judge

Score 1–5 and give a concrete fix below 5:

- fit with requirements, scope/depth/readiness, and requirement links;
- cohesive responsibilities, minimal coupling, readable architecture, and core/shell or
  equivalent separation;
- interfaces, lifecycle/errors/data/side effects, compatibility, and real-boundary realism;
- decisions, alternatives, risks, clear pass/fail checks, and `TEST-*` architecture;
- review depth, extra risk checks, and environments proportional to accepted risk;
- complexity budget versus the user's mental model;
- reuse of existing functional, acceptance, schema/OpenAPI, CI, build, deployment, and
  operational evidence;
- separation of process records from product code, plus concrete evidence for each
  framework, generator, registry,
  manifest, schema system, extension point, or generic harness;
- current-consumer need: generalization normally requires a second concrete use case.

Start with simplification. Name components, abstractions, commands, generated files, tests,
or diagrams that can be removed, deferred, collapsed, or proven by existing evidence. A
a design with every required section can still be `Needs rework` when it is overbuilt,
often with
`revision-required` changes to parent documents.

Report blockers, evidence considered, scorecard, what can be deleted, deferred, or reused,
top fixes,
and `Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Update `.sdlc/wip.md` and
stop; do not start planning without explicit approval.
