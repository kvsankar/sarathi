---
description: Create the shortest safe implementation plan for the approved change.
agent: agent
---

# Plan Create

Turn approved requirements into a specific implementation plan. Split the work only when
a specific unanswered question prevents safe implementation.

## Load And Gate

Read `.sdlc/wip.md`, accepted parent specs/designs/ADRs/prototypes, the existing plan, and
repository delivery conventions. Load `docs/artifact-contracts.md` and
`docs/simplicity-first.md`, plus `docs/human-first-artifacts.md`.

## Triggered References

Load only when the trigger applies:

- `docs/work-decomposition.md`: splitting the work or adding another document is being considered;
- `docs/feedback-and-learning.md`: UI review, feedback dependencies, or parallel work;
- `docs/test-ownership.md`: inherited or cross-boundary test intent;
- `docs/assurance-profiles.md` and `docs/cross-cutting-concerns.md`: an identified risk needs an additional check;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: before handoff.

Block only on intent, architecture, approval, or risk gaps that make implementation unsafe.
Do not treat scope size or document level as a blocker.

## Can Implementation Start?

Use this order:

1. Do the approved documents answer what must be built and tested?
2. Can one short implementation plan make the change safe to start?
3. Can the result be reviewed and tested as one change or a short sequence?
4. If not, what exact unanswered question requires the work to be split?
5. What is the smallest document or experiment that answers it?
6. Return to implementation immediately after it is resolved.

Choose `Plan Type: Implementation` whenever the first three answers are yes. A feature or
component may proceed directly at any review level. Link approved requirements,
tests, architecture, interfaces, risks, and prototypes instead of reproducing them.

Choose `Plan Type: Breakdown` only for a concrete reason allowed by
`docs/work-decomposition.md`. Say in one sentence which unanswered question prevents safe
implementation. If there is no concrete question, do not create the Breakdown plan.

## Plan The Increment

Start new or materially revised plans with the version marker and
`## Implementation Approach`. Accept `## Implementation Crux` in existing documents.
Explain the outcome, exact change/non-change boundary, sequence, safety, and proof without
process IDs. Use descriptive delivery headings; keep allocations in comments and the final
`## Traceability` appendix.

For an Implementation plan:

- make each delivery item cohesive, testable, safe to undo, and clear about the files it
  expects to change; keep `PR-*` IDs in traceability;
- link required behavior and tests from approved documents;
- name the first failing tests, the smallest implementation, and cleanup, with clear
  pass/fail results;
- reuse accepted architecture and existing compatibility evidence;
- schedule several sequential prototype-matching UI slices in one plan when they share
  behavior and architecture, stopping for stakeholder UI review after each slice;
- name realistic evidence for actual security, privacy, safety, persistence,
  accessibility, migration, or integration risks;
- prefer one cohesive PR when it remains easy to review and test.

For a small change, link the approved parent documents and include only the changed
behavior, implementation steps, and verification. Existing legacy compact-plan markers
remain parseable, but do not add them to new plans.

For a Breakdown plan, list only independently useful `WORK-*` outcomes, require only the
minimum document for each, and use a work group only for a real shared feedback/integration
checkpoint. A reviewer must reject decomposition that merely restates parent intent.

Write `plan.md` unless another path is named. Do not create `plan.html`.

## Verify And Handoff

Run the earlier applicable checkers and `check_plan.py`. Run each repeatable check once for
this revision. Then assess with a fresh checker and independent reviewer when
available. After local fixes, use focused re-verification/re-review; restart the full pass
only if requirements or scope changed.

Record checker results, approvals, and workflow status together. Update `.sdlc/wip.md`, run
simplify, and stop for human review unless the latest request
explicitly authorizes end-to-end execution. Recommend `/code-create` for a passing
Implementation plan.
