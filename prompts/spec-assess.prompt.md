---
description: Run structural verification and independent qualitative review as the full spec gate.
agent: agent
---

# Spec Assess

Assess the target spec using two separate passes. Load `prompts/spec-verify.prompt.md`,
`prompts/spec-review.prompt.md`, `docs/review-verification-checklist.md`, and the selected
profile/modules from `docs/assurance-profiles.md`. Apply `docs/simplicity-first.md`.

## Run

1. **Mechanical Verifier**: in a fresh sub-agent when available, run `/spec-verify` and
   return raw checker command, IDs, metrics, failures, and approval evidence without making
   the qualitative verdict.
2. **Qualitative Reviewer**: in a different fresh sub-agent when available, run
   `/spec-review` using the artifact and mechanical evidence. Judge depth against the
   selected profile and activated modules, not a universal concern list.

If sub-agents are unavailable, disclose degraded non-independent assessment and execute the
passes separately with an adversarial posture. Never treat checker JSON as semantic review.

Stop as `Blocked-upstream` when the artifact cannot be judged responsibly. Otherwise report:

1. Mechanical scorecard with command and totals.
2. Qualitative scorecard with profile/module fitness.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework`.

Update `.sdlc/wip.md` and stop for human review. Do not start design in the same turn unless
the latest request explicitly asks for end-to-end continuation.
