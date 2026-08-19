# AGENTS.md

Guidance for coding agents maintaining this repository.

## Canonical Sources

- `docs/`: shared process policy and user-facing guides.
- `prompts/`: canonical `<stage>-<action>` command prompts.
- `skills/`: skill-specific definitions and metadata.
- `checkers/`: repeatable structure, approval, and link checks.
- `scripts/`: Windows, macOS, Linux, and WSL installers.
- `tests/`: checker, bundle, renderer, instruction-budget, installer, and browser regressions.
- `README.md`: installation, command orientation, and repository entry points.

Do not treat `.github` as canonical source. `.github/prompts` is only a project-scoped
GitHub Copilot installation target. Installers assemble the `sarathi` bundle from canonical
prompts, docs, checkers, and skill-specific files.

## Repository Maintenance Is Not Self-Hosted

Do not run Sarathi's delivery workflow on this repository for ordinary maintenance. Do not
create or maintain root `.sdlc/` specs, plans, approvals, decisions, or WIP records here.
Use the user's request, the working diff, focused tests, independent review when useful, and
`CHANGELOG.md` as maintenance evidence. Only run a self-dogfooding experiment when the user
asks, and keep its temporary state untracked.

## Product Policy Lives Elsewhere

This file governs repository maintenance, not repositories that use Sarathi. Do not restate
runtime policy here.

- `skills/sarathi/SKILL.md` contains only always-loaded routing and operating constraints.
- `prompts/<stage>-<action>.prompt.md` owns command behavior.
- [docs/progressive-disclosure.md](docs/progressive-disclosure.md) maps every shared reference
  and its loading trigger.
- [docs/enduring-model.md](docs/enduring-model.md) owns the delivery model.
- [docs/approval-gates.md](docs/approval-gates.md) owns approvals and YOLO.
- [docs/review-verification-checklist.md](docs/review-verification-checklist.md) owns check and
  review independence.
- [docs/process-maintenance.md](docs/process-maintenance.md) owns process-editing rules.

When changing process behavior, edit the owning source and replace other copies with links.
Keep command prompts local and concise; put shared judgment in one triggered reference and
deterministic rules in checkers.

## Maintenance Rules

- Read [docs/process-maintenance.md](docs/process-maintenance.md) before changing prompts,
  skills, policy, or checker behavior.
- Apply [docs/simplicity-first.md](docs/simplicity-first.md): prefer deletion and direct
  changes; do not add process machinery without a concrete need.
- Use `apply_patch` for manual edits. Preserve unrelated user changes in a dirty worktree.
- Keep `skills/sarathi` limited to skill-specific files. Installers assemble canonical docs,
  prompts, and checkers into installed bundles.
- Keep `sarathi` as the only implicitly invocable skill. Generated command skills remain
  explicit, agent-neutral, and named `sarathi-<stage>-<action>`.
- Update `CHANGELOG.md` for user-visible process, checker, installer, or skill changes.
- Keep deterministic output free of timestamps, randomness, network assets, and
  environment-dependent content unless its schema requires them.
- Do not infer passing tests, approval, feedback, merge state, or production readiness from
  checker or Git activity.
- Live production deployment or checks require explicit user approval.

## Verification And Publication

Run before publishing:

```powershell
uv run pre-commit run --all-files
uv run pytest -q --cov=checkers --cov-report=term-missing
```

Run `npm run test:layout` when changing the workflow-status renderer, browser tests, or
JavaScript dependencies. The Python suite owns portable skill metadata validation; CI
installs Chromium only for layout-related changes.

Use `scripts/install.ps1` or `scripts/install.sh`. User scope and all-agent installation are
the defaults; do not pass a narrower tool target unless requested. Publish through a PR, wait
for CI, merge, then deploy from the merged default branch.
