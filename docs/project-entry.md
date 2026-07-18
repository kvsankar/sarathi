# Starting In A New Or Existing Project

Sarathi can start with a new project or be adopted in the middle of an
existing one. First choose how much of the existing system Sarathi should cover. Then look
for documents and tests that can be reused.

## Choose One Starting Mode

Choose exactly one project entry mode before creating or reviewing later documents
when the repo is not already operating under an SDLC decision record:

- **New project** (`greenfield` / `Greenfield Adoption`): the project starts under Sarathi
  now. Establish product intent and architecture, then apply direct-to-code readiness at
  each boundary. Existing external references may satisfy part of that intent.
- **Document and review the existing system** (`brownfield_baseline` / `Brownfield Baseline
  Adoption`): create a retrospective spec and design from the existing product, docs,
  tests, and code, then perform a baseline
  `/code-review` when requested. A retrospective baseline code review may skip
  `/plan-create` and `/plan-review` because it judges already-written code against
  reconstructed intent, not against a pre-approved implementation plan.
- **Govern only new changes** (`brownfield_delta_only` / `Brownfield Delta-Only Adoption`):
  learn enough about the existing system to avoid breaking it, then create or revise
  slice/change documents for the requested change. Existing behavior outside the change is
  accepted unless the change touches it or the user asks for a baseline review.

Existing specs, designs, plans, ADRs, tickets, roadmaps, tests, docs, CI, and deployment
files are not a fourth mode. They are discovered inputs that can appear in any mode.

## Find Existing Material

For every mode, scan for useful existing material before choosing the next stage:

- requirements, specs, issue epics, product briefs, or acceptance criteria;
- design docs, ADRs, architecture diagrams, API contracts, schemas, or interface docs;
- plans, roadmaps, tickets, milestone docs, release notes, or implementation notes;
- tests, fixtures, captured examples, CI config, build/deployment files, runbooks, and
  user/developer documentation.

Classify each discovered set as one of:

- `adopt`: use as a current source document without material rewriting;
- `adapt`: convert or revise into the SDLC format while preserving stable intent and IDs
  where possible;
- `supersede`: replace with a new document and record why the old one no longer controls
  the work;
- `background`: use only as context or historical evidence;
- `none_found`: no relevant material was found.

## Rules For Documenting An Existing System

Baseline adoption reconstructs accepted intent; it is not a blind transcript of
whatever the current code happens to do.

- The retrospective SRS expresses reconstructed accepted product/system intent from
  existing specs, docs, tests, code, and user clarification. Existing code is evidence, not
  the source of truth.
- After the SRS is drafted, possible outcomes are: current code matches the SRS; current
  code has implementation gaps; or the SRS overreached, misread, or invented intent and
  must be revised.
- The retrospective design describes the current accepted architecture grounded in code and
  constrained by the approved SRS. It may name risks, technical debt, and improvement
  candidates, but adoption itself must not silently convert those into redesign work.
  Redesign requires an explicit user-approved delta.
- SRS `AT-`/`JT-` items and design `TEST-` obligations are normative verification
  obligations once the documents are accepted. Existing tests are evidence of current
  coverage, not the source of truth.
- If existing tests differ from or fall short of the SRS/design obligations, surface the
  gap rather than rewriting the obligations down to current tests.

A baseline code review is therefore a **baseline conformance audit**, not a generic code
review. It must report two primary gap sets:

- **Code gaps against SRS**: behavior missing, different, ambiguous, or accidentally
  implemented relative to reconstructed accepted intent.
- **Test gaps against SRS/design**: `AT-`, `JT-`, or `TEST-` obligations missing, weakly
  asserted, indirectly covered without a clear pass/fail check, or only covered by risky
  doubles.

Classify each finding as exactly one of:

- `fix-code`: implementation should change to match accepted SRS/design intent.
- `add-or-strengthen-tests`: tests should be added or improved to cover accepted
  SRS/design obligations.
- `revise-artifact`: the SRS or design appears wrong, overreached, or misread current
  accepted intent.
- `defer-delta`: the gap is real but should become an explicit future delta only if the
  user approves it.

## Decision Record

Record the user's adoption decision in `.sdlc/process-decisions.yaml` when the user chooses
one of these modes, approves an inferred mode, or explicitly accepts a plan-skipping
retrospective baseline review. This file records process scope and the reason; it is not an
approval ledger and does not replace `.sdlc/approvals.yaml`.

Use this shape, adding fields only when useful:

```yaml
project_entry:
  decided_at: "2026-07-03T00:00:00Z"
  decided_by: "user"
  mode: "greenfield | brownfield_baseline | brownfield_delta_only"
  scope: "product/system | feature/component | slice/change"
  baseline_sources:
    - "existing codebase"
    - "README.md"
  existing_artifact_policy:
    specs: "adopt | adapt | supersede | background | none_found"
    designs: "adopt | adapt | supersede | background | none_found"
    plans: "adopt | adapt | supersede | background | none_found"
    docs: "adopt | adapt | supersede | background | none_found"
    tests: "adopt | adapt | supersede | background | none_found"
  stage_policy:
    retrospective_plan_required: false
    new_delta_plan_required: true
    code_review_without_plan_allowed_for: "baseline_review_only"
  assumptions:
    - "Existing behavior outside the requested delta is accepted as baseline."
  risks:
    - "Legacy requirements may remain incomplete until touched by a future delta."
  next_recommended_stage: "/spec-create"
delivery:
  profile: "lean | standard | high-assurance"
  assurance_modules:
    - "external-integration"
  rationale: "Ordinary production change with a vendor boundary."
  escalation_triggers:
    - "The change touches authentication or irreversible data migration."
```

If the agent infers a low-risk mode in YOLO mode, record `decided_by: "agent-inferred"` and
list the assumption and risk. If the user later corrects the mode, update the record rather
than silently relying on the stale decision.

Choose review depth separately using [assurance-profiles.md](assurance-profiles.md). The
starting mode says how Sarathi enters the repository; the profile says how much evidence
the current production work needs.

## Stage Rules

- Greenfield work follows the normal spec-first sequence.
- Existing-system baseline work may create retrospective specs and designs from observed
  behavior, docs, tests, and code. Mark reconstructed intent clearly and flag gaps where the
  current system's intended behavior cannot be inferred.
- A planless baseline `/code-review` must say that it is a retrospective baseline
  review, name the decision record that permits skipping plan review, and avoid claiming
  conformance to a pre-approved implementation plan.
- New implementation changes in any mode require accepted intent and a bounded code-ready
  Implementation plan. Existing approved specs/designs are inherited; create only a delta
  artifact needed for a concrete unresolved decision or risk.
- Existing documents can satisfy a gate only when they are classified as `adopt` or have
  been `adapt`ed into a fit earlier document. `background` evidence can inform judgment
  but cannot silently stand in for a missing gate.
- If the discovery step shows that the selected mode is wrong, stop and ask the user to
  revise the process decision before proceeding.
