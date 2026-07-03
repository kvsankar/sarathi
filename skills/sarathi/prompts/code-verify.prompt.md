---
description: Run code verification gates, tests, quality checks, logging/error-handling checks, build/docs/deployment checks, and structural code evidence without qualitative review.
agent: agent
---

# Code Verify

## Workflow state

At the start of this stage, follow `docs/work-in-progress.md`: read `.sdlc/wip.md` if it
exists, verify important claims against the named artifacts, and use it only as a resume
note. Before any hard stop, blocker report, or completed stage handoff, update `.sdlc/wip.md`
with the current stage, artifact paths, decisions/assumptions, verification evidence,
blockers/open questions, bootstrap status, and next recommended action. Do not store
secrets or long command logs.

## Artifact formatting

For Markdown artifacts and reports produced or revised in this stage, follow
`docs/artifact-formatting.md`: wrap normal prose and list continuation lines at 80
characters where practical, while allowing longer lines for tables, URLs, code/logs,
paths, hashes, IDs, approval records, and syntax where wrapping would reduce correctness
or readability.

Run verification gates for implemented code. This command is the confidence-run command:
tests, coverage, pre-commit/equivalent quality gates, logging/error-handling checks,
build/docs/deployment checks where planned, upstream structural checks, and `check_code.py`.
It collects evidence only; it does not perform a qualitative code review. Use `/code-review`
for judgment and `/code-assess` for verify + review.

If the host exposes sub-agent capability, run this verification in a fresh-context
Mechanical Verifier sub-agent. This is mandatory for verify stages. The Mechanical Verifier
reports deterministic evidence only and does not give a qualitative verdict. If sub-agents
are unavailable, state that the host lacks sub-agent capability and run the same mechanical
checks directly.

Do not edit code unless explicitly asked.

## Upstream Structural Verification

When upstream artifacts exist, run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

If `python` is unavailable or fails because the launcher is missing, retry with `python3`;
if that is unavailable, retry with `uv run python`.

Report any upstream structural failure as evidence. Do not do qualitative upstream review in
this command.

## Code/Test Structural Verification

Run the planned test command through `check_code.py`:

```pwsh
python checkers/check_code.py --plan plan.md --tests-argv '<json-array>' --cov-min <n> --json
```

Prefer `--tests-argv`. Use `--tests-shell` only for trusted commands that genuinely need
shell behavior. By default, traceability is read from `.sdlc/test-traceability.yaml`; pass
`--traceability <path>` only when the project uses a different map location. Use
`--allow-inline-test-traceability` only as a temporary migration flag for older repos that
still have artifact IDs in test comments/docstrings. Provide `--diff-base <base>` when the
review target is known and automatic merge-base resolution is not right.

When verifying a code gate that depends on an approved plan, add `--require-approvals`.
This checks `.sdlc/approvals.yaml` for a hash-matched `plan.approved` record and, when the
plan declares UI work with a mock dependency, a hash-matched `ux.mock.approved` record. UTC
`approved_at` timestamps are required. This verifies the structure and freshness of a local
attestation record; it does not prove human intent or external consent.

Report:

- Exact command executed.
- Raw checker JSON.
- Exit code.
- `passed/total`.
- Test pass/fail.
- Coverage percentage.
- PR and FR/AT/JT/COMP/TEST traceability percentages, sourced from
  `.sdlc/test-traceability.yaml` or the project-equivalent traceability map.
- Note that the traceability map is a structured project claim, not independent proof of
  semantic coverage.
- Assertion-traceability percentage.
- Test traceability file status, invalid entries, and unresolved mapped test names.
- External boundary verification from `.sdlc/test-traceability.yaml`: each entry may declare
  `boundary`, `level`, `uses_double`, `real_boundary`, and `type_conformance`. If a boundary
  has tests that use a double, at least one mapped test for the same boundary must be a
  real-boundary or type-conformance check. Treat these flags as declarations and report the
  concrete command/test evidence behind them.
- Diff LOC and evidence source, as advisory reviewability evidence.
- TDD evidence source. The checker recognizes explicit `TDD: red` and `TDD: green`
  commit-message lines/trailers; ordinary words such as "implementation" or "failing test"
  do not count.
- Approval requirements and stale/missing approval records when `--require-approvals` is
  used.
- Bad ID format, oversized modules, large advisory diffs, failing/skipped tests,
  TODO/FIXME/XXX/skip/xfail markers awaiting approval, and uncovered IDs. Large modules and
  large diffs are advisory unless `--enforce-max-loc` or a
  project-specific hard gate is used; never recommend cutting useful comments, tests, docs,
  JSDoc/docstrings, readable structure, or cohesive module boundaries merely to fit a size
  target.
- Any external boundary whose tests rely only on a self-authored double is a failed
  verification gate. Coverage percentage and passing unit tests do not satisfy this gate.

Do not add SDLC-specific annotations to app code. If markers remain, surface their file,
line, marker, and text to the user and require `code.markers.approved` before downstream
progress.

## Local Quality Gates

Run the repository's configured one-command quality gate, normally:

```pwsh
uv run pre-commit run --all-files
```

If the project uses another documented equivalent, run that command instead. Report the
command, tools covered, thresholds, and pass/fail.

## Logging, Error, Build, Documentation, And Deployment Verification

Run planned commands where present:

- Logging/telemetry checks for structured events, metrics, traces, audit/support IDs,
  correlation propagation, redaction, alert hooks, APM instrumentation, service/resource
  attributes, trace propagation, latency/throughput/error/saturation metrics, dashboards,
  alerts, SLO/SLI signals, exporter/provider config, and absence of sensitive data.
- Error-handling checks for UI/API/domain/integration/infrastructure error mapping,
  retry/fallback/degraded behavior, safe user/API messages, and representative failure
  paths.
- Build/package command and artifact existence/version check.
- Documentation build/generation/link/example checks.
- Deployment lint/dry-run/plan/template/smoke/rollback checks.
- Test-environment checks named by the plan, including developer-local and any shared
  integration/test, staging/pre-production, production canary/smoke, or synthetic-monitor
  checks.
- Context-driven checks named by the plan, such as performance/load, security,
  privacy/compliance, accessibility, resilience/DR, migration, compatibility, cost, or
  operational checks.

Do not perform a live production deployment unless the user explicitly asked for it.

## Output

End with:

- **Verification result**: Pass / Fail / Unable to run.
- Commands run and concise outcomes.
- Evidence gaps or commands that could not run.
- **Evidence limits**: verification evidence does not prove implementation quality, design
  fidelity, TDD authenticity, or test meaningfulness.
- **Recommended next command**: `/code-review` or `/code-assess`.
