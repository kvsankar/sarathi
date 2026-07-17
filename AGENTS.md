# AGENTS.md

Guidance for coding agents maintaining this repository. Sarathi starts from an accepted
specification and learns through feedback; it is not a linear waterfall checklist.

## Canonical Sources

- `docs/`: shared process policy and user-facing guides.
- `prompts/`: canonical stage prompts and command definitions.
- `skills/`: installable skill bundles. `skills/sarathi` mirrors selected canonical
  prompts, docs, and checkers.
- `checkers/`: repeatable checks for required structure and links.
- `scripts/`: Windows, macOS, Linux, and WSL installers.
- `tests/`: checker, bundle, renderer, prompt-budget, and browser regressions.

Do not treat `.github` as canonical source. `.github/prompts` is only a project-scoped
GitHub Copilot installation target.

## Command Contract

Command verbs are intentionally distinct:

- `create`: write or revise a document or code slice.
- `verify`: run repeatable checks and report their limits.
- `review`: independently judge quality and look for counterexamples.
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

Use [docs/assurance-profiles.md](docs/assurance-profiles.md) to choose review depth:

- **Lean** for small, reversible, low-risk production changes.
- **Standard** as the ordinary default or when risk is unclear.
- **High-assurance** when failure has material security, privacy, safety, regulatory,
  financial, availability, migration, or irreversible-data consequences.
- **Exploratory** remains a separate non-production track for timeboxed spikes.

Profiles change review depth; they never waive accepted intent, readiness to implement,
tests, honest feedback, review of parent documents, human approval points, or safety
limits. Add only the extra risk checks that the work actually needs. High-assurance asks
for stronger proof at each delivery step instead of front-loading the whole project.

Apply [docs/simplicity-first.md](docs/simplicity-first.md) as a hard design constraint.
Process evidence must not become product architecture. Start with the smallest direct
implementation, reuse existing suites and contracts as compatibility proof, generalize
after a second concrete use case, and stop when conceptual complexity exceeds the user's
mental model. A bounded slice defaults to at most three implementation PRs; exceptions need
concise justification and a `plan.complexity-approved` record that matches the current plan
before assessment; final `plan.approved` remains the approval required for code. Sarathi has no LOC
constraints.

Record the profile, extra risk checks, reason, and conditions that would require stronger
review in `.sdlc/process-decisions.yaml` when present, `.sdlc/wip.md`, and the source
document.

## Scope And Readiness

- **Product/system**: broad boundary and capabilities; usually needs breakdown.
- **Feature/component**: coherent capability or subsystem; may need breakdown.
- **Slice/change**: smallest implementable unit; normally code-ready.

Documents declare `Implementation Readiness: Exploratory | Decomposable | Code-ready`.
`/code-create` blocks without a code-ready implementation plan for a slice or sufficiently
small feature.

A `WORK-*` item assigns child work in a parent Breakdown plan; it is not a document or code
level.
Product plans normally allocate feature children; feature plans normally allocate slice
children. Integration work may allocate directly to the smallest coherent executable
scope. Standard children follow their own Spec/Design/Plan chain; an eligible code-ready Lean
slice uses one Lean Change Record. See
[docs/work-decomposition.md](docs/work-decomposition.md).

Breakdown plans use a `WAVE-*` only for near-term `WORK-*` children that share a real
feedback or integration checkpoint; unscheduled children have no wave. Implementation plans
list the PRs for one child without assigning PRs to waves. Each wave states what it should
teach us, how much may run at once, when
feedback and integration happen, and when to stop or replan. A
`.sdlc/wave-checkpoints.yaml` record that matches the current plan closes only its wave. See
[docs/feedback-and-learning.md](docs/feedback-and-learning.md).

## Non-Negotiable Evidence Rules

- Requirements own black-box `AT-*` acceptance and `JT-*` journey intent.
- Designs own executable `TEST-*` obligations and verification architecture.
- Plans assign parent and local test obligations to child work or PRs.
- Code implements assigned tests and reports exact commands, outcomes, and unavailable
  evidence. Reviewers inspect test bodies and their pass/fail checks.
- A primary external seam cannot rely only on a self-authored double without explicit
  acceptance of the remaining risk. Prefer the real dependency or its official test
  surface.
