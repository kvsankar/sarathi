# Document Locations, Names, And Review Records

Keep Sarathi records with the work they describe. Do not create `spec.md`, `design.md`,
`plan.md`, or review reports in the repository root unless the user or an established project
convention explicitly names that location.

## Document Classes

Treat every delivery document as one of four classes and give each its discipline:

- **Intent** (specs, designs, plans, slices): durable and reviewed; expresses what to build
  and how; never trimmed for convenience.
- **Knowledge** (integration gotchas, research notes): durable learning about the outside
  world; append as it is learned.
- **Orienting status** (WIP, progress notes): minimal and current-state only; replace rather
  than append. It may be stale and must never gate an action. Superseded narrative belongs
  to version-control history, not to the file.
- **Evidence** (review reports, check results, approval records): bound to the exact
  revision it judged and validated when a decision uses it. Stale evidence is missing
  evidence, not an approximation.

The dividing rule: anything a decision gates on must be checked evidence, not prose;
anything that merely orients may be minimal, stale-tolerant prose. The real status is
always the code and its checked evidence.

## Choose The Document Area

Before creating or revising a document, resolve one documentation area in this order:

1. An explicit user path, repository convention, or existing governing document path.
2. The directory containing the parent spec, design, plan, or current work-item documents.
3. The closest established `docs/` directory for the feature, component, or work item.
4. `docs/` at the repository root when no more specific location can be inferred.

For Product/system scope, write controlling documents as `<document-area>/spec.md`,
`<document-area>/design.md`, and `<document-area>/plan.md`. Use
`<document-area>/<work-slug>.spec.md` for a separate Feature/component spec and
`<document-area>/<work-slug>.slice.md` for a focused delta. Optional designs and plans use
`<document-area>/<work-slug>.design.md` and `<document-area>/<work-slug>.plan.md`. Derive the slug from the feature or work-item name
(for example, `auth-signin`), not from a generic label or an arbitrary number. Thus a child
may live at `docs/work/auth/signin/auth-signin.spec.md`. Do not move or rename existing
documents merely to match this convention. Record the chosen repository-relative paths in WIP
and pass those exact paths to checkers rather than relying on their legacy root-file defaults.

When more than one candidate exists or the area is non-standard, record the renderer's
canonical paths under `artifact_paths` in `.sdlc/process-decisions.yaml`:

```yaml
artifact_paths:
  canonical:
    spec: docs/features/auth/auth-signin.spec.md
    design: docs/features/auth/auth-signin.design.md
    plan: docs/features/auth/auth-signin.plan.md
```

Use its `children` mapping for work-item-specific paths when applicable. See
[workflow-status.md](workflow-status.md) for the full shape.

## Preserve Review Output

Every direct `spec-review`, `design-review`, `plan-review`, and `code-review` writes or
updates a Markdown report in `<document-area>/reviews/`. Product/system reports normally use
`spec-review.md`, `design-review.md`, `plan-review.md`, or `code-review.md`. Smaller-scope
reports use the document's work slug, such as `auth-signin.spec-review.md`; assessments use
`auth-signin.<stage>-assessment.md` with separate **Check Pass** and **Review Pass** sections.
For a child, use that child's document area, not a repository-wide review folder.

When a report enters a correction and re-review loop, it names its assessment target, target
state (`active | accepted | abandoned`), current review round, and concise earlier-round
conclusions. Findings use one lifecycle: `open | claimed-fixed | closed`. A passing one-off
review does not need empty lifecycle metadata. A code target names the exact code change being
reviewed, even when several changes share one plan.

Choose report boundaries by coherent review units, not by approval policy, pauses, or whether
the request spans the full delivery path. A review unit is work that one reviewer can safely
understand and judge together. Small work may use one delivery assessment across several
stages. Larger work uses separate reports by stage, child work item, or code change when its
size, risk, or independence makes that easier to review.

A cross-stage Product/system report uses `delivery-assessment.md`; smaller work uses
`<work-slug>.delivery-assessment.md`. Stage-specific reports keep the names above. Each target
subsection keeps its own **Check Pass**, **Review Pass**, internal verdict, current review
round, and findings with the lifecycle above. Correction rounds update the same report for
that review unit; they never create separate closure reports. Put the current overall result
and active target at the top of a multi-target report. Point WIP to the current report and
name only the target and next engineering action there; the report is authoritative for
round state.

For code, keep one rolling `<work-slug>.code-assessment.md` per controlling slice or plan.
Give each planned delivery unit a compact section with its reviewed commit or range, result, short check
references, reviewer, and active findings. Update that section after reviewed fixes. At each
declared integration review point, add one section for cross-PR behavior, integration checks,
feedback, combined risk, and readiness to continue. Do not copy complete logs or add a
per-unit hash ledger. Git history carries older report text; the current report stays concise.
When a separate report's target is fully superseded — the revision it judged is no longer
part of any current candidate — move that report to a `reviews/archive/` folder instead of
leaving it beside current evidence. The archive is historical record: exclude it from
routine search and never cite it as current evidence. Agents search rather than read by
default, so a stale report at a current-looking path is eventually quoted as current.

For baseline-only defect repair, refactor, or mechanical work, derive `<task-slug>` from the
requested change and keep one `<task-slug>.code-assessment.md` in the chosen document area's
`reviews/` directory. This names the review unit without creating a slice or plan.

Each report follows [result-reporting.md](result-reporting.md) and states:

- one plain-language result;
- important findings and practical next actions;
- checks run and what they could not prove;
- the reviewed files, their revision or hash when available, scope, and commands;
- whether the reviewer was independent;
- simplifications considered and unresolved items; and
- each assessed target's exact internal verdict.

A stage summary explains the combined state in plain language. Do not mark the stage ready or
start the next stage while any required target is not ready for its next step.

A report is not approval or proof of stakeholder feedback. Update the current target's report
across its correction revisions and review rounds. Link genuinely older targets when history
matters instead of copying them.
