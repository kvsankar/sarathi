# Project Quality Gates

Every production repository guided by Sarathi must have a committed, documented,
one-command local gate plus a configured pre-commit hook or the ecosystem's equivalent.
Reuse the repository's established tooling and hook runner. The hook runs the fast,
deterministic subset of the gate; the complete gate should be mirrored in CI wherever
practical so local and shared checks enforce the same rules.

If the gate or hook configuration is missing, make its smallest useful setup part of the
first implementation change. Include the configuration and documentation in that change's
expected files; do not expand the controlling slice or plan silently. Document how contributors install
the hook and how they run the complete gate without committing.

Choose checks for the languages and files the repository actually contains:

- Python: Ruff formatting and linting, `ty` type checking or an established Pyright/mypy
  equivalent, and focused tests.
- JavaScript/TypeScript: Prettier formatting, ESLint, the TypeScript compiler when
  TypeScript is present, and focused tests.
- JVM languages: the established formatter, compiler, Checkstyle/SpotBugs or equivalent
  static analysis, and focused Gradle/Maven tests.
- Go: `gofmt`, `go vet` or Staticcheck, and focused `go test` packages.
- Rust: rustfmt, Clippy, and focused Cargo tests.
- .NET: `dotnet format`, compiler/analyzer checks, and focused `dotnet test` projects.
- Other ecosystems: the repository's formatter, linter, type/static checker, and focused
  test command. Prefer an established ecosystem hook runner over introducing a parallel
  framework.

Keep commit-time checks deterministic and fast enough that contributors will use them.
Put slow suites, builds, network-dependent checks, broad security/dependency scans, and
environment-heavy validation in the one-command project gate and CI when they are not
suitable for every commit. Do not add unrelated tools or duplicate checks already enforced
credibly by the repository.

During code creation, install or refresh the hook in the working checkout, run the complete
gate before handoff, and report the exact command and result. Verification treats a missing
required gate, an uninstalled hook, or a failing check as an evidence gap, not a pass.

## Start From A Green Gate

Begin a work item from a passing complete gate, not only end with one. A slow gate that
runs only at delivery discovers accumulated drift at the worst moment — mid-delivery, on
top of finished work. Running it at work-item start moves that discovery to the cheapest
moment. Where the repository caches results by exact content, a clean start costs seconds
and a real run happens exactly when something changed, which is when the time buys
information. Repair a red baseline as its own small correction before feature work begins.

When two checkers assert the same fact — for example an expected output shape pinned in
both a test suite and a packaging script, possibly in different languages — record the
fact once in a fixture that every checker reads. A fact written twice eventually disagrees
with itself, and diff-scoped review cannot see the copy in the file the change did not
touch; only executing the second checker, or removing the duplication, catches it.
