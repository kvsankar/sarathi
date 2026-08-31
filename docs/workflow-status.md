# Workflow Status Visualization

Sarathi can render a repeatable, read-only HTML page showing how requirements connect to
working code and tests. The page helps people find and understand the work. It is not
an approval record, completion percentage, or substitute for checks and review.
Formal status responses follow [result-reporting.md](result-reporting.md): one
plain-language engineering result comes first, and internal document and approval states
are explained afterward.

## What The View Shows

- **Current result first**: `Status Result`, plain-language `Status Summary`, goal, working
  result, blockers, and next action from `.sdlc/wip.md`. Every completion claim names its
  exact scope.
- **Main documents**: whether the accepted product baseline and any separate design or plan
  exist, are ready, and have approval matching the current file.
- **Process details second**: current approvals, delivery results, and the next process
  problem. An approved plan with no implementation still shows as not implemented. The
  compact slice path does not require status generation or a second slice ledger.
- **Expandable work tree**: the product Spec/Design/Plan path remains visible. The current
  `WORK-` item opens by default; other work stays collapsed. Missing documents show as `Not
  yet done`.
- **Schedule and PRs in the tree**: each child-work row shows its one work-group label.
  Expanding that row shows its implementation PRs and their state. Opening its existing
  details reveals the expected result, review point, and conditions that stop or change the
  plan. PRs do not have group assignments.
- **Approval details on demand**: the compact parent-approval badge opens a dialog listing the
  requirements, design, and delivery-plan records. A stale row identifies the last approval,
  the approved and current hash prefixes, and the exact fresh approval gate needed; the page
  does not expand this detail by default.
- **Malformed-allocation warning**: ID-shaped `WORK-*` bullets that do not satisfy
  `WORK-AREA-NAME` remain visible in a repair warning but are excluded from valid
  allocation counts and workflow branches.
- **Results from checks and review**: work whose code checks and review passed can show what
  was learned and what happens next from its matching code-assessment record.

The renderer finds tracked and nonignored `spec.md`, `design.md`, and `plan.md`. If the
project stores them elsewhere or ignores them, record their paths under `artifact_paths` in
`.sdlc/process-decisions.yaml` as described in [document-locations.md](document-locations.md).

It finds child documents through `Parent Work Item: WORK-*` or a `WORK-*` ID in the first
heading. It understands compact plans that reuse earlier documents and remains compatible
with older marker fields.

It also reads:

- `Work Groups` in Breakdown plans;
- `.sdlc/approvals.yaml` and `.sdlc/gates.yaml`;
- `.sdlc/process-decisions.yaml` and historical `.sdlc/delivery-records.yaml` when present;
- `.sdlc/wip.md`; and
- optional `.sdlc/test-traceability.yaml`.

In a Git project it discovers documents through Git's tracked and nonignored file list, so it
does not recurse through ignored dependencies, caches, build output, disposable state, or
inaccessible ignored directories. Configured paths are read directly. A non-Git directory
uses a tolerant fallback scan that skips common generated directories and inaccessible paths.

## What Each Status Means

| Display state | Meaning |
| --- | --- |
| Approved | A local approval record matches the document path and current SHA-256. |
| Present | The document exists without a matching current approval record. |
| Approval out of date | The document changed after approval. Review and approve the current version. |
| Not yet done | No document was found for that stage. |
| Documents started | A child spec or design exists, but no child plan was found. |
| Detailed plan found | A parent `WORK-` item has a child Implementation plan. |
| PRs planned | A child plan declares PR slices without linked executable tests. |
| Tests linked | At least one child `PR-` has entries in the test-link file. |
| Code checks and review passed | Historical display only: an existing `code_assessment` entry matches the current plan and records `Pass`. New work keeps this result in its assessment report and WIP position instead. |
| Approved for the next integration step | A matching `code_slice.approved` record approves the child plan for the next integration step. It does not complete its parent feature. |
| Child work reviewed or approved for the next integration step | Every discovered child change passed its code assessment or was approved for the next integration step. This does not mean the parent feature is complete. |
| No detailed plan yet | A parent `WORK-` item has no child Implementation plan. |
| Group closed | Historical display only: an existing checkpoint matches the current plan and group membership. New work records the combined result in its assessment report and WIP position. |
| In progress | The group is active or at least one member has implementation work. |
| Not started | No member has implementation work and the group is not active. |

The page uses three simple symbols. A green check means a document is approved, a code
change passed its checks and review, a change was approved for the next integration step, or
a work-group checkpoint closed after its required feedback, integration, and parent-document
decisions. It does not mean the whole feature is complete. An amber dot means work or
supporting records exist. A gray circle means not started. Linked tests alone remain amber
until the code assessment passes.

`WORK-*` is an exceptional Breakdown-plan assignment, not a document type. Follow
[work-decomposition.md](work-decomposition.md). Missing child spec/design nodes are not
expected when a compact plan safely proceeds directly to code.

`Tests linked` does not mean complete, correct, merged, deployed, or independently
verified. WIP statuses are shown only as project-authored claims. The renderer never infers
completion from source-file counts or ordinary Git activity.

