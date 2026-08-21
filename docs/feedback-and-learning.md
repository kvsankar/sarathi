# Feedback And Learning

Sarathi expects plans to change when real results teach us something. Specs, designs, and
plans record the current agreed requirements and decisions. Approval does not freeze them.

## Approval Meaning

Approval means a document is sufficient and safe for the next change. It does not
mean the document is final, complete, or presumed correct. Approval should consider
available feedback from appropriate stakeholders, record feedback not yet obtained, and
expect revision when implementation, integration, deployment, or use produces new evidence.

Production incidents, support reports, and monitoring results may start new work or revise
existing requirements; Sarathi does not manage incident response or continuous product
operations.

An approval record proves only that the required fields are present and its saved hash
matches the current file. It does not prove that feedback occurred, that an approver
represents end users, or that the document will remain correct after the next slice.

## Plan For Feedback

For each change, answer three questions:

- What should this change demonstrate?
- Who or what can judge the result? This may be an end user, product owner, operator,
  reviewer, real dependency, telemetry, or acceptance environment.
- What result would make us change the plan?

Record one feedback status when the change is complete:

- `received`: concrete stakeholder or observed-system evidence was obtained.
- `requested`: feedback has been requested and is still pending.
- `unavailable`: the planned source could not be reached; record the remaining risk.
- `not-applicable`: no external feedback is useful for this slice; name the objective
  evidence used instead.

Never invent stakeholder feedback. Technical checks can support a decision, but they do not
stand in for end-user or stakeholder judgment when the change needs it.

For UI work based on an approved prototype, use that prototype instead of creating another
product-wide mock or rewriting the whole feature. Implement one UI change that matches the
prototype, run its checks, and stop for stakeholder review. Review each completed UI change
before starting UI work that depends on its result.

## Inspect And Adapt

After each reviewed code change, inspect the result before starting work that depends on it.
Check the affected earlier documents and other active work:

| Area | Ask |
| --- | --- |
| Spec | Did observed behavior or feedback change a need, acceptance criterion, non-goal, or constraint? |
| Design | Did implementation or integration reveal a different interface, technical approach, risk, or required test? |
| Plan | Should remaining slices be reordered, split, cancelled, combined, or newly created? |
| Code and integration | Did the slice expose compatibility, migration, deployment, observability, or cross-slice work? |
| Process | Did a checker, prompt, fixture, or evidence rule encourage waste or a false claim? |

Record one outcome per affected area:

- `no-change`: current accepted documents still fit; cite the evidence.
- `revision-proposed`: a useful document change is identified but does not block safe work.
- `revision-required`: revise and reassess the document before affected work
  continues.
- `feedback-required`: the next decision depends on feedback that has not arrived.

Use `revision-required` only when the accepted document itself must change—for example, its
behavior, scope, contract, acceptance criteria, architecture, required proof, or stated risk.
If the document is right and the code is wrong, fix the code and record `no-change` for the
document. Use `revision-proposed` for useful wording or consistency changes that do not
change what should be built.

A required revision names the exact document and requirements or decisions that must change.
It also names the work that depends on them and must wait, and the work that may continue.
Do not mark every earlier document for revision, stop unrelated fixes, or reassess an
unchanged document merely because another document changed. Use `Blocked-upstream` only when
the named problems prevent a safe, sound judgment of the requested work.

Record the current state in `.sdlc/wip.md` using the fields from
[work-in-progress.md](work-in-progress.md). When a slice receives a passing code assessment,
preserve its completed learning evidence in an assessment record that matches the current
plan so workflow status can show branch history without treating WIP or Git activity as
proof.

The agent performs this check and may draft revisions supported by observed results. It must
not silently change accepted product behavior, contracts, safety rules, or scope. Material revisions
go through the matching create/assess command and recorded approval policy. Small factual updates
that preserve approved behavior may be included in the current change when they stay within
the files expected to change.

## Parallel work

Agent capacity is not, by itself, a reason to start more slices. Ask:

> Could feedback from this slice materially invalidate another slice already underway?

Check whether one change must finish before another can run, whether one result could change
another change's requirements or priority, and where separately built changes will be
combined and tested.

Prefer parallel work inside one defined change. Run separate changes concurrently only when
the result of one cannot change the other, file ownership is clear, and someone owns
integration and review. Keep speculative later work reversible, timeboxed, and easy to
discard.

For a group of parallel changes, record how many may run at once, when they will be combined
and reviewed, and what would stop or change the work. Prefer detailed near-term plans over
elaborating distant changes whose assumptions have not been tested.

Breakdown plans may schedule near-term child work in a `Work Groups` section. Each
`WAVE-AREA-NAME` block declares `Order`, `Expected Result`, `Members`, `Parallel Limit`,
`Review Point`, and `Stop Conditions`. Members are `WORK-*` items;
a scheduled child belongs to exactly one group, while an unscheduled child has no group. An
Implementation plan lists the PRs for one child; PRs do not belong to groups.

The current group and active members live in `.sdlc/wip.md`. When a group finishes, a
`wave_checkpoint` entry in `.sdlc/delivery-records.yaml` records the group ID, exact members,
current plan SHA-256, `status: completed`, completion time, feedback, and document changes.
It marks only that group as finished. It is not a code assessment, human approval, merge
claim, or permission to start the next group. Changing the plan or group membership makes
the checkpoint stale.

Run checks, record approvals, update status, and update the records together as one automatic
step. Do not pause the user between these bookkeeping actions. Keep old approvals as history,
but do not repeatedly report them as current errors after a document is revised and approved.

Unattended or end-to-end mode may cross a collaboration pause only when the recorded approval
policy permits automatic approval for that local gate. It does not remove learning
dependencies or cross protected gates, including release/deployment, security/privacy
acceptance, and required UI approval. The agent must still stop or replan work whose accepted
assumptions were shown to be wrong.
