# Workflow Status Visualization

Sarathi can render a repeatable, read-only HTML page showing how parent intent has expanded
into working code and tests. The page helps people find and understand the work. It is not
an approval record, completion percentage, or substitute for checks and review.

## What The View Shows

- **Document tree trunk**: product spec, design, and plan presence, readiness, and whether
  each approval matches the current file.
- **Executive summary**: the current allocation and product-to-child breadcrumb, current
  stage, next gate, implementation evidence, and the most immediate document gap. This is
  orientation, not a percentage-complete estimate.
- **Progressively disclosed workflow tree**: the product Spec/Design/Plan trunk remains
  visible, the current `WORK-` allocation opens by default, and other allocations stay
  collapsed until requested. Each expanded branch uses the same Spec/Design/Plan/Code
  backgrounds and Product/Feature/Slice level tags as the static process guide. Missing
  documents remain explicit `Not yet done` nodes.
- **Schedule and PRs in the tree**: each child-work row shows its one `Wave N` label.
  Expanding that row shows its implementation PRs and their state. Opening its existing
  details reveals the wave purpose, review point, and conditions that stop or change the
  plan. PRs do not have wave assignments.
- **Approval details on demand**: the compact parent-approval badge opens a dialog listing the
  requirements, design, and delivery-plan records. A stale row identifies the last approval,
  the approved and current hash prefixes, and the exact fresh approval gate needed; the page
  does not expand this detail by default.
- **Malformed-allocation warning**: ID-shaped `WORK-*` bullets that do not satisfy
  `WORK-AREA-NAME` remain visible in a repair warning but are excluded from valid
  allocation counts and workflow branches.
- **Assessed learning evidence**: a completed branch can show the learning and next
  decisions recorded in a passing code assessment that matches the current plan.

The renderer discovers canonical `spec.md`, `design.md`, and `plan.md` files; child specs,
designs, and plans linked by a plain `Parent Work Item: WORK-*` field or a `WORK-*` ID in
the first heading. A Lean Change Record is discovered through the child plan path and shown
as one compact record. It also reads Breakdown-plan `Waves` sections; `.sdlc/approvals.yaml`;
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
| Lean record found | An eligible Lean child has one compact implementation plan instead of child spec/design files. |
| Child plan found | A parent `WORK-` item has a child implementation plan. |
| PRs planned | A child plan declares PR slices without linked executable tests. |
| Tests linked | At least one child `PR-` has entries in the test-link file. |
| Assessed | A `.sdlc/code-assessments.yaml` entry matching the current plan records `Pass` for the child plan and `WORK-*` item. |
| Completed | A matching `code_slice.approved` record approves the child plan as a slice handoff. |
| Not yet broken down | A parent `WORK-` item has no child implementation plan. |
| Wave completed | A checkpoint matches the current plan, wave ID, and exact member list. |
| Wave in progress | The wave is explicitly active or at least one member has implementation evidence. |
| Wave not started | No member has implementation evidence and the wave is not active. |

The visual status grammar is deliberately small: a green check means an approval matches
the current file, a code assessment passed, or a code slice was approved; an amber dot means work
or evidence is present but not complete; and a gray circle means not started. A branch with
linked tests remains amber until a code assessment establishes a stronger state.

`WORK-*` is an assignment in the parent Breakdown plan, not a document type. Follow
[work-decomposition.md](work-decomposition.md): the allocation names a child scope, and the
child's Spec/Design/Plan/Code documents retain that child level even when they implement
parent obligations. The status renderer shows that expected chain for every real
assignment, linking found documents and leaving missing ones visibly blank.

`Tests linked` does not mean complete, correct, merged, deployed, or independently
verified. WIP statuses are shown only as project-authored claims. The renderer never infers
completion from source-file counts or ordinary Git activity.

Learning state follows the same evidence rule. The current loop comes only from these exact
`.sdlc/wip.md` fields:

```text
Learning Target: assumption, behavior, boundary, or risk under test
Delivery Profile: Lean | Standard | High-assurance | Exploratory | unknown
Assurance Modules: comma-separated module names or none
Feedback Target: stakeholder, real system, environment, or objective evidence source
Feedback Status: received | requested | unavailable | not-applicable
Feedback Evidence: path, review, observation, or concise remaining-risk note
Active Learning Wave: exact WAVE-AREA-NAME from the plan, or none when the selected work is not wave-scheduled
Active Work Item: exact selected WORK-AREA-NAME, or none
WIP Limit: positive integer or not-recorded
Active Slices: legacy optional detail; do not use it to invent a wave assignment
Invalidation Result: concise evidence-backed result
Ancestor Impact: spec/design/plan/code/process outcome and affected paths
Stop Or Replan Triggers: conditions that pause or cancel active sibling work
```

An explicit valid `WORK-*` in `Active Work Item` selects the branch opened as the current
focus. `Active Slices` remains readable for older files. The renderer does not infer an
active wave, active slice, feedback result, or
parent-document decision from Git activity, approvals, mapped tests, or passing commands.

A plan declares a wave only when near-term children need a shared feedback or integration
checkpoint:

```markdown
## Waves

### WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the external identity boundary.
Members: WORK-AUTH-SIGNIN, WORK-AUTH-RECOVERY
WIP Limit: 2
Feedback/Integration Checkpoint: Review sandbox and consumer contract evidence.
Stop/Replan Triggers: Stop later auth work if the public token contract changes.
```

`WAVE-*` uses the same two uppercase slug-token rule as delivery IDs. Wave order is local to
a Breakdown plan. A scheduled `WORK-*` belongs to exactly one declared wave; unscheduled work
has no wave. A slice can contain one or more `PR-*` entries, but PRs are not scheduled
independently. Later waves are provisional, not promises. Existing Implementation-plan wave
declarations remain readable for older projects but are not the format for new plans.

A completed wave is recorded separately from full code assessment or human approval:

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
        plan: "no-change: the next wave may begin"
      stop_or_replan: Stop if the provider contract changes.
```

The renderer excludes a stale or member-mismatched checkpoint from completion. A checkpoint
closes only its wave; it does not mark a member slice assessed, merged, approved, or ready for
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
or GitHub state do not imply assessment or completion. `Completed` additionally requires a
hash-current `code_slice.approved` record whose artifact is the child implementation plan.
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
wave-checkpoint, assessment, test-link, or process-guide changes. CI may use
`--check` to reject a stale status page or static guide. Do not hand-edit generated HTML;
change the source documents, the guide source, or the renderer instead.

The canonical repository also runs responsive browser checks for the status page and
process guide:

```pwsh
npm ci
npx playwright install chromium
npm run test:layout
```
