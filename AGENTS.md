# AGENTS.md

Guidance for coding agents maintaining this repository. Sarathi is spec-first,
feedback-driven, and artifact-governed; it is not a linear waterfall checklist.

## Canonical Sources

- `docs/`: shared process policy and user-facing guides.
- `prompts/`: canonical stage prompts and command definitions.
- `skills/`: installable skill bundles. `skills/sarathi` mirrors selected canonical
  prompts, docs, and checkers.
- `checkers/`: deterministic structural verification.
- `scripts/`: Windows, macOS, Linux, and WSL installers.
- `tests/`: checker, bundle, renderer, prompt-budget, and browser regressions.

Do not treat `.github` as canonical source. `.github/prompts` is only a project-scoped
GitHub Copilot installation target.

## Command Contract

Command verbs are intentionally distinct:

- `create`: author or revise an artifact.
- `verify`: collect deterministic/mechanical evidence only.
- `review`: make the qualitative adversarial judgment using available evidence.
- `assess`: run verification and review as the full gate.

The stage sequence is `spec -> design -> plan -> code`, with matching `create`, `verify`,
`review`, and `assess` commands. `/workflow-status` is a read-only projection and never
advances a gate. Canonical behavior lives in `prompts/<stage>.prompt.md`; shared behavior
lives in `docs/` and must not be copied into every prompt.

## Delivery Model

All production work uses the same loop:

```text
accepted intent -> smallest useful slice -> evidence -> feedback -> inspect/adapt
```

Use [docs/assurance-profiles.md](docs/assurance-profiles.md):

- **Lean** for small, reversible, low-risk production changes.
- **Standard** as the ordinary default or when risk is unclear.
- **High-assurance** when failure has material security, privacy, safety, regulatory,
  financial, availability, migration, or irreversible-data consequences.
- **Exploratory** remains a separate non-production track for timeboxed spikes.

Profiles calibrate depth; they never waive current intent, code readiness, tests, honest
feedback, ancestor-impact review, human gates, or safety constraints. Activate only
context-triggered assurance modules. High-assurance strengthens evidence at each learning
boundary rather than front-loading the whole project.

Apply [docs/simplicity-first.md](docs/simplicity-first.md) as a hard design constraint.
Process evidence must not become product architecture. Start with the smallest direct
implementation, reuse brownfield suites/contracts as compatibility oracles, generalize
after a second concrete use case, and stop when conceptual complexity exceeds the user's
mental model. A bounded slice defaults to at most three implementation PRs; exceptions need
concise justification and the dedicated hash-current `plan.complexity-approved` gate before
assessment; final `plan.approved` remains the downstream code gate. Sarathi has no LOC
constraints.

Record profile, triggered modules, rationale, and escalation triggers in
`.sdlc/process-decisions.yaml` when present, `.sdlc/wip.md`, and the governing artifact.

## Scope And Readiness

- **Product/system**: broad boundary and capabilities; usually decomposable.
- **Feature/component**: coherent capability or subsystem; may be decomposable.
- **Slice/change**: smallest implementable unit; normally code-ready.

Artifacts declare `Implementation Readiness: Exploratory | Decomposable | Code-ready`.
`/code-create` blocks without a code-ready implementation plan for a slice or sufficiently
small feature.

A `WORK-*` item is an allocation in a parent Breakdown plan, not an artifact or code level.
Product plans normally allocate feature children; feature plans normally allocate slice
children. Integration work may allocate directly to the smallest coherent executable
scope. Every child follows its own Spec/Design/Plan chain. See
[docs/work-decomposition.md](docs/work-decomposition.md).

Plans assign every `WORK-*` or `PR-*` exactly once to an ordered `WAVE-*` declaration.
Waves carry learning target, WIP limit, feedback/integration checkpoint, and stop/replan
triggers. A hash-current `.sdlc/wave-checkpoints.yaml` record closes only its wave. See
[docs/feedback-and-learning.md](docs/feedback-and-learning.md).

## Non-Negotiable Evidence Rules

- Requirements own black-box `AT-*` acceptance and `JT-*` journey intent.
- Designs own executable `TEST-*` obligations and verification architecture.
- Plans allocate ancestor and local obligations to child work or PRs.
- Code implements assigned tests and records claims in `.sdlc/test-traceability.yaml`.
- Traceability is a claim map, not proof. Reviewers spot-check test bodies and oracles.
- A primary external seam cannot rely only on a self-authored double without explicit
  residual-risk acceptance. Prefer real or official conformance surfaces.
- Build, deployment, environments, docs, observability, error handling, UI/accessibility,
  security, privacy, resilience, performance/cost, and migration depth are activated by
  accepted requirements or assurance-module triggers. Follow
  [docs/cross-cutting-concerns.md](docs/cross-cutting-concerns.md).
