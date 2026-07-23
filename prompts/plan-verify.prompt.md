---
description: Run repeatable format and link checks for a work plan without judging its quality.
agent: agent
---

# Plan Verify

## Workflow state

At the start of this stage, follow `docs/work-in-progress.md`: read `.sdlc/wip.md` if it
exists, check important claims against the named files, and use it only as a resume note.
Before any hard stop, blocker report, or completed stage handoff, update `.sdlc/wip.md`
with the current stage, document paths, decisions/assumptions, check results,
blockers/open questions, bootstrap status, and next recommended action. Do not store
secrets or long command logs.

## Document formatting

For Markdown documents and reports produced or revised in this stage, follow
`docs/artifact-formatting.md`: wrap normal prose and list continuation lines at 80
characters where practical, while allowing longer lines for tables, URLs, code/logs,
paths, hashes, IDs, approval records, and syntax where wrapping would reduce correctness
or readability.

Run repeatable checks for a work plan. This command collects evidence only; it does not
judge whether the plan divides work well. Use `/plan-review` for independent judgment and
`/plan-assess` for checks plus review.

If the host exposes sub-agent capability, run this verification in a fresh-context
checker sub-agent. This is mandatory for verify stages. The checker reports repeatable
results only and does not judge overall quality. If sub-agents are unavailable, state that
the host lacks sub-agent capability and run the same
checks directly.

Target the plan file the user provides; otherwise resolve the location with
`docs/document-locations.md`: normally `docs/plan.md` for Product/system, otherwise the
work slug's `.plan.md` file. Do not edit it unless explicitly asked.

## Checks

When checking a Standard plan, first run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
```

Then run:

```pwsh
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

When checking a later gate that depends on approved earlier documents, add
`--require-approvals`. This checks `.sdlc/approvals.yaml` for hash-matched `spec.approved`,
`design.approved`, and, when applicable, `ux.mock.approved` records with UTC `approved_at`
timestamps. Do not require approval while drafting; require it only when the plan is ready to
advance and the recorded policy makes the gate applicable.

For a compact plan that relies on approved parent documents, verify those documents first,
then run the plan checker with `--feature` and the parent document options needed to
check its inherited IDs. Use `--inherited-subset --spec <parent-spec> --design
<parent-design>` so cited IDs are validated without requiring allocation of the complete
parent inventory. Do not require missing child spec/design files. For focused
feature/component or slice/change plans, add `--feature` and `--parent` when applicable.

If `python` is unavailable or fails because the launcher is missing, retry with `python3`;
if that is unavailable, retry with `uv run python`.

Report:

- Exact commands executed.
- Document format and human-first structure issues: Implementation Approach placement (or
  legacy Implementation Crux), machine-only visible headings, final traceability,
  annotation/table resolution, and descriptive hidden-ID work-group/delivery parsing. Unmarked
  legacy files stay legacy.
- Raw checker JSON.
- Exit codes.
- `passed/total`.
- Any spec/design failures.
- Any bad IDs, duplicates, orphan refs, uncovered FR/AT/JT/COMP/TEST refs, forward
  dependencies, or vague hits.
- Declared work groups, malformed or duplicate `WAVE-*` IDs/orders, missing required group fields,
  invalid parallel-work limits, and unknown or duplicate members. Unscheduled `WORK-*` items are valid.
- `external_double_mentions` and `external_double_mitigation_present`. If a plan uses a
  mock/fake/stub/test double for an external system, report what remains untested and the
  command or accepted mitigation that ties it to the real dependency or official test
  interface.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- **Evidence limits**: format and link checks only; independent review is still required for
  scope, sequence, expected file changes, test quality, and risk.
- **Recommended next command**: `/plan-review` or `/plan-assess`.
