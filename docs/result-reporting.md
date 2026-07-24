# Plain-Language Results And Handoffs

Sarathi reports are written first for the person deciding whether the product work can
continue. Internal verdicts, document state, approvals, hashes, checker fields, and workflow
IDs remain available as supporting process evidence; they do not become the headline.

Use this guidance for specification, design, plan, code, verification, review, assessment,
workflow-status, pause, resume, and handoff responses. Apply the same order in saved review
and assessment reports.

## Lead With One Outcome

Start with one plain-language result and a short explanation of the most important product,
code, or delivery consequence:

- **Ready**: no known material problem prevents the stated next step.
- **Ready after minor fixes**: only small, bounded fixes remain and they do not change the
  approach.
- **Not ready**: a known product, code, design, plan, or evidence problem must be corrected.
- **Cannot assess yet**: missing or unfit prerequisite information prevents a responsible
  judgment.

Label the result for the response, such as `Review result`, `Assessment result`, `Handoff
result`, or `Status result`. Do not add a second headline verdict.

Canonical prompts name a recommended next stage by its internal ID, such as `code-review`.
Render that recommendation using the explicit command or skill form available in the current
host. Do not recommend an entry point that was not installed.

Name the scope and next step when `Ready` could be mistaken for release readiness. For
example, write `Assessment result: Ready.` and put `Ready for implementation planning, not
release` in the next sentence. Keep the result itself to one of the four exact values.

For a create-stage handoff, use the same language as `Handoff result`. For a verify-only
command, which cannot judge overall readiness, use one plain result:

- **Checks passed**: every required and applicable command completed and succeeded.
- **Checks failed**: at least one completed command found a concrete failure. This result
  takes precedence when other required checks were also unavailable.
- **Checks could not run**: no completed command failed, but at least one required command
  or its environment was unavailable. Successful partial checks remain supporting evidence,
  not a green result.

Immediately explain what those checks establish. Do not present `12/12`, a percentage, or
another checker score without an interpretation such as, “The requirements, design, and
implementation plan passed their structural checks.” Raw counts and checker JSON may follow
under technical evidence.

When updating `.sdlc/wip.md`, put only the base `Ready`, `Ready after minor fixes`,
`Not ready`, or `Cannot assess yet` value in `Status Result`. Put scope, next step, and the
plain-language reason in `Status Summary`. A verify-only result does not replace this broader
readiness status; record it under check evidence instead. The workflow-status page renders
only the recorded readiness result; it does not derive readiness from approvals, Git
activity, or passing tests.

## Keep The Machine Verdict Secondary

Reviews and assessments preserve the internal verdict exactly:
`Pass | Pass-with-fixes | Needs rework | Blocked-upstream`. Put it after the engineering
outcome on a secondary line:

```text
Process status: Blocked-upstream — the implementation plan does not have a recorded
approval for its current version, so Sarathi cannot mark the assessment complete.
```

`Blocked-upstream` means a required earlier document or approval record prevents the current
stage from completing. “Recorded approval for its current version” is the ordinary-language
explanation for a matching approval record and file hash; do not say only
“hash-current approval.”

Use this default mapping:

| Internal verdict | User-facing result |
| --- | --- |
| `Pass` | Ready |
| `Pass-with-fixes` | Ready after minor fixes |
| `Needs rework` | Not ready |
| `Blocked-upstream` | Cannot assess yet |

A known direct defect can make the user-facing result `Not ready` even when the process
status is `Blocked-upstream`. Explain that the process record is an additional completion
block, not a competing engineering verdict. Never show `Needs rework` and
`Blocked-upstream` as two unexplained conclusions or ask the reader to reconcile them.

## Separate What Must Change

After the opening explanation, group findings under these headings:

1. **Product or code problems**: incorrect behavior, unsafe design, implementation defects,
   release blockers, usability problems, or unnecessary complexity.
2. **Missing verification**: tests, commands, environments, external-system checks,
   accessibility checks, or other evidence still needed.
3. **Process/documentation problems**: missing or stale requirements, design, plan,
   approval, traceability, feedback, local-check configuration, or handoff records.

Omit an empty heading in a short chat response, or say `None found` when a saved report
needs the distinction to remain explicit. Do not hide a product defect inside process
language. Order findings within each group by practical impact, then provide one combined
next-actions list ordered by impact and dependency.

## Explain Specialized Terms

Prefer ordinary language. When an exact technical or machine term matters, explain it at
first use. Examples:

- “the implementation plan that controls this change,” not only “governing plan”;
- “a recorded approval that matches the current file,” not only “hash-current approval”;
- “the documented route and the implemented route differ,” not only “route drift”;
- “the repository’s automated check command and pre-commit check,” not only
  “repository hook/gate”;
- “a passing test or observed command result,” not only “positive evidence.”

Do not assume that an ID, status value, checker key, or Sarathi command is self-explanatory.
Exact machine-readable values may appear in parentheses or in a technical-evidence section
after the plain explanation.

## Recommended Report Shape

```markdown
Assessment result: Not ready.

The most important engineering reason and its consequence.

### Product or code problems

- Findings ordered by practical impact.

### Missing verification

- Evidence still needed and what risk it leaves open.

### What is working

- Builds, tests, behavior, or documents that were actually established.

### Process/documentation problems

- Record or document gaps and what they prevent.

Process status: `Blocked-upstream` — ordinary-language explanation, when applicable.

### Next actions

1. Highest-impact corrective action.
2. Next verification or process action in dependency order.

Technical evidence: exact commands, interpreted checker results, then raw counts or record
details when useful.
```

Use only the sections needed for a concise response, but preserve the ordering: engineering
outcome, categorized findings, working evidence, process status, actions, technical detail.

## Example

```markdown
Assessment result: Not ready.

The main problem is that the screen explainer is enabled in every build. It is intended to
appear only in internal review builds, so the build configuration must be corrected before
release.

### Product or code problems

- Limit the screen explainer to internal review builds.

### Missing verification

- Verify that every new screen receives an explainer.
- Test that invalid explainer documentation is rejected.
- Test the screen with Android TalkBack.
- Finish the project's automated pre-commit checks.

### What is working

The implementation builds successfully, and all 188 automated tests pass.

### Process/documentation problems

The implementation plan does not yet have a recorded approval that matches its current
version. This does not change the product defect above, but Sarathi cannot mark the work
complete until that record is added.

Process status: `Blocked-upstream` — the missing plan approval record prevents process
completion; it does not replace the “Not ready” engineering result.

### Next actions

1. Correct the build configuration so the explainer cannot ship in release builds.
2. Add the missing explainer coverage and invalid-documentation tests.
3. Complete the TalkBack and automated pre-commit checks.
4. Record approval of the current implementation plan.
```

For a successful verification, prefer:

```text
Verification result: Checks passed.

The requirements, design, and implementation plan passed their structural checks. These
checks establish that the required sections and links are present; they do not judge whether
the product behavior or technical approach is correct.
```
