---
description: Check a requirements document and review it independently.
agent: agent
---

# Spec Assess

Assess the target spec using two separate passes. Load `prompts/spec-verify.prompt.md`,
`prompts/spec-review.prompt.md`, `docs/review-verification-checklist.md`, and the selected
review level and additional checks from `docs/assurance-profiles.md`. Apply
`docs/simplicity-first.md`.

## Run

Run full passes once per revision. After local finding corrections, rerun affected checks
and focus review on those findings unless requirements or scope changed.

1. **Check pass**: in a fresh sub-agent when available, run `/spec-verify` and return the
   command, IDs, metrics, failures, and approval evidence without judging overall quality.
2. **Review pass**: in a different fresh sub-agent when available, run `/spec-review` using
   the spec and check results. Judge depth against the selected review level and additional
   checks, not a universal concern list.

If sub-agents are unavailable, disclose degraded non-independent assessment and execute the
passes separately and actively look for counterexamples. Never treat checker JSON as proof
that the requirements are good.

Stop as `Blocked-upstream` when the spec cannot be judged responsibly. Otherwise report:

1. Check results with command and totals.
2. Concrete review findings and whether an engineer can understand the opening page.
3. Top fixes ranked by impact.
4. Verdict: `Pass | Pass-with-fixes | Needs rework`.

Update `.sdlc/wip.md` and stop for human review. Do not start design in the same turn unless
the latest request explicitly asks for end-to-end continuation.
