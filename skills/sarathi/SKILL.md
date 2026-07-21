---
name: sarathi
description: sarathi helps teams build production software with AI agents while preserving decisions, checks, reviews, and test evidence.
---

# sarathi

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

## Enduring Model

Sarathi turns accepted intent into the smallest safe working increment, preserves the
decisions and evidence needed to review it, decomposes work that is too complex to reason
about safely as one unit, and adapts the remaining work from real feedback.

```text
accepted intent -> smallest safe increment -> working behavior -> evidence -> feedback -> adapt
```

Decompose when a competent engineer cannot understand and review the work safely as one
coherent unit. Specification, design, plan, and code preserve
decisions along the loop; they are not a one-way waterfall. Load `docs/enduring-model.md`
when explaining the whole process.

Production work must preserve approved requirements, useful tests with clear pass/fail
results, honest feedback, required human approvals, and safety limits.

Choose the review depth using `docs/assurance-profiles.md`:

- **Lean**: small, reversible, low-risk production change.
- **Standard**: ordinary default or unclear risk.
- **High-assurance**: failure could cause material security, privacy, safety, regulatory,
  availability, migration, or irreversible-data consequence.
- **Exploratory**: separate non-production track for timeboxed learning.

Apply `docs/simplicity-first.md`: keep process records out of product architecture, start
with the smallest direct implementation, reuse tests from the existing system, and avoid
general solutions until a current need justifies them. If the solution is more complicated
than the problem requires, simplify it. Do not use LOC or PR-count targets.

## Supporting Status Rule

For status, resume, handoff, remaining-work, readiness, and next-action questions, lead with
scope-qualified engineering reality and one executable next action. Check the claims and put
process evidence afterward. Use `docs/work-in-progress.md` for the supporting snapshot fields.

Never use `complete` without its exact scope. State prerequisite, slice, feature, and full
product status separately when they differ. A completed prerequisite unlocks named work; it
does not complete the feature. Use ordinary technical names unless traceability detail was
requested.

## Route The Request

Command verbs are distinct:

- `create`: author or revise.
- `verify`: run repeatable checks and report what they prove and do not prove.
- `review`: independently judge quality and look for counterexamples.
- `assess`: run both checks and independent review.

Load exactly one matching `prompts/<stage>.prompt.md`:

| Stage | Purpose |
| --- | --- |
| `spec-*` | Needs → features → use cases → requirements → acceptance and journeys. |
| `design-*` | Architecture, boundaries, decisions, quality attributes, and testability. |
| `plan-*` | Impact, breakdown or PR graph, sequence, integration, safety, and proof. |
| `code-*` | Test-first implementation, exact results, independent review, and feedback. |
| `workflow-status` | Read-only HTML progress summary. |

## Orient Before Acting

1. Read `.sdlc/wip.md` and `.sdlc/process-decisions.yaml` when present. Check important
   claims against the source documents.
2. Use `docs/project-entry.md` if it is unclear whether this is a new project, adoption of
   an existing baseline, or a change to an existing system.
3. Infer Product/system, Feature/component, or Slice/change scope. Ask only when the answer
   would materially change the document.
4. Select Lean, Standard, or High-assurance and any additional checks. Record why and what
   would require stronger review. In YOLO mode, use Standard unless Lean is justified.
5. Load the selected stage prompt and only its triggered references.

## Decompose Only When It Helps

`/code-create` blocks without approved requirements and a specific implementation plan that
is ready to implement. Do not write another document when the approved requirements and one
short plan are enough to start safely.

If a competent engineer can understand, explain, review, and safely plan the work as one
coherent unit, keep it together. Otherwise split it along a natural product or technical
boundary until each part is understandable, testable, and safe to integrate. A split does
not require a new document chain. Use `docs/work-decomposition.md`.

