# Workflow Status Visualization

Sarathi can render a repeatable, read-only HTML page showing how parent intent has expanded
into working code and tests. The page helps people find and understand the work. It is not
an approval record, completion percentage, or substitute for checks and review.

## What The View Shows

- **Engineering snapshot first**: the goal, working and reusable capability, current
  increment, remaining shared and target-owned work, deferred work, coding blockers, and
  next action from `.sdlc/wip.md`. Every completion claim names its exact scope.
- **Document tree trunk**: product spec, design, and plan presence, readiness, and whether
  each approval matches the current file.
- **Process state second**: current document approvals, delivery evidence, and the most
  immediate process gap. An approved plan with no implementation remains visibly
  unimplemented in the engineering snapshot.
- **Progressively disclosed workflow tree**: the product Spec/Design/Plan trunk remains
  visible, the current `WORK-` allocation opens by default, and other allocations stay
  collapsed until requested. Each expanded branch uses the same Spec/Design/Plan/Code
  backgrounds and Product/Feature/Slice level tags as the static process guide. Missing
  documents remain explicit `Not yet done` nodes.
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
- **Assessed learning evidence**: an assessed branch can show the learning and next
  decisions recorded in a passing code assessment that matches the current plan.

The renderer discovers canonical `spec.md`, `design.md`, and `plan.md` files; use
`.sdlc/artifact-paths.yaml` when [document-locations.md](document-locations.md) selected a
non-standard or ambiguous area. Child specs,
designs, and plans linked by a plain `Parent Work Item: WORK-*` field or a `WORK-*` ID in
the first heading. A compact implementation plan that reuses approved earlier documents is
shown without false missing-spec/design nodes; older marker fields remain readable. It also reads
Breakdown-plan `Work Groups` sections; `.sdlc/approvals.yaml`; `.sdlc/gates.yaml`;
`.sdlc/process-decisions.yaml`;
`.sdlc/code-assessments.yaml`; `.sdlc/wave-checkpoints.yaml`; `.sdlc/wip.md`; and
`.sdlc/test-traceability.yaml` when a project voluntarily maintains one. It ignores common
dependency, cache, and VCS directories.

## What Each Status Means

| Display state | Meaning |
| --- | --- |
| Approved | A local approval record matches the document path and current SHA-256. |
| Present | The document exists without a matching current approval record. |
| Approval stale | An approval exists for the path, but not for the current bytes. Select the parent-approval badge for the affected record, hash prefixes, and required fresh approval. |
| Not yet done | No document was found for that stage. |
| Documents started | A child spec or design exists, but no child plan was found. |
| Compact plan | Approved earlier documents plus one implementation plan replace unnecessary child spec/design files. |
| Child plan found | A parent `WORK-` item has a child implementation plan. |
| PRs planned | A child plan declares PR slices without linked executable tests. |
| Tests linked | At least one child `PR-` has entries in the test-link file. |
| Assessed | A `.sdlc/code-assessments.yaml` entry matching the current plan records `Pass` for the child plan and `WORK-*` item. |
| Slice handed off | A matching `code_slice.approved` record approves the child plan as a slice handoff. It does not complete its parent feature. |
| Children assessed | Every discovered child slice is assessed or handed off; the parent feature has no inferred completion state. |
| Not yet broken down | A parent `WORK-` item has no child implementation plan. |
| Group closed | A checkpoint matches the current plan, group ID, and exact member list. |
| Group in progress | The group is explicitly active or at least one member has implementation evidence. |
| Group not started | No member has implementation evidence and the group is not active. |

The visual status grammar is deliberately small: a green check means an approval matches
the current file, a code assessment passed, a code slice was handed off, or a work-group
review point was closed. It does not mean the enclosing feature is complete. An amber dot
means work or evidence is present, and a gray circle means not started. A branch with linked
tests remains amber until a code assessment establishes a stronger state.

`WORK-*` is an exceptional Breakdown-plan assignment, not a document type. Follow
[work-decomposition.md](work-decomposition.md). Missing child spec/design nodes are not
expected when a compact plan safely proceeds directly to code.

`Tests linked` does not mean complete, correct, merged, deployed, or independently
verified. WIP statuses are shown only as project-authored claims. The renderer never infers
completion from source-file counts or ordinary Git activity.

Engineering state comes only from these exact `.sdlc/wip.md` fields. Missing fields display
`Not recorded`; the renderer does not infer product state from approvals or Git:

```text
Goal: end capability and target system
Working Today: capability and the system where it currently works
Reusable Today: shared code usable without extraction
Current Increment: exact bounded slice and state
Remaining Shared Work: extraction or shared refactoring still required
Target-Owned Work: target-specific implementation still required
Deferred: non-blocking cleanup or migration
Before Coding: exact blockers, or none
Next Action: one executable action
```

Learning and process state follows the same evidence rule. The current loop comes only from
these exact `.sdlc/wip.md` fields:

