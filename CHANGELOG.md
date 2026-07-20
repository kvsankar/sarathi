# Changelog

All notable Sarathi changes should be recorded here.

This project follows a Keep-a-Changelog style format with `Added`, `Changed`,
`Fixed`, `Deprecated`, `Removed`, `Security`, and `Docs` headings as needed.
Release tags use `vMAJOR.MINOR.PATCH` and should match `pyproject.toml`.

## Unreleased

## 0.4.0 - 2026-07-21

### Changed

- Recenter Sarathi's overview, routing skill, static guide, and process diagram on its
  enduring model: the learning loop, decomposition when useful, independent quality checks,
  continuity, risk-proportionate assurance, and supporting authoring rules.
- Make decomposition a simple human judgment: split work when a competent engineer cannot
  understand and review it safely as one coherent unit, then stop when each part is clear,
  testable, and safe to integrate. Keep extra documents independent from that decision.
- Treat product-first status, reuse classification, and identifier placement as supporting
  safeguards rather than the identity or headline of the delivery process.
- Restore design as an implementable, evolvable technical model rather than merely a
  current-to-target change description. Require designs to select consequential boundaries
  for their context, including applicable database-schema and API boundaries in backends.
- Restore planning as executable delivery structure rather than only the next safe
  increment. Distinguish Breakdown child-outcome graphs from Implementation PR graphs, and
  require proportionate impact, dependency, sequencing, integration, safety, and proof.
- Restore explicit Red-Green-Refactor for behavior-changing code, including observation of
  the expected failing test before the minimum implementation, and make test evidence plus
  independent review visible across every stage of the enduring model and process diagram.
- Restore a needs-to-evidence specification model, principally influenced by
  Leffingwell/Widrig, as a core stage definition:
  problem and stakeholder needs lead to features, use cases, functional and supplementary
  requirements, black-box acceptance tests, journeys, and traceability to observable
  evidence. New and materially revised specs use format version 3 so the checker requires
  that complete product-spec hierarchy; existing version-2 specs retain their earlier
  human-first contract.

### Fixed

- Keep existing version-2 plans with the documented `Implementation Crux` heading
  readable while new plans use `Implementation Approach`.
- Keep existing version-2 specifications and designs with the documented
  `Product Crux` and `Technical Crux` headings readable.
- Accept the documented `Required child documents` wording in Breakdown-plan
  allocations while retaining the legacy `Required child artifacts` field.

## 0.3.2 - 2026-07-19

### Changed

- Lead WIP files, status answers, handoffs, and generated workflow pages with a short,
  scope-qualified engineering snapshot; show document and approval state afterward, and
  never promote assessed or handed-off child slices into parent-feature completion.
- Require new plans to inspect existing and sibling systems, explain the shared-versus-target
  boundary, and classify each delivery item as reuse, extraction, target-owned work, new
  behavior, or deferred cleanup.
- Replace stale WIP narrative on update and keep historical approvals, assessments, hashes,
  and checker details as secondary linked evidence.

### Fixed

- Report TODO/FIXME/XXX and skip/skipif/xfail markers without failing solely because they
  appear in source; review still treats unexplained skips and expected failures as evidence
  gaps.
- Restrict source process-ID detection to canonical uppercase IDs and declared IDs
  normalized into test names, avoiding ordinary values such as `test-client-id` and
  behavioral `test_*` names while still rejecting `test_at_auth_reset_replay` when that
  obligation exists.
- Let repeated `--src` and `--tests-dir` inputs name files or recursive directories, and
  fail visibly for missing or unsupported inputs.
- Use `timezone.utc` so standalone checkers remain usable with Python 3.9.

## 0.3.1 - 2026-07-19

### Removed

- Remove the required Complexity Budget, Ceremony Budget, Direct-To-Code form, special
  complexity approval, PR-count limit, keyword triggers, and code-marker approval.

### Changed

- Rewrite the main instructions, reviews, checker messages, and project-status page in
  ordinary engineering language. New files say `Ready To Implement`, `Extra Checks`,
  `Expected Result`, and `Work Groups`; older field names remain parseable.
- Let new human-first documents choose descriptive sections instead of reproducing the
  legacy template. Existing documents remain readable by the checkers.
- Report TODO/FIXME/XXX entries as warnings, while skipped and expected-failure tests remain
  a failing code check without requiring a separate approval form.
