# Changelog

All notable Sarathi changes should be recorded here.

This project follows a Keep-a-Changelog style format with `Added`, `Changed`,
`Fixed`, `Deprecated`, `Removed`, `Security`, and `Docs` headings as needed.
Release tags use `vMAJOR.MINOR.PATCH` and should match `pyproject.toml`.

## Unreleased

### Added

- Add the top-level changelog and maintainer release/tagging process.
- Add the cross-ecosystem `api-contract-examples` skill, including deterministic OpenAPI 3 to
  Markdown and Markdown-to-HTML renderers and Sarathi design-to-code obligations for
  schema-owned examples, conformance, reproducibility, and freshness.

### Fixed

- Avoid treating `.sdlc/test-traceability.yaml` path references as malformed
  `TEST-*` IDs during plan/code structural checks.

## Pre-Changelog History

Sarathi existed before this changelog was introduced. Earlier history is
available in Git, including the prompt, skill, checker, installer, brownfield
adoption, SRS authoring, cleanup, simplify, and process-quality gate changes.
