# Loading Only Relevant Instructions

Sarathi should load the smallest instruction set that can safely decide the next
command, then load deeper instructions only when the selected command or risk requires them.
This keeps broad process policy from crowding out command-specific judgment.

## Instructions Always Loaded

`SKILL.md` chooses the next action. It should contain only:

- how to locate the bundled command prompts, docs, agents, and checkers;
- work target, scope, stage, action, and command meanings;
- command verb meanings: create, verify, review, assess;
- project entry/adoption-mode routing;
- resumable WIP state expectations;
- consent-gated bootstrap-file instruction expectations;
- command selection and required approval rules;
- non-negotiable operating constraints that affect every command;
- what to do when a required checker is unavailable.

Only the top-level `sarathi` skill is implicitly discoverable. Standalone command skills use
the `sarathi-<stage>-<action>` namespace and explicit-only agent metadata; their instructions
remain agent-neutral.

Do not copy full command procedures, long cross-cutting concern lists, checker schemas, or
review rubrics into `SKILL.md` when a referenced prompt or doc can carry them.

## On-Demand References

Load references only when their trigger applies. This table classifies every canonical
top-level `docs/*.md` instruction file; command prompts keep smaller local trigger lists for
the references relevant to that command.

| Reference | Load When |
| --- | --- |
| `docs/workflow-terminology.md` | Routing, status, or explanation needs the work target, scope, stage, action, command, or work-item distinction. |
| `docs/enduring-model.md` | Explaining Sarathi, orienting a new project, or deciding how delivery, decomposition, quality, continuity, and risk fit together. |
| `docs/work-in-progress.md` | Starting, resuming, pausing, handing off, or blocking SDLC work in a project; reading or updating `.sdlc/wip.md`. |
| `docs/result-reporting.md` | Reporting a completed stage command, workflow status, or saved review/assessment. |
| `docs/project-entry.md` | Starting in a new or existing codebase, or deciding how much existing work to document. |
| `docs/artifact-contracts.md` | Writing or revising a spec, design, plan, or code evidence record. |
| `docs/artifact-formatting.md` | Writing or materially revising a Markdown document or its rendered companion. |
| `docs/document-locations.md` | Choosing a document area, recording non-standard paths, or saving a review/assessment report. |
| `docs/requirements-model.md` | Creating or reviewing a specification and preserving the hierarchy from stakeholder needs to observable evidence. |
| `docs/srs-authoring.md` | Writing detailed use cases, measurable supplementary requirements, or reconstructed requirements for an existing system. |
| `docs/human-first-artifacts.md` | Creating or materially revising a spec, design, or plan; reviewing first-page comprehensibility; checking process IDs in source. |
| `docs/design-principles.md` | Creating or reviewing architecture, detailed design, ADRs, interfaces, data ownership, or deployment topology. |
| `docs/simplicity-first.md` | Creating, reviewing, or simplifying architecture, abstractions, generated machinery, existing compatibility proof, or PR breakdown. |
| `docs/cleanup-pass.md` | Running the focused pre-handoff cleanup pass or classifying cleanup findings. |
| `docs/simplify-pass.md` | Running the post-cleanup simplification pass on documents, plans, or code. |
| `docs/assurance-profiles.md` | Choosing or changing the stage path, decomposition bias, review cadence, or extra checks for specific risks. |
| `docs/bootstrap-instructions.md` | Offering, adding, updating, or recording consent for a bootstrap block in files such as `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md`. |
| `prompts/<stage>-<action>.prompt.md` | A command is selected or directly invoked, such as `spec-create` or `code-review`. |
| `docs/cross-cutting-concerns.md` | Assigning extra risk checks to the document or code that owns them. |
| `docs/test-ownership.md` | Planning or implementing tests, including test-first behavior changes, or assigning acceptance, journey, or integration tests. |
| `docs/project-quality-gates.md` | Defining or reviewing repository quality gates, CI placement, merge requirements, or release evidence. |
| `docs/work-decomposition.md` | Deciding whether complex work should be split, where to split it, or whether a child needs another document. |
| `docs/feedback-and-learning.md` | Planning or completing changes; handling stakeholder feedback, updates to earlier documents, or parallel work. |
| `docs/review-verification-checklist.md` | Running or explaining an assessment that pairs repeatable checks with independent review. |
| `docs/approval-gates.md` | Recording, checking, or explaining `.sdlc/approvals.yaml` or `.sdlc/gates.yaml`. |
| `docs/workflow-status.md` | Rendering, interpreting, or troubleshooting workflow-status output. |
| `docs/slug-id-migration.md` | Migrating legacy numeric IDs or checking slug-ID compatibility and grammar. |
| `docs/state-file-migration.md` | Migrating legacy Sarathi state files after they are detected or when migration is explicitly requested. |
| `docs/progressive-disclosure.md` | Locating shared guidance or maintaining this reference-routing map. |
| `docs/process-maintenance.md` | Modifying the SDLC process, prompts, skills, checker policy, or shared docs. |
| `docs/release-process.md` | Preparing `CHANGELOG.md`, a version bump, release commit, or Git tag. |
| `docs/sarathi-process-diagram-prompt.md` | Regenerating or materially revising the Sarathi process-diagram asset. |
| `checkers/check_*.py` help/source | Running, troubleshooting, or changing deterministic verification. |

