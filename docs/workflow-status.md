# Workflow Status Visualization

Sarathi can render a deterministic, read-only HTML snapshot of how far a workflow has
expanded from parent intent into implementation evidence. The page is a navigation and
visibility aid. It is not a governing artifact, approval ledger, completion percentage, or
substitute for verification and review.

## What The View Shows

- **Artifact gates**: canonical spec, design, and plan presence, readiness, and hash-current
  approval attestations.
- **Expansion summary**: parent-plan `WORK-` allocations, allocations with child
  implementation plans, discovered `PR-` slices, and PR slices with mapped executable-test
  evidence.
- **Known-unknown expansion map**: one row per parent-plan `WORK-` allocation, progressing
  through its child scope and plan, PR slices, and implementation evidence. Missing cells remain
  explicitly `Not yet decomposed` or `Not yet known`.
- **Provenance**: relative source paths and SHA-256 prefixes used for the snapshot.

The renderer discovers canonical `spec.md`, `design.md`, and `plan.md` files; child plans
that declare `Plan Type: Implementation`; `.sdlc/approvals.yaml`; `.sdlc/wip.md`; and
`.sdlc/test-traceability.yaml`. It ignores common dependency, cache, and VCS directories.

## Evidence Semantics

| Display state | Meaning |
| --- | --- |
| Approved | A local approval record matches the artifact path and current SHA-256. |
| Present | The artifact exists without a matching current approval record. |
| Approval stale | An approval exists for the path, but not for the current bytes. |
| Not yet done | No canonical artifact was discovered for that stage. |
| Plan expanded | A parent `WORK-` item has a child implementation plan. |
| Evidence mapped | At least one child `PR-` has entries in test traceability. |
| Not yet decomposed | A parent `WORK-` item has no discovered child implementation plan. |

`WORK-*` is an allocation in the parent Breakdown plan, not an artifact type. Follow
[work-decomposition.md](work-decomposition.md): the allocation names a child scope, and the
child's Spec/Design/Plan/Code artifacts retain that child level even when they implement
ancestor obligations. The status renderer currently links each allocation to its discovered
child Implementation plan and PR evidence; the static process guide shows the complete
artifact chain.

`Evidence mapped` does not mean complete, correct, merged, deployed, or independently
verified. WIP statuses are shown only as project-authored claims. The renderer never infers
completion from source-file counts or ordinary Git activity.

## Generate And Check

From the target project root, run the repository checker copy:

```pwsh
python checkers/render_workflow_status.py . --output docs/sdlc-status.html
python checkers/render_workflow_status.py . --output docs/sdlc-status.html --check
```

When using an installed skill without project-local checkers, run the same script from the
installed `sarathi/checkers` directory and pass the target project root explicitly.

The output is a standalone LF UTF-8 HTML file with embedded CSS, JavaScript, and a normalized
JSON snapshot. It contains no clock value, random identifier, network dependency, or external
asset. The command also publishes the static process guide as
`docs/sarathi-process.html`; the status page and guide link to each other. Identical source
content and paths produce identical output bytes, with the published guide normalized to LF.

The renderer finds the guide beside its installed or source checker bundle. A standalone
project-local checker without that companion file can name it explicitly:

```pwsh
python checkers/render_workflow_status.py . --output docs/sdlc-status.html --guide-source <sarathi>/docs/sarathi.html
```

## Maintenance

Regenerate the page after accepted artifact, approval, decomposition, WIP, traceability, or
process-guide changes. CI may use `--check` to reject a stale status page or static guide.
Do not hand-edit generated HTML; change governing artifacts, the guide source, or the
renderer instead.
