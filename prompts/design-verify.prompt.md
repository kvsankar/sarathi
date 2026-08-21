---
description: Run repeatable format and link checks for a Software Design Document without judging its quality.
agent: agent
---

# Design Verify

Read `.sdlc/wip.md` as a resume note when it exists. Follow
`docs/work-in-progress.md`, `docs/artifact-formatting.md`, and `docs/result-reporting.md`.
Before stopping, update WIP with the current command, files, results, open problems, and next
action. Do not store secrets or long logs.

Run repeatable checks for a Software Design Document. This command collects evidence
only; it does not judge whether the design is a good design. Use the `design-review` command for
independent judgment and `design-assess` for checks plus review.

Run the checks directly in the active context. Repeatable command execution does not require
a fresh sub-agent and does not judge overall quality.

Target the design file the user provides; otherwise resolve the location with
`docs/document-locations.md`: normally `docs/design.md` for Product/system, otherwise the
work slug's `.design.md` file. Do not edit it unless explicitly asked.

## Checks

When an earlier spec exists, first run:

```pwsh
node checkers/check_spec.mjs spec.md --json
```

Then run:

```pwsh
node checkers/check_design.mjs design.md --spec spec.md --json
```

When checking a later gate that depends on an already-approved spec or required mock
UI, add `--require-approvals`. This checks `.sdlc/approvals.yaml` for hash-matched
`spec.approved` and, when applicable, `ux.mock.approved` records with UTC `approved_at`
timestamps. Do not require approval while drafting; require it only when the design is ready
to advance and the recorded policy makes the gate applicable.

For a component/slice design, add `--component` and `--parent <parent-design.md>` when
applicable.

Report:

- Exact commands executed.
- Document structure problems, including Technical Approach placement (or legacy Technical
  Crux), visible machine-only headings, final traceability, and references that do not resolve
  between annotations and tables. Do not apply the new format to an unmarked legacy file.
- Raw checker JSON.
- Exit codes.
- `passed/total`.
- Any spec failures.
- Every failure category reported by the checker, including invalid or duplicate IDs, broken
  references, missing component requirement or test coverage, missing or untraced `TEST-*`
  obligations, missing `JT-*` journey coverage, unclear interface ownership, dependency
  cycles, and vague wording hits.
- The `external_double_mentions`, `external_double_drift_risks`, and
  `external_double_mitigation_tests` totals.
- When an external dependency is mocked, what remains untested and how the contract is checked
  against the real dependency or its official types.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

Start with one plain result from `docs/result-reporting.md`:

- **Verification result**: Checks passed / Checks failed / Checks could not run.
- **Interpretation**: what the checks establish, before raw totals or JSON.
- **Evidence limits**: format and link checks only; independent review is still required for
  whether the design is suitable, trade-offs, dependencies, risks, decisions, and testability.
- **Recommended next command**: `design-review` or `design-assess`, using the current host's explicit invocation form.
