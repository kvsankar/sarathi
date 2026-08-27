---
description: Report current work without writing, or explicitly check or write the status HTML.
agent: agent
---

# Workflow Status

Report the project's Sarathi status without changing files. Generate HTML only when the user
explicitly asks to write it. This command does not change or approve work. Load
`docs/workflow-status.md`,
`docs/work-decomposition.md`, `docs/assurance-profiles.md`,
`docs/feedback-and-learning.md`, and `docs/result-reporting.md`. Read `.sdlc/wip.md` and
available delivery records, and check important claims against their source documents.

Prefer the installed npm command:

```pwsh
sarathi-sdlc status <project-root>
```

Use `status --check` to verify existing HTML without writing. Use `status --write` only when
the user asks to regenerate it; that mode also publishes `docs/sarathi-process.html` with
links between the guide and project status. The bundled `render_workflow_status.mjs` accepts
the same modes when the npm command is unavailable.

Do not hand-edit generated HTML.

Report:

- one plain status and what it means for the requested work;
- generated status and process-guide paths only after `--write`;
- what works now, what can be reused, what remains, what is deferred, what blocks coding, and
  the next action;
- approval and document status after the product status, with unfamiliar terms explained;
- any error or missing or outdated input that makes the page unreliable;
- that the workflow tree shows details for a feature, change, work group, or PR.

Every use of `complete` must say what is complete; finishing one prerequisite or change does
not finish a feature. Do not repeat hidden details, internal records, or exhaustive counts
unless they explain a problem. The page must not infer completion,
quality, or stakeholder feedback from Git, approvals, tests, or missing records.
