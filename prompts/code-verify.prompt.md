---
description: Run repeatable code, test, requirement-link, and project checks without judging overall quality.
agent: agent
---

# Code Verify

Collect repeatable check results for implemented code. Do not edit code or judge overall
quality. Use the `code-review` command for judgment and `code-assess` to run both.

Read `.sdlc/wip.md`, the accepted plan and earlier documents, repository commands, and the
selected delivery assurance and additional checks. A compact or legacy plan may use approved
parent documents instead of unnecessary child spec/design files. Load
`docs/document-locations.md`, `docs/project-quality-gates.md`, and
`docs/result-reporting.md`. Run repeatable commands directly in the active context.

## Earlier Documents

Run only the earlier documents that control the plan. Do not fail a compact or legacy plan
because unnecessary child spec/design files do not exist. When documents exist, run:

```pwsh
node checkers/check_spec.mjs <spec-path> --json
node checkers/check_design.mjs <design-path> --spec <spec-path> --json
node checkers/check_plan.mjs <plan-path> --spec <spec-path> --design <design-path> --json
```

Report failures in earlier documents without reinterpreting them as a quality judgment.

## Code And Tests

Run the planned test command through:

```pwsh
node checkers/check_code.mjs \
  --plan <plan-path> \
  --tests-argv '<json-array>' \
  --json
```

Pass the real production and test files or roots with repeatable `--src` and `--tests-dir`
flags. Missing, unsupported, or otherwise invalid inputs fail visibly instead of producing
an empty scan. Defaults cover
common Python, JavaScript/TypeScript, JVM, Go, Rust, .NET, C/C++, Ruby, PHP, Swift, Scala,
shell, and PowerShell source. Use `--src-ext` for repository-specific languages rather than
silently omitting them.

Prefer `--tests-argv`; use `--tests-shell` only for trusted commands requiring shell
behavior. Add `--require-approvals` when implementation depends on an approved plan or
mock.

Report exact commands, raw JSON, exit codes, pass totals, approval problems, process IDs found
in source, and the command behind each risk check. Explain failures in plain language. The
checker records command results; review judges whether the tests are meaningful. Do not
publish non-blocking scan candidates or a warning section. A failed command remains a
failure. Do not require process IDs in source to prove coverage. Repeat
`--generated-traceability-path` for each exact generated traceability file outside normal
source. Never use it to hide process IDs in normal source.

## Project And Additional Checks

Confirm and run the committed local gate and hook required by
`docs/project-quality-gates.md`. Run only additional checks assigned by the plan or required
by identified risks, such as build/package, docs/examples, deployment dry-run/smoke/rollback, environment, security,
privacy, accessibility, migration, reliability, performance/cost, observability, or
external-integration commands.

Do not recreate existing compatibility proof in a new harness. Run the
existing functional, acceptance, schema/OpenAPI, CI, build, deployment, and operational
suites plus focused changed-boundary tests. Do not perform live production deployment or
checks without explicit user approval.

Report unavailable commands and remaining evidence gaps. Include cleanup/simplify evidence
recorded by code-create without judging its sufficiency.

## Output

Start with one plain result:

- `Verification result: Checks passed | Checks failed | Checks could not run`;
- what the checks establish, then commands and raw metrics;
- missing verification and unavailable checks, separate from process/documentation problems;
- evidence limits: commands do not prove that the design is suitable, tests are meaningful,
  the change is simple, feedback is genuine, or a person approved the work;
- recommended next command, `code-review` or `code-assess`, using the current host's explicit invocation form.
