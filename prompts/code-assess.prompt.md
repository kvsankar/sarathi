---
description: Assess implemented code/logging/error-handling/docs/build/deploy work against its plan with upstream checks, structural code gates, pre-commit/local quality gates, and a qualitative pass.
agent: agent
---

# Code Assess

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

Assess the implementation against `plan.md`, `design.md`, and `spec.md`. The code was built
TDD, one PR at a time. Produce the verification sequence below. Do not edit code unless
asked; report findings only.

If `.sdlc/process-decisions.yaml` records **Brownfield Baseline Adoption** and the user wants
a retrospective review of already-existing code without a plan, use `/code-review` instead
of `/code-assess`. A planless baseline review may be legitimate, but it is not a full code
assessment because `check_code.py`, Planned Touch Sets, PR traceability, and TDD evidence
are plan-dependent. The `/code-review` report should be a baseline conformance audit with
separate code gaps against the SRS and test gaps against SRS/design obligations. Continue
with `/code-assess` only when a code-ready implementation plan exists or the user explicitly
accepts a degraded assessment and the report states which plan-dependent gates were not run.

Do not stop after checker JSON. This assessment must include:

1. Verification 0: upstream spec/design/plan structural evidence plus qualitative
   code-readiness and upstream-fitness assessment.
2. Verification A: structural `check_code.py` evidence.
3. Verification A2: pre-commit or equivalent quality-gate evidence.
4. Verification B: qualitative implementation, test implementation, TDD, scope,
   production-quality, and quality-gate fitness assessment.

If the host exposes sub-agent capability, run these as two fresh-context sub-agent passes.
This split is mandatory for assessment stages:

- **Mechanical Verifier sub-agent**: run upstream checkers, `check_code.py`, and
  pre-commit/equivalent gates; return raw evidence, metrics, IDs, git evidence, and command
  failures.
- **Qualitative Reviewer sub-agent**: read the code, upstream artifacts, and mechanical
  evidence, then judge upstream fitness, implementation quality, test implementation
  quality, logging/telemetry and error-handling fitness, TDD evidence, scope fidelity, and
  quality-gate fitness adversarially.

If sub-agents are unavailable, state that the host lacks sub-agent capability, mark the
assessment as degraded and non-independent where applicable, and keep the mechanical and
qualitative sections separate.

Use an adversarial assessment posture: try to refute correctness, test implementation
quality, TDD claims, planned-scope fidelity, and upstream artifact fitness. If sub-agents
are unavailable and the same agent that implemented the code is assessing it, state that the
review half of the assessment is not independent and actively look for counterexamples.

## Verification 0 — Upstream Consistency Gate

Before assessing the code itself, check whether the upstream spec, design, and plan are fit
to implement from. If the files exist, run:

```pwsh
python checkers/check_spec.py spec.md --json
python checkers/check_design.py design.md --spec spec.md --json
python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
```

If `python` is unavailable or fails because the launcher is missing, retry checker commands
with `python3`; if that is unavailable, retry with `uv run python`.

Then read enough of the upstream artifacts to detect latent issues exposed by the code,
including ambiguous requirements, missing acceptance criteria, untestable design choices,
incorrect component boundaries, plan slices that cannot be built independently, missing NFR
validation, missing logging/telemetry/error-handling intent, missing build/release/
deployment intent, missing/incorrect Planned Touch Sets, missing user/developer
documentation intent, missing approved mock UI for required UI-facing work, traceability
gaps, or implementation behavior that suggests the upstream artifact specified the wrong thing.

Also verify the upstream artifacts were code-ready for this implementation. If `spec.md`,
`design.md`, or `plan.md` declares Exploratory or Decomposable readiness, or if `plan.md`
is a Breakdown plan rather than an Implementation plan, the code can only be assessed if a
focused child spec/design/implementation plan for the implemented slice is also present and
code-ready.

If any upstream checker fails, or if code assessment reveals that the spec/design/plan must
change before the code can be judged fairly, **stop the code assessment**. Report an
**Upstream blocker** with the exact upstream IDs/sections affected, why the code cannot be
reliably assessed, and the recommended upstream revision. Do not continue to Verification A
or B for the code until the upstream issue is resolved.