- Build, deployment, environments, docs, observability, error handling, UI/accessibility,
  security, privacy, resilience, performance/cost, and migration depth are activated by
  accepted requirements or identified risks. Follow
  [docs/cross-cutting-concerns.md](docs/cross-cutting-concerns.md).
- Never infer passing tests, stakeholder feedback, merge state, or human
  approval from an automatic checker or Git activity.
- Live production deployment/checks require explicit user approval.

Behavior-changing code has focused, meaningful verification. The implementation approach is
chosen by the repository; review evaluates whether the resulting tests and commands are
credible.

Run bounded cleanup and simplify passes before handoff. Fix in-scope oddities, avoid
unrelated refactors, and revise earlier documents if simplification changes accepted
behavior or contracts. See `docs/cleanup-pass.md` and `docs/simplify-pass.md`.

## Feedback And Parallelism

Approval means sufficient for the next learning step, not frozen forever. Every code-ready
slice states what it should teach us, who or what can judge the result, how feedback will
be gathered, what result would change the plan (`Invalidation Question`), and which parent
documents may need revision (`Ancestor Impact`). Feedback status is `received`, `requested`,
`unavailable`, or `not-applicable`; never fabricate evidence.

After each assessed slice, classify changes to parent documents as `no-change`, `revision-proposed`,
`revision-required`, or `feedback-required`. Revise before affected work continues.

Prefer intra-slice sub-agent parallelism. Run independent slices concurrently only in a
bounded wave with clear execution, learning, and integration dependencies, a WIP cap, who
will combine the work, and conditions for stopping or replanning.

## IDs

- Specs/plans/waves: `KIND-AREA-NAME`, such as `FR-AUTH-SIGNIN`,
  `PR-AUTH-SIGNIN`, and `WAVE-AUTH-BOUNDARY`.
- Design entities: `KIND-SLUG`, such as `COMP-AUTH` and `IFACE-AUTH`.
- Design tests: `TEST-AREA-NAME`.

Tokens are uppercase slugs; numeric placeholder suffixes are invalid. Keep human-facing
design labels readable and place machine IDs in annotations, glossaries, matrices, and
required references. See [docs/slug-id-migration.md](docs/slug-id-migration.md).

## Entry, WIP, And Human Gates

Use [docs/project-entry.md](docs/project-entry.md) to choose how Sarathi starts in a new or
existing system. Baseline adoption reconstructs accepted intent; current
code is evidence, not truth. A planless baseline review is a conformance audit and must be
explicitly authorized in `.sdlc/process-decisions.yaml`.

Read and maintain `.sdlc/wip.md` using [docs/work-in-progress.md](docs/work-in-progress.md).
It is a resumable navigation note, not approval or product truth.

When `sarathi` is invoked generally, run only the next appropriate stage. After creating or
materially revising a spec, design, ADR, plan, code slice, assessment, or review report:

1. Update `.sdlc/wip.md`.
2. Report document or code path, status/readiness, evidence, open questions, and next command.
3. End the turn before starting the next stage.

Continue across stages only when the latest user request explicitly asks for end-to-end or
unattended execution. YOLO permits reasonable assumptions but does not bypass readiness,
touch-set, earlier-document blockers, evidence, safety, or human-review gates.

Approval records use `.sdlc/approvals.yaml`; optional limited automatic approval policy uses
`.sdlc/gates.yaml`. Follow [docs/approval-gates.md](docs/approval-gates.md).

## Verification Independence

When sub-agents are available, use fresh-context passes:

- Check pass: repeatable checks and raw results.
- Review pass: independent judgment using the document or code plus those results.

An assessment runs both. If sub-agents are unavailable, disclose non-independence and keep
the passes separate. Stop assessment when an earlier required document is unfit. Follow
[docs/review-verification-checklist.md](docs/review-verification-checklist.md).

## Maintenance Rules

- Read [docs/process-maintenance.md](docs/process-maintenance.md) before changing process
  prompts, skills, policy, or checker behavior.
- Keep global routing and stage contracts concise. Shared rules belong in one triggered
  reference; deterministic rules belong in checkers.
- Use `apply_patch` for manual edits. Do not overwrite user changes or generated consumer
  documents.
- Mirror canonical prompts/checkers and the selected docs into `skills/sarathi`.
- Update `CHANGELOG.md` for user-visible process, checker, installer, or skill changes.
- Keep deterministic output free of timestamps, randomness, network assets, and
  environment-dependent content unless the document schema explicitly requires them.

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
