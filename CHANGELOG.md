# Changelog

All notable Sarathi changes should be recorded here.

This project follows a Keep-a-Changelog style format with `Added`, `Changed`,
`Fixed`, `Deprecated`, `Removed`, `Security`, and `Docs` headings as needed.
Release tags use `vMAJOR.MINOR.PATCH` and should match `pyproject.toml`.

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
