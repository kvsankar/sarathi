---
description: Run deterministic structural verification for a work plan and report evidence without qualitative judgment.
agent: agent
---

# Plan Verify

## Workflow state

At the start of this stage, follow `docs/work-in-progress.md`: read `.sdlc/wip.md` if it
exists, verify important claims against the named artifacts, and use it only as a resume
note. Before any hard stop, blocker report, or completed stage handoff, update `.sdlc/wip.md`
with the current stage, artifact paths, decisions/assumptions, verification evidence,
blockers/open questions, bootstrap status, and next recommended action. Do not store
secrets or long command logs.

## Artifact formatting

For Markdown artifacts and reports produced or revised in this stage, follow
`docs/artifact-formatting.md`: wrap normal prose and list continuation lines at 80
characters where practical, while allowing longer lines for tables, URLs, code/logs,
paths, hashes, IDs, approval records, and syntax where wrapping would reduce correctness
or readability.

Run mechanical verification for a work plan. This command collects evidence only; it does
not judge whether the plan slices work well. Use `/plan-review` for qualitative judgment
and `/plan-assess` for verify + review.

If the host exposes sub-agent capability, run this verification in a fresh-context
Mechanical Verifier sub-agent. This is mandatory for verify stages. The Mechanical Verifier
reports deterministic evidence only and does not give a qualitative verdict. If sub-agents
are unavailable, state that the host lacks sub-agent capability and run the same mechanical
checks directly.

Target the plan file the user provides, defaulting to `plan.md`. Do not edit it unless
explicitly asked.

## Mechanical Verification

When upstream artifacts exist, first run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
```

Then run:

```pwsh
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

When verifying a downstream gate that depends on approved upstream artifacts, add
`--require-approvals`. This checks `.sdlc/approvals.yaml` for hash-matched `spec.approved`,
`design.approved`, and, when applicable, `ux.mock.approved` records with UTC `approved_at`
timestamps. Do not require approvals while drafting a plan that still needs human review.

For focused feature/component or slice/change plans, add `--feature` and `--parent` when
applicable.

If `python` is unavailable or fails because the launcher is missing, retry with `python3`;
if that is unavailable, retry with `uv run python`.

Report:

- Exact commands executed.
- Raw checker JSON.
- Exit codes.
- `passed/total`.
- Any upstream spec/design failures.
- Any bad IDs, duplicates, orphan refs, uncovered FR/AT/JT/COMP/TEST refs, missing
  Red/Green text, forward dependencies, or vague hits.
- Declared learning waves, malformed or duplicate `WAVE-*` IDs/orders, missing required wave
  fields, invalid WIP limits, and unknown, duplicate, or unassigned `WORK-*`/`PR-*` members.
- Complexity-budget presence, generic-machinery signals, and the bounded Slice/change
  implementation PR gate, including exception rationale and hash-current approval evidence.
- `external_double_mentions` and `external_double_mitigation_present`. If a plan uses a
  mock/fake/stub/test double for an external system, the structural gate requires a
  real-boundary, official-conformance, type-conformance, generated-schema/client,
  sandbox/emulator, captured-real-fixture, or user-approved mitigation allocation.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- **Evidence limits**: structural verification only; qualitative review still required for
  slicing, sequencing, TDD usefulness, touch-set fidelity, and risk.
- **Recommended next command**: `/plan-review` or `/plan-assess`.
