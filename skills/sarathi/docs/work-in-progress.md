# Work In Progress State

Sarathi should keep resumable workflow state in `.sdlc/wip.md`. The file is a
human-readable handoff note for fresh agent contexts. It lets a new context load current
state and continue without depending on chat history.

`wip.md` is not an approval ledger, a source of product truth, or proof that checks passed.
Specs, designs, plans, code, tests, `.sdlc/process-decisions.yaml`, and
`.sdlc/approvals.yaml` remain the source records. Treat `.sdlc/wip.md` as a current
navigation note that can become stale.

## When To Read

At the start of any SDLC stage or general SDLC request:

- read `.sdlc/wip.md` if it exists;
- read `.sdlc/process-decisions.yaml` if it exists;
- use the decision ledger for durable process choices and WIP for the current stage and
  next action;
- check important claims against the named files before acting.

If `.sdlc/wip.md` conflicts with a source document or the user's latest instruction, the
source document or latest instruction wins. Update the WIP file to remove the stale
claim before continuing.

If a legacy decision ledger contains live workflow fields such as
`next_recommended_stage`, follow the WIP file and remove the duplicate field during the
next process-maintenance update.

## When To Create Or Update

Create `.sdlc/wip.md` when SDLC work starts in a project and no WIP file exists. Update it:

- after creating, materially revising, reviewing, checking, or assessing a document;
- before every hard human gate stop;
- before ending a turn with unresolved blockers or open questions;
- after the user approves a document, changes the starting mode, changes scope, or
  explicitly chooses YOLO/lightweight/degraded check behavior;
- after bootstrap instruction injection is accepted, declined, or deferred.

Do not store secrets, credentials, private tokens, raw sensitive data, or long command logs.
Summarize evidence and link to document paths instead.

## Required Shape

Use this section order:

```markdown
# SDLC Work In Progress

Last Updated: 2026-07-03T00:00:00Z
Updated By: agent
Current Stage: spec-create | spec-review | design-create | plan-create | code-create | ...
Current Gate: none | human-review | blocked | approved-for-next-stage
Project Entry Mode: greenfield | brownfield_baseline | brownfield_delta_only | unknown
Work Scope: product/system | feature/component | slice/change | unknown
Implementation Readiness: Exploratory | Decomposable | Code-ready | unknown
Delivery Profile: Lean | Standard | High-assurance | Exploratory | unknown
Assurance Modules: comma-separated module names or none

## Resume Summary

One short paragraph describing what a fresh context must know first.

## Current Artifacts

| Kind | Path | Status | Notes |
| --- | --- | --- | --- |
| Spec | spec.md | draft/reviewed/approved/stale/missing | ... |
| Design | design.md | draft/reviewed/approved/stale/missing | ... |
| Plan | plan.md | draft/reviewed/approved/stale/missing | ... |

## Decisions And Assumptions

- Decision or assumption, with source path when applicable.

## Check And Review Evidence

- Command or review performed, date, result, and where details live.

## Feedback And Learning

Learning Target: assumption, behavior, boundary, or risk tested by the current slice
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

## Open Questions And Blockers

- Question or blocker, owner, and why it matters.

## Next Recommended Action

Run `/design-create` after the user approves `spec.md`.

## Bootstrap Status

Bootstrap File: AGENTS.md | CLAUDE.md | .github/copilot-instructions.md | none
Status: not-offered | offered | accepted | injected | declined | deferred
Notes: ...
```

Add compact subsections only when they improve resumability. Keep the file short enough for
a fresh context to read quickly; prefer links to documents over copied content.

## Fresh Context Resume Procedure

A fresh agent context should:

1. Read the repository bootstrap file, if present.
2. Read `.sdlc/wip.md`.
3. Read `.sdlc/process-decisions.yaml`, `.sdlc/approvals.yaml`,
   `.sdlc/code-assessments.yaml`, and `.sdlc/wave-checkpoints.yaml` when present.
4. Load the selected stage prompt and triggered docs using `docs/progressive-disclosure.md`.
5. Re-open the source document paths named in WIP before editing or judging them.
6. Check feedback status, active learning dependencies, and parent-document outcomes before
   starting another slice.
7. Continue from `Next Recommended Action`, unless the user's latest instruction changes
   the stage or scope.

If WIP is missing in a project that is already using the process, reconstruct the smallest
accurate WIP from existing documents and ask the user to confirm when the reconstruction
materially affects the next stage.
