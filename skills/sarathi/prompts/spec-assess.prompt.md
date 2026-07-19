---
description: Run repeatable checks and an independent judgment review as the full spec gate.
agent: agent
---

# Spec Assess

Assess the target spec using two separate passes. Load `prompts/spec-verify.prompt.md`,
`prompts/spec-review.prompt.md`, `docs/review-verification-checklist.md`, and the selected
profile/modules from `docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

Run full passes once per revision. After local finding corrections, rerun affected checks
and focus review on those findings unless scope or controlling intent changed materially.

1. **Check pass**: in a fresh sub-agent when available, run `/spec-verify` and return the
   command, IDs, metrics, failures, and approval evidence without judging overall quality.
2. **Review pass**: in a different fresh sub-agent when available, run `/spec-review` using
   the spec and check results. Judge depth against the selected profile and extra risk
   checks, not a universal concern list.

If sub-agents are unavailable, disclose degraded non-independent assessment and execute the
passes separately and actively look for counterexamples. Never treat checker JSON as proof
that the requirements are good.

Stop as `Blocked-upstream` when the spec cannot be judged responsibly. Otherwise report:

1. Check results with command and totals.
2. Review scorecard with review-depth and extra-check fitness.
3. Human-first comprehensibility result from `docs/human-first-artifacts.md`.
4. Top fixes ranked by impact.
5. Verdict: `Pass | Pass-with-fixes | Needs rework`.

Update `.sdlc/wip.md` and stop for human review. Do not start design in the same turn unless
the latest request explicitly asks for end-to-end continuation.
