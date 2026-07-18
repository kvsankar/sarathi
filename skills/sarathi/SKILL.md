---
name: sarathi
description: Sarathi guides resumable, reviewable, feedback-driven software delivery. Use it to create, verify, review, assess, resume, break down, or visualize product, feature, and slice work.
---

# Sarathi

At the start of each invocation, run the bundled `scripts/check_update.py` with an
available Python interpreter. Surface any update notice, but never block delivery when the
check is silent, unavailable, or offline. If an update is available, report both versions
and never update automatically. With explicit user approval, install the exact available
version, verify the installed manifest, and ask the user to reload their agent tools.
Respect `SARATHI_UPDATE_CHECK=0`.

Choose the right stage, load its instructions, and load only the guidance needed for the
current scope and risks. Do not preload every stage or every possible concern.

The bundle must contain `prompts/`, `docs/`, and `checkers/`. If a required file is absent,
look for another installed `sarathi` bundle or canonical repository source; otherwise
report an incomplete installation instead of inventing policy.

## Core Loop

```text
accepted intent -> smallest useful slice -> evidence -> feedback -> inspect/adapt
```

Production work always preserves accepted intent, readiness to implement, appropriate
tests with clear pass/fail checks, honest feedback, review of changes needed in parent
documents, human approval points, and safety limits.

Choose the review depth using `docs/assurance-profiles.md`:

- **Lean**: small, reversible, low-risk production change.
- **Standard**: ordinary default or unclear risk.
- **High-assurance**: failure could cause material security, privacy, safety, regulatory,
  availability, migration, or irreversible-data consequence.
- **Exploratory**: separate non-production track for timeboxed learning.

The profile sets the overall review depth. `Assurance Modules` name extra checks required
for specific risks. High-assurance strengthens each delivery step; it must not become big
up-front design.

Apply `docs/simplicity-first.md`: keep process records out of product architecture, start
with the smallest direct implementation, reuse tests from the existing system, generalize
only after a second real use case, and stop when the proposed design becomes materially
more complex than the user's description. A bounded slice defaults to at most three
implementation PRs. More than three needs a short reason and a current
`plan.complexity-approved` approval record before plan assessment. Do not use LOC targets.

## Route The Request

Command verbs are distinct:

- `create`: author or revise.
- `verify`: run repeatable checks and report what they prove and do not prove.
- `review`: independently judge quality and look for counterexamples.
- `assess`: verification plus review as the full gate.

Load exactly one matching `prompts/<stage>.prompt.md`:

| Stage | Purpose |
| --- | --- |
| `spec-*` | Requirements, externally observable acceptance intent, scope, and readiness. |
| `design-*` | Architecture, interfaces, decisions, executable test obligations, and risks. |
| `plan-*` | Breakdown or implementation allocation, learning waves, PRs, and evidence plan. |
| `code-*` | Test-first implementation, verification, review, and slice assessment. |
| `workflow-status` | Read-only, repeatable work-tree and learning-wave HTML. |

When invoked generally, choose and run only the next appropriate stage.

## Orient Before Acting

1. Read `.sdlc/wip.md` and `.sdlc/process-decisions.yaml` when present. Check important
   claims against the source documents.
2. Use `docs/project-entry.md` if it is unclear whether this is a new project, adoption of
   an existing baseline, or a change to an existing system.
3. Infer Product/system, Feature/component, or Slice/change scope. Ask only when the answer
   would materially change the document.
4. Select Lean, Standard, or High-assurance and any extra risk checks. Record why and what
   would require stronger review. In YOLO mode, use Standard unless Lean is justified.
5. Load the selected stage prompt and only its triggered references.

Maintain `.sdlc/wip.md` using `docs/work-in-progress.md`. It is a resume note, not product
truth or approval evidence.

## Execution-First Readiness

