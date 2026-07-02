---
description: Run deterministic structural verification for a Software Design Document and report evidence without qualitative judgment.
agent: agent
---

# Design Verify

Run mechanical verification for a Software Design Document. This command collects evidence
only; it does not judge whether the design is a good design. Use `/design-review` for
qualitative judgment and `/design-assess` for verify + review.

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
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- **Evidence limits**: structural verification only; qualitative review still required for
  design fitness, trade-offs, cohesion/coupling, risks, ADRs, and testability.
- **Recommended next command**: `/design-review` or `/design-assess`.
