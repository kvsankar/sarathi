# Simplicity-First Delivery

Simplicity is a design rule and assessment gate. A document can contain every required
section and still fail when it turns a limited change into unnecessary machinery.

## Keep Process Machinery Out Of Product Code

Sarathi's requirement links, approvals, evidence records, wave state, and status reporting
manage delivery. They must not become product architecture unless accepted product
behavior independently requires the same capability.

- Keep process metadata in documents and `.sdlc/` files.
- Reuse existing tests, schemas, contracts, CI, deployment checks, and reporting tools.
- Do not add runtime registries, manifests, generators, schema systems, evidence stores,
  resource frameworks, extension points, or generic harnesses merely to make Sarathi easier
  to verify.
- Product code should not know Sarathi IDs or evidence formats unless accepted requirements
  exposes that behavior.

## Smallest Implementation First

Start every spec, design, and plan with the smallest implementation that satisfies current
accepted behavior for current consumers.

Before adding a framework, generator, registry, manifest format, schema system, extension
point, generic harness, or generalized lifecycle, require at least one of:

- an accepted requirement that directly needs it;
- two concrete current consumers exposing real duplication or variation;
- measured evidence that the direct implementation is inadequate;
- a material risk that cannot be handled more simply.

Hypothetical future consumers are not evidence. Prefer a local direct implementation and
generalize when a second concrete use case reveals the right boundary.

## Reuse Proof From The Existing System

For refactors in an existing system, its functional, acceptance, schema, OpenAPI, CI,
build, deployment, and operational tests are the default compatibility proof. Treat
current passing behavior as evidence constrained by accepted intent.

Add only focused tests for the boundary being changed, a missing pass/fail check, or a demonstrated
risk. Do not reproduce existing compatibility evidence in a new generated contract or
manifest system. When existing evidence is weak, strengthen the closest existing suite
before inventing a parallel harness.

## Complexity Budget

Before accepting a Standard design or implementation plan, compare it with the user's stated
mental model. Record one checker-visible `## Complexity Budget` section:

```markdown
## Complexity Budget
- Mental Model: one sentence in the user's terms.
- Current Consumers: concrete current consumers and behavior that must remain.
- Proposed Additions: components, machinery, commands, and persistent/generated artifacts.
- Existing Evidence Reused: current tests, contracts, CI, build, and deployment evidence.
- Deleted or Deferred: machinery intentionally omitted until evidence justifies it.
- Implementation PR Count: 1
```

Designs use the first five fields. Plans use all six; Breakdown plans record `0`. The
checker verifies exact fields and, for plans, that the declared count matches actual
`PR-*` items. An eligible Lean Change Record uses its shorter `Why Lean` and `Escalate If`
fields instead. Independent review decides whether the content is honest and proportionate.

The budget is qualitative. Sarathi has no source-file, module, diff, or PR line-count
target. Stop for user review before materially exceeding the mental model.

For a bounded Slice/change Implementation plan, default to at most three `PR-*` items. More
than three requires a concise `Complexity Budget Exception:` in the plan and a dedicated
`plan.complexity-approved` approval that matches the current plan before assessment. Final
`plan.approved` remains a separate approval for code. Prefer one cohesive change over
artificial setup, scaffold, routing, generated-output, parity, or cleanup PRs.
Product/feature Breakdown-plan work-item counts are not subject to this slice PR limit.

## Deletion-First Review

Before asking for more machinery, reviewers identify:

1. What can be deleted?
2. What can be deferred until a concrete need exists?
3. What can be proven by existing evidence?
4. What can be implemented directly inside an existing boundary?
5. Which proposed abstraction has only one current consumer?

`Needs rework` does not imply more components, documents, tests, or PRs. The preferred fix
may be to remove a document section, collapse PRs, reuse a test suite, or revise an
overbuilt parent spec/design/plan.

## Simplify Earlier Documents Too

The simplify pass may and must reopen earlier documents when their accepted machinery is
not justified by behavior, risk, constraints, or evidence. Classify the impact as
`revision-required`; revise the controlling spec, design, and plan before continuing affected
implementation. Do not preserve an overbuilt design merely because implementation started.

## Regression Example: Reusable Package Extraction

**User mental model:** extract currently reusable behavior into a neutral package, wire the
current consumer to it, and prove compatibility.

An overbuilt response introduces a generic evidence platform, many-category compatibility
manifest, resource-lease framework, generated contract system, and a long sequence of
scaffold/parity/routing PRs. It fails because process evidence became product architecture,
future consumers were hypothetical, existing suites were ignored, and conceptual
complexity exceeded the user's model.

A proportionate plan is approximately:

1. **Neutral package and current contracts**: move the reusable behavior behind the
   smallest package boundary; preserve current public behavior.
2. **Current-consumer build integration**: make the existing application consume the
   package using its existing build/package path.
3. **Real compatibility proof**: run existing functional, acceptance, schema/OpenAPI, CI,
   build, and deployment suites; add only focused changed-boundary tests.

Collapse these further when one cohesive PR is easier to review and rollback. Add a fourth
PR or generalized system only after concrete evidence and explicit approval.
