# Feedback And Learning

Sarathi is iterative. Specs, designs, and plans record the current agreed requirements and
decisions. They are not a one-way handoff chain, and approval does not freeze them.

## Approval Meaning

Approval means a document is sufficient and safe for the next change. It does not
mean the document is final, complete, or presumed correct. Approval should consider
available feedback from appropriate stakeholders, record feedback not yet obtained, and
expect revision when implementation, integration, deployment, or use produces new evidence.

An approval record proves only that the required fields are present and its saved hash
matches the current file. It does not prove that feedback occurred, that an approver
represents end users, or that the document will remain correct after the next slice.

## Planning feedback

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

For approved-prototype UI work, the prototype is inherited UI intent. Do not create another
product-wide mock or respecify the complete feature before the first slice. Implement a
prototype-matching UI slice, run its checks, and stop for stakeholder UI review. That review
is mandatory after every completed UI slice before learning-dependent UI work continues.

## Inspect And Adapt

After each reviewed code change, inspect the result before starting work that depends on it.
Check the affected earlier documents and other active work:

| Area | Ask |
| --- | --- |
| Spec | Did observed behavior or feedback change a need, acceptance criterion, non-goal, or constraint? |
| Design | Did implementation or integration reveal a different boundary, tactic, interface, risk, or test obligation? |
| Plan | Should remaining slices be reordered, split, cancelled, combined, or newly created? |
| Code and integration | Did the slice expose compatibility, migration, deployment, observability, or cross-slice work? |
| Process | Did a checker, prompt, fixture, or evidence rule encourage waste or a false claim? |

Record one outcome per affected area:

- `no-change`: current accepted documents still fit; cite the evidence.
- `revision-proposed`: a useful change is identified but does not block safe learning.
- `revision-required`: revise and reassess the controlling document before affected work
  continues.
- `feedback-required`: the next decision depends on feedback that has not arrived.

Record the current state in `.sdlc/wip.md` using the fields from
[work-in-progress.md](work-in-progress.md). When a slice receives a passing code assessment,
preserve its completed learning evidence in an assessment record that matches the current
plan so workflow status can show branch history without treating WIP or Git activity as
proof.

The agent performs this scan and may draft evidence-backed revisions. It must not silently
redefine accepted product behavior, contracts, safety posture, or scope. Material revisions
go through the matching create/assess command and human review gate. Small factual updates
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

The current group and active members live in `.sdlc/wip.md`. A completed checkpoint lives in
`.sdlc/wave-checkpoints.yaml` and binds the group ID and exact members to the current governing
plan SHA-256. It records `status: completed`, completion time, feedback evidence, what the
feedback changed, and earlier-document impact. This records the end of one group; it is not a
full code assessment, human approval, merge claim, or authorization to begin the next group.
Changing the plan or group membership makes the checkpoint stale.

Batch checker execution, approval recording, status rendering, and ledger updates as one
automatic bookkeeping step at the boundary. Do not introduce repeated user-facing pauses
between them. Historical approvals remain history and must not be reported repeatedly as
current invalid-record noise after an approved revision.

Unattended or end-to-end mode may cross human collaboration pauses when explicitly requested,
but it does not remove learning dependencies. The agent must still stop or replan work whose
accepted assumptions were shown to be wrong.
