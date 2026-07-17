---
description: Create or revise a proportionate, testable Software Requirements Specification from stakeholder intent.
agent: agent
---

# Spec Create

Create or revise the requirements document that controls the work. Requirements define
intent, not implementation architecture.

## Load

Read `.sdlc/wip.md`, `.sdlc/process-decisions.yaml`, existing documents, and relevant
repository evidence. Load these Sarathi references:

- `docs/artifact-contracts.md` for the Spec contract and IDs;
- `docs/simplicity-first.md` for smallest-current-behavior and process/product separation;
- `docs/assurance-profiles.md` to choose review depth and extra risk checks;
- `docs/project-entry.md` when it is unclear how to start in an existing codebase;
- `docs/srs-authoring.md` for product/system scope, reconstructed baseline intent, or terse
  requirements risk;
- `docs/cross-cutting-concerns.md` only for modules triggered by context;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md` before handoff.

If a required reference cannot be found in the active skill bundle or canonical repo,
report an incomplete installation instead of recreating policy from memory.

## Establish Intent

Infer and state Product/system, Feature/component, or Slice/change scope. Select Lean,
Standard, or High-assurance for production work; keep Exploratory for timeboxed
non-production learning. Record the profile, extra risk checks, reason, and conditions
that would require stronger review in the spec and current process/WIP state.

Before writing, understand the problem, affected stakeholders, success, non-goals,
observable behavior, external boundaries, acceptance basis, and material constraints. Ask
one focused question per turn only when the missing answer materially changes accepted
intent or risk. In YOLO mode, proceed with explicit assumptions; default to Standard when
Lean is not supported by evidence.

Research current external facts when requirements depend on changing standards,
regulation, vendor contracts, or specialized domain facts. Cite authoritative sources in
the spec when they control intent.

## Author

Follow the Spec contract in `docs/artifact-contracts.md` exactly for product/system work.
Feature and slice specs may stay compact and reference parent IDs, but must retain common
metadata, changed intent, acceptance criteria, links to parent requirements, and
assumptions.

Apply these requirements rules:

- State stakeholder needs before features and behavior before solution mechanics.
- Make non-goals explicit enough to prevent accidental scope.
- Write atomic, necessary, feasible, unambiguous, testable `FR-*`/`NFR-*` obligations.
- Define black-box `AT-*` criteria and ordered `JT-*` journeys at the spec's scope.
- Name external contract sources and how the real boundary will be tested. State the risk
  of test doubles instead of treating invented interfaces as truth.
- For UI-facing work, record presentation/accessibility intent and
  `UI Mock Preference: Required | Optional | Not needed | Deferred`.
- Include only the extra risk checks this work needs. Do not paste a universal concern list
  or add `None` fields for risks the context does not suggest.
- Preserve stable IDs during revision and record changes needed in parent documents.
- Do not turn process links, evidence, approval, or status needs into product requirements.
  Do not specify hypothetical future consumers.

Write `spec.md` unless another path is named. Child specs include
`Parent Work Item: WORK-AREA-NAME`.

## Verify And Handoff

Run the repeatable format and link checker and fix failures:

```pwsh
python checkers/check_spec.py spec.md --json
```

Retry with `python3` or `uv run python` when needed. Then run `/spec-assess`; use one fresh
sub-agent for checks and another for independent review when available. Without sub-agents,
say that the review is not independent and keep the passes separate.

Revise until the result is Pass or an explicitly accepted Pass-with-fixes. Update
`.sdlc/wip.md` with paths, review depth and extra checks, readiness, evidence, assumptions,
blockers, and next action.

Stop for human review. Report the spec path, scope, readiness, review depth and extra
checks, assessment, open questions, and recommended `/design-create`. Do not start design
in the same turn
unless the latest user request explicitly asks for end-to-end continuation.
