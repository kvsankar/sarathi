---
description: Qualitatively review implemented code, tests, logging/error-handling, docs, build/deploy work, and upstream consistency using existing verification evidence where available.
agent: agent
---

# Code Review

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

Perform the qualitative review of implemented code, tests, docs, build/deploy work, and
upstream consistency. This command judges the change; it does not replace `/code-verify`.
If verification evidence is absent, state that gap and either use the latest supplied
evidence or recommend `/code-verify`. Use `/code-assess` when the user wants verification
and review together.

Do not edit code unless explicitly asked.

Before judging the code itself, check the project entry decision in
`.sdlc/process-decisions.yaml` when present. For normal greenfield work and new brownfield
deltas, check whether the upstream spec, design, and plan are fit for this implementation.
If a latent upstream issue prevents fair code review, stop with an upstream blocker and
name the affected IDs/sections.

For **Brownfield Baseline Adoption**, a retrospective baseline code review may proceed
without `plan.md` only when the decision record or the user's current instruction explicitly
allows `code_review_without_plan_allowed_for: baseline_review_only`. In that mode, say the
review is judging existing code against reconstructed spec/design intent, not against a
pre-approved implementation plan. Review plan-dependent items such as Planned Touch Set,
TDD order, and assigned `AT-`/`JT-`/`TEST-` coverage as "not applicable to retrospective
baseline review" or as improvement findings, not as false claims of plan conformance. Any
new implementation delta still requires the normal code-ready plan.

Use an adversarial posture: try to refute correctness, test implementation quality, TDD claims,
planned-scope fidelity, implementation/design fit, logging/telemetry and error-handling
fitness, deployment safety, documentation completeness, test-environment execution,
context-driven concerns the implementation exposed, and quality-gate adequacy. If the host
exposes sub-agent capability, run this review in a fresh-context Qualitative Reviewer
sub-agent. This is mandatory for review stages. If sub-agents are unavailable, state that
the host lacks sub-agent capability, mark the review as degraded and non-independent when
the same agent implemented the code, and actively look for counterexamples.

## Qualitative Review

Score each item 1-5 and give one concrete fix for any score below 5:

- Upstream code-readiness: spec/design/plan are still fit for the implemented behavior.
- TDD authenticity: behavior-changing code has meaningful Red/Green history, or the lack of
  independent evidence is clearly reported. Missing Red is acceptable only for a planned or
  explicitly accepted narrow exception: generated code only, docs-only, formatting-only,
  build/deploy config validation, or characterization before legacy refactor, with concrete
  replacement verification.
- Test implementation quality and level completeness: executable acceptance tests cover
  assigned `AT-` items, executable journey/workflow tests cover assigned `JT-` items by
  chaining the ordered `AT-` scenarios with realistic state handoff, and planned `TEST-`
  obligations cover unit/pure-core, component, contract, integration, UI, migration,
  operational, and quality-attribute risks. Review the test code itself: assertions,
  fixtures, helpers, mocks, generated data, setup/teardown, selectors, determinism, speed,
  isolation, readability, maintainability, and false-positive/false-negative risk.
- Supplemental inner tests: code-discovered helper, pure-core, parser, mapper, regression,
  characterization, property/table, adapter, or edge-case tests are useful, traceable to the
  nearest `PR-` and relevant `FR-`/`AT-`/`JT-`/`TEST-`/`COMP-`, and stay inside the Planned
  Touch Set. Flag tests that replace required `AT-`/`JT-`/`TEST-` coverage, overfit implementation
  trivia, lack an oracle, or reveal product-visible behavior that should have updated
  upstream artifacts.
- Verification-oracle rigor: every test has a concrete pass/fail oracle aligned with the
  design/plan, such as return values, state changes, persisted records, emitted events, API
  responses, DOM/accessibility output, screenshots/visual baselines, generated artifacts,
  structured logs, metrics, traces, deployment signals, or captured external calls. Reject
  tests that only prove execution, mock invocation, or absence of exceptions unless that is
  the specified behavior.
