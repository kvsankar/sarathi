---
description: Render a repeatable HTML delivery-progress summary and workflow tree.
agent: agent
---

# Workflow Status

Render a read-only Sarathi workflow-status page for the target project. Load
`docs/workflow-status.md`, `docs/work-decomposition.md`, `docs/assurance-profiles.md`, and
`docs/feedback-and-learning.md`; read `.sdlc/wip.md`, hash-current code-assessment records,
and current wave checkpoints when present, and check important claims against the source
documents. This command does not create or revise a spec, design, plan, approval,
implementation, or review report, so it does not advance a human gate.

Locate `render_workflow_status.py` in the target project's `checkers/` directory, this
skill bundle's `checkers/` directory, or the source repository's `checkers/` directory. Run:

```pwsh
python checkers/render_workflow_status.py <project-root> --output <project-root>/docs/sdlc-status.html
```

The command should also publish `docs/sarathi-process.html`, with bidirectional links
between the static process guide and live project status. If a project-local checker has no
companion `docs/sarathi.html`, locate the guide in the installed skill or source repository
and pass it with `--guide-source`.

Retry with `python3` or `uv run python` when needed. Do not hand-edit the generated HTML.
Use `--check` when the user asks for freshness verification or CI integration.

Report:

- generated status and process-guide paths;
- the concise progress summary shown by the page;
- any error, stale source, or missing input that prevents the page from being current or
  trustworthy;
- the workflow tree as the place to inspect a selected feature, slice, wave, or PR.

Do not restate hidden or progressively disclosed details in the command response. Do not
report snapshots, provenance, learning records, WIP limits, or exhaustive wave and PR counts
unless they are the specific problem being reported. The page must not infer completion,
quality, or stakeholder feedback from Git, approvals, tests, or missing records.
