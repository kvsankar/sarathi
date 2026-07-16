# Delivery Profiles And Assurance Modules

Sarathi uses one feedback-driven delivery loop with risk-calibrated depth. Profiles do not
create separate lifecycles and do not authorize skipping accepted intent, code readiness,
tests, feedback, or ancestor-impact review.

## Core Delivery Invariants

Every production profile preserves these invariants:

- Work from current accepted intent and a code-ready implementation plan.
- Deliver the smallest useful, reviewable change in a bounded learning wave.
- Use appropriate executable tests and concrete verification oracles.
- Record feedback honestly; never invent stakeholder or observed-system evidence.
- Inspect affected ancestor specs, designs, plans, code, integration, and process after an
  assessed slice.
- Stop or replan when evidence invalidates active work.
- Preserve human gates, safety constraints, and explicit approval boundaries.
- Apply `docs/simplicity-first.md`: process evidence never justifies product machinery,
  and conceptual complexity must stay inside the user's mental model.

The existing **Exploratory track** remains separate. It covers timeboxed spikes,
prototypes, and investigations that are not production-ready. Exploratory code becomes
production work only after entering one of the delivery profiles below.

## Production Profiles

Choose the least intensive profile that is justified by consequence, reversibility,
uncertainty, and evidence. The profile may differ by feature or slice.

| Profile | Use when | Expected depth |
| --- | --- | --- |
| Lean | The change is small, reversible, well understood, and low blast radius. | Compact artifacts, one or few PRs, targeted tests, one bounded wave, and direct feedback. |
| Standard | Ordinary product or feature delivery with meaningful integration or operational concerns. This is the default when risk is unclear. | Normal artifact depth, explicit integration and deployment evidence, incremental waves, and independent assessment when available. |
| High-assurance | Failure could cause material security, privacy, safety, regulatory, financial, availability, migration, or irreversible data harm. | Stronger independent review, realistic-boundary evidence, rehearsals where applicable, auditable decisions, and tighter approval gates. |

High-assurance means stronger evidence at each learning boundary. It must not become a
large up-front specification phase or defer integration until the end.

## Selection

At project entry or before the first affected artifact, state:

- `Delivery Profile: Lean | Standard | High-assurance`
- `Assurance Modules: comma-separated module names or none`
- a short rationale;
- escalation triggers.

Record the default in `.sdlc/process-decisions.yaml` when that file exists. Record an
artifact or slice override in `.sdlc/wip.md` and the governing spec or plan. In YOLO mode,
use Standard when evidence is insufficient to justify Lean. A user may override the
profile, but residual risk must remain explicit.

Escalate before affected work continues when new evidence increases blast radius,
irreversibility, uncertainty, external-boundary risk, or legal/safety consequence.
De-escalation requires evidence and must not remove obligations already accepted by an
ancestor artifact.

## Assurance Modules

Profiles set a baseline; modules activate focused depth. Load only modules triggered by
the product context, changed boundary, or accepted requirement.

| Module | Typical triggers | Additional evidence |
| --- | --- | --- |
| Security | Authentication, authorization, secrets, untrusted input, privilege. | Threat review, abuse cases, boundary tests, secure configuration evidence. |
| Privacy and compliance | Personal, regulated, retained, exported, or audited data. | Data-flow/retention decisions, consent or policy checks, audit evidence. |
| External integration | Vendor API, event contract, RPC boundary, generated client. | Real/official conformance evidence, contract fixtures, drift controls. |
| Data and migration | Schema/data conversion, destructive or hard-to-reverse state change. | Rehearsal, backup/restore, rollback, reconciliation, integrity oracles. |
| Reliability and operations | Availability, concurrency, queues, recovery, on-call impact. | Failure-path tests, observability, resilience, runbook and recovery evidence. |
| Performance and cost | Material latency, throughput, scale, capacity, or spend risk. | Representative benchmarks, limits, budgets, and monitoring evidence. |
| UI and accessibility | User-facing workflows or presentation changes. | Approved mock when required, interaction states, accessibility and visual checks. |
| Build and release | Packaging, CI/CD, infrastructure, rollout, or environment changes. | Build artifact, dry run, smoke, promotion, rollback, and release evidence. |
| Documentation | Users, integrators, operators, support, or auditors depend on guidance. | Validated examples, links/build, runbook, migration or release documentation. |

[cross-cutting-concerns.md](cross-cutting-concerns.md) assigns module decisions to the
artifact that owns them. Do not paste every module into every artifact. Mark a module
`not-applicable` only when the context could reasonably suggest it and the rationale helps
reviewers.

## Profile Is Not Completion

A profile is a planning and evidence posture, not a status badge. Lean does not mean
unchecked; High-assurance does not mean complete. The artifact tree, wave checkpoints,
assessments, and approvals remain independent evidence sources.