## Verification A — Mechanical / Deterministic (run the tool)

Run the checker and report its output verbatim. This is a deterministic **structural**
check: it runs the supplied test command, parses labeled coverage output, checks test
traceability evidence, and checks per-module size/TODO/skip markers. It does not prove test
assertions are meaningful, prove real TDD order, or measure PR diff size; Verification B
must judge those from the code, traceability map, tests, and available git/review evidence.
Traceability maps, approval ledgers, and `real_boundary`/`type_conformance` flags are local
structured claims. The checker can validate shape, freshness, and internal consistency; it
cannot prove human intent, semantic coverage, or that a boundary really ran against the
vendor/system named by the claim.

```pwsh
python checkers/check_code.py --plan plan.md --tests-argv '<json-array>' --cov-min <n> --json
```

If all Python runners fail (`python`, `python3`, and `uv run python`), report the runner
failures and fall back to manual checks where possible.

Always provide `--tests-argv` when possible. Use `--tests` only for simple split-safe
commands, and use `--tests-shell` only for trusted commands that genuinely need shell
features. By default, traceability is read from `.sdlc/test-traceability.yaml`; pass
`--traceability <path>` only when the project uses a different map location. Use
`--allow-inline-test-traceability` only as a temporary migration flag for older repos that
still have artifact IDs in test comments/docstrings. The gate fails if no test command runs
or if no coverage percentage is found in labeled coverage output. By default, the checker
tries to resolve a review base using the merge-base with the remote/local default branch.
Provide `--diff-base <base>` when the review target is known and automatic resolution is not
right. If no review base can be resolved, actual PR size is reported as unverified; use
`--allow-missing-git-evidence` only for non-git or intentionally evidence-poor reviews and
state that limitation. TDD evidence from git log is also required by default; use
`--allow-missing-tdd-evidence` only when Red/Green history is unavailable and state that
limitation. The checker exits `0` only if every structural gate passes and emits metrics:

- **tests_pass** — the suite returns success; **no skipped/xfail** tests.
- **coverage_pct** — line coverage ≥ `--cov-min` (default 80).
- **bad_id_format** — ID-looking tokens that are not slug-only, including trailing numeric
  IDs, must be empty.
- **test_traceability** — source/path/status for `.sdlc/test-traceability.yaml`, including
  invalid entries or test names that could not be matched to executable test blocks.
- **pr_traceability_pct** — every plan PR-ID maps to ≥1 test in the external traceability
  evidence. Structural completeness must be 100%, but this is a claim map that still needs
  qualitative spot-checking against test bodies.
- **id_traceability_pct** — every FR/AT/JT/COMP/TEST maps to ≥1 test in
  `.sdlc/test-traceability.yaml` or an equivalent project traceability map. Structural
  completeness must be 100%, but this does not prove the mapped tests are semantically
  sufficient.
- **id_assertion_traceability_pct** — every FR/AT/JT/COMP/TEST maps to a test that contains
  a non-trivial assertion-like statement. Structural completeness must be 100%; review must
  still judge whether the assertion is a real oracle.
- **oversized_modules / module_size_advisory** — files exceeding `--max-loc`. This is
  advisory by default; it fails only when the project explicitly uses `--enforce-max-loc`.
  Do not recommend mechanically splitting cohesive modules merely to fit the target.
- **diff_loc / diff_evidence / oversized_diff / diff_size_advisory** — actual added+deleted
  lines from `git diff --numstat` when git evidence is available. This is advisory
  reviewability evidence, not a hard gate. If unavailable, qualitative review must say
  actual PR size was not independently verified.
- **tdd_evidence** — Red/Green presence markers from git log between the review base and
  `HEAD`. The checker recognizes explicit `TDD: red` and `TDD: green` lines or trailers.
  This is a presence check, not proof that tests really failed before implementation;
  qualitative review must confirm TDD authenticity.
