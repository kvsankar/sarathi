# Work In Progress State

Sarathi should keep a short resumable note in `.sdlc/wip.md`. It lets a fresh agent context
continue without depending on chat history.

`wip.md` is not an approval record, a source of product truth, or proof that checks passed.
Specs, designs, plans, code, tests, `.sdlc/process-decisions.yaml`, and
`.sdlc/approvals.yaml` remain the source records. Treat `.sdlc/wip.md` as a current
navigation note that can become stale.

## When To Read

At the start of any Sarathi command or general Sarathi request:

- read `.sdlc/wip.md` if it exists;
- read `.sdlc/process-decisions.yaml` if it exists;
- use both only to choose the next command and find relevant documents;
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

## What The Note Must Answer

For formal status, remaining-work, readiness, and next-action requests, report engineering
reality first and follow [result-reporting.md](result-reporting.md).
A reader should be able to answer six questions quickly:

- What are we working on?
- What is done and working?
- Which files matter?
- What is blocking progress?
- What feedback has arrived?
- What happens next?

Use ordinary technical language and impact-ranked actions. Keep document state, approvals,
internal verdicts, IDs, hashes, and checker fields out of the response unless the user asks
or the detail changes what can happen next. If `complete` could mean either a prerequisite
or the broader feature, state both scopes explicitly.

## Default Shape

New files use this section order. Older WIP files remain readable and should be converted
when they are materially updated:

```markdown
# SDLC Work In Progress

## Current Work

Status Result: Ready | Ready after minor fixes | Not ready | Cannot assess yet
Status Summary: plain-language reason and consequence for the recorded status
Goal: end capability and target system
Working Result: what is done and where it works
Work Target: short human-readable name of the current subject
Work Scope: product/system | feature/component | slice/change | unknown
Current Command: spec-create | spec-review | design-create | plan-create | code-create | ...
Ready To Implement: Yes | No | unknown
Blockers: exact unresolved decision, approval, review, dependency, or `none`
Next Action: one executable action

## Relevant Files

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

## Feedback

Expected Result: what the current change should demonstrate
Feedback From: person, real system, environment, or objective result that can judge it
Feedback Status: received | requested | unavailable | not-applicable
Feedback Evidence: path, review, observation, or concise remaining-risk note
What Changed: result that changed or confirmed the plan
Documents To Update: earlier documents that need updating and their paths
Stop Conditions: conditions that pause or cancel active parallel work

## Coordinated Work

Current Work Group: exact WAVE-AREA-NAME, or none
Current Work: exact selected WORK-AREA-NAME, or none
Parallel Limit: positive integer or not-recorded
```

Omit `Feedback`, `Coordinated Work`, `Decisions And Assumptions`, or `Check And Review
Evidence` when the section has nothing useful to say. Keep the whole file short enough to
scan in two minutes and prefer links over copied content.

Project-wide choices such as entry mode, the default assurance profile, approval policy,
work outcome, and default extra checks belong in `.sdlc/process-decisions.yaml`. A
change-specific choice belongs in its spec or plan. Do not copy either into a new WIP note;
the note points to the relevant files. This avoids stale competing values.

The renderer also accepts the former section headings and fields, including the expanded
product snapshot, copied delivery choices, and a combined value such as `Current Stage:
code-create`. New files use `Working Result`, `Relevant Files`, `Feedback`, `Work Target`,
`Work Scope`, and `Current Command`; stage and action are derived from the command rather
than stored as duplicate state. See `docs/workflow-terminology.md`.

The spec, design, plan, and code checkers validate only the machine-read values in this note
and `.sdlc/process-decisions.yaml`. They reject malformed commands, enumerated values, IDs,
limits, and YAML shapes. Optional fields may be absent, legacy field names remain accepted,
and free-form summaries are not judged by a checker. The status page shows the same concrete
issues rather than silently treating an invalid value as missing.

## Fresh Context Resume Procedure

A fresh agent context should:

1. Read the repository bootstrap file, if present.
2. Read the current-work summary and relevant file paths in `.sdlc/wip.md`.
3. Read `.sdlc/process-decisions.yaml`, `.sdlc/approvals.yaml`, and
   `.sdlc/delivery-records.yaml` when present.
4. Load the selected command prompt and triggered docs using `docs/progressive-disclosure.md`.
5. Re-open the source document paths named in WIP before editing or judging them.
6. Check feedback, blockers, and coordinated-work limits when they are recorded.
7. Continue from `Next Action`, unless the user's latest instruction changes the stage or
   scope.

If WIP is missing in a project that is already using the process, reconstruct the smallest
accurate WIP from existing documents and ask the user to confirm when the reconstruction
materially affects the next stage.