If a referenced doc is not bundled in an installed skill, fall back to the repository copy
when available. If neither exists and the missing reference governs the requested action,
report the incomplete installation instead of silently relying on memory.

## Command Prompt Loading

Command prompts are authoritative only for their command. When the user invokes Sarathi
generally, first use `SKILL.md` to choose the next command, then load exactly its prompt. Do
not preload every command prompt merely because the workflow contains them.

When a command prompt references another shared doc, load that doc only if the current work
needs its details. For example, `spec-create` can cite project-entry rules while writing a
greenfield product spec without loading code-review or plan-assess instructions.

## Existing Project Loading

For existing projects, start with discovery rather than the full stage stack:

1. Load `docs/work-in-progress.md` and read `.sdlc/wip.md` if present.
2. Load `docs/project-entry.md`.
3. Inspect enough repository files to choose the starting mode and find existing material.
4. Record or update `.sdlc/process-decisions.yaml` when the user chooses or confirms the
   entry mode, delivery assurance profile, approval policy, or work outcome.
5. Load only the selected command prompt.
6. Load deeper docs or checker sources only when the command reaches that concern.
7. Update `.sdlc/wip.md` before stopping or handing off.

This means a spec for a change to an existing system does not need plan or code instructions
until the user approves moving to the next stage.

## Assessment Loading

Assessments intentionally load more context, but still in layers:

1. Load the selected `*-assess` prompt.
2. Load earlier documents named by the prompt.
3. Run the required checker scripts and capture evidence.
4. Load `docs/review-verification-checklist.md` when the assessment report needs the full
   verification/review pairing.
5. Load the matching `*-review` prompt only for the independent review half when the
   assessment prompt does not already include enough review criteria.

Never stop at checker JSON. Progressive disclosure reduces irrelevant instruction load; it
does not weaken the check-plus-review assessment requirement.

## Maintenance Rules

- New shared policy belongs in a focused `docs/*.md` file when more than one stage uses it.
- New concerns become extra risk checks with explicit triggers; do not add them to every
  stage by default.
- Command prompts should carry command-specific actions, outputs, gates, and stop conditions, not
  repeated global policy.
- `SKILL.md` should point to shared docs by trigger and should not grow into a second copy
  of the prompts.
- WIP and bootstrap instructions should stay short and resumable; they should point to
  source documents rather than duplicating them.
- If a new rule changes checker behavior, update the checker, its prompt invocation, and
  the relevant shared doc together.
- Keep installed skill copies synchronized with root `docs/`, `prompts/`, and `checkers/`
  sources.
