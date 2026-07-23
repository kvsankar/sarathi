# Document Locations, Names, And Review Records

Keep Sarathi records with the work they describe. Do not create `spec.md`, `design.md`,
`plan.md`, or review reports in the repository root unless the user or an established project
convention explicitly names that location.

## Choose The Document Area

Before creating or revising a document, resolve one documentation area in this order:

1. An explicit user path, repository convention, or existing governing document path.
2. The directory containing the parent spec, design, plan, or current work-item documents.
3. The closest established `docs/` directory for the feature, component, or work item.
4. `docs/` at the repository root when no more specific location can be inferred.

For Product/system scope, write controlling documents as `<document-area>/spec.md`,
`<document-area>/design.md`, and `<document-area>/plan.md`. For Feature/component or
Slice/change scope, use one descriptive lowercase-kebab `<work-slug>` for the same work in
every filename: `<document-area>/<work-slug>.spec.md`,
`<document-area>/<work-slug>.design.md`, and
`<document-area>/<work-slug>.plan.md`. Derive the slug from the feature or work-item name
(for example, `auth-signin`), not from a generic label or an arbitrary number. Thus a child
may live at `docs/work/auth/signin/auth-signin.spec.md`. Do not move or rename existing
documents merely to match this convention. Record the chosen repository-relative paths in WIP
and pass those exact paths to checkers rather than relying on their legacy root-file defaults.

When more than one candidate exists or the area is non-standard, record the renderer's
canonical paths in `.sdlc/artifact-paths.yaml`:

```yaml
canonical:
  spec: docs/features/auth/auth-signin.spec.md
  design: docs/features/auth/auth-signin.design.md
  plan: docs/features/auth/auth-signin.plan.md
```

Use its `children` mapping for work-item-specific paths when applicable. See
[workflow-status.md](workflow-status.md) for the full shape.

## Preserve Review Output

Every direct `/spec-review`, `/design-review`, `/plan-review`, and `/code-review` writes or
updates a Markdown report in `<document-area>/reviews/`. Product/system reports normally use
`spec-review.md`, `design-review.md`, `plan-review.md`, or `code-review.md`. Smaller-scope
reports use the document's work slug, such as `auth-signin.spec-review.md`; assessments use
`auth-signin.<stage>-assessment.md` with separate **Check Pass** and **Review Pass** sections.
For a child, use that child's document area, not a repository-wide review folder.

Each report states the target paths and revisions or hashes when available, scope, evidence
and commands, independence limits, findings ordered by impact, simplifications considered,
verdict, and open follow-ups. It is an evidence record, not approval or proof of stakeholder
feedback. Update the current report for the reviewed revision; link earlier reports when
history matters instead of duplicating their contents.
