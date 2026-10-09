# TODO

Open engineering work for Sarathi itself. This file stays at the repository
root because everything under `docs/` is bundled into installed skills.

## Adopted documents and existing projects

Found while restructuring the documentation of kvsankar/prashna, which
adopted Sarathi in `brownfield_baseline` mode and is moving to
`brownfield_delta_only`.

- **Adopted documents cannot pass the checkers.** `docs/project-entry.md`
  says an existing document can satisfy a gate when it is classified
  `adopt`, and `artifact_paths` can point at it. The checkers only recognise
  Sarathi-format documents. Run on Prashna's own spec (`docs/specs.md`),
  `check_spec.mjs` counted 0 use cases and 0 requirements, rejected all 77
  IDs of the form `UC-A-01` (`id_format_slug_only`), and failed
  `sections_present`. Converting would mean renaming IDs that about 600
  test names depend on. Decide between an adopt mode in the checkers (for
  example a configured ID pattern and section mapping) and documenting that
  adoption requires conversion to the Sarathi format.
- **Coverage is reported as 100% when nothing was found.** For the same
  document, `uc_at_coverage_pct` and `fr_at_coverage_pct` were 100.0 with
  zero use cases and requirements counted. A zero count should fail or
  warn instead of passing the coverage gates.
- **Retrospective baselines duplicate an existing authoritative spec.** In
  `brownfield_baseline` mode Sarathi wrote `spec.md` and `design.md` beside
  Prashna's existing `docs/specs.md` and `docs/UX.md`. Only about 60 to 90
  of the 1,052 lines in `spec.md` were not written elsewhere, and the two
  sets drifted (about 30 stale or contradictory statements within three
  months). When an authoritative spec already exists, guide the user
  towards `adopt` or `brownfield_delta_only`, or define how retrospective
  documents are retired once they are reconciled.
- **Stale records go unnoticed.** In Prashna, the `.sdlc/approvals.yaml`
  hashes for `spec.md` and `design.md` no longer matched the files,
  `.sdlc/test-traceability.yaml` named two tests that no longer exist, and
  `.sdlc/wip.md` described work finished two months earlier. `check_spec`
  without `--require-approvals` passed 7 of 8 gates on that `spec.md`
  (the `--require-approvals` path was not tried). Consider having `status`
  or the checkers report approval-hash mismatches and traced tests that are
  missing from the repository.
- **Delta-only mode does not say where change documents end up.** After a
  slice ships, its behaviour belongs in the project's own documentation.
  Describe how the slice document is folded in and retired, so a project
  that keeps one authoritative spec does not accumulate a second one.
