# Assurance And Extra Risk Checks

Sarathi does not select a named document path. Start from the accepted baseline and the
smallest focused change. Add a separate design, plan, delivery boundary, review point, or
extra check only when the work's complexity or risk makes it useful.

## Rules That Never Change

- Intentional observable behavior and protected-contract changes use an approved slice
  delta. Defect repairs, refactors, and mechanical work use the accepted baseline directly
  unless they intentionally change that behavior or contract.
- Every planned delivery unit is independently reviewable and receives focused and affected
  checks, exact Git identity, independent focused assessment, and one replacement WIP
  position.
- Record feedback honestly; never invent stakeholder or observed-system evidence.
- Stop or revise the controlling document when results show that active work is invalid or
  unsafe.
- Preserve approval, authority, privacy, safety, migration, external-effect, release, and
  production boundaries.
- Apply [simplicity-first.md](simplicity-first.md): delivery records never justify product
  machinery, and conceptual complexity stays inside the user's mental model.

## Scale The Work To Risk

Use one compact slice when a competent engineer can understand, implement, test, review, and
undo the change safely. Put the technical approach, delivery unit, checks, rollback, and
review point in that document.

Create a separate design when an interface, data model, security boundary, migration, or
architectural trade-off needs independent review. Create a separate implementation plan
when the slice needs several delivery units, complex dependencies, staged migration,
feedback before later work, or risk-specific review points. A wider product effort may use
a breakdown plan for independently useful child outcomes. These documents answer concrete
questions; they do not form a mandatory stage sequence.

One slice normally maps to one delivery unit. A slice may name several when reviewability,
risk, migration, dependency feedback, or learning requires it. Keep one controlling delta
and make every boundary and dependency explicit. Do not count internal commits, test-first
chronology, or review-fix amendments as additional delivery units.

## Extra Checks For Specific Risks

Add only checks required by product context, the changed boundary, or an approved
requirement. Do not paste the whole table into each document.

| Risk | Use when | Additional evidence |
| --- | --- | --- |
| Security | Authentication, authorization, secrets, untrusted input, privilege. | Identify credible abuse cases at changed trust boundaries, test mitigations through the real enforcement point, and state remaining risk. |
| Privacy and compliance | Personal, regulated, retained, exported, or audited data. | Minimize and de-identify data, restrict access and retention, and prevent personal data from entering committed fixtures, logs, screenshots, or output. |
| External integration | Vendor API, event contract, RPC boundary, generated client. | Real or official conformance evidence, contract fixtures, and drift controls. |
| Data and migration | Schema conversion or destructive, persistent, or hard-to-reverse state change. | Rehearsal, backup and restore, rollback, reconciliation, and integrity checks. |
| Reliability and operations | Availability, concurrency, queues, recovery, on-call impact. | Force material failure paths and verify recovery, side effects, and observability. |
| Performance and cost | Material latency, throughput, scale, capacity, or spend risk. | Measure representative outcomes against accepted limits and a comparable baseline when claiming improvement. |
| UI and accessibility | User-facing workflows or presentation changes. | Exercise relevant loading, empty, error, interaction, viewport, keyboard, focus, semantic, contrast, text-scaling, and screen-reader behavior. |
| Build and release | Packaging, CI/CD, infrastructure, rollout, or environment changes. | Build artifact, dry run, smoke, promotion, rollback, and release evidence. |
| Documentation | Users, integrators, operators, support, or auditors depend on guidance. | Validated examples, links or build, runbook, migration, or release guidance. |

[cross-cutting-concerns.md](cross-cutting-concerns.md) assigns each check to the document or
code that owns it. Mark a check not applicable only when the context suggests it and the
reason helps reviewers.

## Assurance Is Not Approval Or Status

Risk determines evidence and review timing. Approval policy determines who may authorize a
protected decision or action. Neither makes the work complete. A compact slice still needs
meaningful checks and independent review; a risky change does not become safe by creating
more documents.
