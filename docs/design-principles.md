# Design Principles

Use these principles to reason about a design, not to force every system into the same
diagram, layers, vocabulary, or framework.

## Enduring Principles

1. **Start from requirements and real concerns.** Tie choices to accepted behavior, quality
   goals, constraints, risks, and operating needs.
2. **Explain the outside before the inside.** Establish the users, external systems,
   ownership, trust, and important contracts before splitting the system into components.
3. **Design for the qualities that matter.** Address material performance,
   availability, security, privacy, usability, accessibility, observability,
   modifiability, deployability, interoperability, and cost with concrete trade-offs.
4. **Show only useful views and detail.** Show only the structure, runtime, data,
   deployment, and operational views needed to explain important decisions and risks.
5. **High cohesion and low coupling.** Give components clear responsibilities, hide
   volatile details, depend on stable contracts, and avoid accidental dependency cycles.
6. **Separate decisions from external effects.** Keep business rules, validation, policies, state
   transitions, calculations, and other deterministic decisions separate from I/O,
   persistence, messaging, frameworks, clocks, randomness, navigation, and device or
   network APIs. Keep the code that performs these external effects explicit and observable.
   This is often called a functional core and imperative shell.
7. **Design shared interfaces early.** Treat APIs, events, schemas, protocols, errors,
   ownership, compatibility, and service expectations as design work, not implementation
   detail.
8. **Explain data ownership and lifecycle.** Make state ownership, identity, validation,
   consistency, transactions, retention, migration, recovery, and privacy explicit where
   they affect correctness.
9. **Explain how the design will be tested and operated.** Explain how decisions, components, contracts,
   real external boundaries, failures, and quality attributes can be checked and observed.
10. **Decisions carry rationale and consequences.** Compare realistic alternatives and
    record benefits, costs, reversibility, risks, and revisit conditions for material
    choices.
11. **Use the smallest design that works.** Prefer the smallest direct design that satisfies
    current needs. Apply single responsibility, information hiding, dependency inversion,
    useful DRY, and fail-safe behavior as review lenses—not reasons to manufacture layers,
    interfaces, or abstractions.

## Choosing Diagrams

Use a diagram when it makes an important relationship, flow, or change materially easier
to understand and review than prose or a small table. Choose the diagram from the question
the design must answer:

- a **system-context diagram** for actors, external systems, ownership, trust, and the
  system boundary;
- a **component, container, or module diagram** for structure, responsibilities, and major
  collaborations;
- a **dependency diagram** for dependency direction, layering, cycles, plugins, or build
  relationships;
- a **sequence diagram** for ordered collaboration, timing, asynchronous work, and
  important success or failure paths;
- a **state diagram** for lifecycle, allowed transitions, guards, terminal states, and
  recovery;
- a **data-flow diagram** or focused data-model view for sources, transformations, stores,
  ownership, trust crossings, and privacy-sensitive movement;
- a **deployment diagram** for deployable units, networks, environments, scaling, failure
  isolation, and operational ownership.

Do not create every kind of diagram. Use the smallest useful set for the consequential
decisions and omit visuals whose question is already clear. Keep each diagram near the
narrative it supports, use the repository's maintainable source format when possible, give
elements readable labels, and keep it aligned with the written contracts and decisions.

## Conditional Approaches

Do not select an architecture by fashion or name recognition. Select an approach only when
its problem is present, record the expected benefit and cost, and keep the simplest viable
alternative visible.

- **Domain-Driven Design (DDD):** use when business language, rules, ownership, or model
  divisions are genuinely complex. First agree on terms and divide the business areas
  clearly. Add aggregates, repositories, domain services, or domain events only when they
  protect a specific rule. Do not wrap straightforward CRUD in domain layers merely to
  follow the pattern.
- **Clean Architecture or Hexagonal Architecture:** use when dependency direction and
  isolation from several real external adapters improve testability or expected change.
  Add interfaces at real external connections and keep adapters thin. Do not create one interface and mapping
  layer per class merely to match a diagram.
- **Behavior-Driven Development (BDD):** use examples and shared behavioral language when
  requirements or boundary behavior need clarification. Build on the spec's acceptance and
  journey intent; Gherkin and BDD frameworks are optional. BDD does not replace technical
  design or lower-level tests.
- **Vertical slices:** use when end-to-end use-case ownership reduces coordination and keeps
  changes cohesive. Preserve shared domain and platform boundaries instead of duplicating
  them inside every slice.
- **CQRS or event sourcing:** use only when accepted requirements need materially different
  read/write models, durable event history, temporal reconstruction, or audit behavior that
  a simpler state model cannot provide. Record consistency, migration, replay, and
  operational costs explicitly.

SOLID terms can help reviewers discuss responsibility, substitutability, interface size,
and dependency direction. They are prompts for thought, not a requirement to introduce interfaces,
factories, inheritance, or indirection without a concrete consumer or change pressure.

For every important pattern choice, the design or ADR states the problem, why the pattern
fits, how much of it will be used, the simpler option that was rejected, its consequences,
how it will be checked, and when it should be removed or reconsidered.
