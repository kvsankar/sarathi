---
description: Render repeatable HTML work-tree and learning-wave views with implementation and feedback evidence.
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

- generated status and process-guide paths, plus the snapshot fingerprint;
- the executive current-focus breadcrumb, current stage, next gate, and immediate document
  gaps;
- the explicit current learning target, feedback status/evidence, active learning wave, WIP
  limit, active slice IDs, what feedback changed, changes needed in parent documents, and
  stop/replan triggers;
- the selected review depth and extra risk checks, or `Not recorded`;
- the product trunk and progressively disclosed parent-allocation branches, including
  explicit missing Spec/Design/Plan/Code nodes;
- each plan's ordered `WAVE-*` sequence, member states, active wave, WIP limit, planned
  feedback/integration checkpoint, and hash-current completed checkpoint evidence;
- spec/design/plan presence and whether approvals match the current files;
- valid and malformed parent-plan `WORK-` allocation counts, expanded child-plan count,
  PR-slice count, PRs with mapped tests, and assessed/completed branch counts;
- approval, assessment, or wave-checkpoint parse errors; stale approval records or checkpoints;
  malformed wave declarations; missing expected files; or discovery limitations;
- the evidence limit that mapped tests, WIP claims, and learning records do not prove
  completion, quality, or stakeholder feedback beyond their explicit source. Show `Not
  recorded` for missing learning fields and never infer them from Git, approvals, or tests.
