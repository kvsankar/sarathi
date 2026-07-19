# Human-first Sarathi artifacts

<!-- sarathi:artifact-format version="2" -->

## Implementation Crux

Sarathi will put a concise product, technical, or implementation explanation before
process metadata. Specifications, designs, and plans will keep descriptive visible
headings, while a final traceability appendix or structured HTML comments preserve the
links used by checkers and status rendering.

The change updates one shared policy reference, the stage prompts that create and judge
documents, the deterministic checkers, the bundled skill copies, and regression tests.
Legacy documents remain valid. New-format documents are checked for their opening crux,
descriptive headings, and final traceability layer. Production and test source is checked
for process-ID pollution without requiring IDs in code.

No new document type, service, approval gate, or source-code annotation mechanism will be
introduced. Success is demonstrated by the complete Python, layout, pre-commit, bundle,
and dogfood regression suites.

## Overview

Work Scope: Slice/change
Implementation Readiness: Code-ready
Delivery Profile: Standard
Assurance Modules: Documentation, Build and release
Plan Type: Implementation
Inherited Intent Record: Yes

The user supplied accepted intent and explicitly requested end-to-end implementation. The
repository is an existing system governed in delta-only mode.

## Direct-To-Code Decision

- Inherited Sources: the user-provided human-first artifact requirements and repository
  maintenance policy.
- Reviewable Increment: human-first specs, designs, and plans with isolated traceability
  and clean production/test source.
- Unresolved Blocker: none.
- Smallest Additional Artifact: none.

Why Direct: The requested behavior, compatibility boundary, forbidden approaches, examples,
and regression scenarios are explicit; one bounded plan can safely authorize the change.

Acceptance & Verification: scenarios A through E have focused checker, source-scan,
renderer, and dogfood assertions. The complete Python suite must pass with at least 80%
checker branch coverage, followed by layout tests, pre-commit, and bundled-skill validation.

## Strategy

Add one concise shared human-first policy and point affected prompts and contracts to it.
Teach checkers only narrow structural rules: preserve unversioned legacy parsing and opt
new or materially revised documents into a hidden human-first format marker; validate crux
placement and descriptive headings for versioned documents; resolve IDs from the appendix
or comments; and detect process IDs in the production/test source paths passed to the code
checker. Explicit generated external traceability paths are outside source scanning.
Sarathi's checker fixtures contain process IDs as test data, not implementation
traceability, and are exercised as fixture content rather than scanned application source.
Keep subjective comprehensibility in independent review.

The implementation will preserve current parsing paths and add new-format paths alongside
them. Canonical sources will be mirrored into the installable bundle. Cleanup will remove
duplicated wording, and simplification will reject any new artifact hierarchy or runtime
traceability machinery.

## Complexity Budget

- Mental Model: readable technical documents first, compact traceability last.
- Current Consumers: stage agents, Markdown checkers, workflow rendering, and installed
  Sarathi bundles.
- Proposed Additions: one shared policy reference and small parsing/checking helpers.
- Existing Evidence Reused: checker tests, bundle parity tests, prompt budgets, layout
  tests, and pre-commit.
- Deleted or Deferred: prose scoring, a traceability service, new artifact types, and
  identifiers embedded in source code.
- Implementation PR Count: 1

## Milestones

The single milestone is a backward-compatible human-first authoring and review contract.
Scenario A asserts an identifier-free authentication crux and external trace appendix;
scenario B asserts compact small-change documents; scenario C asserts high-assurance
migration detail without jargon inflation; scenario D asserts legacy acceptance and
versioned conversion; scenario E accepts behavioral test names and rejects source-ID
pollution.

## Pull Requests / Child Work Items

One cohesive change updates the shared human-first policy; artifact, formatting,
simplicity, cleanup, and ID guidance; create/review/verify/assess prompts; Markdown, stage,
code, wave, and workflow-status parsing; dogfood examples; mirrored bundle content; tests;
and the changelog. Discoveries remain in scope only when they directly implement or verify
this named compatibility contract.

## Coverage Map

The final traceability table allocates all requested document, checker, source-cleanliness,
compatibility, review, dogfood, and validation outcomes to the single implementation item.

## Sequencing & Risks

Write tests for the new format and legacy compatibility, implement the shared parser and
checker rules, update canonical guidance, mirror the bundle, then run focused and complete
validation. The exact publication checks are `uv run pytest -q --cov=checkers
--cov-report=term-missing`, `npm run test:layout`, `uv run pre-commit run --all-files`, and
the repository-prescribed `quick_validate.py skills/sarathi` command using an available
project Python environment. Every command must exit zero; coverage must satisfy the
repository threshold. Stop and replan if legacy fixtures cannot remain accepted or if
checker support would require source annotations. The whole change is reverted together if
compatibility regresses.

Learning Target: whether one compact human-first contract can improve opening-page
comprehension without weakening deterministic traceability.

Feedback Target: the user, independent code review, dogfood examples, and executable
regression evidence.

Feedback Method: inspect before/after authentication examples and review checker results.

Comprehensibility Review: an independent reviewer must answer the first-page product,
technical, and implementation questions. Automatic structure checks do not prove clarity;
if the reviewer must decode IDs before explaining the crux, the document is rewritten.

Invalidation Question: does any required traceability still force process IDs into visible
technical prose or source code?

Ancestor Impact: revise canonical process policy, stage prompts, and bundled copies; no
product requirement ancestor exists.

## Traceability

| Delivery item | Milestone | Scope | Planned touch set | Verification |
| --- | --- | --- | --- | --- |
| PR-HUMANFIRST-ARTIFACTS | MILE-HUMANFIRST-DELIVERY | Human-first authoring, checking, review, bundling, and dogfood | Named shared docs and stage prompts; Markdown/stage/code/wave/status checkers; focused tests and fixtures; exact bundle mirrors; `CHANGELOG.md` | Scenarios A-E, full pytest with coverage, layout tests, pre-commit, and skill validation |

- MILE-HUMANFIRST-DELIVERY
  Outcome: readable documents retain mechanically resolvable traceability.

- PR-HUMANFIRST-ARTIFACTS
  Scope: implement the complete human-first artifact correction.
  Planned Touch Set: `docs/human-first-artifacts.md`, affected artifact/formatting/
  simplicity/cleanup/ID references and process guide; affected spec/design/plan/code stage
  prompts; `checkers/markdown_structure.py`, affected stage/code/wave/status checkers and
  schemas; focused checker/code/renderer/bundle/budget tests and dogfood fixtures; exact
  mirrors under `skills/sarathi/`; `skills/sarathi/SKILL.md`; and `CHANGELOG.md`.
  Focused Verification: human-first and legacy artifact fixtures pass; source pollution
  fixtures fail with precise findings; canonical and bundled files match.
  Pass/Fail Check: all requested regression scenarios and repository publication checks
  pass with no source-code process IDs introduced.
  Risk Evidence: legacy fixtures prove backward compatibility; dogfood fixtures cover
  authentication and high-assurance migration examples.
