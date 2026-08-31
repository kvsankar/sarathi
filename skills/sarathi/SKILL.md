---
name: sarathi
description: Use Sarathi for managed software delivery with specifications, designs, plans, approvals, checks, reviews, and test evidence. Do not use it for ordinary coding requests.
---

# sarathi

Sarathi helps an agent turn accepted product intent into the smallest safe working change. It
keeps review-sized Git boundaries, meaningful checks, independent assessment, resumability,
and protected gates without requiring a document chain for every change.

```text
accepted baseline + focused delta -> working change -> checks and review -> feedback -> adapt
```

## Commands

A stage is `spec`, `design`, `plan`, or `code`. An action is `create`, `verify`, `review`, or
`assess`. Together they name a command such as `code-assess`. `workflow-status` reports
current status without writing unless explicitly asked.

Installed command skills use `$sarathi-<stage>-<action>`. Only this router may be selected
implicitly. An ordinary coding request does not invoke Sarathi. Without an explicit command,
choose one canonical `prompts/<stage>-<action>.prompt.md`; do not load every prompt.

Run bundled `scripts/check_update.mjs` at invocation start. Never update or install without
approval. Respect `SARATHI_UPDATE_CHECK=0`; missing bundle files mean an incomplete install.

## Start From The Right Authority

Read repository instructions, `.sdlc/wip.md`, and `.sdlc/process-decisions.yaml` when present.
Check important WIP claims against the named documents, Git state, tests, and assessment.

For an intentional observable behavior or protected-contract change, create one focused
slice delta. It references the accepted baseline and applicable product, authority, privacy,
safety, migration, and other protected constraints. The slice controls the intended change;
the referenced baseline and constraints remain authoritative. Do not create a baseline
registry or slice-index ledger.

A compact slice may contain observable behavior, exclusions, affected interfaces or state,
constraints, technical approach, planned delivery unit, checks, rollback, and review point.
Create a separate design or plan only when complexity or risk makes independent review
materially easier. Defect repairs, refactors, and mechanical work need no slice unless they
intentionally change observable behavior or a protected contract.

Use `docs/project-entry.md` when entering an unfamiliar repository,
`docs/requirements-model.md` for baseline and delta rules, and
`docs/artifact-contracts.md` for exact document content. Choose approval policy separately
with `docs/approval-gates.md`. Explicit YOLO may authorize eligible internal approvals and
end-to-end continuation, but it never crosses the protected actions listed there.

## Keep Delivery Reviewable

One slice normally maps to one planned delivery unit. Here, PR means that planned unit: it
may be a pull request or an exact commit/range in a direct-to-main workflow. Internal
implementation commits, test-first chronology, and review-fix amendments do not create more
Sarathi boundaries.

When reviewability, risk, migration, dependency feedback, or learning needs several delivery
units, keep one controlling slice delta and name the boundaries and dependencies in its
plan. Use a Breakdown plan only when broad work must first be split into independently useful
child outcomes. Splitting work does not require a new spec or design for every child. Follow
`docs/work-decomposition.md`.

At every genuine delivery boundary:

1. Run the focused and affected checks assigned to that unit.
2. Record its exact commit or base/head range.
3. Assess that exact change with a fresh independent reviewer when available.
4. Correct blocking findings and rerun only affected checks and focused review.
5. Replace `.sdlc/wip.md` with one short current position.

Passing work continues automatically when the next unit is safe and authorized. A boundary
does not trigger product-spec rewrites, roadmap or status regeneration, repeated approval
work, unrelated process updates, or an accumulating ledger.

## Test And Evidence Rules

Behavior-changing code uses Red-Green-Refactor: observe the smallest meaningful test fail
for the expected reason, make the minimum production-quality change that passes, then improve
the code while affected tests stay green. When a failing automated test is not useful, state
why and run the closest repeatable check.

Code verification names exactly one authority: `--slice <path>`, `--plan <path>`, or
`--baseline` for conforming maintenance that changes neither observable behavior nor a
protected contract.

Keep process IDs in documents and external records, not production or test source. Test names
describe behavior. Run real or official external interfaces when they are the changed
boundary; disclose what a test double leaves untested. Automatic checks do not prove correct
intent, meaningful tests, stakeholder feedback, merge state, or human approval. Never invent
execution, stakeholder, or real-system evidence.

Apply `docs/simplicity-first.md`: keep process records out of product architecture, start
with the smallest direct implementation, reuse existing tests, and avoid general machinery
without a current need. Do not use line-count or PR-count targets.

## Stop And Resume

Stop affected work for a failed assessment that cannot be corrected, invalidated accepted
intent, required product decision or feedback, a genuine blocker, or a protected authority,
privacy, safety, migration, external-effect, release, deployment, credential, or production
boundary. Live production deployment or checks always require explicit approval.

Keep `.sdlc/wip.md` as a replacement bookmark, not history. It names the active slice (or
`none` for baseline-only maintenance), optional plan, last completed delivery unit and exact Git identity, current unit, next action,
blockers, next review point, latest checks, and any active stop condition. Update it after a
delivery assessment, for a blocker or invalidated document, before handoff with unfinished
work, or when switching independently resumable work. Do not update it after every test,
internal commit, fix, or unchanged check. Follow `docs/work-in-progress.md`.

## Product Reconciliation

Reconcile accumulated deltas only through an approved product-intent decision at a meaningful
release, feature-family, interdependency, contradiction, or material-staleness boundary.
Resolve supersession, temporary prototype behavior, and accidental implementation details.
Never reconcile after a fixed slice count. A slice becomes historical only after an approved
coherent replacement baseline links it.

## Reviews And Reporting

Run repeatable checks in the active context. Use a fresh reviewer for judgment when the host
supports it, and give re-reviewers earlier findings. Treat suggested remedies as advice.
Never run a fourth review automatically; after round three, eligible automatic approval or
the user decides. If no fresh reviewer is available, disclose that limitation. Follow
`docs/review-verification-checklist.md` and `docs/result-reporting.md`.

Use `docs/progressive-disclosure.md` to load only references triggered by the selected
command or risk. Use bundled `checkers/check_*.mjs` with Node and preserve raw command
evidence.
