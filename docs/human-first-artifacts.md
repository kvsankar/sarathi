# Human-first documents

Specifications, designs, and plans are technical communication for engineers. Traceability
supports that communication; it must not interrupt it.

## Explanation first, mappings last

Put the technical explanation first. Put IDs and mappings last in `## Traceability`, or use
structured HTML comments to connect descriptive sections to stable identifiers.

Do not add a separate summary or metadata file, another approval step, a traceability
service, a new document hierarchy, a writing framework, or a readability score. This hidden
markers enable the human-first checks:

```markdown
<!-- New specifications -->
<!-- sarathi:artifact-format version="3" -->

<!-- New designs -->
<!-- sarathi:artifact-format version="2" -->

<!-- New plans, including baseline-reuse classification -->
<!-- sarathi:artifact-format version="3" -->
```

Existing version-2 specs remain valid without the complete version-3 section check, and
version-2 plans remain valid without the newer baseline classification. Unmarked documents
use the legacy checker rules and remain parseable. When an agent
substantially revises one, it adds the marker and converts the document without changing the
approved requirements merely for formatting. A checker cannot infer edit history from file
contents, so creation and review instructions enforce that transition.

Existing documents that use `Product Crux`, `Technical Crux`, or `Implementation Crux`
remain valid. New and substantially revised documents use the clearer headings below.

Visible headings use descriptive language. A heading made only from a process identifier is
invalid in a versioned document. IDs may appear in the final appendix or in comments such as:

```markdown
### Sign in using an enabled method
<!-- sarathi:requirement id="FR-AUTH-METHOD" -->

A consumer can sign in using any authentication method enabled for the deployment. A
disabled method must not create a session.
```

Appendix tables may map human labels to IDs. When a table defines an item without an adjacent
annotation, put the ID in its first column so deterministic parsers can recognize it.
Human-first placement does not change ID grammar: spec/plan/test IDs remain
`KIND-AREA-NAME`, while design entities remain `KIND-SLUG` with no extra hyphenated token.

## Specifications

A specification starts with `## Product Overview`, before machine-oriented sections. Without
using Sarathi identifiers, it explains:

- the problem and who experiences it;
- what users must be able to do;
- explicit non-goals;
- the observable result that means success;
- important failures and constraints.

Requirement and acceptance headings are descriptive. Natural language owns the meaning;
annotations and the final appendix own stable mapping. Requirements remain atomic and
testable, acceptance scenarios remain black-box, and high-assurance work retains the extra
failure and evidence detail its risk needs.

The readable body still follows the requirements model in
`docs/requirements-model.md`: stakeholder needs lead to features, use cases explain main,
alternate, and failure behavior, functional and supplementary requirements make it
precise, and acceptance tests and journeys define observable proof. Moving IDs to the
appendix must not flatten that reasoning into a generic summary.

## Designs

A design starts with `## Technical Approach`. Its opening page explains the architectural
drivers, system boundary, essential technical model, responsibilities, relationships,
consequential interfaces and data, important decisions and trade-offs, testability, and
evolution. It selects the boundaries that matter for the kind of system, following
`docs/artifact-contracts.md`; applicable backend API and database-schema boundaries are
explicit. For an existing-system change, it also explains the relevant current state,
target state, unchanged boundaries, compatibility, and migration. Use compact diagrams when
relationships are clearer visually.

Component and interface headings describe their role, such as `Password mechanism service`
or `BPTrial compatibility adapter`. Stable component, interface, decision, risk, and test
obligation IDs live in annotations or `## Traceability`.

## Plans

A plan starts with `## Implementation Approach`. It explains how the approved technical
model becomes an executable delivery structure: outcomes, impacted areas and extent,
breakdown or PR dependency graph, sequence, integration points, safety, and proof. It says
why `Plan Type: Breakdown | Implementation` fits. A Breakdown plan organizes broad work
into independently useful child outcomes; an Implementation plan organizes one code-ready
outcome into reviewable PRs. One cohesive PR is a valid one-node graph.

Follow with a proportionate `## Impact Map`. Identify affected product and delivery areas,
what is added, changed, removed, or deliberately untouched, affected consumers and owners,
compatibility concerns, and allocation to child work or PRs. Do not use LOC estimates or
list irrelevant areas. Descriptive headings remain understandable without decoding process
IDs.

Follow with a short `## Baseline Reuse` section. Explain what already works in the current
or sibling system, what is reusable now, what must be extracted, what remains target-owned,
what is genuinely new, and what is deferred. Each delivery item has one compact `Work
Classification:` line using the values defined in `docs/work-decomposition.md`.

The final appendix keeps compact assignment tables. Refer to approved earlier documents and
include only the IDs actually assigned to the change; do not copy a complete parent
inventory into narrative prose.

## Production and test source

Production code and tests remain normal software. Never insert Sarathi process IDs merely
for traceability in:

