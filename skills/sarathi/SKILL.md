---
name: sarathi
description: sarathi helps teams build production software with AI agents while preserving decisions, checks, reviews, and test evidence.
---

# sarathi

Sarathi turns accepted intent into the smallest safe working change, preserves the decisions
and evidence needed to judge it, and adapts remaining work from real feedback. It guides the
next appropriate step, not a linear waterfall or document factory. Use `$sarathi` for
orientation, resumption, or stage selection.

```text
accepted intent -> smallest safe increment -> working behavior -> evidence -> feedback -> adapt
```

## Direct Stage Skills

Use one direct skill when stage and action are clear: `create` authors, `verify` checks,
`review` judges independently, `assess` runs both; `workflow-status` is read-only.

| Work | Direct skills | Use when |
| --- | --- | --- |
| Requirements | `spec-create`, `spec-verify`, `spec-review`, `spec-assess` | Defining or evaluating needs, requirements, acceptance, and journeys. |
| Technical design | `design-create`, `design-verify`, `design-review`, `design-assess` | Defining or evaluating boundaries, decisions, quality attributes, and testability. |
| Delivery plan | `plan-create`, `plan-verify`, `plan-review`, `plan-assess` | Defining or evaluating impact, work, sequence, integration, safety, and proof. |
| Implementation | `code-create`, `code-verify`, `code-review`, `code-assess` | Implementing or evaluating an approved plan, its tests, and its evidence. |
| Progress | `workflow-status` | Rendering a read-only delivery-progress summary. |

When the direct skill is unclear, select it as described below. Do not load every stage or
concern.

## Skill Maintenance

Run bundled `scripts/check_update.py` at invocation start; never auto-update or install
without approval. Respect `SARATHI_UPDATE_CHECK=0`; missing bundle files mean incomplete install.

## Enduring Model

Decompose when a competent engineer cannot understand and review the work safely as one
coherent unit. Specification, design, plan, and code preserve decisions along the loop; they
are not a one-way waterfall. Load `docs/enduring-model.md` when explaining the whole process.

Production work must preserve approved requirements, useful tests with clear pass/fail
results, honest feedback, required approvals, and safety limits.

Choose a delivery assurance profile with `docs/assurance-profiles.md`:

- **Lean**: small, reversible, low-risk production change.
- **Standard**: ordinary default or unclear risk.
- **High-assurance**: material security, privacy, safety, regulatory, availability,
  migration, or irreversible-data consequence.

Choose an approval policy separately with `docs/approval-gates.md`: **Human checkpoints**
stop for explicit approval at each material gate; **Automatic eligible gates** uses only an
explicit local policy and never covers excluded safety or production gates. Work may deliver
either a **Product increment** or **Decision/evidence**; this changes its done signal, not its
required assurance or approval policy.

Apply `docs/simplicity-first.md`: keep process records out of product architecture, start with
the smallest direct implementation, reuse existing-system tests, and avoid general solutions
until a current need justifies them. Simplify when the solution is more complicated than the
problem requires. Do not use LOC or PR-count targets.

## Supporting Status Rule

For status, resume, handoff, readiness, and next-action questions, lead with scoped engineering
reality and one executable next action; put checked process evidence afterward. Never call work
complete without its scope. A completed prerequisite unlocks named work, not the whole feature.

## Orient Before Acting

1. Read `.sdlc/wip.md` and `.sdlc/process-decisions.yaml` when present. Check important claims
   against source documents.
2. Use `docs/project-entry.md` if it is unclear whether this is a new project, an existing
   baseline, or a change to an existing system.
3. Infer Product/system, Feature/component, or Slice/change scope. Ask only when the answer
   would materially change the document.
4. At project entry and first requirements for a feature, present the assurance profile and
   approval policy choices with a contextual recommendation. Record the explicit choice or
   confirmation of a project default, plus the work outcome. Never infer automatic approval.
5. Select Lean, Standard, or High-assurance and additional checks. Record why and what would
   require stronger assurance. In YOLO mode, use Standard unless Lean is justified.
6. Load only the selected `prompts/<stage>.prompt.md` and its triggered references.

## Decompose Only When It Helps

`code-create` blocks without approved requirements and a specific implementation plan that is
ready to implement. Do not write another document when the approved requirements and one short
plan are enough to start safely.

