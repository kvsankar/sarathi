---
description: Create or revise a proportionate, testable Software Requirements Specification from stakeholder intent.
agent: agent
---

# Spec Create

Create or revise the governing requirements artifact. Requirements define observable
intent, not implementation architecture.

## Load

Read `.sdlc/wip.md`, `.sdlc/process-decisions.yaml`, existing artifacts, and relevant repo
evidence. Load these Sarathi references:

- `docs/artifact-contracts.md` for the Spec contract and IDs;
- `docs/simplicity-first.md` for smallest-current-behavior and process/product separation;
- `docs/assurance-profiles.md` to select delivery depth and triggered modules;
- `docs/project-entry.md` when adoption mode is undecided or brownfield;
- `docs/srs-authoring.md` for product/system scope, reconstructed baseline intent, or terse
  requirements risk;
- `docs/cross-cutting-concerns.md` only for modules triggered by context;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md` before handoff.

If a required reference cannot be found in the active skill bundle or canonical repo,
report an incomplete installation instead of recreating policy from memory.

## Establish Intent

Infer and state Product/system, Feature/component, or Slice/change scope. Select Lean,
Standard, or High-assurance for production work; keep Exploratory for timeboxed
non-production learning. Record profile, modules, rationale, and escalation triggers in the
spec and current process/WIP state.

Before writing, understand the problem, affected stakeholders, success, non-goals,
observable behavior, external boundaries, acceptance basis, and material constraints. Ask
one focused question per turn only when the missing answer materially changes accepted
intent or risk. In YOLO mode, proceed with explicit assumptions; default to Standard when
Lean is not supported by evidence.

Research current external facts when requirements depend on changing standards,
regulation, vendor contracts, or specialized domain facts. Cite authoritative sources in
the artifact when they govern intent.

## Author

Follow the Spec contract in `docs/artifact-contracts.md` exactly for product/system work.
Feature and slice specs may stay compact and reference parent IDs, but must retain common
metadata, changed intent, acceptance criteria, traceability, and assumptions.

Apply these requirements rules:

- State stakeholder needs before features and behavior before solution mechanics.
- Make non-goals explicit enough to prevent accidental scope.
- Write atomic, necessary, feasible, unambiguous, testable `FR-*`/`NFR-*` obligations.
- Define black-box `AT-*` criteria and ordered `JT-*` journeys at the artifact's scope.
- Pin external contract sources and downstream real-boundary testability; disclose double
  risk rather than normalizing invented interfaces.
- For UI-facing work, record presentation/accessibility intent and
  `UI Mock Preference: Required | Optional | Not needed | Deferred`.
- Include only activated assurance-module outcomes. Do not paste a universal concern list
  or add `None` fields for risks the context does not suggest.
- Preserve stable IDs during revision and record ancestor impact.
- Do not turn traceability, evidence, approval, or status needs into product requirements.
  Do not specify hypothetical future consumers.

Write `spec.md` unless another path is named. Child specs include
`Parent Work Item: WORK-AREA-NAME`.

## Verify And Handoff

Run the structural checker and fix failures:

```pwsh
python checkers/check_spec.py spec.md --json
```

Retry with `python3` or `uv run python` when needed. Then run `/spec-assess`; use fresh
Mechanical Verifier and Qualitative Reviewer sub-agents when available. Without sub-agents,
disclose degraded non-independent assessment and keep passes separate.

Revise until the result is Pass or an explicitly accepted Pass-with-fixes. Update
`.sdlc/wip.md` with paths, profile/modules, readiness, evidence, assumptions, blockers, and
next action.

Stop for human review. Report the spec path, scope, readiness, profile/modules, assessment,
open questions, and recommended `/design-create`. Do not start design in the same turn
unless the latest user request explicitly asks for end-to-end continuation.
