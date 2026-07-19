# Accurate checking and product-first status

<!-- sarathi:artifact-format version="3" -->

## Implementation Approach

Prepare Sarathi 0.3.2 as one compatible correction. Code checking must report environment-
specific skips without failing solely on their presence, recognize real process IDs without
matching ordinary test vocabulary, scan exact files or directories, and run with the macOS
Python 3.9 checker environment. Status and planning must lead with engineering reality:
what works, what is reusable, what remains shared or target-owned, what is deferred, what
blocks coding, and the single next action.

Existing approvals, evidence rules, security review, migration review, implementation
readiness, and legacy artifact parsing remain unchanged. No new artifact, gate, registry,
history service, readability score, or source-code traceability mechanism is added.

## Baseline Reuse

Sarathi already has Markdown WIP files, plans, stage prompts, deterministic checkers, an HTML
workflow renderer, installer-generated stage skills, and bundle-parity tests. Revise those
paths directly. Reuse existing approval and assessment records as process evidence, but do
not infer product completion from them. Existing format-2 and unmarked plans remain valid;
only new or materially revised plans use the baseline-reuse contract.

## What Changes

- WIP becomes a current product snapshot followed by process evidence, replacing stale
  narrative instead of accumulating it.
- Plans classify delivery items as direct reuse, extraction then reuse, target-owned work,
  new behavior, or deferred cleanup.
- Workflow status renders the engineering snapshot first and scope-qualifies assessed and
  handed-off slices without promoting their parent feature to complete.
- Code checking applies the four bounded 0.3.2 corrections described above.
- Canonical prompts, docs, checkers, installer wrappers, bundled copies, regressions, and
  release notes remain synchronized.

## What Does Not Change

- A product or feature is complete only when product evidence says so.
- Required approvals and readiness checks still block implementation when applicable.
- High-assurance work still adds evidence for its actual risks.
- Production and test source remain free of Sarathi IDs used only for traceability.
- Existing ledgers remain the historical record.

## Implementation Sequence

1. Add generalized status, planning, WIP, checker, and renderer regressions.
2. Make the smallest canonical prompt, policy, checker, and renderer changes.
3. Mirror canonical files into the installable skill and generated stage-skill behavior.
4. Dogfood the status output against the authentication extraction case without placing
   project-specific policy in Sarathi.
5. Run focused tests, the full Python suite, browser layouts, formatting, skill validation,
   package checks, and source and packaged installer dry-runs.
6. Run separate verification and review passes and correct their findings.

## Verification

The change passes when ordinary test data is not mistaken for process metadata; explicit
lowercase or uppercase ID-shaped test names are still rejected; skip markers are reported
without creating a false mechanical failure; exact scan inputs work; existing plan formats
remain accepted; every new-format delivery classification belongs to a descriptive item;
the workflow page never turns slice evidence into feature completion; generalized
regressions pass; canonical and bundled bytes match; and all publication checks pass.

## Delivery

### Correct checking and status reporting

<!-- sarathi:delivery id="PR-SARATHI-STATUS" -->

Work Classification: reuse directly
Scope: Revise the existing checker, document, prompt, renderer, installer, and bundle paths.
Verification: Run the complete validation sequence and independent check and review.

## Traceability

| Delivery item | Machine ID | Evidence |
| --- | --- | --- |
| Correct checking and status reporting | PR-SARATHI-STATUS | focused regressions, full suite, dogfood output, independent assessment |

Work Scope: Slice/change
Ready To Implement: Yes
Plan Type: Implementation
