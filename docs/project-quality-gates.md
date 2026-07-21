# Project Quality Gates

Every production repository guided by Sarathi must have a committed, documented,
one-command local gate plus a configured pre-commit hook or the ecosystem's equivalent.
Reuse the repository's established tooling and hook runner. The hook runs the fast,
deterministic subset of the gate; the complete gate should be mirrored in CI wherever
practical so local and shared checks enforce the same rules.

If the gate or hook configuration is missing, make its smallest useful setup part of the
first implementation change. Include the configuration and documentation in that change's
expected files; do not expand an approved plan silently. Document how contributors install
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
