---
description: Assess a Work Plan with a deterministic mechanical pass and a qualitative pass, checking PR reviewability, TDD, logging/error-handling/docs/build/deploy allocation, and full spec/design coverage.
agent: agent
---

# Plan Assess

## Workflow state

At the start of this stage, follow `docs/work-in-progress.md`: read `.sdlc/wip.md` if it
exists, verify important claims against the named artifacts, and use it only as a resume
note. Before any hard stop, blocker report, or completed stage handoff, update `.sdlc/wip.md`
with the current stage, artifact paths, decisions/assumptions, verification evidence,
blockers/open questions, bootstrap status, and next recommended action. Do not store
secrets or long command logs.

## Artifact formatting

For Markdown artifacts and reports produced or revised in this stage, follow
`docs/artifact-formatting.md`: wrap normal prose and list continuation lines at 80
characters where practical, while allowing longer lines for tables, URLs, code/logs,
paths, hashes, IDs, approval records, and syntax where wrapping would reduce correctness
or readability.

## Simplify pass

Before handoff, follow `docs/simplify-pass.md`: remove over-engineered requirements,
layers, abstractions, extension points, fixtures, checks, or code paths that are not
justified by accepted scope, risk, constraints, or evidence. Preserve necessary detail,
reviewability, traceability, and real boundaries. If simplification would change accepted
behavior, contracts, UX, NFRs, deployment posture, or public docs, stop for governing
artifact revision.

Assess a Work Plan against its principles: small reviewable PRs with an advisory size
target, Red/Green TDD, full coverage of spec and design, explicit Planned Touch Sets,
planned build/deployment work, planned user/developer documentation work, and
always-shippable ordering.
Produce the verification sequence below.

Do not stop after checker JSON. This assessment must include:

1. Verification 0: upstream spec/design structural evidence plus qualitative upstream fitness.
2. Verification A: structural `check_plan.py` evidence.
3. Verification B: qualitative plan assessment.

If the host exposes sub-agent capability, run these as two fresh-context sub-agent passes.
This split is mandatory for assessment stages:

- **Mechanical Verifier sub-agent**: run upstream spec/design checkers and the plan checker,
  returning raw evidence, metrics, IDs, and command failures.
- **Qualitative Reviewer sub-agent**: read the plan, upstream artifacts, and mechanical
  evidence, then judge upstream fitness and plan quality adversarially.

If sub-agents are unavailable, state that the host lacks sub-agent capability, mark the
assessment as degraded and non-independent where applicable, and keep the mechanical and
qualitative sections separate.

Target the plan file the user provides (default `plan.md`). Do not edit it unless asked;
report findings only. Pass `--spec spec.md` and `--design design.md` so FR/AT/JT/COMP/TEST
refs resolve. For a feature/component or slice/change plan, add `--feature` and
`--parent <product-plan>`.

Use an adversarial assessment posture: try to refute the slicing, find missing upstream
spec/design changes, touch-set gaps, PRs that are too large in reality, weak Red steps,
dependency traps, and traceability theater. If sub-agents are unavailable and the same agent
that created the plan is assessing it, state that the review half of the assessment is not
independent and actively look for counterexamples.

## Verification 0 — Upstream Consistency Gate

