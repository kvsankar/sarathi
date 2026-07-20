# SDLC Work In Progress

## Product Snapshot

Goal: Release Sarathi 0.4.0 with the enduring process model and corrected definitions of requirements, architecture, decomposition, delivery planning, test-first implementation, and independent review.
Working Today: Sarathi 0.4.0 is published and installed for all supported local agents.
Reusable Today: Existing create, verify, review, assess, WIP, approval, assurance, traceability, and compatibility behavior remains available.
Current Increment: Sarathi 0.4.0 release and local deployment: complete.
Remaining Shared Work: None for this increment.
Target-Owned Work: None; this change is entirely within Sarathi.
Deferred: None.
Before Coding: none
Next Action: Use Sarathi 0.4.0 in production projects and report concrete process or checker failures.

## Process Snapshot

Last Updated: 2026-07-20T18:51:08Z
Updated By: agent
Current Stage: release
Current Gate: released and deployed
Project Entry Mode: brownfield_delta_only
Work Scope: feature/component
Ready To Implement: Yes
Review Level: Standard
Extra Checks: bundle parity, prompt budgets, browser layout, image inspection, distribution build, Twine, installer dry runs, release metadata

## Current Artifacts

| Kind | Path | Status | Notes |
| --- | --- | --- | --- |
| Enduring model | `docs/enduring-model.md` | ready for review | Defines the stable six-part hierarchy. |
| Routing skill | `skills/sarathi/SKILL.md` | ready for review | Leads with the enduring model; detailed status remains triggered guidance. |
| Requirements model | `docs/requirements-model.md` | validated | Restores problem and stakeholder needs through features, use cases, functional and supplementary requirements, acceptance tests, journeys, and traceability. |
| Spec prompts and checker | `prompts/spec-create.prompt.md`, `prompts/spec-review.prompt.md`, `checkers/check_spec.py` | validated | New/materially revised v3 product specs require the complete hierarchy; existing v2 specs remain accepted. |
| Design contract | `docs/artifact-contracts.md` | validated | Defines design as an implementable, evolvable technical model and selects boundaries by context. |
| Design prompts | `prompts/design-create.prompt.md`, `prompts/design-review.prompt.md` | validated | Make current/target state conditional and require applicable backend API and database-schema boundaries. |
| Plan contract | `docs/artifact-contracts.md` | validated | Defines planning as executable delivery structure with a proportionate Impact Map. |
| Plan prompts | `prompts/plan-create.prompt.md`, `prompts/plan-review.prompt.md` | validated | Distinguish Breakdown child-outcome graphs from Implementation PR graphs without one-PR ceremony. |
| Decomposition policy | `docs/work-decomposition.md` | validated | Uses one mental-load test, natural boundaries, and a clear stopping rule without coupling a split to more documents. |
| Test policy and code prompts | `docs/test-ownership.md`, `prompts/code-create.prompt.md`, `prompts/code-review.prompt.md`, `prompts/code-assess.prompt.md` | validated | Require observed Red-Green-Refactor for behavior changes and honest review of that evidence. |
| Static guide | `docs/sarathi.html` | validated | Draws the full requirements model, adaptive loop, cross-stage test evidence, independent quality gate, and conditional branch/rejoin. |
| Diagram prompt | `docs/sarathi-process-diagram-prompt.md` | validated | Makes the complete Spec model, test evidence, and independent review first-class. |
| Raster diagram | `docs/sarathi-process-diagram.png` | inspected | Shows the complete Spec hierarchy while preserving Design, Plan, TDD, test, review, and decomposition corrections. |
| Compatibility fixes | checker and human-first test files already in the worktree | validated | Preserved and formatted; not overwritten by this increment. |
| Release | `v0.4.0` | published and locally deployed | GitHub Release and PyPI contain the wheel and source archive. |

## Decisions And Assumptions