- **code_markers / marker_approval_requirements** — TODO/FIXME/XXX/skip/xfail markers
  found in code or tests. Plain English words such as "skip blank lines" are not markers;
  explicit skip/xfail constructs and TODO-style markers are. These must be surfaced to the
  user and approved through `code.markers.approved`, keyed to the current marker inventory,
  before proceeding.
- **gates** + `passed/total`.

Present the JSON, then `passed/total`, coverage %, traceability %, assertion-traceability %,
diff evidence, and TDD evidence. List every uncovered PR/ID, ID without nearby assertion,
failing test, marker awaiting approval, oversized module, and large diff explicitly. Do not
recommend cutting useful comments, tests, docs,
JSDoc/docstrings, or readable structure merely to fit a diff target.
Flag artifact IDs in test names, docstrings, or comments as code clutter unless the project
has explicitly chosen inline metadata. If `--allow-inline-test-traceability` was used, state
that the run used legacy compatibility and recommend migration to `.sdlc/test-traceability.yaml`.
Spot-check the traceability map by reading at least three mapped tests, or all mapped tests
when fewer than three exist. For each external boundary flagged as `real_boundary` or
`type_conformance`, identify the concrete command/test evidence that would fail if the local
mirror drifted from the real contract. If the answer is "none," fail the assessment.

## Verification A2 — Pre-Commit / Local Quality Gates

Verify that the implementation has language-appropriate local quality gates. Look for
`.pre-commit-config.yaml` first. If the repo intentionally uses another hook/check runner,
such as Husky/lint-staged, Lefthook, Overcommit, Gradle/Maven verification tasks, cargo
aliases, Make/NPM/Taskfile commands, or CI-only gates, verify the documented equivalent.

If neither pre-commit nor an equivalent one-command local quality gate is configured, report
this as a finding. A repo should not rely only on reviewer memory for formatting, linting,
type checking, tests, coverage, complexity, security, and dependency checks.

Run the gate, normally:

```pwsh
uv run python -m pre_commit run --all-files
```

If the project uses an equivalent command, run that command instead and report it. The gate
should cover the repo's languages and file types, using established project tools where
available. Examples include:

- **Python**: `ruff format`, `ruff check`, `ty`, `pyright`/`mypy`, `pytest`, `coverage`,
  `bandit`, `pip-audit`, `radon`/`xenon`.
- **JavaScript/TypeScript**: `prettier`, `eslint`, `tsc --noEmit`, `stylelint`, `vitest`/`jest`
  coverage, `playwright`, `npm audit`/`pnpm audit`, `knip`, `madge`, complexity rules.
- **Go**: `gofmt`, `go vet`, `staticcheck`, `golangci-lint`, `govulncheck`, `go test -cover`.
- **Rust**: `cargo fmt`, `cargo clippy -D warnings`, `cargo test`, `cargo llvm-cov`/`tarpaulin`,
  `cargo audit`.
- **Java/Kotlin**: Checkstyle, Spotless, PMD, SpotBugs, Error Prone, `detekt`, `ktlint`,
  Gradle/Maven test tasks, JaCoCo.
- **.NET/C#**: `dotnet format`, Roslyn/StyleCop analyzers, `dotnet test`, Coverlet.
- **Ruby/PHP/Swift/Dart**: RuboCop/Brakeman/SimpleCov; PHP-CS-Fixer/PHPCS/PHPStan/Psalm/PHPUnit;
  SwiftFormat/SwiftLint/Xcode tests; `dart format`, `dart analyze`, `flutter test --coverage`.
- **Shell/SQL/IaC/config/docs**: `shellcheck`, `shfmt`, `sqlfluff`, `hadolint`, `yamllint`,
  `actionlint`, `markdownlint`, `prettier`, `tflint`, `terraform fmt/validate`, `checkov`.
- **Cross-language**: `lizard`, Sonar-compatible reports, CodeQL where configured,
  dependency audits, `gitleaks` or equivalent secret scanning.
- **Build/deployment validation**: repo-native build commands, Docker/BuildKit or
  `docker compose config`, Kubernetes dry-run or `kubeconform`, Helm lint/template,
  Terraform/OpenTofu validate/plan, Bicep/ARM validation, CloudFormation validate,
  serverless/SAM/CDK synth, package publish dry runs, mobile archive/export validation, and
  environment smoke-test commands where available.