Before assessing the plan itself, check whether the upstream spec and design are fit to
plan from. If the files exist, run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
```

If `python` is unavailable or fails because the launcher is missing, retry checker commands
with `python3`; if that is unavailable, retry with `uv run python`.

Then read enough of `spec.md` and `design.md` to detect latent upstream issues exposed by
the plan, including ambiguous or conflicting requirements, missing acceptance criteria,
unmeasurable NFRs, component boundaries that do not realize requirements, missing interfaces,
untestable design choices, unresolved dependencies, unclear migration/rollout constraints,
missing UI mock approval when the spec/design requires one, missing logging/error-handling
strategy, missing build/release/deployment strategy, missing documentation strategy, or
scope that cannot be sliced into reviewable PRs.

If either upstream checker fails, or if plan assessment reveals that the spec or design must
change before the plan can be judged fairly, **stop the plan assessment**. Report an
**Upstream blocker** with the exact spec/design IDs/sections affected, why the plan cannot
be reliably assessed, and the recommended upstream revision. Do not continue to Verification
A or B for the plan until the upstream issue is resolved.

## Verification A — Mechanical / Deterministic (run the tool)

Run the bundled checker and report its output verbatim. This is a deterministic
**structural** check: it catches section, ID, orphan-reference, declared coverage, declared
LOC estimates, Red/Green-step, dependency-order, and banned-word issues. LOC sizing is
advisory reviewability evidence, not a hard gate. It does not prove PR size from the actual
diff, prove TDD history, or prove the plan slices are substantively good; Verification B
must judge that.

```pwsh
python checkers/check_plan.py <plan.md> --spec spec.md --design design.md --json
```

If all Python runners fail (`python`, `python3`, and `uv run python`), report the runner
failures and fall back to manual checks.

It exits `0` only if every structural gate passes (non-zero otherwise) and emits metrics:

- **counts** per ID kind (MILE/WORK/PR) and **plan_kind** (`breakdown` or `implementation`).
- **fr_coverage_pct / uc_coverage_pct / nfr_coverage_pct / at_coverage_pct / comp_coverage_pct** — must each be **100%**, meaning each required ID is referenced by child `WORK-` items in a Breakdown plan or `PR-` items in an Implementation plan.
- **uncovered_frs / uncovered_ucs / uncovered_nfrs / uncovered_ats / uncovered_comps** — must be empty.
- **work_items** — child work items for a Breakdown plan.
- **large_prs** — implementation PRs declaring more than the advisory LOC target. This is a
  declared plan estimate, not measured diff size. It requires qualitative review, not
  automatic failure.
- **prs_missing_loc** — implementation PRs without an estimated LOC declaration. This
  requires qualitative review, not automatic failure.
- **loc_advisory** — checker explanation for the reviewability signal. Never recommend
  deleting useful comments, tests, docs, JSDoc/docstrings, or readable structure merely to
  satisfy the LOC target.
- **prs_missing_tdd** — implementation PRs lacking Red and Green step text. This is a
  presence check; qualitative review must still judge whether the Red step would be a
  meaningful failing test. Must be empty.
- **forward_deps** — PRs depending on a later PR defined below them. Must be empty.
- **orphan_refs**, **duplicates**, **bad_id_format** — must be empty.
- **vague_hits** — count of "etc.", "and/or", "tbd", "as appropriate", "various".
- **gates** + `passed/total`.

Present the JSON, then `passed/total` and the coverage percentages. List every uncovered,
large, missing-LOC, non-TDD, or orphan ID explicitly.

## Verification B — Qualitative

Reasoned judgment, scored 1–5 with one concrete fix each:

- **PR reviewability** — slices are coherent, single-concern, and normally around the
  advisory 500 changed-LOC target. Larger slices may pass when the plan explains why
  splitting would harm cohesion, readability, test quality, or documentation quality.
  Reject attempts to meet the target by cutting useful comments, tests, docs, JSDoc/
  docstrings, or clear structure.
- **Plan type and readiness fit** — the plan declares product/system, feature/component, or
  slice/change scope; declares Breakdown or Implementation plan type; and marks
  Implementation Readiness realistically. Breakdown plans may pass as Decomposable, but only
  Implementation plans with concrete `PR-` items may be Code-ready for `/code-create`.
- **Scope-specific content completeness** — product/system plans carry milestones, child
  feature/component `WORK-` items, dependencies, required child specs/designs/ADRs, research
  or decision needs, logging/error-handling tracks, build/release/deployment tracks,
  documentation tracks, sequencing, parallel tracks, risks, and readiness targets;
  feature/component plans carry child slice/change work or code-ready PRs, child artifact
  needs, integration order, test allocation, logging/error-handling impacts,
  build/deployment impacts, documentation impacts, and touch-scope risks; slice/change plans
  carry concrete `PR-` items, Planned Touch Sets, Red/Green steps, test levels, LOC
  estimates, quality gates, logging/error-handling verification, build/deployment
  verification, documentation updates/checks, rollback, dependencies, and worktree guidance.
- **TDD discipline** — planned Red steps precede Green steps and are meaningful, not coverage
  theater. The structural checker only verifies Red/Green step text; use judgment here.
  Missing Red/Green is acceptable only for a narrow declared exception with replacement
  verification: generated code only, docs-only, formatting-only, build/deploy config
  validation, or characterization before legacy refactor.
- **Coverage threshold fitness** — the done definition must not lower the Sarathi floor and
  must raise coverage thresholds when deterministic, algorithmic, financial, safety-critical,
  security-policy, parser/serializer, migration, or pure mathematical/library code needs
  stronger evidence.
- **Cleanup-pass allocation** — the done definition requires a bounded general cleanup pass
  before code-slice handoff, including removal of in-scope odd issues and test/security/
  observability/traceability theater without unrelated churn.
- **Simplify-pass allocation** — the done definition requires a simplify pass after cleanup
  when both apply, and PR slices avoid ceremony, speculative infrastructure, duplicated
  checks, or coordination cost that does not reduce review risk.
- **Coverage** — no requirement/component silently skipped; NFRs and journey tests are
  scheduled.
- **Test-level allocation** — each `AT-` maps to an executable acceptance/e2e/API workflow
  test PR or justified non-code verification, each `JT-` maps to an executable
  journey/e2e/API workflow PR or justified non-code verification with ordered steps and
  state handoff, while each design `TEST-` obligation for unit/pure-core, component,
  contract, integration, UI/accessibility/visual, quality-attribute, migration, and
  operational checks is scheduled near the code it protects.
- **Test-environment allocation** — developer-local verification is planned. Shared
  integration/test, staging/pre-production, production canary/smoke, and synthetic-monitor
  environments recommended by the design or implied by risk are assigned to PRs/work items,
  including data/secrets handling, external dependency mode, reset/cleanup, deployment
  validation, smoke/canary/rollback checks, owner, and residual risk for deferrals.
- **Context-driven review/test allocation** — the plan allocates needed performance/load,
  security/threat-model, privacy/compliance, accessibility, resilience/DR, migration,
  localization, abuse/fraud/safety, cost, compatibility, and operational reviews/tests, or
  explicitly explains why each material concern is out of scope. Missing material work is a
  plan defect or upstream blocker.
- **Inner-test discovery guidance** — the plan identifies likely implementation-local
  supplemental test zones where useful, without using them as a substitute for required
  `AT-`/`JT-`/`TEST-` coverage or allowing new product-visible scope to bypass upstream
  artifacts.
- **Verification-oracle allocation** — each planned executable test states the observable
  evidence that proves pass/fail, such as return value, state, event, API response,
  DOM/accessibility output, screenshot, artifact, log, metric, trace, deployment signal, or
  external call.
- **Contract-fixture allocation** — boundary-facing PRs identify the shared fixtures,
  schemas, generated clients, captured representative examples, or contract tests that keep
  mocks aligned with the real producer/consumer contract.
- **External double verification allocation** — PRs that use mocks, fakes, stubs, or test
  doubles for external systems flag the verification risk and allocate mitigation through a
  real-boundary smoke/integration test, official conformance harness, type-conformance
  check, generated schema/client check, vendor sandbox/emulator, captured real fixture, or
  explicit user-approved limitation. If a primary integration seam is covered only by a
  self-authored double, fail the plan assessment.
- **UX/presentation allocation** — UI-facing PRs assign baseline styling/layout,
  responsive/accessibility checks, and readable loading/empty/error/validation states, or
  explicitly justify why they are out of scope.
- **Mock UI approval** — if the spec/design requires a mock UI, UI-facing PRs reference the
  approved mock artifact and remain blocked until user approval is explicit.
- **Logging/error-handling allocation** — PRs assign structured logs, telemetry events,
  metrics, traces, audit/support IDs, correlation propagation, redaction, alert hooks,
  APM instrumentation, dashboards, SLO/SLI signals, exporter/provider config,
  representative failure-path tests, error mapping, retry/fallback/degraded behavior, and
  safe UI/API messages where required. If production performance visibility is needed but
  no PR owns latency/throughput/error/saturation metrics or trace propagation, flag it.
- **Build/deployment allocation** — artifact creation, packaging, generated outputs, CI/CD
  config, deployment scripts/manifests/IaC, migration validation, dry-run/plan/lint commands,
  smoke checks, rollback checks, and release docs are assigned to PRs when the upstream
  artifacts call for them, or explicitly marked out of scope with a defensible reason.
- **Documentation allocation** — user docs, developer docs, README/API/reference output,
  examples, tutorials, diagrams, runbooks, troubleshooting, release/migration notes, doc
  generation, link checks, accessibility/readability, and freshness/versioning checks are
  assigned to PRs when the upstream artifacts call for them, or explicitly marked out of
  scope with a defensible reason.
- **Planned Touch Sets** — every PR names the files/directories/modules/config/docs/generated
  artifacts and spec/design/plan sections it may touch, with narrow enough scope for
  `/code-create` to detect out-of-scope edits.
- **Sequencing** — always-green, no forward deps, sensible flags/migrations, and clear
  integration order.
- **Parallelism and worktrees** — waves and critical path are correct; concurrent PRs avoid
  shared-file conflicts or identify them through touch-set overlaps; independent branches say
  whether separate Git worktrees are recommended and how they rejoin.
- **Production quality** — logging/telemetry, error handling, NFR validation, rollback per PR.
- **Shippability** — the plan introduces build, deployment, and documentation capability
  before dependent feature work, keeps each PR independently buildable and explainable, and
  avoids late integration or documentation surprises.

If a `plan.html` companion exists, confirm its dependency graph and wave/Gantt view match
`plan.md` (same PR-IDs, same depends-on edges); flag any divergence.

## Report format

If blocked by Verification 0:

1. **Upstream blocker** (spec/design IDs or sections + why it blocks plan review).
2. Required upstream changes.
3. **Verdict**: Blocked-upstream.

Otherwise:

1. Mechanical scorecard (✅/❌ + IDs + totals).
2. Qualitative scorecard (1–5 + fixes, including Planned Touch Set adequacy).
3. **Top fixes** ranked by impact.
4. **Verdict**: Pass / Pass-with-fixes / Needs rework.

## Human review gate (hard stop)

After reporting the plan assessment verdict, **stop**. Do not start `/code-create`,
implementation, build/deployment work, or any downstream artifact in the same turn. The next
stage requires explicit user approval or an explicit unattended end-to-end instruction in
the user's latest message.
