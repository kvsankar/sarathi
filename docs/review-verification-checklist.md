# Checks And Review Checklist

Every assessment pairs repeatable check results with independent judgment. Checker JSON is
never the whole assessment.

## Independent Passes

When the host supports sub-agents, use two fresh contexts:

1. **Check pass**: runs repeatable checkers/commands and returns raw results, IDs, metrics,
   and failures without judging overall quality.
2. **Review pass**: receives the document/code plus check results and independently judges
   it while looking for counterexamples.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. A failed or unfit earlier document blocks the later verdict.

## Check Pass

| Assessment | Required evidence |
| --- | --- |
| `/spec-assess` | `check_spec.py`, ID/section/coverage structure, approval evidence when required. |
| `/design-assess` | Spec check, `check_design.py`, component/interface/test-obligation structure, approval evidence when required. |
| `/plan-assess` | Earlier checks, `check_plan.py`, allocation/coverage, labeled Red/Green or TDD-exception contracts, exact wave membership, structured complexity budget/count, and targeted exception approval. |
| `/code-assess` | Earlier checks, `check_code.py`, tests, coverage, requirement-to-test links, TDD evidence, repository quality gate, planned extra-risk commands. |

Check results prove only what the command observes. They do not prove
correctness, meaningful tests, stakeholder feedback, real-boundary execution, merge state,
or human intent beyond a valid local approval record.

## Review Pass

Every reviewer judges:

- accepted intent, scope/readiness, and fitness of earlier documents;
- selected review depth and only the extra risk checks triggered by context;
- clear pass/fail checks, real-boundary confidence, risks, and remaining uncertainty;
- feedback/learning dependencies and changes to parent documents where applicable;
- simplicity using `docs/simplicity-first.md`.
- TDD-exception eligibility and replacement evidence when a plan does not use Red/Green.

Start with simplification: what can be deleted, deferred, collapsed, implemented directly,
or proved by existing evidence? A document with every required section still fails when it is overbuilt,
turns process requirements into product architecture, generalizes for hypothetical
consumers, ignores existing compatibility evidence, or materially exceeds the user's
mental model without approval.

Stage-specific review prompts provide the remaining rubric. Do not load unrelated module
criteria merely because they exist.

## Report

Every non-blocked assessment reports:

1. Check results with exact commands and evidence limits.
2. Review scorecard, including review-depth, extra-risk, and simplicity fitness.
3. Deletion, deferral, collapse, and existing-evidence opportunities.
4. Top fixes ranked by impact.
5. Verdict: `Pass | Pass-with-fixes | Needs rework`.

Use `Blocked-upstream` when a controlling parent document must be corrected before later
judgment. Code assessment also reports feedback and parent-document changes, and writes
assessment/wave ledgers only under the evidence rules in `docs/workflow-status.md`.
