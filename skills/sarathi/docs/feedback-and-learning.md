# Feedback And Learning

Sarathi is iterative. Specs, designs, and plans record the **current accepted
understanding**: the best accepted basis for the next learning step. They are not a
one-way handoff chain, and approval does not freeze them.

## Approval Meaning

Approval means a document is sufficient and safe for the next learning step. It does not
mean the document is final, complete, or presumed correct. Approval should consider
available feedback from appropriate stakeholders, record feedback not yet obtained, and
expect revision when implementation, integration, deployment, or use produces new evidence.

An approval record proves only that the required fields are present and its saved hash
matches the current file. It does not prove that feedback occurred, that an approver
represents end users, or that the document will remain correct after the next slice.

## Feedback Ownership

Every code-ready slice identifies:

- **Learning target**: the important assumption, behavior, boundary, or risk the slice will
  test.
- **Feedback target**: the people or evidence able to judge the result, such as end users,
  a product owner, operators, support, security/privacy reviewers, integrators, a real
  dependency, telemetry, or an executable acceptance environment.
- **Feedback method**: demo, usability session, acceptance run, integration result,
  operational observation, review, or another concrete signal.
- **Invalidation question**: what result would change a parent spec/design/plan or make
  planned sibling work unsafe to continue. In other words: what would change the plan?

Use one feedback status at a slice boundary:

- `received`: concrete stakeholder or observed-system evidence was obtained.
- `requested`: feedback has been requested and is still pending.
- `unavailable`: the planned source could not be reached; record the remaining risk.
- `not-applicable`: no external feedback is useful for this slice; name the objective
  evidence used instead.

Never invent stakeholder feedback. Technical checks can support a decision, but they do not
stand in for end-user or stakeholder judgment when the learning target requires it.

## Inspect And Adapt

After each assessed code slice, and before starting learning-dependent work, inspect the
new evidence against all affected parent documents and active sibling work:

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

Record the current loop in `.sdlc/wip.md` using the exact fields from
[work-in-progress.md](work-in-progress.md). When a slice receives a passing code assessment,
preserve its completed learning evidence in an assessment record that matches the current
plan so workflow status can show branch history without treating WIP or Git activity as
proof.

The agent performs this scan and may draft evidence-backed revisions. It must not silently
redefine accepted product behavior, contracts, safety posture, or scope. Material revisions
go through the matching create/assess command and human review gate. Small factual updates
that preserve accepted intent may be included in the current slice when its Planned Touch
Set permits them.

## Parallel Learning Waves

Agent capacity is not, by itself, a reason to start more slices. Ask:

> Could feedback from this slice materially invalidate another slice already underway?

Classify dependencies explicitly:

- **Execution dependency**: one change or artifact must exist before another can run.
- **Learning dependency**: evidence from one slice may materially change another slice's
  requirement, design, or priority.
- **Integration dependency**: slices can be built separately but need a planned convergence
  point and shared checks.

Use three parallelism classes:

1. **Intra-slice parallelism** is preferred. Sub-agents may work concurrently on tests,
   implementation, docs, threat review, or checks inside one defined slice when
   touch ownership and integration are clear.
2. **Independent-slice parallelism** is selective. Put slices in the same bounded learning
   wave only when feedback from one cannot materially change another, shared touch sets are controlled,
   integration ownership is explicit, and review/feedback capacity exists.
3. **Speculative downstream parallelism** is exceptional. Keep it reversible, timeboxed,
   and easy to discard; do not present it as completed production work before its learning
   dependency resolves.

Each parallel wave records its WIP limit, feedback/integration checkpoint, and conditions
for stopping or replanning. Close the wave by assessing its slices, collecting available
feedback, checking which parent documents need changes, and revising the next wave. Prefer
progressively detailed near-term
plans over elaborating distant slices whose assumptions have not yet been tested.

Plans make that sequence deterministic in an exact `Learning Waves` section. Each
`WAVE-AREA-NAME` block declares `Order`, `Learning Target`, `Members`, `WIP Limit`,
`Feedback/Integration Checkpoint`, and `Stop/Replan Triggers`. Breakdown-plan members are
`WORK-*` allocations; Implementation-plan members are `PR-*` items. Every delivery item
belongs to exactly one wave, and order is local to its plan.

The current wave and active members live in `.sdlc/wip.md`. A completed checkpoint lives in
`.sdlc/wave-checkpoints.yaml` and binds the wave ID and exact members to the current governing
plan SHA-256. It records `status: completed`, completion time, feedback evidence, what the
feedback changed, and parent-document impact. This records the end of one wave; it is not a
full code assessment, human approval, merge claim, or authorization to begin the next wave.
Changing the plan or wave membership makes the checkpoint stale.

Unattended or end-to-end mode may cross human collaboration pauses when explicitly requested,
but it does not remove learning dependencies. The agent must still stop or replan work whose
accepted assumptions were shown to be wrong.