- function, class, or test names;
- comments or docstrings;
- decorators, annotations, or generated source blocks;
- runtime constants, mappings, logs, metrics, or API responses.

Tests use behavioral names. Accepted-intent-to-test mapping belongs in the plan, assessment,
or an optional external test-traceability ledger, not source files. Code checks may inspect
the production and test paths supplied to them and reject process IDs. Explicit generated
external traceability files are outside those source paths or must be named as generated
exclusions; this does not permit traceability blocks in ordinary source.

## Review stop condition

Reviewers judge what automatic checks cannot:

- Can I explain the problem and proposed approach after reading the first page?
- Are the technical model, important boundaries, responsibilities, decisions, and trade-offs clear?
- For an existing-system change, are current state, target state, compatibility, migration,
  and unchanged boundaries clear?
- For a plan, can I understand the Impact Map, Breakdown or PR graph, sequence,
  integration, safety, and proof without decoding identifiers?
- Are identifiers supporting traceability rather than interrupting the explanation?
- Could process metadata move to the appendix without losing technical meaning?

If any answer is no, the verdict is `Needs rework` even when deterministic checks pass.

> If an engineer must decode Sarathi identifiers before understanding the product,
> architecture, or implementation, rewrite the document in plain technical language.

Automatic checks stay narrow: versioned documents have the required overview or approach first,
descriptive visible headings, a final traceability section, and mechanically resolvable
IDs. They do not score prose quality.

## Authentication dogfood

The following example uses an existing BPTrial backend, an independent consumer-backend,
and a shared neuring-auth wheel. The target model is User -> Identity -> Mechanism ->
Credential, with a BPTrial compatibility adapter.

### Design before: jargon first

```markdown
## COMP-AUTH

COMP-AUTH implements IFACE-AUTH for FR-AUTH-METHOD and TEST-AUTH-COMPAT. DEC-AUTHADAPTER
keeps BPTrial compatible while COMP-IDENTITY owns the new model.
```

The IDs are traceable, but the architecture is not apparent without decoding them.

### Design after: technical model first

```markdown
## Technical Approach

### Current state

BPTrial stores passwords on its User model.

### Target state

A user owns authentication identities. Each Identity has one or more Mechanisms, and each
Mechanism owns its Credential.

### Shared code and deployment boundary

BPTrial and consumer-backend independently install the neuring-auth wheel. They do not share
a deployment or database.

### BPTrial change

Existing password operations route through a compatibility adapter. The first increment
changes no database schema or public API.

### Consumer change

Consumer starts with separate User, Identity, Mechanism, and Credential models.

### Hard part and order

Reset tokens identify the exact email identity. Credential replacement, token consumption,
and session invalidation are atomic. Implement and verify the BPTrial adapter before adding
consumer persistence.
```

### Plan before: allocation first

```markdown
## PR-AUTH-COMPAT

Implements FR-AUTH-METHOD with COMP-AUTH and TEST-AUTH-COMPAT, then PR-AUTH-CONSUMER
implements COMP-IDENTITY.
```

### Plan after: implementation first

```markdown
## Implementation Approach

Route BPTrial password operations through the compatibility adapter without changing its
schema or public API. Verify existing sign-in, password-change, reset, and session behavior.
Then add the consumer's separate identity persistence model. Stop if compatibility tests
show an observable BPTrial change or reset operations cannot be made atomic.

## Traceability

| Human delivery item | Machine ID | Verification |
| --- | --- | --- |
| Route BPTrial password operations through the adapter | PR-AUTH-COMPAT | BPTrial compatibility suite |
| Add consumer identity persistence | PR-AUTH-CONSUMER | Consumer model and transaction tests |
```

### Test naming before and after

Forbidden ID-polluted naming:

```python
def test_at_auth_reset_replay():
    ...
```

Behavioral naming:

```python
def test_replayed_reset_token_cannot_change_password():
    ...
```

The external mapping remains in the plan or assessment:

```markdown
| Password-reset replay protection | test_replayed_reset_token_cannot_change_password |
```

## Regression scenarios

### Multi-method authentication feature

The opening design explains the current and target models, shared-wheel boundary,
independent deployments, minimal BPTrial refactor, consumer starting model, and atomic reset
risk before showing any process ID. The final appendix retains detailed mappings.

### Small behavior change

Use a short Product Overview or Implementation Approach, a compact plan, a minimal appendix, and
behavioral test names. Do not inflate the change with process vocabulary.

### High-assurance migration

Explain data ownership, migration order, rollback, failure behavior, and evidence in human
technical language. High-assurance adds realistic proof and independent review, not
identifier-heavy prose.

### Existing legacy document

Keep unmarked legacy documents parseable. On material revision, preserve approved requirements,
add the version marker, move process mappings to `## Traceability`, and rewrite affected
visible sections in plain language.

### Code traceability

Accept behavioral code and test names. Reject identifiers added to source names, comments,
docstrings, annotations, runtime values, or logs merely for process traceability. Keep the
mapping external to code.
