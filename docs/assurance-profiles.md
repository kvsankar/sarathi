# Delivery Assurance Profiles And Extra Risk Checks

Sarathi uses one delivery process. A delivery assurance profile sets the evidence and
independent review the work needs. It never allows anyone to skip approved requirements,
readiness to implement, tests, feedback, or earlier-document review.

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

Choose the least intensive profile justified by consequence, reversibility, uncertainty, and
available test results. The profile may differ by feature or change.

| Profile | Use when | Expected proof |
| --- | --- | --- |
| Lean | The work is small, reversible, well understood, and affects little. | A short delivery or evidence plan, targeted checks, and direct feedback. |
| Standard | Ordinary delivery with meaningful integration or operational concerns; the default when risk is unclear. | A specific delivery or evidence plan, applicable real-boundary results, and independent assessment when useful. |
| High-assurance | Failure could cause material security, privacy, safety, regulatory, financial, availability, migration, or irreversible-data harm. | Stronger independent review, realistic-boundary evidence, rehearsals where applicable, auditable decisions, and tighter approval gates. |

High-assurance means stronger evidence for actual risk. It does not mean more hierarchy,
document depth, or recursive Spec/Design/Plan chains. An accepted high-assurance design may
be reused by one specific Implementation plan and proceed directly to code.

## Choosing A Profile

At project entry, and when requirements begin for a feature, present the choices with a
contextual recommendation. Record an explicit selection or confirmation of the project
default; never silently infer an automatic approval policy from YOLO or unattended wording.

State:

- `Delivery Assurance Profile: Lean | Standard | High-assurance`
- `Extra Checks: comma-separated checks or none`
- a short reason; and
- what would require stronger review.

Record the default in `.sdlc/process-decisions.yaml` when that file exists. Record a
document or slice override in `.sdlc/wip.md` and the accepted spec or plan. In YOLO mode,
use Standard when evidence is insufficient to justify Lean. A user may override the profile,
but remaining risk must remain explicit.

Escalate before affected work continues when new evidence increases blast radius,
irreversibility, uncertainty, external-boundary risk, or legal/safety consequence.
Reducing assurance requires evidence and must not remove obligations accepted by a parent
document.

A compact implementation plan is allowed at any profile when approved requirements and
architecture make a product increment ready to implement. A decision/evidence plan instead
states its question, method, boundaries, timebox, decision owner, and done signal. Escalate
only an unresolved boundary or risk; do not add unrelated document layers.

## Extra Checks For Specific Risks

The profile sets a baseline. Add only checks required by product context, the changed
boundary, or an approved requirement. Existing machine-readable documents store these
choices in `Extra Checks`. Older field names remain readable.

| Extra check | Use when | Additional evidence |
| --- | --- | --- |
| Security | Authentication, authorization, secrets, untrusted input, privilege. | Threat review, abuse cases, boundary tests, secure configuration evidence. |
| Privacy and compliance | Personal, regulated, retained, exported, or audited data. | Data-flow/retention decisions, consent or policy checks, audit evidence. |
| External integration | Vendor API, event contract, RPC boundary, generated client. | Real/official conformance evidence, contract fixtures, drift controls. |
| Data and migration | Schema/data conversion, destructive or hard-to-reverse state change. | Rehearsal, backup/restore, rollback, reconciliation, and integrity checks. |
| Reliability and operations | Availability, concurrency, queues, recovery, on-call impact. | Failure-path tests, observability, resilience, runbook and recovery evidence. |
| Performance and cost | Material latency, throughput, scale, capacity, or spend risk. | Representative benchmarks, limits, budgets, and monitoring evidence. |
| UI and accessibility | User-facing workflows or presentation changes. | Approved mock when required, interaction states, accessibility and visual checks. |
| Build and release | Packaging, CI/CD, infrastructure, rollout, or environment changes. | Build artifact, dry run, smoke, promotion, rollback, and release evidence. |
| Documentation | Users, integrators, operators, support, or auditors depend on guidance. | Validated examples, links/build, runbook, migration or release documentation. |

`docs/cross-cutting-concerns.md` assigns each extra check to the document that owns it. Do
not paste every option into every document. Mark an extra check `not-applicable` only when
the context reasonably suggests it and the rationale helps reviewers.

## A Profile Is Not A Status

An assurance profile tells the team how deeply to plan and review; it is not a completion
status. Lean does not mean unchecked, and High-assurance does not mean complete. Checks,
reviews, feedback, and approvals remain separate results.
