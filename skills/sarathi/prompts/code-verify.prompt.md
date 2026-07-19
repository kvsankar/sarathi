---
description: Run repeatable code, test, requirement-link, quality, and extra-risk checks without judging overall quality.
agent: agent
---

# Code Verify

Collect repeatable check results for implemented code. Do not edit code or judge overall
quality. Use `/code-review` for judgment and `/code-assess` for the full gate.

Read `.sdlc/wip.md`, the accepted plan and earlier documents, repository commands, and the
selected review depth and extra checks. For an Inherited-Intent Implementation Record (or
legacy Lean Change Record), use approved parent intent in place of missing child spec/design
files. Use a fresh checker sub-agent when available;
otherwise disclose that sub-agents are unavailable and run the same checks directly.

## Earlier Documents

Run only the earlier documents that control the plan. Do not fail an inherited-intent plan
because unnecessary child spec/design files do not exist. When documents exist, run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

Report failures in earlier documents without reinterpreting them as a quality judgment.

## Code And Tests

Run the planned test command through:

```pwsh
python checkers/check_code.py \
  --plan plan.md \
  --tests-argv '<json-array>' \
  --json
```

Pass the real production and test roots with `--src` and `--tests-dir`. Defaults cover
common Python, JavaScript/TypeScript, JVM, Go, Rust, .NET, C/C++, Ruby, PHP, Swift, Scala,
shell, and PowerShell source. Use `--src-ext` for repository-specific languages rather than
silently omitting them.

Prefer `--tests-argv`; use `--tests-shell` only for trusted commands requiring shell
behavior. Add `--require-approvals` when the code gate depends on approved plan or mock
artifacts. Retry with `python3` or `uv run python` when needed.

Report exact commands, raw JSON, exits, passed/total, code markers, approval requirements,
process-ID source hits, and the concrete test or command behind each claimed risk check.
The checker records command outcomes; review judges whether the tests and evidence are
meaningful. Do not require IDs inside source to establish coverage. Use an exact repeated
`--generated-traceability-path` only for explicit generated external ledger files, never to
hide ordinary source pollution.

## Repository And Extra Risk Checks

Run the repository's documented one-command quality gate, normally pre-commit or its
equivalent. Run only checks assigned by the plan or required by identified risks, such as
build/package, docs/examples, deployment dry-run/smoke/rollback, environment, security,
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
- evidence limits: commands do not prove design fitness, test meaningfulness, simplicity,
  true stakeholder feedback, or human approval;
- recommended `/code-review` or `/code-assess`.