If a competent engineer can understand, explain, review, and safely plan the work as one
coherent unit, keep it together. Otherwise split it along a natural product or technical
boundary until each part is understandable, testable, and safe to integrate. A split does not
require a new document chain. Use `docs/work-decomposition.md`.

Breakdown plans use a work group only for near-term `WORK-*` children that share a feedback or
integration check; unscheduled children have no group. Implementation plans list the PRs that
implement one child; PRs do not belong to groups. Use `docs/feedback-and-learning.md`. A
matching checkpoint closes one group only; it does not approve the whole plan or next group.

## When To Stop

After creating or materially revising a spec, design, ADR, plan, code change, assessment, or
review report:

1. Update `.sdlc/wip.md`.
2. Report path, readiness/status, evidence, blockers/questions, and recommended next stage.
3. End the turn before starting the next stage.

Continue across stages only when the latest user request explicitly asks for end-to-end or
unattended execution and the recorded approval policy permits the current gate. Human
checkpoints always stop for explicit approval. YOLO permits assumptions but never selects
automatic approval or bypasses readiness, declared scope, blockers, evidence, or safety stops.

## Evidence Invariants

- Specs own `AT-*` and `JT-*` descriptions of observable success.
- Designs own `TEST-*` descriptions of what must be tested and where.
- Plans assign tests from parent and local documents to child work or PRs.
- Behavior-changing code uses Red-Green-Refactor: observe the smallest meaningful test fail,
  make the minimum change that passes it, then improve the code while tests stay green.
- Code implements assigned tests and reports the commands and outcomes that exercised them.
- Process IDs stay in document traceability and external records, never in production/test
  source merely to create a link. Test names describe behavior.
- Format checks and optional requirement-to-test links do not prove correct meaning,
  stakeholder feedback, real-dependency execution, merge state, or human approval.
- A primary external boundary cannot rely only on a self-authored test double unless the user
  explicitly accepts the remaining risk. Test an important dependency through the real system
  or its official test interface, or state what the mock leaves untested.
- Live production deployment or production checks require explicit user approval.
- Run cleanup and simplify passes before handoff; do not use them for unrelated churn or hidden
  behavior changes.

## Verification Independence

Run repeatable checks once per document revision. After local findings are fixed, recheck the
affected boundary and focus independent review on them; restart full review only when
requirements or scope changed. When sub-agents are available, use one fresh agent to run
checks and another to independently judge the work. If unavailable, say the review is not
independent and keep the two passes separate. Stop when an earlier required document is not
fit. Use `docs/review-verification-checklist.md`.

## Triggered References

| Reference | Load when |
| --- | --- |
| `docs/enduring-model.md` | Explaining Sarathi, orienting a project, or relating delivery, decomposition, quality, continuity, and risk. |
| `docs/requirements-model.md` | Specifications and their needs-to-evidence hierarchy. |
| `docs/assurance-profiles.md` | Choosing delivery assurance or additional checks. |
| `docs/simplicity-first.md` | Checking whether a solution or PR breakdown is no larger than needed. |
| `docs/project-entry.md` | Starting in a new or existing codebase. |
| `docs/work-in-progress.md` | Starting, resuming, blocking, handing off, or answering status and next-action questions. |
| `docs/document-locations.md` | Choosing document/review-report paths or recording non-standard canonical paths. |
| `docs/artifact-formatting.md` | Writing or materially revising Markdown documents. |
| `docs/human-first-artifacts.md` | Creating or revising a spec, design, or plan; checking readability or source-ID cleanliness. |
| `docs/cross-cutting-concerns.md` | Choosing checks for security, privacy, reliability, or other identified risks. |
| `docs/test-ownership.md` | Planning or implementing tests, including test-first changes, or when test ownership spans children. |
| `docs/work-decomposition.md` | Breakdown plans or child document chains are involved. |
| `docs/feedback-and-learning.md` | Coordinating parallel work, feedback, or earlier-document changes. |
| `docs/approval-gates.md` | Choosing approval policy or reading approval/auto-policy ledgers. |
| `docs/cleanup-pass.md` and `docs/simplify-pass.md` | Handoff quality passes apply. |
| `docs/workflow-status.md` | Rendering or interpreting workflow status. |

Use `docs/progressive-disclosure.md` for the complete reference map. Use bundled
`checkers/check_*.py` for deterministic verification and preserve raw evidence.
