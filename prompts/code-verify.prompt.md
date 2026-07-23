---
description: Run repeatable code, test, requirement-link, and project checks without judging overall quality.
agent: agent
---

# Code Verify

Collect repeatable check results for implemented code. Do not edit code or judge overall
quality. Use `/code-review` for judgment and `/code-assess` to run both.

Read `.sdlc/wip.md`, the accepted plan and earlier documents, repository commands, and the
selected delivery assurance and additional checks. A compact or legacy plan may use approved
parent documents instead of unnecessary child spec/design files. Load
`docs/document-locations.md` and `docs/project-quality-gates.md`. Use a fresh checker
sub-agent when available;
otherwise disclose that sub-agents are unavailable and run the same checks directly.

## Earlier Documents

Run only the earlier documents that control the plan. Do not fail a compact or legacy plan
because unnecessary child spec/design files do not exist. When documents exist, run:

```pwsh
python checkers/check_spec.py <spec-path> --json
python checkers/check_design.py <design-path> --spec <spec-path> --json
python checkers/check_plan.py <plan-path> --spec <spec-path> --design <design-path> --json
```

Report failures in earlier documents without reinterpreting them as a quality judgment.

## Code And Tests

Run the planned test command through:

```pwsh
python checkers/check_code.py \
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
mock. Retry with `python3` or `uv run python` when needed.

Report exact commands, raw JSON, exits, passed/total, code markers, approval requirements,
process-ID source hits, and the concrete test or command behind each claimed risk check.
The checker records command outcomes; review judges whether the tests and evidence are
meaningful. TODO/FIXME/XXX and skip/skipif/xfail markers are reported facts, not automatic
failures; a failing verification command remains a failure. Do not require IDs inside
source to establish coverage. Use an exact repeated
`--generated-traceability-path` only for explicit generated external ledger files, never to
hide ordinary source pollution.

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

End with:

- `Verification result: Pass | Fail | Unable to run`;
- commands and concise outcomes;
- evidence gaps and unavailable checks;
- evidence limits: commands do not prove that the design is suitable, tests are meaningful, or the change is simple,
  true stakeholder feedback, or human approval;
- recommended `/code-review` or `/code-assess`.