Breakdown plans use a work group only for near-term `WORK-*` children that share a feedback
or integration check; unscheduled children have no group. Implementation plans list the PRs
that implement one child; PRs do not belong to groups. Use
`docs/feedback-and-learning.md`. A checkpoint that matches the current plan closes one group
only; it does not approve the whole plan or authorize the next group.

## When To Stop

After creating or materially revising a spec, design, ADR, plan, code change, assessment,
or review report:

1. Update `.sdlc/wip.md`.
2. Report path, readiness/status, evidence, blockers/questions, and recommended next stage.
3. End the turn before starting the next stage.

Continue across stages only when the latest user request explicitly asks for end-to-end or
unattended execution. YOLO permits assumptions but does not bypass readiness, declared file
scope, blockers in earlier documents, test evidence, safety, approval, or human-review
stops.

## Evidence Invariants

- Specs own `AT-*` and `JT-*` descriptions of observable success.
- Designs own `TEST-*` descriptions of what must be tested and where.
- Plans assign tests from parent and local documents to child work or PRs.
- Behavior-changing code uses Red-Green-Refactor: observe the smallest meaningful test fail,
  make the minimum change that passes it, and improve the code while tests stay green.
- Code implements assigned tests and reports the commands and outcomes that exercised them.
- Process IDs stay in document traceability and external records, never in production/test
  source merely to create a link. Test names describe behavior.
- Format checks and optional requirement-to-test links do not prove correct meaning,
  stakeholder feedback, execution against a real dependency, merge state, or human
  approval.
- A primary external boundary cannot rely only on a self-authored test double unless the
  user explicitly accepts the remaining risk. In ordinary terms: test an important
  dependency through the real system or its official test interface, or state what the
  mock leaves untested.
- Live production deployment or production checks require explicit user approval.
- Run cleanup and simplify passes before handoff; do not use them for unrelated churn or
  hidden behavior changes.

## Verification Independence

Run repeatable checks once per document revision. After local findings are fixed, recheck
the affected boundary and focus independent review on those findings; restart full review
only when requirements or scope changed. When sub-agents are available,
use one fresh agent to run checks and another to independently judge the work. If
sub-agents are unavailable, say that the review is not independent and keep the two passes
separate. Stop when an earlier required document is not fit. Use
`docs/review-verification-checklist.md`.

## Triggered References

| Reference | Load when |
| --- | --- |
| `docs/enduring-model.md` | Explaining Sarathi, orienting a new project, or relating delivery, decomposition, quality, continuity, and risk. |
| `docs/requirements-model.md` | Specifications and their needs-to-evidence hierarchy. |
| `docs/assurance-profiles.md` | Choosing review depth or additional checks. |
| `docs/simplicity-first.md` | Checking that a solution or PR breakdown is no larger than needed. |
| `docs/project-entry.md` | Starting in a new or existing codebase. |
| `docs/work-in-progress.md` | Starting, resuming, blocking, handing off, or answering status and next-action questions. |
| `docs/artifact-formatting.md` | Writing or materially revising Markdown documents. |
| `docs/human-first-artifacts.md` | Creating or materially revising a spec, design, or plan; checking readability or source-ID cleanliness. |
| `docs/cross-cutting-concerns.md` | Choosing checks for security, privacy, reliability, or other identified risks. |
| `docs/test-ownership.md` | Planning or implementing tests, including test-first behavior changes, or when test ownership spans children. |
| `docs/work-decomposition.md` | Breakdown plans or child document chains are involved. |
| `docs/feedback-and-learning.md` | Coordinating parallel work, feedback, or earlier-document changes. |
| `docs/approval-gates.md` | Reading or writing approval/auto-policy ledgers. |
| `docs/cleanup-pass.md` and `docs/simplify-pass.md` | Handoff quality passes apply. |
| `docs/workflow-status.md` | Rendering or interpreting workflow status. |

Use `docs/progressive-disclosure.md` for the complete reference map. Use bundled
`checkers/check_*.py` for deterministic verification and preserve their raw evidence.
