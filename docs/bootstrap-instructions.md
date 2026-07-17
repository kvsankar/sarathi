# Bootstrap Instructions

Sarathi may add a short bootstrap instruction to a project's agent guidance file
so future fresh contexts know to load the process and resume from `.sdlc/wip.md`.

Bootstrap injection is consent-gated. Do not create or modify a bootstrap file unless the
user explicitly approves that change for the target project. Consent can be a direct
instruction such as "add the bootstrap to AGENTS.md" or an affirmative answer after the
agent offers the change.

## Candidate Files

Prefer the first existing file in this order unless the user names a target:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `GEMINI.md`
4. `.github/copilot-instructions.md`
5. `.codex/instructions.md`

If none exists, ask before creating `AGENTS.md`. If multiple files exist and the correct
one is unclear, ask the user to choose. Do not write to tool-specific files that the project
does not use unless the user requests it.

## Injection Block

Use marker comments so the block can be updated idempotently:

```markdown
<!-- sarathi:start -->
## Sarathi

This project uses the Sarathi process. For SDLC work, first load the
`sarathi` skill or the installed stage prompt, then read `.sdlc/wip.md` and
`.sdlc/process-decisions.yaml` if present. Resume from the WIP file's next recommended
action, check claims against the named documents, and preserve the human review gates.

Do not skip required spec/design/plan/code gates for new implementation deltas. A
retrospective baseline review may skip plan creation only when `.sdlc/process-decisions.yaml`
records that policy.
<!-- sarathi:end -->
```

If the file already contains a block between these markers, replace only that block. If the
file contains related hand-written SDLC guidance without markers, ask before merging or
replacing it.

## Recording The Decision

After offering bootstrap injection, update `.sdlc/wip.md`:

- `Status: offered` when the user has not answered yet;
- `Status: injected` when the block was added or updated;
- `Status: declined` when the user says no;
- `Status: deferred` when the user wants to decide later.

If `.sdlc/process-decisions.yaml` exists, record a compact `bootstrap` entry when the user
accepts, declines, or defers:

```yaml
bootstrap:
  decided_at: "2026-07-03T00:00:00Z"
  decided_by: "user"
  target: "AGENTS.md"
  status: "injected | declined | deferred"
```

This record is process context, not proof of external consent beyond the local conversation
and files. Do not treat it as an approval gate.

## Safety Rules

- Keep the injected block short; it should point to `.sdlc/wip.md`, not duplicate the
  process.
- Preserve all existing human-authored bootstrap content outside the marker block.
- Do not insert secrets, user identifiers, chat transcripts, or long process docs.
- Update `.sdlc/wip.md` before ending the turn so a fresh context can see whether bootstrap
  injection happened.
