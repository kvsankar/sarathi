# Delivery Assurance Profiles And Extra Risk Checks

Sarathi has three paths to code. A delivery assurance profile chooses which documents stay
separate, whether the work should be split, and when reviews happen. It never makes a review
less careful or allows anyone to skip approved requirements, a code-ready plan, tests,
feedback, or review of earlier documents.

## Rules That Never Change

Every profile keeps these rules:

- Product-increment work uses approved requirements and a code-ready plan. Tests show that the
  smallest useful change works.
- Decision/evidence work starts with an accepted question, decision owner, method, limits,
  and stopping point or time limit. It records the decision and next action. Experiments,
  inspection, prototypes, and checks must be reliable enough for the decision, but do not
  make the product ready to ship.
- Record feedback honestly; never invent stakeholder or observed-system evidence.
- Inspect affected parent specs, designs, plans, code, integration, and process after an
  assessed slice.
- Stop or change the plan when results show that active work is no longer valid or safe.
- Preserve required approvals, safety constraints, and explicit approval boundaries.
- Apply `docs/simplicity-first.md`: process records never justify product machinery, and
  conceptual complexity must stay inside the user's mental model.

## Delivery Assurance Profiles

Choose the shortest safe path. Consider what failure would cause, how easily the change can
be undone, what is uncertain, and what is already known. The profile may differ by feature
or change.

### Lean: combine design with planning

```text
spec -> implementation plan -> code
```

Use Lean when the work is small, easy to undo, well understood, and has limited effect. Do
not create a separate design. Put the technical decisions needed for safe code in the
Implementation plan: relevant current structure, changed interfaces, data or state effects,
important trade-offs, test approach, and reasons that would require a separate design. Keep
the work together unless it cannot be understood and combined safely as one unit.

Run a complete assessment after the spec, plan, and code. Lean gets to code faster by
combining documents and keeping coherent work together, not by weakening checks or review.

### Standard: keep each delivery stage explicit

```text
spec -> design -> implementation plan -> code
```

Use Standard for ordinary work or when risk is unclear. Review the spec, design, plan, and
code separately. Use a Breakdown plan only when the work cannot be handled safely as one
unit. Run a complete assessment after each stage.

### High-assurance: review smaller risk-bounded increments

```text
spec -> design -> breakdown plan -> child implementation plan(s) -> code slices
```

Use High-assurance when failure could cause serious security, privacy, safety, legal or
regulatory, financial, availability, migration, or permanent data harm. Before coding, split the work
where a risk, recovery step, review result, or integration result could change what follows.
Assess the spec, design, and Breakdown plan together before code. Assess each child
Implementation plan and each meaningful code change before dependent work continues. If the
accepted work is already one safe, independent change, use one Implementation plan and state
why a Breakdown plan is unnecessary.

High-assurance reviews smaller changes more often. It does not require longer documents,
chains of repeated documents, or a different standard of reviewer care.

### What combining a stage means

A combined stage removes a standalone document, not the decisions it protects. Lean plans
must make the necessary technical approach reviewable. If an interface, data model,
migration, security boundary, or architectural trade-off cannot be safely resolved inside
the plan, escalate to Standard and create the design before implementation.

Every stage kept in the chosen path receives the same automatic checks and independent
review described in [review-verification-checklist.md](review-verification-checklist.md).
The profile changes when reviews happen, not whether findings are fixed or results are
trustworthy.

## Choosing A Profile

At project entry, and when requirements begin for a feature, present the choices with a
contextual recommendation. Record an explicit selection or confirmation of the project
default. Under explicit YOLO, infer the profile without stopping for confirmation and follow
the automatic internal-gate policy in [approval-gates.md](approval-gates.md).

State:

- `Delivery Assurance Profile: Lean | Standard | High-assurance`
- `Extra Checks: comma-separated checks or none`
- a short reason; and
- what would require a longer path or additional review point.

