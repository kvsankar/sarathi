---
description: Run repeatable code, test, requirement-link, quality, and extra-risk checks without judging overall quality.
agent: agent
---

# Code Verify

Collect repeatable check results for implemented code. Do not edit code or judge overall
quality. Use `/code-review` for judgment and `/code-assess` for the full gate.

Read `.sdlc/wip.md`, the accepted plan and earlier documents, repository commands, and the
selected review depth and extra checks. Use a fresh checker sub-agent when available;
otherwise disclose that sub-agents are unavailable and run the same checks directly.

## Earlier Documents

When the documents exist, run:

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
  --cov-min <n> \
  --json
```

Prefer `--tests-argv`; use `--tests-shell` only for trusted commands requiring shell
behavior. Use `--traceability` for a non-default map, `--diff-base` when automatic TDD
history resolution is unsuitable, and `--allow-inline-test-traceability` only for an
explicit migration. Add `--require-approvals` when the code gate depends on approved plan
or mock artifacts. Retry with `python3` or `uv run python` when needed.

Report exact commands, raw JSON, exits, passed/total, tests, coverage, links from PRs and
requirements to tests, invalid/unresolved map entries, bad IDs, code markers, TDD evidence,
approval requirements, and external-boundary declarations. Link and boundary fields are
claims; name the concrete test or command behind them.

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
