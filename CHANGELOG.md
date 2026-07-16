# Changelog

All notable Sarathi changes should be recorded here.

This project follows a Keep-a-Changelog style format with `Added`, `Changed`,
`Fixed`, `Deprecated`, `Removed`, `Security`, and `Docs` headings as needed.
Release tags use `vMAJOR.MINOR.PATCH` and should match `pyproject.toml`.

## Unreleased

### Added

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

- Use one canonical `MILE|WORK|PR-AREA-NAME` grammar in plan verification and workflow
  rendering; reject one-token and extra-token IDs, avoid valid-prefix matches, and display
  malformed allocations as excluded repair warnings.
- Prevent status and process-guide nodes from collapsing below their content height in
  mobile column layouts; add Chromium assertions for clipping, overlap, and horizontal
  overflow at mobile and desktop viewports.
- Distinguish mapped test evidence from assessed or completed code: hash-current passing
  code-assessment entries display `Assessed`, while hash-current `code_slice.approved`
  records display `Completed`.
- Publish installed skill manifests by atomic replacement so agents cannot observe a
  truncated YAML frontmatter block while an installation is running.
- Avoid treating `.sdlc/test-traceability.yaml` path references as malformed
  `TEST-*` IDs during plan/code structural checks.

### Changed

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

## Pre-Changelog History

Sarathi existed before this changelog was introduced. Earlier history is
available in Git, including the prompt, skill, checker, installer, brownfield
adoption, SRS authoring, cleanup, simplify, and process-quality gate changes.
