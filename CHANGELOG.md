# Changelog

All notable Sarathi changes should be recorded here.

This project follows a Keep-a-Changelog style format with `Added`, `Changed`,
`Fixed`, `Deprecated`, `Removed`, `Security`, and `Docs` headings as needed.
Release tags use `vMAJOR.MINOR.PATCH` and should match `pyproject.toml`.

## Unreleased

### Added

- Add the top-level changelog and maintainer release/tagging process.
- Add a deterministic workflow-status HTML renderer and `/workflow-status` command that
  visualize artifact gates, known-unknown decomposition, PR slices, and mapped test evidence;
  publish a linked static process guide that explains PR-sized and recursively decomposable
  workflow shapes.

### Fixed

- Publish installed skill manifests by atomic replacement so agents cannot observe a
  truncated YAML frontmatter block while an installation is running.
- Avoid treating `.sdlc/test-traceability.yaml` path references as malformed
  `TEST-*` IDs during plan/code structural checks.

### Changed

- Clarify cross-scope test ownership: ancestor product/feature acceptance and integration
  obligations must be allocated to code-ready descendant leaves instead of disappearing
  during decomposition or becoming a final big-bang test phase.
- Replace the verbose static process guide with concise PR-sized and decomposable-product
  trees that show feature, slice, and product-integration test leaves and their statuses;
  encode artifact type by node background and work scope by explicit level tags, with
  legend swatches that display the full node fill and accent edge.

## Pre-Changelog History

Sarathi existed before this changelog was introduced. Earlier history is
available in Git, including the prompt, skill, checker, installer, brownfield
adoption, SRS authoring, cleanup, simplify, and process-quality gate changes.