- Make installers report compact summaries by default, move expected dogfooding and
  checker-scope messages to verbose notes, and add `-v`/`--verbose` detail output to both
  source-checkout scripts and the packaged CLI.

## 0.3.0 - 2026-07-19

### Changed

- Make new and materially revised specifications, designs, and plans human-first: a plain
  language crux leads each document, descriptive headings remain visible, and process IDs
  move to structured comments and a final traceability appendix.
- Preserve unmarked legacy artifact parsing while adding narrow versioned structure checks,
  hidden-ID delivery/wave rendering, and external source-ID cleanliness checks.
- Require independent reviews to reject documents whose product, architecture, or
  implementation cannot be understood without decoding Sarathi identifiers.

## 0.2.0 - 2026-07-18

### Changed

- Make direct-to-code readiness the default when accepted parent intent and architecture
  plus a bounded Implementation plan safely authorize the next reviewable increment.
- Replace recursive child-document defaults with inherited-intent delta records, a ceremony
  budget for exceptional decomposition, prototype-driven UI slices, and focused re-review.
- Plan schema migration: existing plans must add the compact `Direct-To-Code Decision`
  before their first 0.2 plan check. Breakdown plans also add an allowed decomposition
  reason and Ceremony Budget. Legacy Lean markers remain recognized but do not bypass this
  decision.

## 0.1.1 - 2026-07-18

### Changed

- Lead installation guidance with a one-command `uvx` path and make implicit user-scoped
  package installs skip the redundant project-local checker copy unless requested.
- Require an available Sarathi update to be reported and explicitly approved before an
  agent installs the exact version, verifies its manifest, and asks for an agent reload.

### Fixed

- Give post-PyPI GitHub Release commands an explicit repository so finalization works in a
  job that intentionally does not check out the source tree.
- Scope duplicate-heading linting to sibling sections so Keep-a-Changelog categories can
  repeat across version sections.

## 0.1.0 - 2026-07-18

### Added

- Distribute Sarathi as the `sarathi-sdlc` Python package with a CLI that installs the
  existing cross-platform skill, prompt, and checker targets from a wheel.
- Give installed skills explicit version metadata and a cached, fail-open PyPI update check
  with an environment-variable opt-out.
- Publish tagged releases through a gated GitHub Actions Trusted Publisher workflow, then
  create a GitHub Release with the verified wheel and source distribution attached.
- Show ordered `Wave N` labels beside scheduled child work in the workflow tree, show each
  slice's PR state directly beneath its document chain, and let the compact parent-approval
  status open a dialog with each approval record, stale hash prefixes, and the exact next
  approval needed. Keep wave detail in the expanded tree row instead of a second page section.
- Add a delivery-progress status summary and feature, slice, wave, and text filters that
  retain enough hierarchy to navigate from product progress to the detailed allocation tree.

- Add Lean, Standard, and High-assurance delivery profiles with context-triggered assurance
  modules while preserving one feedback-driven lifecycle.
- Add a hard simplicity policy: process/product architecture separation, brownfield oracle
  reuse, evidence-before-generalization, deletion-first review, conceptual complexity
  budgets, and a three-PR default for bounded implementation slices.
- Add deterministic instruction budgets and a package-extraction regression example that
  collapses speculative machinery into current contracts, consumer integration, and real
  compatibility evidence.
- Add ordered wave declarations and a workflow-status projection: Breakdown plans assign
  `WORK-*` members to `WAVE-*` sequences, while hash-current wave checkpoints preserve
  completed feedback and parent-document impact evidence.
- Add an iterative feedback-and-learning policy: code-ready slices declare learning and
  feedback targets, code assessment records honest feedback status and ancestor impact, and
  the static process guide shows the inspect/adapt loop.
- Add bounded learning-wave guidance for agent parallelism, distinguishing preferred
  intra-slice work, independent concurrent slices, and exceptional speculative downstream
  work through execution, learning, and integration dependencies.
- Show the current learning target, feedback state, active wave and slices, WIP limit,
  invalidation result, ancestor impact, and stop/replan triggers in workflow-status HTML;
  preserve completed-slice learning evidence in hash-current code assessments.
- Add the top-level changelog and maintainer release/tagging process.
- Add a deterministic workflow-status HTML renderer and `/workflow-status` command that
  visualize real artifact gates, known-unknown decomposition, PR slices, and mapped test
  evidence as the same branching Spec/Design/Plan/Code tree used by the linked static process
  guide.

### Fixed

- Resolve transitive verify/review prompts from the sibling Sarathi bundle in direct stage
  aliases, with project-install regression coverage.
