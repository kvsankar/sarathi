# Checks And Review Checklist

Every assessment pairs repeatable check results with independent judgment. Checker JSON is
never the whole assessment. Run automatic checks once per document revision.

## Independent Passes

Use two distinct passes:

1. **Check pass**: the active agent runs repeatable checkers/commands inline and preserves
   raw results, IDs, metrics, and failures without judging overall quality.
2. **Review pass**: a fresh reviewer sub-agent receives the document/code plus check results
   and independently judges it while looking for counterexamples.

If sub-agents are unavailable, disclose that the review was not independent and keep the
passes separate. An earlier document blocks the later verdict only when the requested
judgment depends on the obligations that are wrong or incomplete.

After issues are fixed, review only those fixes. If a fix is incomplete, correct it and
check it again. Do not repeat the full review unless a fix materially changes the
requirements, scope, design, or implementation. Record whether the run was a full review or
a check of fixes.

## Correction Closure

Do not accept a claim that a finding was fixed without checking the expected positive
result. For each claimed correction:

1. State the result that should now be present.
2. Inspect or execute that result directly.
3. Record `confirmed`, `partial`, or `missing` beside the finding in the existing review or
   assessment report, with the file location or executed evidence.

For a document correction, locate the intended new or replacement content where it belongs.
For a code correction, inspect the resulting implementation and run the focused test or
counterexample that demonstrates the behavior. Absence of old text is sufficient only when
deletion itself is the required result, and a generic passing suite does not prove that a
specific correction landed. A partial or missing correction remains an open finding. Do not
create a separate closure report or ledger.

Before asking for re-review, search the relevant documents and code for other places with
the same outdated statement or behavior. Update every place that should change, including
affected comments, fixtures, examples, and user documentation. Confirm that intended new
content is present where it belongs. The reviewer checks this sweep while checking the fix;
it does not require another report, state file, or checker.

When a create command embeds an assessment, its checker output is the check pass for one
assessment cycle. That run is the official assessment for the resulting document revision
and owns the scope-appropriate assessment report. Apply one safe, in-scope fix set and run
one focused recheck/re-review, then hand off the current verdict. A later explicit assessment
of unchanged document and dependency bytes reuses current checker evidence unless the user
requests a fresh run; it updates the same report path rather than creating a second report.

## Check Pass

| Assessment | Required evidence |
| --- | --- |
| `spec-assess` | `check_spec.py`, ID/section/coverage structure, approval evidence when required. |
| `design-assess` | Spec check, `check_design.py`, component/interface/test-obligation structure, approval evidence when required. |
| `plan-assess` | Earlier checks, `check_plan.py`, allocation/coverage, pass/fail verification, and exact membership of any parallel-work group. |
| `code-assess` | Earlier checks, `check_code.py`, planned tests, required project checks, and any extra checks in the plan. |

Check results prove only what the command observes. They do not prove
correctness, meaningful tests, stakeholder feedback, real-boundary execution, merge state,
or human intent beyond a valid local approval record.

Non-blocking deterministic scans may supply private candidates to the review pass. Do not
publish a warning section, warning counts, or candidate inventory. The reviewer either turns
a candidate into an actionable finding with context or omits it from the report.

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

Command-specific review prompts provide the remaining rubric. Do not load unrelated module
criteria merely because they exist.

## Report

Follow `docs/result-reporting.md`. Lead with one plain-language engineering result, separate
product/code problems, missing verification, and process/documentation problems, and
interpret checker results before raw counts. Keep the exact machine verdict in the saved
report and internal state; mention it in chat only when the user asks or it changes the next
available action. Every non-blocked assessment reports:

1. Check results with exact commands and evidence limits.
2. What is clear, what is not, and whether the planned checking matches the actual risk.
3. What can be deleted, deferred, combined, or proved with existing tests.
4. Top fixes ranked by impact.
5. Internal verdict: `Pass | Pass-with-fixes | Needs rework`.

Use `Blocked-upstream` when a controlling parent document must be corrected before later
judgment. Name the document, the specific obligations blocking judgment, and the affected
work; unrelated fixes may continue. Code
assessment also reports feedback and parent-document changes, and writes
assessment and parallel-work ledgers only under the evidence rules in `docs/workflow-status.md`.
Save the report in the matching document area's `reviews/` folder using
`docs/document-locations.md`; do not leave review conclusions only in chat.
