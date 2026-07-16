---
description: Run deterministic structural verification for a Software Design Document and report evidence without qualitative judgment.
agent: agent
---

# Design Verify

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

Run mechanical verification for a Software Design Document. This command collects evidence
only; it does not judge whether the design is a good design. Use `/design-review` for
qualitative judgment and `/design-assess` for verify + review.

If the host exposes sub-agent capability, run this verification in a fresh-context
Mechanical Verifier sub-agent. This is mandatory for verify stages. The Mechanical Verifier
reports deterministic evidence only and does not give a qualitative verdict. If sub-agents
are unavailable, state that the host lacks sub-agent capability and run the same mechanical
checks directly.

Target the design file the user provides, defaulting to `design.md`. Do not edit it unless
explicitly asked.

## Mechanical Verification

When an upstream spec exists, first run:

```pwsh
python checkers/check_spec.py spec.md --json
```

Then run:

```pwsh
python checkers/check_design.py design.md --spec spec.md --json
```

When verifying a downstream gate that depends on an already-approved spec or required mock
UI, add `--require-approvals`. This checks `.sdlc/approvals.yaml` for hash-matched
`spec.approved` and, when applicable, `ux.mock.approved` records with UTC `approved_at`
timestamps. Do not require approvals while drafting a design that still needs human review.

For a component/slice design, add `--component` and `--parent <parent-design.md>` when
applicable.

If `python` is unavailable or fails because the launcher is missing, retry with `python3`;
if that is unavailable, retry with `uv run python`.

Report:

- Exact commands executed.
- Raw checker JSON.
- Exit codes.
- `passed/total`.
- Any upstream spec failures.
- Any bad IDs, duplicates, orphan refs, component requirement coverage gaps, component test
  obligation gaps, missing/untraced `TEST-` obligations, missing `JT-`-to-`TEST` journey
  coverage visible in the design, ambiguous interface ownership, dependency cycles, or
  vague hits.
- Complexity-budget presence and generic-machinery signals. These are structural prompts
  for qualitative review, not proof that machinery is justified or overbuilt.
- `external_double_mentions`, `external_double_drift_risks`, and
  `external_double_mitigation_tests`. If a design mentions mocked/faked/stubbed or locally
  mirrored external interfaces, the structural gate requires a drift risk plus real-boundary
  or type-conformance mitigation evidence.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- **Evidence limits**: structural verification only; qualitative review still required for
  design fitness, trade-offs, cohesion/coupling, risks, ADRs, and testability.
- **Recommended next command**: `/design-review` or `/design-assess`.
