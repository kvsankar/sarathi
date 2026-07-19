---
description: Run repeatable format and link checks for a Software Design Document without judging its quality.
agent: agent
---

# Design Verify

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

Run repeatable checks for a Software Design Document. This command collects evidence
only; it does not judge whether the design is a good design. Use `/design-review` for
independent judgment and `/design-assess` for checks plus review.

If the host exposes sub-agent capability, run this verification in a fresh-context
checker sub-agent. This is mandatory for verify stages. The checker reports repeatable
results only and does not judge overall quality. If sub-agents are unavailable, state that
the host lacks sub-agent capability and run the same
checks directly.

Target the design file the user provides, defaulting to `design.md`. Do not edit it unless
explicitly asked.

## Checks

When an earlier spec exists, first run:

```pwsh
python checkers/check_spec.py spec.md --json
```

Then run:

```pwsh
python checkers/check_design.py design.md --spec spec.md --json
```

When checking a later gate that depends on an already-approved spec or required mock
UI, add `--require-approvals`. This checks `.sdlc/approvals.yaml` for hash-matched
`spec.approved` and, when applicable, `ux.mock.approved` records with UTC `approved_at`
timestamps. Do not require approvals while drafting a design that still needs human review.

For a component/slice design, add `--component` and `--parent <parent-design.md>` when
applicable.

If `python` is unavailable or fails because the launcher is missing, retry with `python3`;
if that is unavailable, retry with `uv run python`.

Report:

- Exact commands executed.
- Artifact format and human-first structure issues: Technical Crux placement, machine-only
  visible headings, final traceability, and annotation/table resolution. Unmarked legacy
  files stay on the legacy contract.
- Raw checker JSON.
- Exit codes.
- `passed/total`.
- Any spec failures.
- Any bad IDs, duplicates, orphan refs, component requirement coverage gaps, component test
  obligation gaps, missing/untraced `TEST-` obligations, missing `JT-`-to-`TEST` journey
  coverage visible in the design, ambiguous interface ownership, dependency cycles, or
  vague hits.
- Exact complexity-budget fields and generic-machinery signals. These are prompts for
  independent review, not proof that machinery is justified or overbuilt.
- `external_double_mentions`, `external_double_drift_risks`, and
  `external_double_mitigation_tests`. If a design mentions mocked/faked/stubbed or locally
  mirrored external interfaces, the checker requires a drift risk plus real-boundary
  or type-conformance mitigation evidence.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- **Evidence limits**: format and link checks only; independent review is still required for
  design fitness, trade-offs, cohesion/coupling, risks, ADRs, and testability.
- **Recommended next command**: `/design-review` or `/design-assess`.
