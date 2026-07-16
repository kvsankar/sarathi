# Simplify Pass

A simplify pass is a deliberate pass to remove over-engineered pieces after the work is
otherwise coherent. It normally runs after cleanup when both apply and before a human
handoff for specs, designs, plans, and code slices. Apply `docs/simplicity-first.md`;
simplification can require upstream artifact revision, not only local implementation edits.

The goal is not to make artifacts brief or code clever. The goal is to keep the solution
only as structured as the problem, risk, and evidence require. Preserve necessary detail,
accepted constraints, and useful tests; remove speculative machinery, premature generality,
and process-shaped weight that does not earn its keep.

## What To Challenge

- Spec: requirements that are broader than accepted intent, duplicated needs, unnecessary
  user roles, speculative future behaviors, NFR thresholds without a real driver, and
  acceptance criteria that test imagined architecture instead of observable outcomes.
- Design: unnecessary layers, components, interfaces, extension points, ADRs, patterns,
  queues, caches, async flows, distributed boundaries, abstractions, diagrams, or glossary
  entries that do not answer a real requirement, risk, constraint, or quality attribute.
- Plan: slices that exist only to satisfy ceremony, extra PRs with no review value,
  duplicated verification work, speculative infrastructure tracks, and handoffs that add
  coordination cost without reducing risk.
- Code: premature abstractions, generic frameworks, indirection, configuration knobs,
  inheritance, factories, adapters, feature flags, state machines, retries, caches,
  concurrency, or dependency seams that the current requirements and tests do not justify.
- Tests and verification: broad fixtures, elaborate mocks, excessive snapshots, redundant
  edge-case matrices, or security/performance/observability checks that add maintenance cost
  without increasing confidence.

## What Not To Remove

- Detail needed for a human to review behavior, trade-offs, and edge cases.
- Separation that protects a real boundary, pure core, security/privacy rule, external
  contract, migration, operability need, or meaningful test seam.
- Explicit requirements, design decisions, or tests that are required by accepted scope,
  safety, compliance, reliability, accessibility, or production operations.
- Readability improvements merely because they add lines.

## Required Questions

During the simplify pass, ask:

1. What user, risk, constraint, or verified future need justifies this complexity?
2. What would break if this layer, option, abstraction, requirement, or test fixture were
   removed?
3. Can the same behavior be expressed more directly while preserving reviewability,
   traceability, and evidence?
4. Is this supporting current accepted scope, or is it preparing for an unapproved future?
5. Does this make the next maintainer's job easier, or only make the artifact look more
   sophisticated?

If the answer is weak, simplify in scope. If the governing artifact itself created the
unjustified complexity, classify ancestor impact as `revision-required`, revise that
artifact, and then continue. Do not preserve an overbuilt spec/design/plan merely because
implementation began. If simplification changes accepted behavior, contracts, quality
attributes, UX, deployment posture, or public documentation, make that revision explicit.

## Handoff Expectation

Creation stages should mention the simplify pass in the handoff when it was relevant:

- What was simplified or intentionally left as-is.
- Any complexity kept because it is justified by a requirement, risk, or constraint.
- Any larger simplification deferred because it would exceed the current scope.

Review and assessment stages should flag unjustified complexity as a finding, even when the
artifact is structurally valid and all checks pass.
