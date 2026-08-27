# Reporting Formal Sarathi Results

Use this guidance for completed stage-command results, workflow-status responses, and saved
review or assessment reports. It does not govern ordinary discussion, questions, repository
maintenance conversation, or brief progress updates; use natural language for those.

Internal verdicts, document state, approvals, hashes, checker fields, workflow IDs, and
record names belong in the files that need them. Do not reproduce them in chat by default.
Mention one only when the user asks or when it changes what can happen next, and explain the
practical consequence before the internal term.

## Lead With One Outcome

Start with one plain-language result and a short explanation of the most important product,
code, or delivery consequence:

- **Ready**: no known material problem prevents the stated next step.
- **Ready after minor fixes**: only small, bounded fixes remain and they do not change the
  approach.
- **Not ready**: a known product, code, design, plan, or evidence problem must be corrected.
- **Cannot assess yet**: missing or unfit prerequisite information prevents a responsible
  judgment.

Label a formal result for the response, such as `Review result`, `Assessment result`, or
`Status result`. Do not add a second headline verdict.

Canonical prompts name a recommended next command by its internal ID, such as `code-review`.
Render that recommendation using the explicit command or skill form available in the current
host. Do not recommend an entry point that was not installed.

Name the scope and next step when `Ready` could be mistaken for release readiness. For
example, write `Assessment result: Ready.` and put `Ready for implementation planning, not
release` in the next sentence. Keep the result itself to one of the four exact values.

For a create command, use `Result`. For a verify-only command, which cannot judge overall
readiness, use one plain result:

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

When recording a formal status in `.sdlc/wip.md`, put only the base `Ready`, `Ready after
minor fixes`, `Not ready`, or `Cannot assess yet` value in `Status Result`. Put scope, next
step, and the plain-language reason in `Status Summary`. A PR assessment updates the short
resume bookmark; it does not replace the broader readiness status. Status reporting never
derives product readiness from approvals, Git activity, or passing tests.

## Keep Machine State In Its Files

Reviews and assessments preserve `Pass | Pass-with-fixes | Needs rework |
Blocked-upstream` in their saved report and internal state. Do not automatically repeat that
value in chat. If an earlier document or approval prevents the requested next action, say
what is missing and what the user needs to do. Include the exact internal value only when
the user requests technical process details.

A direct product or code defect remains the headline even when an internal record is also
incomplete. Do not make the user reconcile competing engineering and process verdicts.

## Separate What Must Change

After the opening explanation, group findings under these headings:

1. **Product or code problems**: incorrect behavior, unsafe design, implementation defects,
   release blockers, usability problems, or unnecessary complexity.
2. **Missing verification**: tests, commands, environments, external-system checks,
   accessibility checks, or other evidence still needed.
3. **Process/documentation problems**: missing or stale requirements, design, plan,
   approval, traceability, feedback, local-check configuration, or continuation notes.

Omit an empty heading in a short chat response, or say `None found` when a saved report
needs the distinction to remain explicit. Do not hide a product defect inside process
language. Order findings within each group by practical impact, then provide one combined
next-actions list ordered by impact and dependency.

## Explain Specialized Terms

Prefer ordinary language. When an exact technical or machine term matters, explain it at
first use. Examples:

- “the implementation plan that controls this change,” not only “governing plan”;
- “the document changed after approval, so it needs approval again,” not only “stale”;
- “the documented route and the implemented route differ,” not only “route drift”;
- “the repository’s automated check command and pre-commit check,” not only
  “repository hook/gate”;
- “a passing test or observed command result,” not only “positive evidence.”

Do not assume that an ID, status value, checker key, or Sarathi command is self-explanatory.
Exact machine-readable values appear only when requested or needed to explain why a next
action is unavailable.

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

### Next actions

1. Highest-impact corrective action.
2. Next verification or process action in dependency order.

Technical details: exact commands or record details when requested or needed for a decision.
```

Use only the sections needed for a concise response, but preserve the ordering: engineering
outcome, categorized findings, working evidence, actions, technical detail when needed.

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

The implementation plan changed after it was approved, so it needs approval again before
implementation can continue. This does not change the product defect above.

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
