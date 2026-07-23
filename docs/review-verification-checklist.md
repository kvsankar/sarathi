# Checks And Review Checklist

Every assessment pairs repeatable check results with independent judgment. Checker JSON is
never the whole assessment. Run automatic checks once per document revision.

## Independent Passes

When the host supports sub-agents, use two fresh contexts:

1. **Check pass**: runs repeatable checkers/commands and returns raw results, IDs, metrics,
   and failures without judging overall quality.
2. **Review pass**: receives the document/code plus check results and independently judges
   it while looking for counterexamples.

If sub-agents are unavailable, disclose degraded non-independent assessment and keep the
passes separate. A failed or unfit earlier document blocks the later verdict.

After review findings are corrected locally, rerun affected checks and perform a focused
re-review of those findings and changed boundaries. Do not restart a full independent review
unless scope or controlling intent changed materially. Record which mode was used.

## Check Pass

| Assessment | Required evidence |
| --- | --- |
| `/spec-assess` | `check_spec.py`, ID/section/coverage structure, approval evidence when required. |
| `/design-assess` | Spec check, `check_design.py`, component/interface/test-obligation structure, approval evidence when required. |
| `/plan-assess` | Earlier checks, `check_plan.py`, allocation/coverage, pass/fail verification, and exact membership of any parallel-work group. |
| `/code-assess` | Earlier checks, `check_code.py`, planned tests, required project checks, and any extra checks in the plan. |

Check results prove only what the command observes. They do not prove
correctness, meaningful tests, stakeholder feedback, real-boundary execution, merge state,
or human intent beyond a valid local approval record.

## Review Pass

Every reviewer judges:

- approved requirements, scope/readiness, and whether earlier documents are sufficient;
- selected delivery assurance profile and only the extra risk checks triggered by context;
- clear pass/fail checks, real-boundary confidence, risks, and remaining uncertainty;
- feedback/learning dependencies and changes to parent documents where applicable;
- simplicity using `docs/simplicity-first.md`.
- whether the chosen verification is focused, meaningful, and proportionate to risk.
- whether a specific unanswered question truly requires another document; recommending a
  new document layer is never the default fix.

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
2. What is clear, what is not, and whether the planned checking matches the actual risk.
3. What can be deleted, deferred, combined, or proved with existing tests.
4. Top fixes ranked by impact.
5. Verdict: `Pass | Pass-with-fixes | Needs rework`.

Use `Blocked-upstream` when a controlling parent document must be corrected before later
judgment. Code assessment also reports feedback and parent-document changes, and writes
assessment and parallel-work ledgers only under the evidence rules in `docs/workflow-status.md`.
