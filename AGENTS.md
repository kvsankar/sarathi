# AGENTS.md

Guidance for coding agents maintaining this repository.

## Source Files

- `docs/`: shared process policy and user-facing guides.
- `prompts/`: canonical `<stage>-<action>` command prompts.
- `skills/`: skill-specific definitions and metadata.
- `src/`: TypeScript CLI, repeatable checks, status renderer, updater, and package assembly.
- `scripts/`: Windows, macOS, Linux, and WSL installers.
- `tests-node/`: checker, bundle, renderer, instruction-budget, and installer regressions.
- `tests/`: browser layout regressions.
- `README.md`: installation, command orientation, and repository entry points.

Do not treat `.github` as canonical source. `.github/prompts` is only a project-scoped
GitHub Copilot installation target. Installers assemble the `sarathi` bundle from canonical
prompts, docs, compiled TypeScript checkers, and skill-specific files.

## Do Not Run Sarathi On Itself

Do not run Sarathi's delivery workflow on this repository for ordinary maintenance. Do not
create or maintain root `.sdlc/` specs, plans, approvals, decisions, or WIP records here.
Use the user's request, the working diff, focused tests, independent review when useful, and
`CHANGELOG.md` as maintenance evidence. Only run a self-dogfooding experiment when the user
asks, and keep its temporary state untracked.

## Where Product Rules Belong

This file governs maintenance of Sarathi itself. It does not define how Sarathi behaves in
other repositories. Do not copy those product rules here.

- `skills/sarathi/SKILL.md` contains only the short rules needed on every invocation.
- `prompts/<stage>-<action>.prompt.md` owns command behavior.
- [docs/progressive-disclosure.md](docs/progressive-disclosure.md) maps every shared reference
  and when to read it.
- [docs/enduring-model.md](docs/enduring-model.md) owns the delivery model.
- [docs/approval-gates.md](docs/approval-gates.md) owns approvals and YOLO.
- [docs/review-verification-checklist.md](docs/review-verification-checklist.md) owns check and
  review independence.
- [docs/process-maintenance.md](docs/process-maintenance.md) owns process-editing rules.

When changing process behavior, edit the owning source and replace other copies with links.
Keep command prompts short and specific. Put shared guidance in one document that is read
when needed. Put rules that a program can check in the TypeScript checker source.

## Maintenance Rules

- Read [docs/process-maintenance.md](docs/process-maintenance.md) before changing prompts,
  skills, policy, or checker behavior.
- Apply [docs/simplicity-first.md](docs/simplicity-first.md): prefer deletion and direct
  changes; do not add process machinery without a concrete need.
- Use `apply_patch` for manual edits. Preserve unrelated user changes in a dirty worktree.
- Keep `skills/sarathi` limited to skill-specific files. Installers assemble canonical docs,
  prompts, and compiled checkers into installed bundles.
- Only `sarathi` may start without being named. Generated command skills must be named
  explicitly, work across agent hosts, and use `sarathi-<stage>-<action>`.
- Update `CHANGELOG.md` for user-visible process, checker, installer, or skill changes.
- Keep repeatable output free of timestamps, randomness, network assets, and
  environment-dependent content unless its schema requires them.
- Do not infer passing tests, approval, feedback, merge state, or production readiness from
  checker or Git activity.
- Live production deployment or checks require explicit user approval.

## Verification And Publication

Run before publishing:

```powershell
npm ci
npm run check
```

Run `npm run test:layout` when changing the workflow-status renderer, browser tests, or
JavaScript dependencies. The Node suite owns portable skill metadata validation.

Use `scripts/install.ps1` or `scripts/install.sh`. User scope and all-agent installation are
the defaults; do not pass a narrower tool target unless requested. Publish through a PR, wait
for CI, merge, then deploy from the merged default branch.
