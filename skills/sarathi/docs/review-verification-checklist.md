# Verification And Review Checklist

Every assessment pairs mechanical evidence with qualitative judgment. Checker JSON is
never the whole assessment.

## Independent Passes

When the host supports sub-agents, use two fresh contexts:

1. **Mechanical Verifier**: runs deterministic checkers/commands and returns raw evidence,
   IDs, metrics, and failures without a qualitative verdict.
2. **Qualitative Reviewer**: receives the artifact/code plus mechanical evidence and makes
   an adversarial judgment.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. A failed/unfit upstream artifact blocks the downstream verdict.

## Mechanical Pass

| Assessment | Required evidence |
| --- | --- |
| `/spec-assess` | `check_spec.py`, ID/section/coverage structure, approval evidence when required. |
| `/design-assess` | Upstream spec check, `check_design.py`, component/interface/test-obligation structure, approval evidence when required. |
| `/plan-assess` | Upstream checks, `check_plan.py`, allocation/coverage, labeled Red/Green or TDD-exception contracts, exact wave membership, structured complexity budget/count, and targeted exception approval. |
| `/code-assess` | Upstream checks, `check_code.py`, tests, coverage, traceability, TDD evidence, repository quality gate, planned module commands. |

Mechanical evidence proves only what the command observes. It does not prove semantic
correctness, meaningful tests, stakeholder feedback, real-boundary execution, merge state,
or human intent beyond a valid local attestation.

## Qualitative Pass

Every reviewer judges:

- accepted intent, scope/readiness, and upstream fitness;
- selected delivery profile and only the assurance modules triggered by context;
- concrete oracles, real-boundary confidence, risks, and residual uncertainty;
- feedback/learning dependencies and ancestor impact where applicable;
- simplicity using `docs/simplicity-first.md`.
- TDD-exception eligibility and replacement evidence when a plan does not use Red/Green.

Start deletion-first: what can be deleted, deferred, collapsed, implemented directly, or
proven by existing evidence? A structurally complete artifact fails when it is overbuilt,
turns process requirements into product architecture, generalizes for hypothetical
consumers, ignores brownfield compatibility evidence, or materially exceeds the user's
mental model without approval.

Stage-specific review prompts provide the remaining rubric. Do not load unrelated module
criteria merely because they exist.

## Report

Every non-blocked assessment reports:

1. Mechanical scorecard with exact commands and evidence limits.
2. Qualitative scorecard, including profile/module and simplicity fitness.
3. Deletion, deferral, collapse, and existing-evidence opportunities.
4. Top fixes ranked by impact.
5. Verdict: `Pass | Pass-with-fixes | Needs rework`.

Use `Blocked-upstream` when the governing ancestor must be corrected before downstream
judgment. Code assessment additionally reports feedback and ancestor impact, and writes
assessment/wave ledgers only under the evidence rules in `docs/workflow-status.md`.
