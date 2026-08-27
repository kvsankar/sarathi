# Work In Progress

Keep `.sdlc/wip.md` as a short bookmark for the next agent. It exists so work can resume
without the previous chat context. It is not an approval, assessment, roadmap, or history.
The linked requirements, design, plan, code, tests, approvals, and assessment report remain
authoritative.

## Read And Resume

At the start of Sarathi work:

1. Read the repository instructions and `.sdlc/wip.md`.
2. Open the active plan and assessment named there.
3. Inspect the current Git state and diff.
4. Check the recorded blocker and next action against those sources.

The user's latest instruction and the source files win when WIP is stale. Replace the stale
bookmark before continuing.

## When To Update

Create the file when Sarathi work starts. Replace its current bookmark:

- after each planned PR is independently assessed;
- when a real blocker appears;
- when accepted requirements, design, or plan become invalid;
- when entering a planned integration review point;
- before ending or handing off unfinished work; and
- when switching to another plan or independently resumable work item.

Beginning the next planned PR in the same session needs no additional update beyond the
completed-PR bookmark. Do not update WIP after every test, fix, command, commit inside a PR,
or unchanged document check.

Do not store secrets, raw sensitive data, copied command logs, approval inventories, roadmap
history, old PR history, or document hashes. A readable commit or range is enough to identify
reviewed code. Link to the assessment instead of copying it.

## Current Format

Keep the file small enough to understand immediately:

```markdown
# Current Work

Goal: the useful result being delivered
Active Plan: repository-relative path to the implementation plan
Last Completed: PR-AREA-NAME — commit or range, assessment result
Current Work: PR-AREA-NAME and its current state
Next Action: one executable action
Blockers: none, or the exact blocker
Planned Review Point: the next integration or feedback review
Latest Checks: short result and link to the rolling assessment
```

If the current PR needs correction, do not call it complete:

```text
Last Completed: PR-INVOICE-EVALUATION — commit abc1234, assessment passed
Current Work: PR-INVOICE-FACETS — correction required
Next Action: Correct the coverage defect and rerun the focused tests
Blockers: none; the correction is understood
```

`Status Result`, `Status Summary`, and `Working Result` may be added when the project records
a formal engineering status. Keep scope and explanation in the summary. Do not infer product
completion from a passing PR, approval, commit, or test command.

Project-wide delivery choices remain in `.sdlc/process-decisions.yaml`. Feedback details,
review rounds, findings, and command evidence remain in the plan's rolling assessment report.
Coordinated work may add the current `WORK-*` or `WAVE-*` only when it is needed to enforce an
actual dependency or parallel-work limit.

Current Sarathi files use this format. Existing projects may use older files as historical
context, but their agents should rewrite only the current bookmark needed to resume work.
