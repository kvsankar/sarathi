---
name: sarathi
description: Use Sarathi for managed software delivery with specifications, designs, plans, approvals, checks, reviews, and test evidence. Do not use it for ordinary coding requests.
---

# sarathi

Sarathi helps an agent turn approved requirements into the smallest safe working change. It
chooses the next useful step, checks the result, gets an independent review, and adjusts the
remaining work from real feedback. Use `$sarathi` to start, continue, or choose the next
command.

```text
approved requirements -> smallest safe change -> working software -> checks and review -> feedback -> adapt
```

## Workflow Terms And Direct Commands

Use `docs/workflow-terminology.md` when these terms need explanation. A stage is `spec`,
`design`, `plan`, or `code`. An action is `create`, `verify`, `review`, or `assess`. Together
they name a command such as `design-review`. `workflow-status` only reports current status.

Installed explicit command skills use `$sarathi-<stage>-<action>`. Only this router may be
selected implicitly; never select a command skill unless the user names it. An ordinary code
request does not invoke Sarathi. Without an explicit command, select and load one canonical
command prompt; do not load every concern.

## Skill Maintenance

Run bundled `scripts/check_update.mjs` with Node at invocation start; never auto-update or
install without approval. Respect `SARATHI_UPDATE_CHECK=0`; missing bundle files mean
incomplete install.

## Enduring Model

Split work when one engineer cannot understand, review, test, and integrate it safely.
Requirements, design, plans, and code may change as the team learns. Load
`docs/enduring-model.md` when explaining the whole process.

Production work must preserve approved requirements, useful tests with clear pass/fail
results, honest feedback, required approvals, and safety limits.

Choose a delivery assurance profile with `docs/assurance-profiles.md`:

- **Lean**: requirements -> technical plan -> code.
- **Standard**: requirements -> design -> plan -> code; the ordinary default.
- **High-assurance**: the Standard path, with risky work split into smaller reviewed changes.

Every stage that remains is checked and independently reviewed. Profiles change which stages
are used, how work is split, and when reviews happen. Choose approval policy separately.

Choose approval policy with `docs/approval-gates.md`. **Human checkpoints** stop at required
approval points. **Automatic eligible gates** follows local policy.
Explicit YOLO allows automatic internal approvals for end-to-end work, but not the protected
actions in that document. **Product increment** and **Decision/evidence** define the intended
result; they do not change review quality or approval rules.

Apply `docs/simplicity-first.md`: keep process records out of product architecture, start with
the smallest direct implementation, reuse existing-system tests, and avoid general solutions
until a current need justifies them. Simplify when the solution is more complicated than the
problem requires. Do not use LOC or PR-count targets.

## Revision Classification

A change is material if it changes what must be built, scope, a contract, the design,
risk, required proof, readiness to continue, or an approval decision. Editing is
non-material only when meaning stays the same. When uncertain, treat the change as material.
See `docs/approval-gates.md`.

## User-Facing Language

Use ordinary language. Hide internal IDs, hashes, records, verdicts, and workflow terms
unless asked or they affect the next action; explain why first. Apply
`docs/result-reporting.md` only to formal results and saved reports.

## Orient Before Acting

1. Read `.sdlc/wip.md` and `.sdlc/process-decisions.yaml` when present. Check important claims
   against source documents.
2. Use `docs/project-entry.md` if it is unclear whether this is a new project, documentation
   of the current system, or a change to an existing system.
3. Choose the scope: Product/system, Feature/component, or Slice/change. Ask only when the
   answer would materially change the document.
4. At project entry and first feature requirements, present profile and approval choices with
   a recommendation; record the choice/default and work outcome. Under explicit YOLO, infer
   and record them without confirmation using `docs/approval-gates.md`.
5. Select Lean, Standard, or High-assurance and additional checks. Follow that profile's
   stage path and record why and what would require a longer path. In YOLO mode, use Standard
   unless Lean is justified.
6. Load only the selected `prompts/<stage>-<action>.prompt.md` and its triggered references.

## Decompose Only When It Helps

`code-create` blocks without approved requirements and a specific implementation plan that is
ready to implement. Do not write another document when the approved requirements and one short
plan are enough to start safely.

Keep the work together if one engineer can understand, explain, review, and safely plan it as
one unit. Otherwise split it at a natural product or technical boundary until every part is
understandable, testable, and safe to integrate. A split does not require a new spec and
design for each part. Use `docs/work-decomposition.md`.

Use a work group (`WAVE-*`) only for near-term `WORK-*` items that share one feedback or
integration checkpoint. Unscheduled work has no group. An Implementation plan lists the PRs
for one work item; those PRs do not belong to a work group. A checkpoint closes only its
group. It does not approve the whole plan or the next group. See
`docs/feedback-and-learning.md`.

## When To Stop

After creating or materially revising a spec, design, ADR, plan, code change, assessment, or
review report:

1. Update `.sdlc/wip.md`.
2. Report the path, whether the work can continue, check and review results, open problems,
   and the recommended next command.
3. End the turn before starting the next stage.

Continue across commands only when the request and recorded policy permit it. Human
checkpoints stop. Explicit YOLO authorizes end-to-end work and automatic internal gates but
keeps the restrictions and protected boundaries in `docs/approval-gates.md`.

## What Each Stage Must Prove

- Specs define observable success in `AT-*` and `JT-*` descriptions.
- Standalone designs define what must be tested and where in `TEST-*` descriptions. A Lean
  plan without a separate design maps spec acceptance directly to executable checks.
- Plans assign those tests to work items or PRs.
- Behavior-changing code uses Red-Green-Refactor: observe the smallest meaningful test fail,
  make the minimum change that passes it, then improve the code while tests stay green.
- Code implements assigned tests and reports the commands and outcomes that exercised them.
- Keep process IDs in document links and records. Do not add them to production or test source
  merely to create a link. Test names describe behavior.
- Format checks and optional requirement-to-test links do not prove correct meaning,
  stakeholder feedback, real-dependency execution, merge state, or human approval.
- Do not test a primary external boundary only with a test double created by the agent or
  project unless the user explicitly accepts the remaining risk. Prefer the real dependency
  or its official test interface, and state what the test double leaves untested.
- Live production deployment or production checks require explicit user approval.
- Clean up and simplify before reporting the result. Do not make unrelated or hidden behavior
  changes.

## Verification Independence

Run automatic checks once per revision. Use a fresh reviewer and give re-reviewers earlier
context. Treat remedies as advice; make the smallest sufficient fix. After the full review,
review only fixes but allow new findings. Never run a fourth review automatically. After
round 3, eligible automatic approval or the user decides whether to continue. If no fresh
reviewer is available, disclose that and keep checks and review separate. Stop when a required
earlier document is not fit. See `docs/review-verification-checklist.md`.

## Triggered References

| Reference | Load when |
| --- | --- |
| `docs/workflow-terminology.md` | Routing needs work target, scope, stage, action, command, or work-item terms. |
| `docs/work-in-progress.md` | Starting, resuming, blocking, handing off, or answering status and next-action questions. |
| `docs/project-entry.md` | Starting in a new or existing codebase. |
| `docs/approval-gates.md` | Choosing approval policy, using YOLO, or reading approval/auto-policy records. |
| `docs/result-reporting.md` | Formal results and saved reports. |

After selecting a command, use its local trigger list and
`docs/progressive-disclosure.md`, the complete shared-reference map. Use bundled
`checkers/check_*.mjs` with Node for deterministic verification and preserve raw evidence.
