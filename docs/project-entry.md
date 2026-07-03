# Project Entry And Adoption Modes

Agent-Steered SDLC can start with a new project or be adopted in the middle of an
existing one. Keep the entry decision separate from artifact discovery so the adoption
choice stays mutually exclusive and collectively exhaustive.

## MECE Adoption Modes

Choose exactly one project entry mode before creating or reviewing downstream artifacts
when the repo is not already operating under an SDLC decision record:

- **Greenfield Adoption**: the project starts under Agent-Steered SDLC now. Use the normal
  sequence: spec, design, plan, code. Existing external references may inform the first
  artifacts, but there is no legacy implementation baseline to accept.
- **Brownfield Baseline Adoption**: the project already exists and the user wants the SDLC
  to reconstruct and review the current system. Create retrospective spec and design
  artifacts from the existing product, docs, tests, and code, then perform a baseline
  `/code-review` when requested. A retrospective baseline code review may skip
  `/plan-create` and `/plan-review` because it judges already-written code against
  reconstructed intent, not against a pre-approved implementation plan.
- **Brownfield Delta-Only Adoption**: the project already exists and the user wants SDLC
  control only for new changes from this point forward. Discover enough baseline context to
  avoid breaking existing behavior, then create or revise slice/change artifacts for the
  requested delta. Existing behavior outside the delta is accepted as baseline unless the
  delta touches it or the user asks for a baseline review.

Existing specs, designs, plans, ADRs, tickets, roadmaps, tests, docs, CI, and deployment
files are not a fourth mode. They are discovered inputs that can appear in any mode.

## Artifact Discovery

For every adoption mode, scan for existing artifacts before choosing the next stage:

- requirements, specs, issue epics, product briefs, or acceptance criteria;
- design docs, ADRs, architecture diagrams, API contracts, schemas, or interface docs;
- plans, roadmaps, tickets, milestone docs, release notes, or implementation notes;
- tests, fixtures, captured examples, CI config, build/deployment files, runbooks, and
  user/developer documentation.

Classify each discovered artifact set as one of:

- `adopt`: use as a current upstream artifact without material rewriting;
- `adapt`: convert or revise into the SDLC format while preserving stable intent and IDs
  where possible;
- `supersede`: replace with a new artifact and record why the old one is no longer
  governing;
- `background`: use only as context or historical evidence;
- `none_found`: no relevant artifact was found.

## Decision Record

Record the user's adoption decision in `.sdlc/process-decisions.yaml` when the user chooses
an adoption mode, approves an inferred mode, or explicitly accepts a plan-skipping
retrospective baseline review. This file records process scope and rationale; it is not an
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
```

If the agent infers a low-risk mode in YOLO mode, record `decided_by: "agent-inferred"` and
list the assumption and risk. If the user later corrects the mode, update the record rather
than silently relying on the stale decision.

## Stage Rules

- Greenfield work follows the normal spec-first sequence.
- Brownfield baseline work may create retrospective specs and designs from observed
  behavior, docs, tests, and code. Mark reconstructed intent clearly and flag gaps where the
  current system's intended behavior cannot be inferred.
- A planless brownfield baseline `/code-review` must say that it is a retrospective baseline
  review, name the decision record that permits skipping plan review, and avoid claiming
  conformance to a pre-approved implementation plan.
- New implementation deltas in any mode require the normal downstream artifacts: a
  code-ready spec/design/implementation plan, unless the user explicitly chooses a
  documented lightweight exploratory track.
- Existing artifacts can satisfy a gate only when they are classified as `adopt` or have
  been `adapt`ed into a fit upstream artifact. `background` evidence can inform judgment
  but cannot silently stand in for a missing gate.
- If artifact discovery shows that the selected mode is wrong, stop and ask the user to
  revise the process decision before proceeding.
