---
name: sarathi
description: Sarathi is Agent-Steered SDLC for resumable, reviewable, feedback-driven software delivery. Use to create, verify, review, assess, resume, decompose, or visualize artifact-governed product, feature, and slice work.
---

# Sarathi

Route the request, load one stage contract, and load only references triggered by the
current scope and risk. Do not preload every stage or assurance concern.

The bundle must contain `prompts/`, `docs/`, and `checkers/`. If a required file is absent,
look for another installed `sarathi` bundle or canonical repository source; otherwise
report an incomplete installation instead of inventing policy.

## Core Loop

```text
accepted intent -> smallest useful slice -> evidence -> feedback -> inspect/adapt
```

Production work always preserves current accepted intent, code readiness, appropriate
tests and oracles, honest feedback, ancestor-impact review, human gates, and safety
constraints.

Select delivery depth using `docs/assurance-profiles.md`:

- **Lean**: small, reversible, low-risk production change.
- **Standard**: ordinary default or unclear risk.
- **High-assurance**: material security, privacy, safety, regulatory, financial,
  availability, migration, or irreversible-data consequence.
- **Exploratory**: separate non-production track for timeboxed learning.

Profiles calibrate depth; assurance modules activate focused evidence. High-assurance
strengthens each learning boundary and must not become big up-front design.

Apply `docs/simplicity-first.md`: keep process evidence outside product architecture, start
with the smallest direct implementation, reuse brownfield compatibility suites, generalize
after a second concrete use case, and stop when conceptual complexity exceeds the user's
mental model. Bounded slices default to at most three implementation PRs; exceptions need
concise justification and explicit plan approval. Do not use LOC targets.

## Route The Request

Command verbs are distinct:

- `create`: author or revise.
- `verify`: deterministic/mechanical evidence only.
- `review`: qualitative adversarial judgment.
- `assess`: verification plus review as the full gate.

Load exactly one matching `prompts/<stage>.prompt.md`:

| Stage | Purpose |
| --- | --- |
| `spec-*` | Requirements, externally observable acceptance intent, scope, and readiness. |
| `design-*` | Architecture, interfaces, decisions, executable test obligations, and risks. |
| `plan-*` | Breakdown or implementation allocation, learning waves, PRs, and evidence plan. |
| `code-*` | Test-first implementation, verification, review, and slice assessment. |
| `workflow-status` | Read-only deterministic artifact-tree and learning-wave HTML. |

When invoked generally, choose and run only the next appropriate stage.

## Orient Before Acting

1. Read `.sdlc/wip.md` and `.sdlc/process-decisions.yaml` when present; verify important
   claims against governing artifacts.
2. Use `docs/project-entry.md` if Greenfield, Brownfield Baseline, or Brownfield Delta-Only
   adoption is undecided.
3. Infer Product/system, Feature/component, or Slice/change scope; ask only when ambiguity
   materially changes the artifact.
4. Select Lean, Standard, or High-assurance and triggered modules. Record rationale and
   escalation triggers. In YOLO mode, default to Standard when Lean is not evidenced.
5. Load the selected stage prompt and only its triggered references.

Maintain `.sdlc/wip.md` using `docs/work-in-progress.md`. It is a resume note, not product
truth or approval evidence.

## Readiness And Decomposition

Artifacts declare `Implementation Readiness: Exploratory | Decomposable | Code-ready`.
`/code-create` blocks without a code-ready implementation plan for a slice or sufficiently
small feature.

A `WORK-*` is a parent-plan allocation. Product plans normally allocate feature children;
feature plans normally allocate slice children. Each child follows its own Spec/Design/Plan
chain. Use `docs/work-decomposition.md`.

Plans assign every `WORK-*` or `PR-*` exactly once to an ordered `WAVE-*`. Use
`docs/feedback-and-learning.md`. A hash-current wave checkpoint closes one wave only; it
does not assess the enclosing plan or authorize the next wave.

## Human Gate

After creating or materially revising a spec, design, ADR, plan, code slice, assessment, or
review report:

1. Update `.sdlc/wip.md`.
2. Report path, readiness/status, evidence, blockers/questions, and recommended next stage.
3. End the turn before starting the downstream stage.

Continue across stages only when the latest user request explicitly asks for end-to-end or
unattended execution. YOLO permits assumptions but does not bypass readiness, planned touch
sets, upstream blockers, evidence, safety, approval, or human-review stops.

## Evidence Invariants

- Specs own `AT-*` and `JT-*` black-box intent.
- Designs own executable `TEST-*` obligations and test architecture.
- Plans allocate ancestor and local obligations to child work or PRs.
- Code implements assigned tests and records traceability claims.
- Structural checks and traceability do not prove semantics, true TDD history, stakeholder
  feedback, real-boundary execution, merge state, or human approval.
- A primary external seam cannot rely only on a self-authored double without explicit
  residual-risk acceptance.
- Live production deployment or production checks require explicit user approval.
- Run cleanup and simplify passes before handoff; do not use them for unrelated churn or
  hidden behavior changes.

## Verification Independence

When sub-agents are available, use a fresh Mechanical Verifier for checker evidence and a
fresh Qualitative Reviewer for adversarial judgment. Assessments require both. Without
sub-agents, disclose non-independence and keep the passes separate. Stop when an upstream
artifact is unfit. Use `docs/review-verification-checklist.md`.

## Triggered References

| Reference | Load when |
| --- | --- |
| `docs/assurance-profiles.md` | Selecting profile, modules, or escalation. |
| `docs/simplicity-first.md` | Designing/reviewing abstractions, brownfield compatibility, complexity budgets, or PR decomposition. |
| `docs/project-entry.md` | Adoption mode or brownfield baseline semantics matter. |
| `docs/work-in-progress.md` | Starting, resuming, blocking, or handing off. |
| `docs/artifact-formatting.md` | Writing or materially revising Markdown artifacts. |
| `docs/cross-cutting-concerns.md` | Assigning an activated module to artifact owners. |
| `docs/test-ownership.md` | Ancestor tests or integration span decomposed children. |
| `docs/work-decomposition.md` | Breakdown plans or child artifact chains are involved. |
| `docs/feedback-and-learning.md` | Planning/coding waves, feedback, or ancestor impact. |
| `docs/approval-gates.md` | Reading or writing approval/auto-policy ledgers. |
| `docs/cleanup-pass.md` and `docs/simplify-pass.md` | Handoff quality passes apply. |
| `docs/workflow-status.md` | Rendering or interpreting workflow status. |

Use `docs/progressive-disclosure.md` for the complete reference map. Use bundled
`checkers/check_*.py` for deterministic verification and preserve their raw evidence.
