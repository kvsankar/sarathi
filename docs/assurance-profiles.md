# Delivery Assurance Profiles And Extra Risk Checks

Sarathi uses one delivery model with three paths to code. A delivery assurance profile sets
which stages are separate, whether risk-boundary decomposition is expected, and when full
assurance runs. It does not make an individual review shallower or allow anyone to skip
approved requirements, readiness to implement, tests, feedback, or earlier-document review.

## Rules That Never Change

Every profile keeps these rules:

- Product-increment work uses approved requirements and a plan ready to implement; it proves
  the smallest useful change with appropriate executable tests.
- Decision/evidence work uses an accepted question, decision owner, evidence method,
  boundaries, and stop condition or timebox; it records the resulting decision and next
  action. Experiments, inspection, prototypes, and checks must be credible and repeatable
  enough for the consequence, but do not claim product readiness.
- Record feedback honestly; never invent stakeholder or observed-system evidence.
- Inspect affected parent specs, designs, plans, code, integration, and process after an
  assessed slice.
- Stop or replan when evidence invalidates active work.
- Preserve required approvals, safety constraints, and explicit approval boundaries.
- Apply `docs/simplicity-first.md`: process records never justify product machinery, and
  conceptual complexity must stay inside the user's mental model.

## Delivery Assurance Profiles

Choose the shortest path justified by consequence, reversibility, uncertainty, and
available evidence. The profile may differ by feature or change.

### Lean: combine design with planning

```text
spec -> implementation plan -> code
```

Use Lean when the work is small, reversible, well understood, and affects little. Do not
create a standalone design. Put the implementation-shaping reasoning needed for safe code
in the Implementation plan: relevant current structure, changed boundaries and interfaces,
data/state effects, material trade-offs, test strategy, and conditions that require a
standalone design. Prefer one coherent implementation unit and do not create a Breakdown
plan unless evidence shows that the work cannot be understood and integrated safely as one
unit.

Run a complete assessment at the spec, plan, and code boundaries. Lean gets to code faster
by combining stages and avoiding unnecessary decomposition, not by weakening checks or
review.

### Standard: keep each delivery stage explicit

```text
spec -> design -> implementation plan -> code
```

Use Standard for ordinary delivery or when risk is unclear. Keep requirements, technical
design, delivery planning, and implementation as separate reviewable stages. Use a
Breakdown plan only when the work is not one coherent unit. Run a complete assessment at
every stage boundary.

### High-assurance: review smaller risk-bounded increments

```text
spec -> design -> breakdown plan -> child implementation plan(s) -> code slices
```

Use High-assurance when failure could cause material security, privacy, safety, regulatory,
financial, availability, migration, or irreversible-data harm. Divide the work at material
risk, recovery, feedback, or integration boundaries before implementation. Assess the full
requirements/design/breakdown package before code, assess each child Implementation plan,
and assess every meaningful code slice before dependent work continues. If the accepted
work is already one independently safe slice, one Implementation plan may replace a
one-child Breakdown plan when the plan records that reason.

High-assurance adds review points and smaller feedback increments. It does not demand
inflated documents, recursive document chains, or a different standard of reviewer care.

### What combining a stage means

A combined stage removes a standalone document, not the decisions it protects. Lean plans
must make the necessary technical approach reviewable. If an interface, data model,
migration, security boundary, or architectural trade-off cannot be safely resolved inside
the plan, escalate to Standard and create the design before implementation.

Every retained stage uses the same check-plus-independent-review assessment contract in
[review-verification-checklist.md](review-verification-checklist.md). The profile changes
where assurance occurs, not whether findings are pursued or evidence is credible.

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

Escalate before affected work continues when new evidence increases blast radius,
irreversibility, uncertainty, external-boundary risk, or legal/safety consequence.
Reducing assurance requires evidence and must not remove obligations accepted by a parent
document.

A compact implementation plan is expected for coherent Lean work, allowed for coherent
Standard work when an approved design already exists, and allowed for High-assurance only
when the accepted work is already one independently safe slice. A decision/evidence plan
instead states its question, method, boundaries, timebox, decision owner, and done signal.
Escalate only an unresolved boundary or risk; do not add unrelated document layers.

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

An assurance profile chooses the stage path, decomposition bias, and review cadence. The
approval policy separately decides whether Sarathi stops at those review points. Lean may
use Human checkpoints, and YOLO may use Standard or High-assurance. A profile is not a
completion status: Lean does not mean unchecked, and High-assurance does not mean complete.
Checks, reviews, feedback, and approvals remain separate results.
