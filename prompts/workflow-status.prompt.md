---
description: Generate a read-only HTML page that shows current work and the next action.
agent: agent
---

# Workflow Status

Generate the project's read-only Sarathi status page. This command only reports status; it
does not change or approve work. Load `docs/workflow-status.md`,
`docs/work-decomposition.md`, `docs/assurance-profiles.md`,
`docs/feedback-and-learning.md`, and `docs/result-reporting.md`. Read `.sdlc/wip.md` and
available delivery records, and check important claims against their source documents. When
other requested checks are running, generate status with them instead of stopping separately.

Locate `render_workflow_status.mjs` in the target project's `checkers/` directory, this
skill bundle's `checkers/` directory, or the built source repository's `dist/checkers/`
directory. Run:

```pwsh
node checkers/render_workflow_status.mjs <project-root> --output <project-root>/docs/sdlc-status.html
```

The command should also publish `docs/sarathi-process.html`, with bidirectional links
between the static process guide and live project status. If a project-local checker has no
companion `docs/sarathi.html`, locate the guide in the installed skill or source repository
and pass it with `--guide-source`.

Do not hand-edit the generated HTML. Use `--check` when the user asks for freshness
verification or CI integration.

Report:

- one plain status and what it means for the requested work;
- generated status and process-guide paths;
- what works now, what can be reused, what remains, what is deferred, what blocks coding, and
  the next action;
- approval and document status after the product status, with unfamiliar terms explained;
- any error or missing or outdated input that makes the page unreliable;
- that the workflow tree shows details for a feature, change, work group, or PR.

Every use of `complete` must say what is complete; finishing one prerequisite or change does
not finish a feature. Do not repeat hidden details, internal records, or exhaustive counts
unless they explain a problem. The page must not infer completion,
quality, or stakeholder feedback from Git, approvals, tests, or missing records.
