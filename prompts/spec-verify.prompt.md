---
description: Run repeatable format and link checks for a Software Requirements Specification without judging its quality.
agent: agent
---

# Spec Verify

Read `.sdlc/wip.md` as a resume note when it exists. Follow
`docs/work-in-progress.md`, `docs/artifact-formatting.md`, and `docs/result-reporting.md`.
Before stopping, update WIP with the current command, files, results, open problems, and next
action. Do not store secrets or long logs.

Run the repeatable checks for a Software Requirements Specification. This command
collects evidence only; it does not decide whether the spec is good, complete, or ready.
Use the `spec-review` command for independent judgment and `spec-assess` for checks plus review.

Run the checks directly in the active context. Repeatable command execution does not require
a fresh sub-agent and does not judge overall quality.

Target the spec file the user provides; otherwise resolve the location with
`docs/document-locations.md`: normally `docs/spec.md` for Product/system, otherwise the
work slug's `.spec.md` file. Do not edit it unless explicitly asked.

If the user is verifying a feature/component or slice/change spec that references a parent
product/system spec, add `--feature --parent <parent-spec.md>`.

## Checks

Run:

```pwsh
node checkers/check_spec.mjs <spec.md> --json
```

For focused specs:

```pwsh
node checkers/check_spec.mjs <spec.md> --feature --parent <parent-spec.md> --json
```

When checking that an already-reviewed spec has a valid local approval before later
work, add `--require-approvals`. This checks `.sdlc/approvals.yaml` for a hash-matched
`spec.approved` record with a UTC `approved_at` timestamp. Do not require approval while
drafting; require it only when the spec is ready to advance and the recorded policy makes the
gate applicable.

Report:

- Exact command executed.
- Document structure problems, including Product Overview placement (or legacy Product
  Crux), visible machine-only headings, final traceability, and references that do not resolve
  between annotations and tables. Do not apply the new format to an unmarked legacy file.
- Raw checker JSON.
- Exit code.
- `passed/total`.
- UC and FR acceptance coverage percentages.
- Every failure category reported by the checker, including uncovered or duplicate IDs,
  broken references, invalid ID formats, missing units for quality requirements, malformed
  acceptance tests, broken journey order or composition, and vague wording hits.
- Whether the required **External Interfaces & Contracts** section is present in full-spec
  mode. This checks structure only; independent review still judges whether each
  external contract is concrete and testable through the real dependency or its official
  test interface.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

Start with one plain result from `docs/result-reporting.md`:

- **Verification result**: Checks passed / Checks failed / Checks could not run.
- **Interpretation**: what the checks establish, before raw totals or JSON.
- **Evidence limits**: format and link checks only; independent review is still required to
  judge the problem, accuracy to user needs, clarity, completeness, and acceptance tests.
- **Recommended next command**: `spec-review` or `spec-assess`, using the current host's explicit invocation form.
