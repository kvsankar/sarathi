# Verification And Review Checklist

Every assessment command must pair structural/mechanical verification evidence with
qualitative judgment. Checker JSON is never the whole assessment.

Command verbs have distinct meanings:

- `verify`: run deterministic/mechanical checks and report evidence only.
- `review`: make the qualitative adversarial judgment using available evidence.
- `assess`: run `verify` first, then `review`; this is the full gate.

Use sub-agents for every verification, review, and assessment command whenever the host
exposes sub-agent capability. This is mandatory, not an optimization or preference:

1. **Mechanical Verifier sub-agent** — runs deterministic checkers and reports raw evidence,
   IDs, metrics, and command failures without making the final judgment.
2. **Qualitative Reviewer sub-agent** — starts from the artifact plus mechanical evidence,
   uses an adversarial posture, and judges correctness, completeness, risks, upstream
   blockers, and the verdict.

- `/spec-verify`, `/design-verify`, `/plan-verify`, and `/code-verify` must run in a
  Mechanical Verifier sub-agent when the host exposes sub-agent capability.
- `/spec-review`, `/design-review`, `/plan-review`, and `/code-review` must run in a
  Qualitative Reviewer sub-agent when the host exposes sub-agent capability.
- `/spec-assess`, `/design-assess`, `/plan-assess`, and `/code-assess` must split into both
  sub-agent passes when the host exposes sub-agent capability.
- Creation stages that run their corresponding assessment before handoff must use the same
  required sub-agent split when the host exposes sub-agent capability.

If sub-agents are unavailable, the main agent must explicitly say sub-agent execution was
unavailable, state that the result is degraded/non-independent, and still keep the
mechanical and qualitative passes separate in the report.

## Required Assessment Verifications

| Assessment command | Mechanical Verifier sub-agent | Qualitative Reviewer sub-agent |
| --- | --- | --- |
| `/spec-assess` | `/spec-verify`: run `check_spec.py` on the target spec. | `/spec-review`: score the spec for problem framing, stakeholder needs, non-goals, scope/readiness, use cases, requirements, NFRs, acceptance quality, UX/presentation expectations, UI mock preference, boundary contracts, external-system real-boundary testability, logging/error-handling intent, build/release/deployment intent, user/developer documentation intent, context-driven missed concerns, and traceability. |
| `/design-assess` | `/design-verify`: run `check_spec.py` on the upstream spec when present, then `check_design.py` on the target design. | `/design-review`: judge upstream spec fitness first, then score requirement fit, context, quality attributes, views, mock UI artifact/approval when required, logging/telemetry/APM and error-handling design, build/deployment design, test-environment strategy, context-driven review/test recommendations, documentation design, depth/readiness, cohesion/coupling, contracts, contract realism, external-double verification risk and mitigation, UX/presentation states, data/side effects, core/shell separation, testability, verification-oracle design, decisions, and risks. |
| `/plan-assess` | `/plan-verify`: run `check_spec.py` and `check_design.py` on upstream artifacts when present, then `check_plan.py` on the target plan. | `/plan-review`: judge upstream spec/design fitness first, then score PR sizing, plan type/readiness, scope-specific completeness, TDD discipline, coverage, test-level allocation, test-environment allocation, context-driven review/test allocation, verification-oracle allocation, contract-fixture allocation, external-double mitigation allocation, UX/presentation allocation, mock UI approval allocation, logging/error-handling allocation, build/deployment allocation, documentation allocation, Planned Touch Sets, sequencing, feedback targets, learning dependencies/waves, parallelism/worktrees, and production quality. |
| `/code-assess` | `/code-verify`: run upstream checkers when present, `check_code.py` with the test command, coverage threshold, external-boundary traceability metadata, and default git diff/TDD evidence; run pre-commit or the repository's equivalent local quality gate; run planned logging/telemetry/APM/error-handling/build/docs/deployment/environment/context-driven verification; report cleanup-pass and simplify-pass evidence when present. | `/code-review`: judge upstream code-readiness first, then score implementation correctness, planned and supplemental inner test quality, verification-oracle rigor, contract realism, external-double verification risk, mock UI fidelity when required, logging/telemetry/APM and error-handling fitness, UI quality/selector resilience, build/deployment completeness, test-environment execution, context-driven concern verification, documentation completeness, TDD authenticity, design fidelity, planned-scope fidelity, cleanup-pass quality, simplify-pass quality, feedback evidence, ancestor-impact decisions, theater removal, readability, production quality, and quality-gate fitness. |

For decomposable work, every qualitative pass also follows
[test-ownership.md](test-ownership.md): ancestor acceptance and design-test intent must
survive allocation into code-ready descendants; integration must appear incrementally at
boundaries and explicitly at feature/product composition points when needed; traceability
claims must remain distinct from execution and passing evidence.

Plan and code qualitative passes also follow
[feedback-and-learning.md](feedback-and-learning.md): approval does not freeze artifacts,
feedback is reported honestly, and learning-dependent sibling work waits for post-slice
inspect/adapt decisions.

## Blocking Rule

If an upstream mechanical checker fails, or if qualitative review reveals that an upstream
artifact must change before the downstream artifact can be judged fairly, stop the downstream
review/assessment and report the upstream blocker. Do not continue to the downstream
mechanical or qualitative verdict until the upstream issue is resolved.

## Reporting Rule

Every non-blocked assessment report must include:

1. Mechanical verification scorecard.
2. Qualitative review scorecard.
3. Top fixes ranked by impact.
4. Verdict.

`/code-assess` additionally includes a pre-commit/local quality-gate scorecard.

Also state whether the mechanical and qualitative passes were run by fresh-context
sub-agents. If not, state the limitation and whether the host lacked sub-agent capability.