- Install complete executable checker bundles, including shared parser/support modules.
- Require every delivery plan to declare complete ordered learning waves instead of
  allowing an absent wave section to pass structurally.
- Separate four-plus-PR exception approval into `plan.complexity-approved`, allowing draft
  verification before the targeted approval and reserving `plan.approved` for code entry.
- Match complexity approvals to Slice/change Plan artifacts, reject auto-approval, and let
  later valid reapprovals supersede stale or ineligible earlier records.
- Validate an exact structured complexity budget and declared PR count instead of accepting
  any non-empty one-line mention.
- Restore explicit TDD-exception categories, scope, replacement evidence, and qualitative
  safety boundaries while replacing lexical Red/Green matching with labeled contracts.
- Ignore fenced Markdown examples when parsing complexity budgets, learning waves, and TDD
  fields; require exact TDD-exception category values.
- Use one canonical `MILE|WORK|PR-AREA-NAME` grammar in plan verification and workflow
  rendering; reject one-token and extra-token IDs, avoid valid-prefix matches, and display
  malformed allocations as excluded repair warnings.
- Prevent status and process-guide nodes from collapsing below their content height in
  mobile column layouts; add Chromium assertions for clipping, overlap, and horizontal
  overflow at mobile and desktop viewports.

### Changed

- Move wave scheduling to Breakdown plans: they group `WORK-*` children, while an
  Implementation plan contains the PRs for one child. Plan and status checks enforce that
  separation.
- Show feature-owned and product-owned slices separately in workflow status, including
  nested allocation paths and external artifact links where configured.

- Rewrite the routing skill, stage prompts, core process docs, static guide, and workflow
  status copy in plain language while preserving checker fields, approval boundaries,
  independent assessment, TDD, feedback, and safety rules.
- Consolidate shared policy into triggered references and reduce the canonical stage prompt
  surface from roughly 5,000 lines to about 1,000 lines.
- Make simplify passes capable of requiring upstream spec/design/plan revision when an
  accepted artifact is itself overbuilt.
- Distinguish mapped test evidence from assessed or completed code: hash-current passing
  code-assessment entries display `Assessed`, while hash-current `code_slice.approved`
  records display `Completed`.
- Publish installed skill manifests by atomic replacement so agents cannot observe a
  truncated YAML frontmatter block while an installation is running.
- Avoid treating `.sdlc/test-traceability.yaml` path references as malformed
  `TEST-*` IDs during plan/code structural checks.
- Define approval as permission for the next learning step rather than artifact freeze;
  require post-slice revision decisions for affected specs, designs, plans, integration
  work, and process tools before learning-dependent work continues.
- Rework live workflow status around a compact executive summary and progressively
  disclosed allocation tree: the active branch opens by default, inactive branches remain
  collapsed, and green/amber/gray icon states distinguish approval, work in progress, and
  work not started without implying percentage complete.
- Clarify cross-scope test ownership: ancestor product/feature acceptance and integration
  obligations must be allocated to code-ready descendant leaves instead of disappearing
  during decomposition or becoming a final big-bang test phase.
- Define `WORK-*` as a parent Breakdown-plan allocation to an explicit child scope and
  artifact chain; distinguish product-to-feature, feature-to-slice, and justified
  product-to-integration-slice decomposition in prompts, docs, status views, and mechanical
  plan checks.
- Replace the verbose static process guide with concise PR-sized and decomposable-product
  trees that show feature, slice, and product-integration test leaves and their statuses;
  encode artifact type by node background and work scope by explicit level tags, with
  legend swatches that display the full node fill and accent edge.

### Removed

- Remove source-hash snapshot and provenance-table UI from workflow status; hashes remain
  available to deterministic checks without becoming status-page content.
- Remove the workflow-and-learning diagnostics disclosure; delivery status is conveyed by the
  progress summary, workflow tree, approval dialog, and only real plan-check warnings.
- Remove all PR, diff, module, and source-file line-count options, metrics, warnings,
  reports, tests, and planning guidance. Reviewability now uses cohesion, conceptual
  complexity, touch scope, evidence, rollback, and learning boundaries.
- Remove superseded private critical-review snapshots from active documentation.

## Pre-Changelog History

Sarathi existed before this changelog was introduced. Earlier history is
available in Git, including the prompt, skill, checker, installer, brownfield
adoption, SRS authoring, cleanup, simplify, and process-quality gate changes.
