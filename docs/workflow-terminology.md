# Workflow Terminology

Use these terms consistently when routing work, recording status, naming
commands, and explaining the next step. A command alone never identifies what
work it applies to.

## Canonical Example

Suppose the requested change is to prevent duplicate payment capture when
checkout retries an interrupted request.

- **Work target:** Checkout retry payment safety
- **Scope:** `slice/change`
- **Stage:** `design`
- **Action:** `review`
- **Command:** `design-review`
- **Work item:** `WORK-PAYMENTS-RETRY`, only if a Breakdown plan allocated
  this target as a child
- **Current activity:** Review the design for the slice/change target
  “Checkout retry payment safety.”

The command says what operation to run. The work target and scope say what the
command acts on. Neither can replace the other.

## Terms

### Work target

The concrete product, capability, component, change, or decision being
delivered or examined. Use a short human-readable name. Every status or routing
result should make the current work target clear, even when no machine ID
exists.

### Scope

The level at which the work target is being handled:

- `product/system`: a broad product or system boundary;
- `feature/component`: one coherent capability or subsystem;
- `slice/change`: the smallest bounded implementation or evidence change.

Scope belongs to the work target, not to the command. The same `design-review`
command can review a product/system design or a slice/change design.

### Stage

The kind of delivery work: `spec`, `design`, `plan`, or `code`. A stage is never
a combined value such as `spec-create` or `code-assess`.

### Action

The operation performed at a stage:

- `create`: write or revise the stage output;
- `verify`: run repeatable checks and report their limits;
- `review`: independently judge quality and seek counterexamples;
- `assess`: run verification and review together.

### Command

The stage-action pair `<stage>-<action>`, such as `spec-create`,
`design-review`, or `code-assess`. A command selects one canonical prompt.
Installed explicit command skills may prefix the same command with `sarathi-`,
such as `$sarathi-code-assess`.

### Work item

A planned child with a `WORK-*` identifier allocated by a Breakdown plan. A
work item may be the current work target, but many work targets have no
`WORK-*` ID. Do not invent a work item merely to name ordinary work.

### Artifact

A document, code change, report, ledger, or other evidence produced or examined
for the work target. An artifact is an output or record, not the work target
itself.

### Current activity

The combination of work target, scope, stage, and action. Report it in ordinary
language; use the command as a compact machine or invocation name.

### Workflow status

A projection of recorded work and process state. `workflow-status` is a
projection command, not a delivery stage or action, and it never advances a
gate.

## One Target Across Commands

The example target may use `spec-create`, `spec-assess`, `design-create`,
`design-review`, `plan-create`, `code-create`, and `code-assess` as evidence and
feedback require. This does not mean every target must execute every command or
create every document. The stage and action can change while the work target and
scope remain stable.

## Usage Rules

- Say “stage `design`, action `review`, command `design-review`,” not “the
  `design-review` stage.”
- Say “command prompt” and “explicit command skill,” not “stage prompt” or
  “stage skill,” when referring to a stage-action pair.
- Reserve **work item** for a `WORK-*` child; use **work target** for the
  universal subject.
- Reserve **worktree** for a Git worktree. It is not a Sarathi work target or
  work item.
- Name the work target and scope when recommending or reporting a command.
- Existing state may use legacy `Current Stage: code-create` values. Interpret
  those values as `Current Command: code-create` during migration. New WIP
  state records `Work Target`, `Work Scope`, and `Current Command`; derive stage
  and action from the command instead of storing duplicate state.
