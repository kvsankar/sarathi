---
description: Render a deterministic HTML snapshot of Sarathi artifact gates, decomposition, PR slices, and implementation evidence.
agent: agent
---

# Workflow Status

Render a read-only Sarathi workflow-status page for the target project. Load
`docs/workflow-status.md`, read `.sdlc/wip.md` when present, and verify important WIP claims
against governing artifacts. This command does not create or revise a spec, design, plan,
approval, implementation, or review report, so it does not advance a human gate.

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
- spec/design/plan presence and hash-current attestation states;
- parent `WORK-` count, expanded child-plan count, PR-slice count, and PRs with mapped tests;
- approval parse errors, stale attestations, missing expected files, or discovery limitations;
- the evidence limit that mapped tests and WIP claims do not prove completion or quality.