Record the default in `.sdlc/process-decisions.yaml` when that file exists. Record a
document or slice override in the accepted spec or plan. Link that source from
`.sdlc/wip.md` rather than copying the choice. In YOLO mode,
use Standard when evidence is insufficient to justify Lean. A user may override the profile,
but remaining risk must remain explicit.

Use a stronger profile before affected work continues when new results show wider
consequences, make the change harder to undo, increase uncertainty or risk at an external
interface, or create new legal or safety consequences. Use evidence to justify a weaker
profile, and do not remove anything required by an earlier document.

Match the process to the work being done now. A disposable change that uses fake data, a
temporary database, no external writes, and no real users normally does not need
production-level evidence yet. It still receives meaningful tests and independent review.

Increase assurance before the work first:

- uses real or production-derived data;
- writes to an external, persistent, or shared system;
- serves more than one real user;
- changes authentication or authorization behavior;
- changes what audit records mean, contain, retain, or guarantee; or
- performs an irreversible migration or production deployment.

Do not postpone an early decision when it would make one of these later steps unsafe or hard
to change. Record the future risk now, but require its expensive evidence when the work
actually reaches that risk.

Use a compact Implementation plan for coherent Lean work. Standard may also use one when an
approved design already exists. High-assurance may use one only when the accepted work is
already one safe, independent change. A decision/evidence plan instead states its question,
method, limits, timebox, decision owner, and completion condition. Add another document only
when a specific unanswered decision or risk blocks the work.

## Extra Checks For Specific Risks

The profile sets a baseline. Add only checks required by product context, the changed
boundary, or an approved requirement. Existing machine-readable documents store these
choices in `Extra Checks`. Older field names remain readable.

| Extra check | Use when | Additional evidence |
| --- | --- | --- |
| Security | Authentication, authorization, secrets, untrusted input, privilege. | For each changed trust boundary, identify credible abuse cases, assign mitigations, test them through the real enforcement point, and state remaining risk. |
| Privacy and compliance | Personal, regulated, retained, exported, or audited data. | Use synthetic test data by default. When production-derived data is necessary, minimize and de-identify it, restrict access and retention, and prevent personal data from entering committed fixtures, logs, screenshots, or test output. |
| External integration | Vendor API, event contract, RPC boundary, generated client. | Real/official conformance evidence, contract fixtures, drift controls. |
| Data and migration | Schema/data conversion, destructive or hard-to-reverse state change. | Rehearsal, backup/restore, rollback, reconciliation, and integrity checks. |
| Reliability and operations | Availability, concurrency, queues, recovery, on-call impact. | For each material retry, fallback, degraded mode, or recovery path, force it and verify recovery, side effects, and observability. |
| Performance and cost | Material latency, throughput, scale, capacity, or spend risk. | Measure a small relevant set of outcomes across representative workload conditions. Compare them with accepted limits and, when claiming an improvement, with a baseline under the same conditions; improving one dimension must not conceal an unacceptable regression in another. |
| UI and accessibility | User-facing workflows or presentation changes. | For each changed user-facing flow, exercise applicable loading, empty, error, and interaction states in the running interface; verify relevant viewport sizes, orientations, text scaling, keyboard and focus behavior, semantics, contrast, and a representative screen-reader path. |
| Build and release | Packaging, CI/CD, infrastructure, rollout, or environment changes. | Build artifact, dry run, smoke, promotion, rollback, and release evidence. |
| Documentation | Users, integrators, operators, support, or auditors depend on guidance. | Validated examples, links/build, runbook, migration or release documentation. |

`docs/cross-cutting-concerns.md` assigns each extra check to the document that owns it. Do
not paste every option into every document. Mark an extra check `not-applicable` only when
the context reasonably suggests it and the rationale helps reviewers.

## A Profile Is Not An Approval Policy Or Status

An assurance profile chooses the path to code, whether work is normally split, and when
reviews happen. The approval policy separately decides whether Sarathi must wait for a
person at those points. Lean may use Human checkpoints, and YOLO may use Standard or
High-assurance. A profile is not a status: Lean is still checked, and High-assurance does
not mean the work is complete. Checks, reviews, feedback, and approvals remain separate.
