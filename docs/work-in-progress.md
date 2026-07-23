# Work In Progress State

Sarathi should keep resumable workflow state in `.sdlc/wip.md`. The file is a
human-readable handoff note for fresh agent contexts. It lets a new context load current
state and continue without depending on chat history.

`wip.md` is not an approval record, a source of product truth, or proof that checks passed.
Specs, designs, plans, code, tests, `.sdlc/process-decisions.yaml`, and
`.sdlc/approvals.yaml` remain the source records. Treat `.sdlc/wip.md` as a current
navigation note that can become stale.

## When To Read

At the start of any SDLC stage or general SDLC request:

- read `.sdlc/wip.md` if it exists;
- read `.sdlc/process-decisions.yaml` if it exists;
- use both only to choose the next stage and find relevant documents;
- check important claims against the named files before acting.

If `.sdlc/wip.md` conflicts with a source document or the user's latest instruction, the
source document or latest instruction wins. Update the WIP file to remove the stale
claim before continuing.

## When To Create Or Update

Create `.sdlc/wip.md` when SDLC work starts in a project and no WIP file exists. Update it:

- after creating, materially revising, reviewing, checking, or assessing a document;
- before every required approval pause;
- before ending a turn with unresolved blockers or open questions;
- after the user approves a document, changes the starting mode, changes scope, or
  explicitly chooses YOLO/lightweight/degraded check behavior;
- after bootstrap instruction injection is accepted, declined, or deferred.

Do not store secrets, credentials, private tokens, raw sensitive data, or long command logs.
Summarize evidence and link to document paths instead.

Replace stale narrative instead of appending a running history. Remove superseded or
contradictory claims and link to approvals, assessments, and reviews rather than retelling
them. A completed prerequisite must never be described as a completed feature. Every use of
`complete` names the exact product, feature, service, or slice that is complete.

## Product-first status

For status, resume, handoff, remaining-work, readiness, and next-action requests, report
engineering reality before process state. A reader should see, in order:

- the end goal;
- what works today and where;
- what is reusable today;
- the current increment;
- shared work that remains;
- target-owned implementation that remains;
- deferred work that does not block the goal;
- exact blockers before coding; and
- one next executable action.

Use ordinary technical names. Put document state, approvals, IDs, hashes, and checker
counts afterward as supporting evidence. If `complete` could mean either a prerequisite or
the broader feature, state both scopes explicitly.

## Required Shape

New files use this section order. Older WIP files remain readable and should be converted
when they are materially updated:

```markdown
# SDLC Work In Progress

## Product Snapshot

Goal: end capability and target system
Working Today: capability and the system where it currently works
Reusable Today: shared code or contracts usable without further extraction
Current Increment: exact bounded slice and its state
Remaining Shared Work: extraction or shared refactoring still required
Target-Owned Work: target-specific adapters, persistence, APIs, or domain behavior
Deferred: non-blocking cleanup or migration
Before Coding: exact unresolved decisions, approvals, reviews, or merges; `none` when clear
Next Action: one executable action

## Process Snapshot

Last Updated: 2026-07-03T00:00:00Z
Updated By: agent
Current Stage: spec-create | spec-review | design-create | plan-create | code-create | ...
Current Gate: none | human-review | blocked | approved-for-next-stage
Project Entry Mode: greenfield | brownfield_baseline | brownfield_delta_only | unknown
Work Scope: product/system | feature/component | slice/change | unknown
Ready To Implement: Yes | No | unknown
Delivery Assurance Profile: Lean | Standard | High-assurance | unknown
Approval Policy: Human checkpoints | Automatic eligible gates | unknown
Work Outcome: Product increment | Decision/evidence | unknown
Extra Checks: comma-separated checks or none

## Current Artifacts

| Kind | Path | Status | Notes |
| --- | --- | --- | --- |
| Spec | selected canonical path | draft/reviewed/approved/stale/missing | ... |
| Design | selected canonical path | draft/reviewed/approved/stale/missing | ... |
| Plan | selected canonical path | draft/reviewed/approved/stale/missing | ... |
| Latest review or assessment | selected `reviews/*.md` path | Pass/Pass-with-fixes/Needs rework/Blocked-upstream | ... |

## Decisions And Assumptions

- Decision or assumption, with source path when applicable.

## Check And Review Evidence

- Command or review performed, date, result, and where details live.

## Results And Feedback

Expected Result: what the current change should demonstrate
Feedback From: person, real system, environment, or objective result that can judge it
Feedback Status: received | requested | unavailable | not-applicable
Feedback Evidence: path, review, observation, or concise remaining-risk note
Current Work Group: exact WAVE-AREA-NAME, or none
Current Work: exact selected WORK-AREA-NAME, or none
Parallel Limit: positive integer or not-recorded
What Changed: result that changed or confirmed the plan
Documents To Update: earlier documents that need updating and their paths
Stop Conditions: conditions that pause or cancel active parallel work

## Open Questions And Blockers

- Question or blocker, owner, and why it matters.

## Bootstrap Status

Bootstrap File: AGENTS.md | CLAUDE.md | .github/copilot-instructions.md | none
Status: not-offered | offered | accepted | injected | declined | deferred
Notes: ...
```

Add compact subsections only when they improve resumability. Keep the product snapshot short
enough to read in two minutes and the whole file short enough for a fresh context; prefer
links to documents over copied content.

The renderer also accepts the field names used by older WIP files. New files use the plain
labels above.

## Fresh Context Resume Procedure

A fresh agent context should:

1. Read the repository bootstrap file, if present.
2. Read the product snapshot in `.sdlc/wip.md`, then its process evidence.
3. Read `.sdlc/process-decisions.yaml`, `.sdlc/approvals.yaml`,
   `.sdlc/code-assessments.yaml`, and `.sdlc/wave-checkpoints.yaml` when present.
4. Load the selected stage prompt and triggered docs using `docs/progressive-disclosure.md`.
5. Re-open the source document paths named in WIP before editing or judging them.
6. Check feedback status, active learning dependencies, and parent-document outcomes before
   starting another slice.
7. Continue from `Next Action`, unless the user's latest instruction changes the stage or
   scope.

If WIP is missing in a project that is already using the process, reconstruct the smallest
accurate WIP from existing documents and ask the user to confirm when the reconstruction
materially affects the next stage.
