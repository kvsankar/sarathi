# Review Depth And Extra Risk Checks

Sarathi uses one feedback-driven delivery loop. `Delivery Profile` sets how much review and
evidence the work needs. It does not create a separate process or allow anyone to skip
accepted intent, readiness to implement, tests, feedback, or review of parent documents.

## Rules That Never Change

Every production profile keeps these rules:

- Work from current accepted intent and a code-ready implementation plan.
- Deliver the smallest useful, reviewable change in a small learning wave.
- Use appropriate executable tests with clear pass/fail checks.
- Record feedback honestly; never invent stakeholder or observed-system evidence.
- Inspect affected parent specs, designs, plans, code, integration, and process after an
  assessed slice.
- Stop or replan when evidence invalidates active work.
- Preserve human gates, safety constraints, and explicit approval boundaries.
- Apply `docs/simplicity-first.md`: process records never justify product machinery,
  and conceptual complexity must stay inside the user's mental model.

The existing **Exploratory track** remains separate. It covers timeboxed spikes,
prototypes, and investigations that are not production-ready. Exploratory code becomes
production work only after entering one of the delivery profiles below.

## Production Review Depth

Choose the least intensive profile that is justified by consequence, reversibility,
uncertainty, and evidence. The profile may differ by feature or slice.

| Profile | Use when | Expected depth |
| --- | --- | --- |
| Lean | The change is small, reversible, well understood, and affects little. | Compact documents, one or few PRs, targeted tests, one small wave, and direct feedback. |
| Standard | Ordinary product or feature delivery with meaningful integration or operational concerns. This is the default when risk is unclear. | Normal document depth, explicit integration and deployment evidence, incremental waves, and independent assessment when available. |
| High-assurance | Failure could cause material security, privacy, safety, regulatory, financial, availability, migration, or irreversible data harm. | Stronger independent review, realistic-boundary evidence, rehearsals where applicable, auditable decisions, and tighter approval gates. |

High-assurance means stronger evidence before each next delivery step. It must not become a
large up-front specification phase or defer integration until the end.

## Selection

At project entry or before the first affected document, state:

- `Delivery Profile: Lean | Standard | High-assurance`
- `Assurance Modules: comma-separated module names or none`
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

## Extra Risk Checks

The profile sets a baseline. `Assurance Modules` is the machine-readable field for extra
checks required by specific risks. Use only the checks triggered by the product context,
changed boundary, or accepted requirement.

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

## Profile Is Not Completion

A profile tells the team how deeply to plan and review; it is not a status badge. Lean does
not mean unchecked, and High-assurance does not mean complete. The work tree, wave
checkpoints, assessments, and approvals remain separate sources of evidence.