```text
Expected Result: assumption, behavior, boundary, or risk under test
Delivery Assurance Profile: Lean | Standard | High-assurance | unknown
Approval Policy: Human checkpoints | Automatic eligible gates | unknown
Work Outcome: Product increment | Decision/evidence | unknown
Extra Checks: comma-separated checks or none
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

An explicit valid `WORK-*` in `Current Work` selects the branch opened as the current
focus. Older field names remain readable. The renderer does not infer an
active group, active change, feedback result, or
parent-document decision from Git activity, approvals, mapped tests, or passing commands.

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

A completed group is recorded separately from full code assessment or human approval:

```yaml
version: 1
checkpoints:
  - id: CHECK-WAVE-AUTH-BOUNDARY
    wave: WAVE-AUTH-BOUNDARY
    plan:
      path: docs/plan.md
      sha256: "<current plan sha256>"
    members:
      - WORK-AUTH-SIGNIN
      - WORK-AUTH-RECOVERY
    status: completed
    completed_at: "2026-07-16T12:00:00Z"
    learning:
      target: Validate the external identity boundary.
      feedback_target: Security reviewer and provider sandbox.
      feedback_status: received
      feedback_evidence: docs/reviews/auth-boundary.md
      invalidation_result: The token contract held.
      ancestor_impact:
        spec: "no-change: accepted behavior remains correct"
        design: "no-change: boundary design remains valid"
        plan: "no-change: the next group may begin"
      stop_or_replan: Stop if the provider contract changes.
```

The renderer excludes a stale or member-mismatched checkpoint from completion. A checkpoint
closes only its group; it does not mark a member change assessed, merged, approved, or ready for
release.

The renderer and `check_plan.py` share the same plan-ID grammar. `MILE-*`, `WORK-*`, and
`PR-*` identifiers require exactly two uppercase slug tokens after the kind. One-token,
extra-token, lowercase, numeric-placeholder, and otherwise malformed candidates are not
valid allocations or delivery items.

A passing code assessment can be recorded without conflating it with human approval:

```yaml
version: 1
assessments:
  - id: ASSESS-CODE-AUTH-SIGNIN
    work_item: WORK-AUTH-SIGNIN
    plan:
      path: docs/plans/work_auth_signin.md
      sha256: "<current child-plan sha256>"
    verdict: Pass
    assessed_at: "2026-07-15T12:00:00Z"
    learning:
      target: Validate the sign-in boundary with a production-like identity provider.
      feedback_target: Security reviewer and identity-provider sandbox.
      feedback_status: received
      feedback_evidence: docs/reviews/auth-signin.md
      invalidation_result: The token-refresh assumption held; retry timing changed.
      ancestor_impact:
        spec: "no-change: accepted behavior remains correct"
        design: "revision-proposed: document the observed retry timing"
        plan: "no-change: remaining allocations are unaffected"
        code_integration: "no-change: contract suite covers the shared boundary"
        process: "no-change: no reusable process gap was found"
      stop_or_replan: Pause sibling auth work if the provider contract changes.
```

Only `Pass` is green. `Pass-with-fixes`, stale plan hashes, WIP prose, mapped tests, and Git
or GitHub state do not imply assessment or completion. `Slice handed off` additionally
requires a hash-current `code_slice.approved` record whose artifact is the child
implementation plan; it does not complete its parent feature.
Legacy passing assessment records without a `learning` mapping remain valid and display
`Not recorded in assessment`; the renderer does not invent a story from unrelated state.

## Generate And Check

From the target project root, run the repository checker copy:

```pwsh
python checkers/render_workflow_status.py . --output docs/sdlc-status.html
python checkers/render_workflow_status.py . --output docs/sdlc-status.html --check
```

When using an installed skill without project-local checkers, run the same script from the
installed `sarathi/checkers` directory and pass the target project root explicitly.

The output is a standalone LF UTF-8 HTML file with embedded CSS, JavaScript, and a normalized
JSON model. It contains no clock value, random identifier, network dependency, or external
asset. The page does not expose source hashes or a provenance table. The command also publishes the static process guide as
`docs/sarathi-process.html`; the status page and guide link to each other. Identical source
content and paths produce identical output bytes, with the published guide normalized to LF.

The renderer finds the guide beside its installed or source checker bundle. A standalone
project-local checker without that companion file can name it explicitly:

```pwsh
python checkers/render_workflow_status.py . --output docs/sdlc-status.html --guide-source <sarathi>/docs/sarathi.html
```

## Maintenance

Regenerate the page after accepted document, approval, breakdown, WIP, learning, feedback,
parallel-work checkpoint, assessment, test-link, or process-guide changes. CI may use
`--check` to reject a stale status page or static guide. Do not hand-edit generated HTML;
change the source documents, the guide source, or the renderer instead.

The canonical repository also runs responsive browser checks for the status page and
process guide:

```pwsh
npm ci
npx playwright install chromium
npm run test:layout
```
