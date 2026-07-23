# AGENTS.md

Guidance for coding agents maintaining this repository. Sarathi starts from an accepted
specification and learns through feedback; it is not a linear waterfall checklist.

## Canonical Sources

- `docs/`: shared process policy and user-facing guides.
- `prompts/`: canonical stage prompts and command definitions.
- `skills/`: skill-specific definitions and metadata. Installers assemble the `sarathi`
  bundle from canonical prompts, docs, and checkers at installation time.
- `checkers/`: repeatable checks for required structure and links.
- `scripts/`: Windows, macOS, Linux, and WSL installers.
- `tests/`: checker, bundle, renderer, prompt-budget, and browser regressions.

Do not treat `.github` as canonical source. `.github/prompts` is only a project-scoped
GitHub Copilot installation target.

## Repository Maintenance Is Not Self-Hosted

Do not run Sarathi's stage workflow on this repository for ordinary maintenance. Do not
create or maintain root `.sdlc/` specs, plans, approvals, decisions, or WIP records here.
Use the user's request, the working diff, focused tests, independent review when useful,
and `CHANGELOG.md` as the maintenance evidence. The `.sdlc` behavior described below is
product guidance for repositories using Sarathi, not state for this repository itself.
Only run an explicit self-dogfooding experiment when the user asks for one, and keep its
temporary state untracked.

## Command Contract

Command verbs are intentionally distinct:

- `create`: write or revise a document or code slice.
- `verify`: run repeatable checks and report their limits.
- `review`: independently judge quality and look for counterexamples.
- `assess`: run verification and review together.

The stage sequence is `spec -> design -> plan -> code`, with matching `create`, `verify`,
`review`, and `assess` commands. `/workflow-status` is a read-only projection and never
advances a gate. Canonical behavior lives in `prompts/<stage>.prompt.md`; shared behavior
lives in `docs/` and must not be copied into every prompt.

## Delivery Model

All production work uses the same loop:

```text
approved requirements -> smallest useful change -> results -> feedback -> inspect/adapt
```

Use [docs/assurance-profiles.md](docs/assurance-profiles.md) to choose review depth:

- **Lean** for small, reversible, low-risk production changes.
- **Standard** as the ordinary default or when risk is unclear.
- **High-assurance** when failure has material security, privacy, safety, regulatory,
  financial, availability, migration, or irreversible-data consequences.
- **Exploratory** remains a separate non-production track for timeboxed spikes.

Review levels change review depth; they never waive approved requirements, readiness to implement,
tests, honest feedback, review of parent documents, human approval points, or safety
limits. Add only the extra risk checks that the work actually needs. High-assurance asks
for stronger proof at each delivery step instead of front-loading the whole project.

Apply [docs/simplicity-first.md](docs/simplicity-first.md) as a hard design constraint.
Process records must not become product architecture. Start with the smallest direct
implementation, reuse existing suites and contracts as compatibility proof, generalize
after a second concrete use case, and stop when conceptual complexity exceeds the user's
mental model. If the solution is larger than the problem requires, simplify it. Sarathi has
no LOC or PR-count constraints.

Record the profile, extra risk checks, reason, and conditions that would require stronger
review in `.sdlc/process-decisions.yaml` when present, `.sdlc/wip.md`, and the source
document.

## Scope And Execution Readiness

- **Product/system**: broad boundary and capabilities.
- **Feature/component**: coherent capability or subsystem; may be ready to implement directly.
- **Slice/change**: smallest implementable unit; normally ready to implement.

`/code-create` blocks without approved requirements and a specific plan that is ready to implement.

At every planning boundary, ask whether a competent engineer can understand, explain,
review, and safely plan the work as one coherent unit. If yes, use one Implementation plan.
If not, split along a natural product or technical boundary until each part is
understandable, testable, and safe to integrate. A split does not automatically require
another spec or design. See [docs/work-decomposition.md](docs/work-decomposition.md).

Breakdown plans use a work group only for near-term `WORK-*` children that share a real
feedback or integration checkpoint; unscheduled children have no group. Implementation plans
list the PRs for one child without assigning PRs to groups. Each group states what it should
teach us, how much may run at once, when
feedback and integration happen, and when to stop or replan. A
`.sdlc/wave-checkpoints.yaml` record that matches the current plan closes only its group. See
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

Run focused cleanup and simplify passes before handoff. Fix in-scope oddities, avoid
unrelated refactors, and revise earlier documents if simplification changes accepted
behavior or contracts. See `docs/cleanup-pass.md` and `docs/simplify-pass.md`.

## Feedback And Parallelism

Approval means sufficient for the next change, not frozen forever. Every planned change
states what it should demonstrate, who or what can judge the result, how feedback will be
gathered, what result would change the plan, and which earlier documents may need revision.
Feedback status is `received`, `requested`,
`unavailable`, or `not-applicable`; never fabricate evidence.

After each assessed slice, classify changes to parent documents as `no-change`, `revision-proposed`,
`revision-required`, or `feedback-required`. Revise before affected work continues.

Prefer sub-agent parallelism inside one change. Run independent changes concurrently only
when one result cannot invalidate another, file ownership is clear, someone will combine
the work, and conditions for stopping or replanning are recorded.

## IDs

- Specs, plans, and work groups: `KIND-AREA-NAME`, such as `FR-AUTH-SIGNIN`,
  `PR-AUTH-SIGNIN`, and `WAVE-AUTH-BOUNDARY`.
- Design entities: `KIND-SLUG`, such as `COMP-AUTH` and `IFACE-AUTH`.
- Design tests: `TEST-AREA-NAME`.

Tokens are uppercase slugs; numeric placeholder suffixes are invalid. Keep human-facing
design labels readable and place machine IDs in annotations, glossaries, matrices, and
required references. See [docs/slug-id-migration.md](docs/slug-id-migration.md).

## Entry, WIP, And Required Reviews

The rules in this section apply to target repositories using Sarathi; the maintenance
exception above applies to this repository itself.

Use [docs/project-entry.md](docs/project-entry.md) to choose how Sarathi starts in a new or
existing system. Documenting an existing system reconstructs approved requirements; current
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
- Keep `skills/sarathi` limited to skill-specific files; make installers assemble canonical
  prompts, checkers, and docs into each installed bundle.
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