Engineering state comes only from these exact `.sdlc/wip.md` fields. Missing fields display
`Not recorded`; the renderer does not infer product state from approvals or Git. A missing
or invalid status result displays `Cannot assess yet` and explains that no valid result was
recorded:

```text
Status Result: Ready | Ready after minor fixes | Not ready | Cannot assess yet
Status Summary: plain-language reason and consequence for the recorded status
Goal: end capability and target system
Working Result: what is done and where it works
Blockers: exact blockers, or none
Next Action: one executable action
```

Feedback and coordinated-work state follows the same evidence rule. The current loop comes
only from these exact `.sdlc/wip.md` fields:

```text
Expected Result: assumption, behavior, boundary, or risk under test
Feedback From: stakeholder, real system, environment, or objective evidence source
Feedback Status: received | requested | unavailable | not-applicable
Feedback Evidence: path, review, observation, or concise remaining-risk note
Current Work Group: exact WAVE-AREA-NAME, or none
Current Work: exact selected WORK-AREA-NAME, or none
Parallel Limit: positive integer or not-recorded
What Changed: concise evidence-backed result
Documents To Update: earlier documents that need updating and their paths
Stop Conditions: conditions that pause or cancel active parallel work
```

The display reads project-wide delivery choices from `.sdlc/process-decisions.yaml` and
change-specific choices from the current spec or plan. It reads copied choices from older
WIP notes only as a compatibility fallback.
If a machine-read value is malformed, the page names the file, field, invalid value, and
expected shape. Missing optional fields still display `Not recorded` without an error.

An explicit valid `WORK-*` in `Current Work` selects the branch opened as the current
focus. Older field names remain readable. The renderer does not guess progress, feedback,
or document changes from Git activity, approvals, test links, or passing commands.

A plan declares a work group only when near-term children need a shared feedback or integration
checkpoint:

```markdown
## Work Groups

### WAVE-AUTH-BOUNDARY
Order: 1
Expected Result: Validate the external identity boundary.
Members: WORK-AUTH-SIGNIN, WORK-AUTH-RECOVERY
Parallel Limit: 2
Review Point: Review sandbox and consumer contract evidence.
Stop Conditions: Stop later auth work if the public token contract changes.
```

`WAVE-*` uses the same two uppercase slug-token rule as delivery IDs. Group order is local to
a Breakdown plan. A scheduled `WORK-*` belongs to exactly one declared group; unscheduled work
has no group. A change can contain one or more `PR-*` entries, but PRs are not scheduled
independently. Later groups are provisional, not promises. Existing Implementation-plan group
declarations remain readable for older projects but are not the format for new plans.

Existing `.sdlc/delivery-records.yaml` files are read-only historical input for the renderer.
New delivery work does not create or update code-assessment or group-checkpoint ledgers. It
keeps the current result in the rolling assessment report and replacement WIP position.

The renderer and `check_plan.mjs` share the same plan-ID grammar. `MILE-*`, `WORK-*`, and
`PR-*` identifiers require exactly two uppercase slug tokens after the kind. One-token,
extra-token, lowercase, numeric-placeholder, and otherwise malformed candidates are not
valid allocations or delivery items.

Only `Pass` in an existing historical record shows a passing assessment in this legacy
projection. WIP text, test links, and Git or GitHub state do not mean the work passed or
finished.

“Approved for the next integration step” also requires a `code_slice.approved` record that
matches the current child Implementation plan. It does not mean the parent feature is done.

The renderer does not infer missing information from other state. Do not migrate or rewrite
old delivery records during ordinary work.

## Generate And Check

From the target project root, use the npm CLI:

```pwsh
sarathi-sdlc status
sarathi-sdlc status --check
sarathi-sdlc status --write
```

The first command prints the recorded status without writing. `--check` compares existing
HTML with current inputs and exits nonzero when it is stale. `--write` generates the status
page and linked process guide. With a project-local checker, use the same explicit modes:

```pwsh
node checkers/render_workflow_status.mjs . --check
node checkers/render_workflow_status.mjs . --write
```

The output is a standalone LF UTF-8 HTML file with embedded CSS, JavaScript, and a normalized
JSON model. It contains no clock value, random identifier, network dependency, or external
asset. The page does not expose source hashes or a provenance table. The command also publishes the static process guide as
`docs/sarathi-process.html`; the status page and guide link to each other. Identical source
content and paths produce identical output bytes, with the published guide normalized to LF.

The renderer finds the guide beside its installed or source checker bundle. A standalone
project-local checker without that companion file can name it explicitly:

```pwsh
node checkers/render_workflow_status.mjs . --write --output docs/sdlc-status.html --guide-source <sarathi>/docs/sarathi.html
```

## Maintenance

Regenerate the page explicitly when a published status view is needed. CI may use `--check`
to reject a stale status page or static guide. Ordinary status queries and PR completion do
not write it. Do not hand-edit generated HTML; change the source documents, guide source, or
renderer instead.

The canonical repository also runs responsive browser checks for the status page and
process guide:

```pwsh
npm ci
npx playwright install chromium
npm run test:layout
```
