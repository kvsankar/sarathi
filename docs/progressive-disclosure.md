# Progressive Disclosure

Sarathi should load the smallest instruction set that can safely decide the next
action, then load deeper instructions only when the selected stage or risk requires them.
This keeps broad process policy from crowding out stage-specific judgment.

## Always-Loaded Kernel

`SKILL.md` is the routing kernel. It should contain only:

- how to locate the bundled stage prompts, docs, agents, and checkers;
- command verb meanings: create, verify, review, assess;
- project entry/adoption-mode routing;
- resumable WIP state expectations;
- consent-gated bootstrap-file instruction expectations;
- stage selection and human-gate rules;
- non-negotiable operating constraints that affect every stage;
- checker availability expectations and degraded-mode stops.

Do not copy full stage procedures, long cross-cutting concern lists, checker schemas, or
review rubrics into `SKILL.md` when a referenced prompt or doc can carry them.

## On-Demand References

Load references only when their trigger applies:

| Reference | Load When |
| --- | --- |
| `docs/work-in-progress.md` | Starting, resuming, pausing, handing off, or blocking SDLC work in a project; reading or updating `.sdlc/wip.md`. |
| `docs/project-entry.md` | The repo may be greenfield/brownfield, lacks a recorded entry decision, or an existing artifact/codebase is being adopted or reviewed. |
| `docs/bootstrap-instructions.md` | Offering, adding, updating, or recording consent for a bootstrap block in files such as `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md`. |
| `prompts/<stage>.prompt.md` | A specific stage is selected or directly invoked, such as `/spec-create` or `/code-review`. |
| `docs/cross-cutting-concerns.md` | Creating, reviewing, or assessing an artifact whose domain, data, UI, integration, deployment, documentation, logging, error-handling, or operational risk needs the shared concern checklist. |
| `docs/review-verification-checklist.md` | Running or explaining an assessment that pairs mechanical verification with qualitative review. |
| `docs/approval-gates.md` | Recording, checking, or explaining `.sdlc/approvals.yaml` or `.sdlc/gates.yaml`. |
| `docs/process-maintenance.md` | Modifying the SDLC process, prompts, skills, checker policy, or shared docs. |
| `checkers/check_*.py` help/source | Running, troubleshooting, or changing deterministic verification. |

If a referenced doc is not bundled in an installed skill, fall back to the repository copy
when available. If neither exists and the missing reference governs the requested action,
report the incomplete installation instead of silently relying on memory.

## Stage Prompt Loading

Stage prompts are authoritative only for their stage. When the user invokes the SDLC
generally, first use `SKILL.md` to choose the next stage, then load exactly the selected
stage prompt. Do not preload all stage prompts just because the workflow contains them.

When a stage prompt references another shared doc, load that doc only if the current work
needs its details. For example, `/spec-create` can cite project-entry rules while writing a
greenfield product spec without loading code-review or plan-assess instructions.

## Existing Project Loading

For existing projects, start with discovery rather than the full stage stack:

1. Load `docs/work-in-progress.md` and read `.sdlc/wip.md` if present.
2. Load `docs/project-entry.md`.
3. Inspect enough repo files to classify adoption mode and existing artifacts.
4. Record or update `.sdlc/process-decisions.yaml` when the user chooses or approves the
   mode.
5. Load only the selected stage prompt.
6. Load deeper docs or checker sources only when the stage reaches that concern.
7. Update `.sdlc/wip.md` before stopping or handing off.

This means a brownfield delta spec does not need plan or code instructions until the user
approves moving downstream.

## Assessment Loading

Assessments intentionally load more context, but still in layers:

1. Load the selected `*-assess` prompt.
2. Load upstream artifacts named by the prompt.
3. Run the required checker scripts and capture evidence.
4. Load `docs/review-verification-checklist.md` when the assessment report needs the full
   verification/review pairing.
5. Load the matching `*-review` prompt only for the qualitative review half when the
   assessment prompt does not already include enough review criteria.

Never stop at checker JSON. Progressive disclosure reduces irrelevant instruction load; it
does not weaken the mechanical-plus-qualitative assessment requirement.

## Maintenance Rules

- New shared policy belongs in a focused `docs/*.md` file when more than one stage uses it.
- Stage prompts should carry stage-specific action, outputs, gates, and stop conditions, not
  repeated global policy.
- `SKILL.md` should point to shared docs by trigger and should not grow into a second copy
  of the prompts.
- WIP and bootstrap instructions should stay short and resumable; they should point to
  governing artifacts rather than duplicating them.
- If a new rule changes checker behavior, update the checker, its prompt invocation, and
  the relevant shared doc together.
- Keep installed skill copies synchronized with root `docs/`, `prompts/`, and `checkers/`
  sources.
