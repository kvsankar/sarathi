# Remove forced process language

<!-- sarathi:artifact-format version="2" -->

## Implementation Approach

Remove every rule, check, flag, approval, and test that forces projects to estimate or
justify process overhead before ordinary implementation work can begin.

Three independent readers are auditing Sarathi's documentation, prompts, checks, and
project-status page. Their findings will be applied in ordinary engineering language.
Exact machine fields will remain only where existing project files still need them.

The result should let an engineer understand what to do without learning a Sarathi dialect.

## What Changes

- Delete the complexity estimate, keyword detector, PR limit, and special approval.
- Stop requiring forms that justify starting work or creating another document.
- Replace `Crux` headings with `Overview` or `Approach`; continue reading the old headings.
- Let new documents use the sections their subject needs instead of copying a fixed
  template.
- Remove subjective word checks that shape prose to satisfy the checker.
- Show descriptive names before IDs on the project-status page.
- Shorten prompts, reviews, handoffs, and installed stage instructions.
- Report TODO and skipped-test markers without requiring a separate approval record.

## What Does Not Change

- Requirements and tests remain linked in the final Traceability section.
- Existing documents and stored records remain readable.
- Implementation still requires an approved plan and meaningful tests.
- Independent checking and review remain separate.
- Production deployment still requires explicit approval.
- Tests against important external systems must still use the real system or its official
  test interface when practical; otherwise the untested risk must be stated.

## Implementation Sequence

1. Add regressions for simple documents, ordinary technical wording, old document
   compatibility, and descriptive status labels.
2. Delete the forced forms, their parsers, checker results, command options, and special
   approvals.
3. Apply the three language audits to the primary docs, prompts, installed instructions,
   and generated status text.
4. Copy canonical prompts, docs, and checks into the installable skill bundle.
5. Run focused tests, the full suite, layout tests, pre-commit, and skill validation.
6. Run a fresh check pass and a separate review; fix any remaining high-impact private
   vocabulary or weakened safety rule.

## Verification

The change passes when:

- a design or plan can mention ordinary technical tools without requiring extra process
  text;
- a plan with more than three implementation steps needs no special exception;
- old files containing removed sections are simply read and ignored;
- new documents need only a clear opening explanation and final Traceability section;
- primary user-facing instructions contain no unexplained Sarathi terms identified by the
  audits;
- canonical and bundled files are identical;
- the complete Python, layout, pre-commit, and skill-validation commands pass.

If deleting a term would weaken a real approval, safety rule, test requirement, or legacy
file contract, keep the behavior and rewrite only the explanation.

## Traceability

Work Scope: Slice/change
Ready To Implement: Yes
Plan Type: Implementation

| Delivery item | Outcome | Files expected to change | Proof |
| --- | --- | --- | --- |
| PR-PLAINLANGUAGE-CLEANUP | Direct instructions without forced complexity paperwork | Canonical docs, prompts, checks, status renderer, installer text, tests, bundle mirrors, release notes, and `.sdlc` records | Audit findings, focused regressions, full test suite, independent check and review |

- PR-PLAINLANGUAGE-CLEANUP
  Scope: remove the forced mechanisms and unnecessary private vocabulary.
  Files Expected To Change: `docs/`, `prompts/`, `checkers/`, `tests/`, `scripts/`,
  `skills/sarathi/`, `README.md`, `AGENTS.md`, `.sdlc/`, and `CHANGELOG.md`.
  Focused Verification: simple current and legacy documents pass; removed flags, gates,
  report fields, and approval names are absent; descriptive status names are visible;
  canonical and bundled files match.
  Pass/Fail Check: all focused and repository checks pass, and independent review finds no
  remaining high-impact unexplained Sarathi vocabulary in the primary instructions.
  Risk Evidence: legacy fixtures prove compatibility; approval and deployment tests prove
  that required safety boundaries remain.