- Sarathi's stable hierarchy is delivery loop, decomposition when useful, quality model, continuity, risk controls, and supporting authoring rules.
- Decompose when a competent engineer cannot understand, explain, review, and safely plan the work as one coherent unit. Split along natural boundaries until every part is understandable, testable, and safe to integrate; do not add documents merely because the work was split.
- Product-first status, reuse classification, identifier placement, and WIP schema remain useful supporting safeguards rather than Sarathi's headline.
- Specification uses a needs-to-evidence derivation from problem and stakeholder needs to features, use cases, functional and relevant supplementary requirements, black-box acceptance tests, journeys where order matters, and observable evidence. Leffingwell/Widrig is the principal influence; other approaches are optional techniques for concrete gaps, not process modes.
- New and materially revised specs use format v3 so product specs receive deterministic hierarchy checks; existing v2 specs retain their earlier human-first contract.
- Backend designs explicitly treat applicable API contracts and database schema/data ownership as primary review surfaces. Other system types select their own consequential boundaries from compact contextual examples.
- Current state, target state, compatibility, and migration describe changes to existing systems; they do not define architecture generally.
- Impact Maps describe affected areas and useful extent through contracts, consumers, ownership, compatibility, and cross-area effects rather than LOC estimates.
- A one-PR Implementation plan is a one-node graph and omits empty dependency, merge-order, parallelism, and integration-topology fields.
- Behavior-changing code must show that the smallest meaningful test failed for the expected reason before the minimum implementation made it pass; passing post-hoc tests are not test-first evidence.
- Tests mature across the full process: observable acceptance in the spec, test architecture in design, allocation in the plan, and executable Red-Green-Refactor evidence in code.
- Every stage is subject to repeatable checks and independent review; assessment combines the two before the result is accepted for the next learning step.
- The static HTML guide remains deterministic; the detailed native diagram remains a separately generated raster asset with its source prompt checked in.

## Check And Review Evidence

- Complete Python suite: 175 passed with 84.69% checker coverage.
- Browser layout suite: 5 passed at mobile and desktop sizes.
- Pre-commit: Ruff, formatting, Markdown, and checker tests passed.
- Skill validation, bundle parity, instruction budgets, HTML parsing, and `git diff --check` passed.
- Independent verification and review findings were corrected across the Spec model, versioned checker, proportional supplementary-requirement guidance, bundle copies, and raster.
- Diagram SHA-256: `c5aeb83d6f5a28fc2363dc5bda92aa8125346b7cda63244500266b01be09bade`.
- Release metadata matches `v0.4.0`; wheel and source distribution build and pass Twine checks.
- Bash and packaged-command installer dry runs passed for all supported agent targets. PowerShell is unavailable on this Mac, so its dry run was not executed.
- PR `#18` passed both CI runs and merged at `b06a4d3`; release run `29769260860` published PyPI and GitHub artifacts successfully.
- Public `uvx` resolved 0.4.0; the pinned local tool and installed Codex, Copilot, Claude, Gemini, and Pi assets were replaced with 0.4.0.

## Results And Feedback

Expected Result: Sarathi presents its enduring adaptive delivery model; specification derives testable requirements from stakeholder needs, design shapes the technical model, planning structures delivery, behavior changes are developed test-first, and every stage receives checks plus independent review.
Feedback From: user direction, independent review, deterministic checks, browser layout, and visual inspection
Feedback Status: received
Feedback Evidence: `docs/enduring-model.md`, `docs/sarathi.html`, and `docs/sarathi-process-diagram.png`
Current Work Group: none
Current Work: none
Parallel Limit: 1
What Changed: Restored the requirements hierarchy, architectural design, delivery planning, explicit Red-Green-Refactor, and independent review across all stages; added backward-compatible Spec v3 enforcement and regenerated both process views.
Documents To Update: none beyond the canonical and bundled files in this change
Stop Conditions: contradiction between overview and routing, bundle mismatch, layout failure, or diagram regression to project/version-specific framing

## Open Questions And Blockers

- None.

## Bootstrap Status

Bootstrap File: AGENTS.md
Status: accepted
Notes: Repository instructions were supplied by the user and applied.