Verify thresholds are explicit and met. If the repo does not define thresholds, use these
minimum review expectations:

- Formatter, linter, type checker, dependency audit, and secret scan: zero errors.
- Tests: pass with no skips/xfails unless each is surfaced to the user and approved before
  proceeding.
- Coverage: use the plan's threshold; if absent, at least 80% line coverage overall,
  70% branch coverage where available, and 90% line coverage for pure functional core modules.
- Complexity: cyclomatic complexity ≤10 per function/method and cognitive complexity ≤15
  where supported, with documented exceptions.
- Security/dependency scans: no critical/high findings; medium findings require accepted
  mitigation or follow-up.
- Module size: review files over the checker's `--max-loc` as maintainability signals.
  Treat them as failures only when the project opted into `--enforce-max-loc` or a stricter
  repo standard; do not mechanically split cohesive modules merely to satisfy the target.
- Build/deployment: planned build command succeeds, expected artifact path/name/version is
  produced or validated, deployment manifests/scripts pass lint/dry-run/plan checks, smoke
  and rollback checks are run where planned, and no production deploy happened without
  explicit approval.
- Documentation: planned doc build/generation/link/readability/accessibility checks pass;
  examples or snippets are runnable where practical; public API/reference docs match the
  implemented contract; no user/developer-facing behavior change ships undocumented unless
  the plan explicitly says docs are out of scope.

## Verification B — Qualitative

Reasoned judgment, scored 1–5 with one concrete fix each:

- **TDD authenticity** — tests assert behaviour, not implementation; meaningful Red. Use
  available git history, review notes, command transcripts, or failing-test evidence. If no
  such evidence exists, report that TDD order was not independently verified rather than
  treating final green tests as proof. Accept a missing Red step only for a planned or
  explicitly accepted narrow exception: generated code only, docs-only, formatting-only,
  build/deploy config validation, or characterization before legacy refactor. Verify the
  replacement evidence for that exception.
- **Test implementation quality and level completeness** — executable acceptance/e2e/API
  workflow tests cover assigned `AT-` items, executable journey/workflow tests cover
  assigned `JT-` items by chaining ordered `AT-` scenarios with realistic state handoff, and
  planned `TEST-` obligations cover unit/pure-core logic, components, contracts,
  integrations, UI/accessibility/visual behavior, quality attributes, migrations, or
  operations as applicable. Review the test code itself: assertions, fixtures, helpers,
  mocks, generated data, setup/teardown, selectors, determinism, speed, isolation,
  readability, maintainability, and false-positive/false-negative risk.
- **Supplemental inner test quality** — code-discovered helper, pure-core, parser, mapper,
  regression, characterization, property/table, adapter, or edge-case tests supplement the
  planned coverage, are mapped in `.sdlc/test-traceability.yaml` to the nearest `PR-` and
  relevant `FR-`/`AT-`/`JT-`/`TEST-`/`COMP-`, stay within the Planned Touch Set, use concrete
  oracles, and do not smuggle product-visible behavior or contract/UX/NFR changes past the
  upstream artifacts.
- **Verification-oracle rigor** — every test has a concrete pass/fail oracle aligned with
  the design/plan, such as return values, state changes, persisted records, emitted events,
  API responses, DOM/accessibility output, screenshots/visual baselines, generated
  artifacts, structured logs, metrics, traces, deployment signals, or captured external
  calls. Tests that only prove execution, mock invocation, or absence of exceptions are weak
  unless that is the specified behavior.
- **Contract realism** — mocks, fixtures, generated clients, captured examples, and
  contract/integration tests reflect the real producer/consumer boundary, including
  representative success and error variants. Ad-hoc string/object mocks that bypass the
  documented contract are defects.
- **External double verification risk** — explicitly answer: "Which tests would fail if
  our local mirror, fake, stub, or mock diverged from the real external contract?" If the
  answer is "none," fail the assessment. Prefer evidence from real-boundary tests, official
  conformance harnesses, type-conformance checks, generated schemas/clients, vendor
  sandboxes/emulators, or captured real fixtures. Coverage percentage and passing unit tests
  do not satisfy external-seam verification by themselves.
