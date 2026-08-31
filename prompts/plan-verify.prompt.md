---
description: Run repeatable format and link checks for a work plan without judging its quality.
agent: agent
---

# Plan Verify

Read `.sdlc/wip.md` as a resume note when it exists. Follow
`docs/work-in-progress.md`, `docs/artifact-formatting.md`, and `docs/result-reporting.md`.
Before stopping, update WIP with the current command, files, results, open problems, and next
action. Do not store secrets or long logs.

Run repeatable checks for a work plan. This command collects evidence only; it does not
judge whether the plan divides work well. Use the `plan-review` command for independent judgment
and `plan-assess` for checks plus review.

Run the checks directly in the active context. Repeatable command execution does not require
a fresh sub-agent and does not judge overall quality.

Target the plan file the user provides; otherwise resolve the location with
`docs/document-locations.md`: normally `docs/plan.md` for Product/system, otherwise the
work slug's `.plan.md` file. Do not edit it unless explicitly asked.

## Checks

Run the controlling slice check first:

```pwsh
node checkers/check_spec.mjs slice.md --slice --json
```

When a separate design exists, also run its checker. Then run:

```pwsh
node checkers/check_plan.mjs plan.md --spec spec.md --design design.md --json
```

Without a standalone design, run:

```pwsh
node checkers/check_plan.mjs plan.md --spec spec.md --json
```

The checker validates structure and requirement coverage. Independently review the plan's required
Technical Decisions; the absence of a design checker does not prove that reasoning sound.

When checking a later gate that depends on approved earlier documents, add
`--require-approvals`. This checks `.sdlc/approvals.yaml` for hash-matched `spec.approved`,
`design.approved` when a standalone design exists, and, when applicable,
`ux.mock.approved` records with UTC `approved_at` timestamps. Do not require approval while drafting; require it only when the plan is ready to
advance and the recorded policy makes the gate applicable.

For a plan that relies on accepted baseline documents, verify those documents first,
then run the plan checker with `--feature` and the parent document options needed to
check its inherited IDs. Use `--inherited-subset --spec <parent-spec> --design
<parent-design>` so cited IDs are validated without requiring allocation of the complete
parent inventory. Do not require missing child spec/design files. For focused
feature/component or slice/change plans, add `--feature` and `--parent` when applicable.

Report:

- Exact commands executed.
- Document structure problems, including Implementation Approach placement (or legacy
  Implementation Crux), visible machine-only headings, final traceability, references that do
  not resolve between annotations and tables, and work-group parsing. Do not apply the new
  format to an unmarked legacy file.
- Raw checker JSON.
- Exit codes.
- `passed/total`.
- Any spec/design failures.
- Every failure category reported by the checker, including invalid or duplicate IDs, broken
  references, uncovered `FR-*`, `AT-*`, `JT-*`, `COMP-*`, or `TEST-*` links, dependencies on
  later work, and vague wording hits.
- Every declared work group and any invalid or duplicate `WAVE-*` ID or order, missing group
  field, invalid parallel-work limit, or unknown or duplicate member. Unscheduled `WORK-*`
  items are valid.
- The `external_double_mentions` and `external_double_mitigation_present` totals.
- When an external dependency is mocked, what remains untested and how the plan checks it
  against the real dependency or its official test interface.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

Start with one plain result from `docs/result-reporting.md`:

- **Verification result**: Checks passed / Checks failed / Checks could not run.
- **Interpretation**: what the checks establish, before raw totals or JSON.
- **Evidence limits**: format and link checks only; independent review is still required for
  scope, sequence, expected file changes, test quality, and risk.
- **Recommended next command**: `plan-review` or `plan-assess`, using the current host's explicit invocation form.
