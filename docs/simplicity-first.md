# Simplicity-First Delivery

Simplicity is a design rule and assessment gate. A document can contain every required
section and still fail when it turns a limited change into unnecessary machinery.

## Keep Process Machinery Out Of Product Code

Sarathi's requirement links, approvals, evidence records, parallel-work state, and status reporting
manage delivery. They must not become product architecture unless accepted product
behavior independently requires the same capability.

- Keep process metadata in documents and `.sdlc/` files.
- Reuse existing tests, schemas, contracts, CI, deployment checks, and reporting tools.
- Do not add runtime registries, manifests, generators, schema systems, evidence stores,
  resource frameworks, extension points, or generic harnesses merely to make Sarathi easier
  to verify.
- Production and test source must not carry Sarathi IDs in names, comments, docstrings,
  decorators, annotations, runtime values, logs, or generated blocks merely for
  traceability. Keep mappings in plans, assessments, or external ledgers unless accepted
  product behavior independently exposes them.

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

## Before Adding Another Document

If the approved requirements and design are enough to implement a safe change, write one
specific implementation plan and start. Create another document only when a specific
unanswered question blocks implementation. Keep that document focused on the question, then
return to implementation when it is answered.

Record the result briefly in the plan. Refer to approved requirements, acceptance tests,
design decisions, risks, interfaces, and prototypes instead of restating them. A feature may
be ready to implement directly; several screens do not require separate document chains.

## Reuse Proof From The Existing System

For refactors in an existing system, its functional, acceptance, schema, OpenAPI, CI,
build, deployment, and operational tests are the default compatibility proof. Treat
current passing behavior as evidence constrained by the approved requirements.

Add only focused tests for the boundary being changed, a missing pass/fail check, or a demonstrated
risk. Do not reproduce existing compatibility evidence in a new generated contract or
manifest system. When existing evidence is weak, strengthen the closest existing suite
before inventing a parallel harness.

## Deletion-First Review

Before asking for more machinery, reviewers identify:

1. What can be deleted?
2. What can be deferred until a concrete need exists?
3. What can be proven by existing evidence?
4. What can be implemented directly inside an existing boundary?
5. Which proposed abstraction has only one current consumer?

`Needs rework` does not imply more components, documents, tests, or PRs. The preferred fix
may be to remove a document section, combine changes, reuse a test suite, or revise an
overbuilt earlier spec, design, or plan. If the solution is larger than the problem
requires, simplify it.

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

## Dogfood: Neuring Consumer Android

**Before:** approved requirements, architecture, prototype, and proven runtime boundaries were followed by
an exhaustive feature SRS, repeated architecture, a Breakdown plan, child specs/designs,
and work groups before the first screen could be implemented.

**After:** reuse the approved requirements, architecture, prototype, working foundation, runtime,
directive, mock-device, encrypted-storage, theme, localization, and Android evidence
boundaries. Create one short, specific Implementation plan for the mocked investor
experience, implement the first prototype-matching UI slice, run focused checks, and stop
for stakeholder UI review. Keep backend and BLE integration out of scope. Continue one UI
slice at a time under the same plan unless feedback or a genuinely new boundary changes it.
