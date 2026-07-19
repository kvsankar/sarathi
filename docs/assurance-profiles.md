# Review Depth And Extra Risk Checks

Sarathi uses one delivery process. The review level sets how much checking and independent
review the work needs. It does not allow anyone to skip approved requirements, readiness to
implement, tests, feedback, or review of earlier documents.

## Rules That Never Change

Every production profile keeps these rules:

- Work from approved requirements and a plan that is ready to implement.
- Deliver the smallest useful change that can be understood and tested on its own.
- Use appropriate executable tests with clear pass/fail checks.
- Record feedback honestly; never invent stakeholder or observed-system evidence.
- Inspect affected parent specs, designs, plans, code, integration, and process after an
  assessed slice.
- Stop or replan when evidence invalidates active work.
- Preserve required approvals, safety constraints, and explicit approval boundaries.
- Apply `docs/simplicity-first.md`: process records never justify product machinery,
  and conceptual complexity must stay inside the user's mental model.

The existing **Exploratory track** remains separate. It covers timeboxed spikes,
prototypes, and investigations that are not production-ready. Exploratory code becomes
production work only after choosing one of the review levels below.

## Review Levels

Choose the least intensive review level justified by consequence, reversibility,
uncertainty, and available test results. The level may differ by feature or change.

| Profile | Use when | Expected depth |
| --- | --- | --- |
| Lean | The change is small, reversible, well understood, and affects little. | A short plan, one or few PRs, targeted tests, and direct feedback. |
| Standard | Ordinary product or feature delivery with meaningful integration or operational concerns. This is the default when risk is unclear. | A specific plan, integration/deployment results where applicable, and independent assessment when useful. |
| High-assurance | Failure could cause material security, privacy, safety, regulatory, financial, availability, migration, or irreversible data harm. | Stronger independent review, realistic-boundary evidence, rehearsals where applicable, auditable decisions, and tighter approval gates. |

High-assurance means stronger evidence for actual risk. It does not mean more hierarchy,
document depth, or recursive Spec/Design/Plan chains. An accepted high-assurance design may
be reused by one specific Implementation plan and proceed directly to code.

## Choosing a level

At project entry or before the first affected document, state:

- `Review Level: Lean | Standard | High-assurance`
- `Extra Checks: comma-separated checks or none`
- a short reason;
- what would require stronger review.

Record the default in `.sdlc/process-decisions.yaml` when that file exists. Record an
document or slice override in `.sdlc/wip.md` and the accepted spec or plan. In YOLO mode,
use Standard when evidence is insufficient to justify Lean. A user may override the
profile, but remaining risk must remain explicit.

Escalate before affected work continues when new evidence increases blast radius,
irreversibility, uncertainty, external-boundary risk, or legal/safety consequence.
Reducing review depth requires evidence and must not remove obligations already accepted
by a parent document.

A compact implementation plan is allowed at any review level when approved requirements
and architecture make the change ready to implement. Escalate only an unresolved boundary
or risk; do not add unrelated document layers.

## Extra checks for specific risks

The review level sets a baseline. Add only the checks required by the product context, the
changed boundary, or an approved requirement. Existing machine-readable documents store
these choices in `Extra Checks`. Older field names remain readable.

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

[cross-cutting-concerns.md](cross-cutting-concerns.md) assigns each extra check to the
document that owns it. Do not paste every option into every document. Mark an extra check
`not-applicable` only when the context could reasonably suggest it and the rationale helps
reviewers.

## A review level is not a status

A review level tells the team how deeply to plan and review; it is not a completion status.
Lean does not mean unchecked, and High-assurance does not mean complete. Checks, reviews,
feedback, and approvals remain separate results.
