---
description: Run repeatable format and link checks for a Software Requirements Specification without judging its quality.
agent: agent
---

# Spec Verify

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

Run the repeatable checks for a Software Requirements Specification. This command
collects evidence only; it does not decide whether the spec is good, complete, or ready.
Use `/spec-review` for independent judgment and `/spec-assess` for checks plus review.

If the host exposes sub-agent capability, run this verification in a fresh-context
checker sub-agent. This is mandatory for verify stages. The checker reports repeatable
results only and does not judge overall quality. If sub-agents are unavailable, state that
the host lacks sub-agent capability and run the same
checks directly.

Target the spec file the user provides, defaulting to `spec.md`. Do not edit it unless
explicitly asked.

If the user is verifying a feature/component or slice/change spec that references a parent
product/system spec, add `--feature --parent <parent-spec.md>`.

## Checks

Run:

```pwsh
python checkers/check_spec.py <spec.md> --json
```

For focused specs:

```pwsh
python checkers/check_spec.py <spec.md> --feature --parent <parent-spec.md> --json
```

When checking that an already-reviewed spec has a valid local approval before later
work, add `--require-approvals`. This checks `.sdlc/approvals.yaml` for a hash-matched
`spec.approved` record with a UTC `approved_at` timestamp. Do not require approvals while
drafting a spec that still needs human review.

If `python` is unavailable or fails because the launcher is missing, retry with `python3`;
if that is unavailable, retry with `uv run python`.

Report:

- Exact command executed.
- Artifact format and human-first structure issues: crux placement, machine-only visible
  headings, final traceability, and annotation/table resolution. Unmarked legacy files stay
  on the legacy contract.
- Raw checker JSON.
- Exit code.
- `passed/total`.
- UC and FR acceptance coverage percentages.
- Any uncovered IDs, orphan refs, duplicates, bad ID format, NFR unit issues,
  acceptance-test shape issues, journey-test sequence/composition issues, or vague hits.
- Whether the required **External Interfaces & Contracts** section is present in full-spec
  mode. This checks structure only; independent review still judges whether each
  external contract is concrete and real-boundary testable.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- **Evidence limits**: format and link checks only; independent review is still required for
  problem framing, stakeholder fidelity, ambiguity, completeness, and acceptance quality.
- **Recommended next command**: `/spec-review` or `/spec-assess`.
