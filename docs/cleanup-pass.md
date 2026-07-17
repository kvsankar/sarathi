# General Cleanup Pass

A general cleanup pass is a deliberate final engineering pass for odd issues that are easy
to miss while chasing the primary behavior. It is required before ending a code slice and is
appropriate after substantial document edits, after refactors, after resolving review
findings, and before a handoff where accumulated small issues would make the next agent or
reviewer work harder.

The pass is scoped. It improves the current document or planned touch set; it does not
silently expand product behavior, redesign architecture, rewrite unrelated modules, or erase
useful comments, tests, docs, or readable structure. If cleanup discovers out-of-scope work,
record a finding, follow-up, or need to revise an earlier document instead of slipping it into
the current slice.

## What To Scan

- Code: dead code, unused imports, debug prints, temporary flags, inconsistent names,
  needless wrappers, avoidable duplication, unclear control flow, stale comments, misleading
  abstractions, accidental global state, and local style drift.
- Tests: tautological assertions, tests that only prove execution, mock-call assertions that
  do not verify behavior, brittle sleeps/selectors, excessive snapshots, duplicated fixtures,
  unhelpful generated data, slow tests that can be lower-level, and missing cleanup/isolation.
- Requirement links: IDs or maps that claim coverage without a real pass/fail check, stale `covers` claims,
  broad test mappings that hide gaps, and comments that exist only to satisfy a checker.
- Security/privacy/reliability: superficial checks that do not protect a real boundary,
  unused or performative validation, fake redaction, noisy logs that obscure incidents,
  swallowed errors, unchecked fallbacks, and scan output recorded without triage.
- Documentation/build/deploy/config: stale commands, undocumented behavior changes, dead
  examples, invalid links, obsolete flags, generated files that should not be checked in,
  and config drift between local gates and CI.

## Theater Smells

Theater is process-looking work that creates confidence without real evidence.

- Test theater: `assert true`, self-comparisons, snapshot churn without intent, checking that
  a mock was called while ignoring the observable outcome, or mapping one broad test to many
  IDs without exercising their distinct behavior.
- Security theater: adding banners, headers, scanner output, allowlists, encryption helpers,
  or validation functions that are not wired to an actual threat, boundary, test, alert, or
  failure mode.
- Observability theater: logs, metrics, traces, or dashboards that are too noisy, unstable,
  unredacted, untested, or disconnected from decisions an operator or agent must make.
- Empty linking: exact IDs are present, but the linked document, test, or review note
  would not fail or change if the behavior were wrong.

Remove empty process work when it is inside scope. Replace it with a clear pass/fail check,
real boundary
evidence, useful diagnostic signal, or an honest finding that the evidence is missing.

## Required Code-Slice Pass

Before ending any `/code-create` slice, the agent must:

1. Re-scan touched code, tests, docs, config, and requirement links for the issues above.
2. Fix in-scope oddities, redundancy, misleading claims, and theater.
3. Avoid cosmetic churn outside the planned touch set.
4. If cleanup changes behavior, contracts, UX, NFRs, or planned scope, stop to revise the
   controlling document instead of hiding the change.
5. Re-run affected tests and the configured local quality gate after cleanup changes.
6. Mention the cleanup pass in the handoff, including fixes made and any follow-up findings.

Review and assessment stages must judge whether this pass actually happened and whether it
removed theater rather than creating more ceremony.
