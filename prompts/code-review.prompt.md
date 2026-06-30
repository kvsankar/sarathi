---
description: Qualitatively review implemented code, tests, docs, build/deploy work, and upstream consistency using existing verification evidence where available.
agent: agent
---

# Code Review

Perform the qualitative review of implemented code, tests, docs, build/deploy work, and
upstream consistency. This command judges the change; it does not replace `/code-verify`.
If verification evidence is absent, state that gap and either use the latest supplied
evidence or recommend `/code-verify`. Use `/code-assess` when the user wants verification
and review together.

Do not edit code unless explicitly asked.

Before judging the code itself, check whether the upstream spec, design, and plan are fit
for this implementation. If a latent upstream issue prevents fair code review, stop with an
upstream blocker and name the affected IDs/sections.

Use an adversarial posture: try to refute correctness, test quality, TDD claims,
planned-scope fidelity, implementation/design fit, deployment safety, documentation
completeness, and quality-gate adequacy. Prefer fresh context, a separate reviewer, or a
different model/tool when available. If the same agent implemented the code, state that the
review is not independent.

## Qualitative Review

Score each item 1-5 and give one concrete fix for any score below 5:

- Upstream code-readiness: spec/design/plan are still fit for the implemented behavior.
- TDD authenticity: tests appear to have meaningful Red/Green history or the lack of
  independent evidence is clearly reported.
- Test quality and level completeness: executable acceptance tests cover assigned `AT-`
  items, and lower-level tests cover unit/pure-core, component, contract, integration, UI,
  migration, operational, and quality-attribute risks as planned.
- Correctness: implementation satisfies FR/AT behavior and relevant edge cases.
- Design fidelity: component boundaries, pure-core/imperative-shell separation, interfaces,
  data ownership, failure handling, and dependency direction match the design.
- Planned scope fidelity: changed files/sections stay within the Planned Touch Set; any
  drift is treated as a plan/design/spec revision need.
- Build/deployment completeness: assigned artifacts, deployment scripts/manifests,
  migrations, smoke checks, rollback checks, and release docs are credible and verified
  where planned.
- Documentation completeness: user/developer docs, examples, generated/reference docs,
  runbooks, troubleshooting, and release/migration notes match behavior where planned.
- Production quality: validation, error handling, security/privacy, observability,
  configuration/secrets handling, reliability, accessibility, and performance concerns are
  handled to the level required by the spec/design.
- Quality-gate fitness: pre-commit/equivalent gates are language-appropriate, thresholded,
  aligned with CI, and not trivially bypassed.
- Maintainability: code is readable, cohesive, appropriately factored, and avoids dead or
  speculative code.

## Output

1. Upstream blockers, if any.
2. Verification evidence considered, or a clear note that none was available.
3. Qualitative scorecard.
4. Top fixes ranked by impact.
5. **Review verdict**: Pass / Pass-with-fixes / Needs rework / Blocked-upstream.

After reporting the verdict, stop. Do not move to the next PR, release, deployment, or any
downstream artifact without explicit user approval.
