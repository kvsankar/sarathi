# Workflow Status Visualization

Sarathi can render a deterministic, read-only HTML snapshot of how far a workflow has
expanded from parent intent into implementation evidence. The page is a navigation and
visibility aid. It is not a governing artifact, approval ledger, completion percentage, or
substitute for verification and review.

## What The View Shows

- **Artifact tree trunk**: canonical product spec, design, and plan presence, readiness, and
  hash-current approval attestations.
- **Executive summary**: the current allocation and product-to-child breadcrumb, current
  stage, next gate, implementation evidence, and the most immediate artifact gap. This is
  orientation, not a percentage-complete estimate.
- **Current learning loop**: the explicit learning target, feedback state, active wave,
  WIP limit, active slices, invalidation result, ancestor impact, and stop/replan triggers
  recorded in `.sdlc/wip.md`. Missing fields display as `Not recorded`.
- **Progressively disclosed workflow tree**: the product Spec/Design/Plan trunk remains
  visible, the current `WORK-` allocation opens by default, and other allocations stay
  collapsed until requested. Each expanded branch uses the same Spec/Design/Plan/Code
  backgrounds and Product/Feature/Slice level tags as the static process guide. Missing
  artifacts remain explicit `Not yet done` nodes.
- **Malformed-allocation warning**: ID-shaped `WORK-*` bullets that do not satisfy
  `WORK-AREA-NAME` remain visible in a repair warning but are excluded from valid
  allocation counts and workflow branches.
- **Assessed learning evidence**: a completed branch can disclose the learning and
  adaptation record attached to its hash-current passing code assessment.
- **Provenance**: relative source paths and SHA-256 prefixes used for the snapshot.

The renderer discovers canonical `spec.md`, `design.md`, and `plan.md` files; child specs,
designs, and plans linked by a plain `Parent Work Item: WORK-*` field or a `WORK-*` ID in
the first heading; `.sdlc/approvals.yaml`; `.sdlc/code-assessments.yaml`; `.sdlc/wip.md`;
and `.sdlc/test-traceability.yaml`. It ignores common dependency, cache, and VCS
directories.

## Evidence Semantics

| Display state | Meaning |
| --- | --- |
| Approved | A local approval record matches the artifact path and current SHA-256. |
| Present | The artifact exists without a matching current approval record. |
| Approval stale | An approval exists for the path, but not for the current bytes. |
| Not yet done | No canonical artifact was discovered for that stage. |
| Artifacts started | A child spec or design exists, but no child plan was discovered. |
| Plan expanded | A parent `WORK-` item has a child implementation plan. |
| PRs planned | A child plan declares PR slices without mapped executable-test entries. |
| Evidence mapped | At least one child `PR-` has entries in test traceability. |
| Assessed | A hash-current `.sdlc/code-assessments.yaml` entry records a `Pass` verdict for the child plan and `WORK-*` item. |
| Completed | A hash-current `code_slice.approved` record attests the child plan as an approved slice handoff. |
| Not yet decomposed | A parent `WORK-` item has no discovered child implementation plan. |

The visual status grammar is deliberately small: a green check means hash-current artifact
approval, passing code assessment, or approved code-slice handoff; an amber dot means work
or evidence is present but not complete; and a gray circle means not started. A branch with
mapped tests remains amber until a governing assessment establishes a stronger state.

`WORK-*` is an allocation in the parent Breakdown plan, not an artifact type. Follow
[work-decomposition.md](work-decomposition.md): the allocation names a child scope, and the
child's Spec/Design/Plan/Code artifacts retain that child level even when they implement
ancestor obligations. The status renderer shows that complete expected chain for every real
allocation, linking discovered artifacts and leaving missing ones visibly blank.

`Evidence mapped` does not mean complete, correct, merged, deployed, or independently
verified. WIP statuses are shown only as project-authored claims. The renderer never infers
completion from source-file counts or ordinary Git activity.

Learning state follows the same evidence rule. The current loop comes only from these exact
`.sdlc/wip.md` fields:

```text
Learning Target: assumption, behavior, boundary, or risk under test
Feedback Target: stakeholder, real system, environment, or objective evidence source
Feedback Status: received | requested | unavailable | not-applicable
Feedback Evidence: path, review, observation, or concise residual-risk note
Active Learning Wave: wave name or none
WIP Limit: positive integer or not-recorded
Active Slices: comma-separated WORK-* or PR-* IDs, or none
Invalidation Result: concise evidence-backed result
Ancestor Impact: spec/design/plan/code/process outcome and affected paths
Stop Or Replan Triggers: conditions that pause or cancel active sibling work
```

An explicit valid `WORK-*` or `PR-*` in `Active Slices` selects the branch opened as the
current focus. A `PR-*` selects its owning `WORK-*` branch. The renderer does not infer an
active wave, active slice, feedback result, or ancestor decision from Git activity,
approvals, mapped tests, or passing commands.

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
or GitHub state do not imply assessment or completion. `Completed` additionally requires a
hash-current `code_slice.approved` record whose artifact is the child implementation plan.
Legacy passing assessment records without a `learning` mapping remain valid and display
`Not recorded in assessment`; the renderer does not backfill a story from unrelated state.

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

Regenerate the page after accepted artifact, approval, decomposition, WIP, learning,
feedback, assessment, traceability, or process-guide changes. CI may use `--check` to reject
a stale status page or static guide. Do not hand-edit generated HTML; change governing
artifacts, the guide source, or the renderer instead.

The canonical repository also runs responsive browser checks for the status page and
process guide:

```pwsh
npm ci
npx playwright install chromium
npm run test:layout
```