- Contract realism: boundary-facing tests use shared fixtures, schemas, generated clients,
  captured representative examples, or contract tests that match the real producer/consumer
  contract, including error variants; ad-hoc convenient mocks are flagged.
- External double verification risk: flag any external-system mock/fake/stub/test double or
  locally re-declared interface that is not tied to the real boundary through a
  real-boundary test, official conformance harness, type-conformance check, generated
  schema/client, vendor sandbox/emulator, captured real fixture, or explicit user-approved
  limitation. Ask which tests fail if the local mirror drifts; if none, this is a blocking
  review finding for a primary integration seam.
- UI quality and selector resilience: planned styling/layout/responsive/accessibility and
  readable loading/empty/error/validation states are present, while behavior tests remain
  role/text/semantic rather than CSS-coupled unless style itself is under test.
- Mock UI fidelity: when a mock UI was required, production UI changes match the approved
  mock's screens, states, flows, copy intent, and responsive expectations, or clearly record
  an approved deviation.
- Logging and telemetry fitness: planned structured logs, events, metrics, traces,
  audit/support IDs, correlation propagation, redaction, alert hooks, and human/agent
  debugging signals are implemented, tested, stable, and free of secrets or excessive noise.
  Planned APM/application-performance work is present: service/resource attributes,
  critical spans, trace propagation, latency/throughput/error/saturation metrics,
  dashboards, alerts, SLO/SLI signals, and exporter/provider config.
- Error-handling fitness: UI, API, domain, integration, infrastructure, validation,
  authorization, timeout, offline, and unexpected failures map to safe messages, typed/
  documented errors, retries/fallback/degraded behavior, escalation, and logs/telemetry at
  the right boundary.
- Correctness: implementation satisfies FR/AT/JT behavior and relevant edge cases.
- Design fidelity: component boundaries, pure-core/imperative-shell separation, interfaces,
  data ownership, failure handling, and dependency direction match the design.
- Planned scope fidelity: changed files/sections stay within the Planned Touch Set; any
  drift is treated as a plan/design/spec revision need.
- Build/deployment completeness: assigned artifacts, deployment scripts/manifests,
  migrations, smoke checks, rollback checks, and release docs are credible and verified
  where planned.
- Test environments: planned developer-local, shared integration/test, staging/pre-production,
  production canary/smoke, and synthetic-monitor checks were run or explicitly reported as
  unavailable; live production checks have explicit approval.
- Context-driven concerns: any performance/load, security/threat-model, privacy/compliance,
  accessibility, resilience/DR, migration, localization, abuse/fraud/safety, cost,
  compatibility, or operational review/test implied by the implementation is either already
  planned and verified or blocks for upstream artifact revision.
- Documentation completeness: user/developer docs, examples, generated/reference docs,
  runbooks, troubleshooting, and release/migration notes match behavior where planned.
- Production quality: validation, error handling, logging/telemetry, security/privacy,
  observability, configuration/secrets handling, reliability, accessibility, and performance
  concerns are handled to the level required by the spec/design.
- Quality-gate fitness: pre-commit/equivalent gates are language-appropriate, thresholded,
  aligned with CI, and not trivially bypassed.
- Maintainability: code is readable, cohesive, appropriately factored, and avoids dead or
  speculative code. Test helpers and fixtures are factored enough to prevent drift without
  hiding the behavior being asserted.

## Output

1. Upstream blockers, if any.
2. Verification evidence considered, or a clear note that none was available.
3. Qualitative scorecard.
4. Top fixes ranked by impact.
5. **Review verdict**: Pass / Pass-with-fixes / Needs rework / Blocked-upstream.

After reporting the verdict, stop. Do not move to the next PR, release, deployment, or any
downstream artifact without explicit user approval.