- Never infer passing tests, true TDD history, stakeholder feedback, merge state, or human
  approval from a structural checker or Git activity.
- Live production deployment/checks require explicit user approval.

Behavior-changing code uses Red/Green/Refactor. Narrow exceptions are generated-only,
docs-only, formatting-only, build/deploy configuration validation, or characterization
before legacy refactor; each needs replacement evidence.

Run bounded cleanup and simplify passes before handoff. Fix in-scope oddities, avoid
unrelated refactors, and revise upstream artifacts if simplification changes accepted
behavior or contracts. See `docs/cleanup-pass.md` and `docs/simplify-pass.md`.

## Feedback And Parallelism

Approval means sufficient for the next learning step, not frozen forever. Every code-ready
slice names a learning target, feedback target/method, invalidation question, and
post-slice ancestor-impact checkpoint. Feedback status is `received`, `requested`,
`unavailable`, or `not-applicable`; never fabricate evidence.

After each assessed slice, classify ancestor impact as `no-change`, `revision-proposed`,
`revision-required`, or `feedback-required`. Revise before affected work continues.

Prefer intra-slice sub-agent parallelism. Run independent slices concurrently only in a
bounded wave with explicit execution, learning, and integration dependencies, WIP cap,
convergence owner, and stop/replan triggers.

## IDs

- Specs/plans/waves: `KIND-AREA-NAME`, such as `FR-AUTH-SIGNIN`,
  `PR-AUTH-SIGNIN`, and `WAVE-AUTH-BOUNDARY`.
- Design entities: `KIND-SLUG`, such as `COMP-AUTH` and `IFACE-AUTH`.
- Design tests: `TEST-AREA-NAME`.

Tokens are uppercase slugs; numeric placeholder suffixes are invalid. Keep human-facing
design labels readable and place machine IDs in annotations, glossaries, matrices, and
required references. See [docs/slug-id-migration.md](docs/slug-id-migration.md).

## Entry, WIP, And Human Gates

Use [docs/project-entry.md](docs/project-entry.md) for Greenfield, Brownfield Baseline, or
Brownfield Delta-Only adoption. Brownfield adoption reconstructs accepted intent; current
code is evidence, not truth. A planless baseline review is a conformance audit and must be
explicitly authorized in `.sdlc/process-decisions.yaml`.

Read and maintain `.sdlc/wip.md` using [docs/work-in-progress.md](docs/work-in-progress.md).
It is a resumable navigation note, not approval or product truth.

When `sarathi` is invoked generally, run only the next appropriate stage. After creating or
materially revising a spec, design, ADR, plan, code slice, assessment, or review report:

1. Update `.sdlc/wip.md`.
2. Report artifact path, status/readiness, evidence, open questions, and next command.
3. End the turn before starting the downstream stage.

Continue across stages only when the latest user request explicitly asks for end-to-end or
unattended execution. YOLO permits reasonable assumptions but does not bypass readiness,
touch-set, upstream-blocker, evidence, safety, or human-review gates.

Approval attestations use `.sdlc/approvals.yaml`; optional bounded auto-policy uses
`.sdlc/gates.yaml`. Follow [docs/approval-gates.md](docs/approval-gates.md).

## Verification Independence

When sub-agents are available, use fresh-context passes:

- Mechanical Verifier: deterministic checks and raw evidence.
- Qualitative Reviewer: adversarial judgment using artifact plus evidence.

An assessment runs both. If sub-agents are unavailable, disclose non-independence and keep
the passes separate. Stop downstream assessment when an upstream artifact is unfit. Follow
[docs/review-verification-checklist.md](docs/review-verification-checklist.md).

## Maintenance Rules

- Read [docs/process-maintenance.md](docs/process-maintenance.md) before changing process
  prompts, skills, policy, or checker behavior.
- Keep global routing and stage contracts concise. Shared rules belong in one triggered
  reference; deterministic rules belong in checkers.
- Use `apply_patch` for manual edits. Do not overwrite user changes or generated consumer
  artifacts.
- Mirror canonical prompts/checkers and the selected docs into `skills/sarathi`.
- Update `CHANGELOG.md` for user-visible process, checker, installer, or skill changes.
- Keep deterministic output free of timestamps, randomness, network assets, and
  environment-dependent content unless the artifact schema explicitly requires them.

Run before publishing:

```powershell
uv run pytest -q --cov=checkers --cov-report=term-missing
npm run test:layout
uv run pre-commit run --all-files
uv run python C:\Users\kvsan\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills\sarathi
```

Use `scripts/install.ps1` or `scripts/install.sh`. User scope and all-agent installation are
the defaults; do not pass a narrower tool target unless requested. Publish through a PR,
wait for CI, merge, then deploy from the merged default branch.
