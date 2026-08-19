---
name: sarathi
description: sarathi manages structured production delivery with specifications, designs, plans, approvals, checks, reviews, and test evidence. Use for Sarathi or managed delivery-workflow requests, not ordinary code generation.
---

# sarathi

Sarathi turns accepted intent into the smallest safe working change, preserves the decisions
and evidence needed to judge it, and adapts remaining work from real feedback. It guides the
next appropriate step, not a linear waterfall or document factory. Use `$sarathi` for
orientation, resumption, or stage selection.

```text
accepted intent -> smallest safe increment -> working behavior -> evidence -> feedback -> adapt
```

## Workflow Terms And Direct Commands

Use `docs/workflow-terminology.md`: a work target and scope identify the subject; stage is
`spec`, `design`, `plan`, or `code`; action is `create`, `verify`, `review`, or `assess`; and
their pair is a command such as `design-review`. `workflow-status` is a projection command.

Installed explicit command skills use `$sarathi-<stage>-<action>`. Only this router may be
selected implicitly; never select a command skill unless the user names it. An ordinary code
request does not invoke Sarathi. Without an explicit command, select and load one canonical
command prompt; do not load every concern.

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

- **Lean**: assessed spec -> assessed plan with technical decisions -> assessed code.
- **Standard**: assessed spec -> design -> plan -> code; the ordinary default.
- **High-assurance**: the full path plus risk-boundary breakdown and assessed code slices.

Profiles change the path, decomposition bias, and review cadence. They never weaken the
check-plus-independent-review assurance applied at a retained stage. Choose approval policy
separately.

Choose approval policy with `docs/approval-gates.md`: **Human checkpoints** stop at material
gates; **Automatic eligible gates** uses local policy. Explicit YOLO selects automatic
internal gates for end-to-end work but keeps its protected boundaries. **Product increment**
or **Decision/evidence** changes the done signal, not required assurance or approval policy.

Apply `docs/simplicity-first.md`: keep process records out of product architecture, start with
the smallest direct implementation, reuse existing-system tests, and avoid general solutions
until a current need justifies them. Simplify when the solution is more complicated than the
problem requires. Do not use LOC or PR-count targets.

## Revision Classification

A revision is material when it changes accepted behavior, scope, contracts, architecture,
risk, evidence obligations, readiness, or approval basis. Editorial changes are non-material
only if meaning is unchanged; when uncertain, treat it as material. See
`docs/approval-gates.md`.

## Supporting Status Rule

Follow `docs/result-reporting.md` for all human-facing results and handoffs. Lead with one
scoped engineering outcome, explain secondary process verdicts, and scope every completion
claim.

## Orient Before Acting

1. Read `.sdlc/wip.md` and `.sdlc/process-decisions.yaml` when present. Check important claims
   against source documents.
2. Use `docs/project-entry.md` if it is unclear whether this is a new project, an existing
   baseline, or a change to an existing system.
3. Infer Product/system, Feature/component, or Slice/change scope. Ask only when the answer
   would materially change the document.
4. At project entry and first feature requirements, present profile and approval choices with
   a recommendation; record the choice/default and work outcome. Under explicit YOLO, infer
   and record them without confirmation using `docs/approval-gates.md`.
5. Select Lean, Standard, or High-assurance and additional checks. Follow that profile's
   stage path and record why and what would require a longer path. In YOLO mode, use Standard
   unless Lean is justified.
6. Load only the selected `prompts/<stage>-<action>.prompt.md` and its triggered references.

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
2. Report path, readiness/status, evidence, blockers/questions, and recommended next command.
3. End the turn before starting the next stage.

Continue across commands only when the request and recorded policy permit it. Human
checkpoints stop. Explicit YOLO authorizes end-to-end work and automatic internal gates but
keeps the restrictions and protected boundaries in `docs/approval-gates.md`.

## Evidence Invariants

- Specs own `AT-*` and `JT-*` descriptions of observable success.
- Standalone designs own `TEST-*` descriptions of what must be tested and where. A Lean
  plan without a standalone design maps spec acceptance directly to executable checks.
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
| `docs/workflow-terminology.md` | Routing needs work target, scope, stage, action, command, or work-item terms. |
| `docs/work-in-progress.md` | Starting, resuming, blocking, handing off, or answering status and next-action questions. |
| `docs/project-entry.md` | Starting in a new or existing codebase. |
| `docs/approval-gates.md` | Choosing approval policy, using YOLO, or reading approval/auto-policy records. |
| `docs/result-reporting.md` | Reporting any result, status, pause, or handoff. |

After selecting a command, use its local trigger list and
`docs/progressive-disclosure.md`, the complete shared-reference map. Use bundled
`checkers/check_*.py` for deterministic verification and preserve raw evidence.