Documents declare `Implementation Readiness: Exploratory | Decomposable | Code-ready`.
`/code-create` blocks without accepted intent and a bounded code-ready Implementation plan.
Before creating a child artifact, decide in this order: can accepted parent artifacts
authorize the work; can one bounded Implementation plan make it safe; and can it ship as
one reviewable increment or sequential UI slices? If yes, plan and implement. A feature or
component may be code-ready directly, in any delivery profile.

Decompose only for a concrete unresolved product decision, new or unclear external
contract, unaccepted material risk, independently valuable feedback outcome, touch or
integration conflict, or missing observable behavior/acceptance. Many screens, feature
size, assurance level, easier traceability, or customary document chains are not reasons.
Use `docs/work-decomposition.md` and its ceremony budget before adding process artifacts.

Breakdown plans use a `WAVE-*` only for near-term `WORK-*` children that share a feedback or
integration check; unscheduled children have no wave. Implementation plans list the PRs that
implement one child; PRs do not belong to waves. Use `docs/feedback-and-learning.md`. A
checkpoint that matches the current plan closes one wave only; it does not approve the whole
plan or authorize the next wave.

## Human Gate

After creating or materially revising a spec, design, ADR, plan, code slice, assessment,
or review report:

1. Update `.sdlc/wip.md`.
2. Report path, readiness/status, evidence, blockers/questions, and recommended next stage.
3. End the turn before starting the next stage.

Continue across stages only when the latest user request explicitly asks for end-to-end or
unattended execution. YOLO permits assumptions but does not bypass readiness, planned touch
sets, blockers in earlier documents, evidence, safety, approval, or human-review stops.

## Evidence Invariants

- Specs own `AT-*` and `JT-*` black-box intent.
- Designs own executable `TEST-*` obligations and test architecture.
- Plans assign tests from parent and local documents to child work or PRs.
- Code implements assigned tests and reports the commands and outcomes that exercised them.
- Format checks and optional requirement-to-test links do not prove correct meaning,
  stakeholder feedback, real-boundary execution, merge state, or human approval.
- A primary external boundary cannot rely only on a self-authored test double unless the
  user explicitly accepts the remaining risk.
- Live production deployment or production checks require explicit user approval.
- Run cleanup and simplify passes before handoff; do not use them for unrelated churn or
  hidden behavior changes.

## Verification Independence

Run repeatable checks once per artifact revision. After local findings are fixed, recheck
the affected boundary and focus independent review on those findings; restart full review
only when scope or controlling intent changed materially. When sub-agents are available,
use one fresh agent to run checks and another to independently judge the work. If
sub-agents are unavailable, say that the review is not independent and keep the two passes
separate. Stop when an earlier required document is not fit. Use
`docs/review-verification-checklist.md`.

## Triggered References

| Reference | Load when |
| --- | --- |
| `docs/assurance-profiles.md` | Choosing review depth or extra risk checks. |
| `docs/simplicity-first.md` | Reviewing abstractions, existing-system compatibility, complexity budgets, or PR breakdown. |
| `docs/project-entry.md` | Starting in a new or existing codebase. |
| `docs/work-in-progress.md` | Starting, resuming, blocking, or handing off. |
| `docs/artifact-formatting.md` | Writing or materially revising Markdown documents. |
| `docs/cross-cutting-concerns.md` | Assigning extra risk checks to the document that owns them. |
| `docs/test-ownership.md` | Parent tests or integration span several children. |
| `docs/work-decomposition.md` | Breakdown plans or child document chains are involved. |
| `docs/feedback-and-learning.md` | Planning/coding waves, feedback, or parent changes. |
| `docs/approval-gates.md` | Reading or writing approval/auto-policy ledgers. |
| `docs/cleanup-pass.md` and `docs/simplify-pass.md` | Handoff quality passes apply. |
| `docs/workflow-status.md` | Rendering or interpreting workflow status. |

Use `docs/progressive-disclosure.md` for the complete reference map. Use bundled
`checkers/check_*.py` for deterministic verification and preserve their raw evidence.
