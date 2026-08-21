---
description: Plan what will change, in what order, and how it will be tested.
agent: agent
---

# Plan Create

## Load And Gate

Read WIP, process decisions, accepted specs and any required designs/ADRs/prototypes, the
existing plan, and repository conventions. Load `docs/artifact-contracts.md`,
`docs/document-locations.md`, `docs/assurance-profiles.md`, `docs/simplicity-first.md`,
`docs/human-first-artifacts.md`, `docs/test-ownership.md`, `docs/work-decomposition.md`, and
`docs/result-reporting.md`.

## Triggered References

Load only when the trigger applies:

- `docs/feedback-and-learning.md`: UI review, feedback dependencies, or parallel work;
- `docs/cross-cutting-concerns.md`: an identified risk needs an extra check;
- `docs/project-quality-gates.md`: the repository lacks a local gate or hook, or the
  delivery changes its language or tooling;
- `docs/artifact-formatting.md` and `docs/simplify-pass.md`: before reporting.

Block only on gaps that make implementation unsafe; scope size or document level is not a
blocker. Follow the selected profile path and escalation rules.

## Choose The Plan Shape

Ask one question:

> Can a competent engineer understand, explain, review, and safely plan this work as one
> coherent unit?

- If yes, choose `Plan Type: Implementation`. Under High-assurance, say why this work is
  already small enough to review, test, and integrate safely.
- If no, split along natural product or technical boundaries and choose `Plan Type:
Breakdown` for the resulting independently useful child outcomes.

Stop splitting when each child is understandable, testable, and safe to integrate. Size
alone is not the test. An unanswered requirement or design question should be resolved
where it belongs; it does not automatically require a Breakdown plan. Link accepted parent
documents instead of reproducing them. A Breakdown plan organizes child outcomes; it does
not authorize code.

For a `Decision/evidence` work outcome, make the required result the named decision, not a
shippable increment. State the question, decision owner, evidence method, boundaries,
timebox or stop condition, and next action. Recommend `code-create` only when a planned
prototype or experiment needs code; otherwise recommend the evidence-gathering or decision
step.

## Structure The Delivery

Start new or materially revised plans with `<!-- sarathi:artifact-format version="3" -->` and
`## Implementation Approach`. Accept `## Implementation Crux` in existing documents.
Explain the outcomes, impacted areas, dependency structure, sequence, integration, safety,
and proof without process IDs. Use descriptive delivery headings; keep allocations in
comments and the final `## Traceability` appendix.

Add a proportionate `## Impact Map` using `docs/artifact-contracts.md`. Name affected
modules/files, contracts, APIs, schemas/data, tests, configuration, deployment, operations,
and documentation only when applicable. Say what is added, changed, removed, or deliberately
untouched; identify consumers, ownership, compatibility, cross-area effects, and likely
conflicts. Do not use LOC estimates. A small local change needs only a few lines.

Then inspect the current system and sibling services and add a short `## Baseline Reuse`
section. Classify every delivery item using the five compact choices in
`docs/work-decomposition.md`. Say what works already, what can be reused, what must be
extracted, what remains target-owned and why, what is genuinely new, and what is deferred.
Do not present an existing capability as greenfield work.

For an Implementation plan:

- for Lean without a design, add concise Technical Decisions and map spec acceptance to
  executable checks;
- list the PRs and their dependencies; one cohesive PR is valid and needs no empty dependency
  fields;
- for each PR, state outcome, impact allocation, verification, and applicable rollback;
- when there is more than one PR, say which PRs depend on others, which can run together,
  their merge order, the dependency chain that controls completion, likely conflicts, and
  where they must be tested together;
- make each PR cohesive, testable, safe to undo, and clear about the files, modules, and
  contracts it expects to change; keep `PR-*` IDs in traceability;
- link required behavior and tests from approved documents;
- name the first behavioral tests that will fail for the expected reason, the smallest
  implementation that should make them pass, and subsequent cleanup, with clear pass/fail
  results;
- inspect the repository's documented local gate and hook; when either is missing, assign
  their smallest useful setup to the first PR and include the expected files and commands;
- reuse accepted architecture and existing compatibility evidence;
- schedule several sequential prototype-matching UI slices in one plan when they share
  behavior and architecture, stopping for stakeholder UI review after each slice;
- name realistic evidence for actual security, privacy, safety, persistence,
  accessibility, migration, or integration risks;
- prefer one cohesive PR when it remains easy to review and test.

For a Breakdown plan, create a dependency graph of independently useful `WORK-*` outcomes.
Each item names its observable result, affected areas, owner, dependencies, readiness,
integration or feedback point, and required result. Require only the minimum document for each,
and use a work group only for a real shared checkpoint.

Use the name for this scope from `docs/document-locations.md`: `plan.md` only for
Product/system, otherwise `<work-slug>.plan.md`, unless another path is named; do not create `plan.html`.

## Check And Report

Run earlier applicable checkers and `check_plan.mjs` once for this revision. Use the results as
the check pass for one assessment under `prompts/plan-assess.prompt.md`; do not rerun unchanged
checks. This is the official assessment for this revision and uses the normal assessment
report. Apply one set of safe, in-scope fixes, update every affected copy, and have a fresh
reviewer check only those fixes. If a fix requires any material revision, stop instead of
changing approved requirements or design decisions. Report the current result even when it
is `Needs rework`; do not accept `Pass-with-fixes`.

Explain checker results before raw metrics, simplify the plan, and state the result first.
List problems by severity and next actions. Update WIP, then follow the recorded approval policy.
Human checkpoints require explicit approval. Automatic approval requires an eligible local policy and explicit end-to-end instruction.
Recommend `code-create` only for a product increment or planned code experiment; otherwise
recommend the next evidence or decision step.