- **UI quality and selector resilience** — planned styling/layout/responsive/accessibility
  and readable loading/empty/error/validation states are implemented; behavior tests use
  role/text/semantic selectors rather than CSS classes unless style is the contract under
  test.
- **Mock UI fidelity** — when a mock UI was required, production UI changes match the
  approved mock's screens, states, flows, copy intent, and responsive expectations, or
  clearly record an approved deviation.
- **Logging and telemetry fitness** — planned structured logs, events, metrics, traces,
  audit/support IDs, correlation propagation, redaction, alert hooks, and human/agent
  debugging signals are implemented, tested, stable, useful, and free of secrets or
  excessive noise. Planned APM/application-performance work is present: service/resource
  attributes, critical spans, trace propagation, latency/throughput/error/saturation
  metrics, dashboards, alerts, SLO/SLI signals, and exporter/provider config.
- **Error-handling fitness** — UI, API, domain, integration, infrastructure, validation,
  authorization, timeout, offline, and unexpected failures map to safe messages, typed/
  documented errors, retries/fallback/degraded behavior, escalation, and logs/telemetry at
  the right boundary.
- **Build/deployment completeness** — assigned build/package work produces or validates the
  expected artifact; deployment scripts, manifests, IaC, migrations, smoke checks, rollback
  checks, and release docs are implemented and verified where planned.
- **Test-environment verification** — planned developer-local, shared integration/test,
  staging/pre-production, production canary/smoke, and synthetic-monitor checks were run or
  explicitly reported as unavailable. Any omitted environment that the design/plan required
  is a finding; any live production check requires explicit approval evidence.
- **Context-driven concern verification** — performance/load, security/threat-model,
  privacy/compliance, accessibility, resilience/DR, migration, localization, abuse/fraud/
  safety, cost, compatibility, and operational reviews/tests required by the artifacts were
  performed or explicitly blocked. If code changes reveal a material unplanned concern,
  fail or block for upstream artifact revision.
- **Documentation completeness** — assigned user/developer docs, README/API/reference output,
  examples, tutorials, diagrams, runbooks, troubleshooting, release/migration notes, and doc
  generation are implemented and verified where planned.
- **Correctness** — code satisfies its FR/AT/JT; edge cases handled at the lowest useful test
  level and not only through broad end-to-end tests.
- **Design fidelity** — matches COMP boundaries; pure core stays pure; no layering breaks.
- **Planned scope fidelity** — changed files/sections stay within each PR's Planned Touch Set;
  any out-of-scope edit is flagged as a plan/design/spec revision need, not accepted silently.
- **Readability** — plain test names, clear structure, no dead code, and no traceability ID
  clutter in test names, docstrings, or comments. Test helpers and fixtures should reduce
  drift and duplication without obscuring the behavior being asserted.
- **Production quality** — error handling, validation, logging/telemetry, NFRs met,
  artifacts are reproducible, config/secrets are handled safely, documentation matches
  behavior, and deployment/rollback behavior is credible.
- **Quality gate fitness** — pre-commit/equivalent gates are language-appropriate,
  enforce thresholds, are not trivially bypassed, and align with CI.

## Report format

If blocked by Verification 0:

1. **Upstream blocker** (spec/design/plan IDs or sections + why it blocks code review).
2. Required upstream changes.
3. **Verdict**: Blocked-upstream.

Otherwise:

1. Mechanical scorecard (✅/❌ + IDs + totals).
2. Pre-commit/local quality gate scorecard (configured command, tools, thresholds, pass/fail).
3. Qualitative scorecard (1–5 + fixes).
4. **Top fixes** ranked by impact.
5. **Verdict**: Pass / Pass-with-fixes / Needs rework.

## Human review gate (hard stop)

After reporting the code assessment verdict, **stop**. Do not move to the next PR, release,
deployment, or any downstream artifact in the same turn. The next step requires explicit
user approval or an explicit unattended end-to-end instruction in the user's latest message.
