---
description: Create the shortest safe path from accepted intent to a reviewable increment.
agent: agent
---

# Plan Create

Turn accepted intent into a bounded, code-ready Implementation plan. Decomposition is an
exception that must resolve a named uncertainty.

## Load And Gate

Read `.sdlc/wip.md`, accepted parent specs/designs/ADRs/prototypes, the existing plan, and
repository delivery conventions. Load `docs/artifact-contracts.md` and
`docs/simplicity-first.md`, plus `docs/human-first-artifacts.md`.

## Triggered References

Load only when the trigger applies:

- `docs/work-decomposition.md`: decomposition or a child artifact is being considered;
- `docs/feedback-and-learning.md`: UI review, feedback dependencies, or parallel work;
- `docs/test-ownership.md`: inherited or cross-boundary test intent;
- `docs/assurance-profiles.md` and `docs/cross-cutting-concerns.md`: a concrete risk check;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: before handoff.

Block only on intent, architecture, approval, or risk gaps that make implementation unsafe.
Do not treat scope size or document level as a blocker.

## Direct-To-Code Decision

Use this order and record the answer concisely:

1. Can work proceed from existing approved artifacts?
2. Can one bounded Implementation plan safely authorize it?
3. Can it ship as one reviewable increment or sequential UI slices?
4. Only if not, what exact uncertainty requires decomposition?
5. What minimum delta artifact resolves that uncertainty?
6. Return to implementation immediately after it is resolved.

Choose `Plan Type: Implementation` whenever the first three answers are yes. A
feature/component may be code-ready directly in Lean, Standard, or High-assurance. Approved
requirements, tests, architecture, interfaces, risks, and prototypes are inherited by
reference; do not reproduce them.

Choose `Plan Type: Breakdown` only for a concrete reason allowed by
`docs/work-decomposition.md`. State the ceremony budget: uncertainty resolved, insufficiency
of existing artifacts, implementation decision changed, and why a plan note is insufficient.
If those answers are not concrete, do not create the Breakdown plan.
Use `Decomposition Reason` with one exact allowed slug from
`docs/work-decomposition.md`, then the exact fields `Uncertainty Resolved`, `Existing Artifacts Insufficient Because`,
`Implementation Decision Changed`, and `Why Plan Note Is Insufficient` under
`## Ceremony Budget`.

## Plan The Increment

Start new or materially revised plans with the version marker and `## Implementation Crux`.
Explain the outcome, exact change/non-change boundary, sequence, safety, and proof without
process IDs. Use descriptive delivery headings; keep allocations in comments and the final
`## Traceability` appendix.

For an Implementation plan:

- make each `PR-*` cohesive, testable, rollback-capable, and within a Planned Touch Set;
- assign inherited acceptance/design-test obligations by concise reference;
- use Red/Green/Refactor and clear pass/fail checks;
- reuse accepted architecture and existing compatibility evidence;
- schedule several sequential prototype-matching UI slices in one plan when they share
  behavior and architecture, stopping for stakeholder UI review after each slice;
- name realistic evidence for actual security, privacy, safety, persistence,
  accessibility, migration, or integration risks;
- prefer one cohesive PR and default a bounded slice to at most three PRs.

Use `Inherited Intent Record: Yes` for compact feature/component or slice/change work whose
parent intent and architecture are sufficient. The Direct-To-Code section already records
inherited sources, changed behavior/reviewable increment, blockers/escalation, and any
additional artifact. Add only `Why Direct` and `Acceptance & Verification`; do not restate
the decision fields. The legacy `Lean Change Record: Yes` marker remains valid.

For a Breakdown plan, allocate only independently useful `WORK-*` outcomes, require only the
minimum artifact for each, and use a `WAVE-*` only for a real shared feedback/integration
checkpoint. A reviewer must reject decomposition that merely restates parent intent.

Write `plan.md` unless another path is named. Do not create `plan.html`.

## Verify And Handoff

Run the earlier applicable checkers and `check_plan.py`. Run each repeatable check once for
this revision. Then assess with a fresh checker and independent reviewer when
available. After local fixes, use focused re-verification/re-review; restart the full pass
only if scope or controlling intent changed materially.

Batch checker results, approvals, workflow status, and ledger updates into one bookkeeping
step. Update `.sdlc/wip.md`, run simplify, and stop for human review unless the latest request
explicitly authorizes end-to-end execution. Recommend `/code-create` for a passing
Implementation plan.
