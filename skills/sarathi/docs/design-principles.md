# Design Principles

Use these principles to reason about a design, not to force every system into the same
diagram, layers, vocabulary, or framework.

## Enduring Principles

1. **Requirements and stakeholder concerns drive design.** Tie choices to accepted
   behavior, quality attributes, constraints, risks, and operational realities.
2. **Context before internals.** Establish the system boundary, actors, external systems,
   ownership, trust, and consequential contracts before decomposing components.
3. **Quality attributes are architectural drivers.** Address material performance,
   availability, security, privacy, usability, accessibility, observability,
   modifiability, deployability, interoperability, and cost with concrete trade-offs.
4. **Appropriate views and proportionate detail.** Show only the structure, runtime, data,
   deployment, and operational views needed to explain important decisions and risks.
5. **High cohesion and low coupling.** Give components clear responsibilities, hide
   volatile details, depend on stable contracts, and avoid accidental dependency cycles.
6. **Functional core, imperative shell.** Keep business rules, validation, policies, state
   transitions, calculations, and other deterministic decisions separate from I/O,
   persistence, messaging, frameworks, clocks, randomness, navigation, and device or
   network APIs. Keep the shell explicit and observable. Use an equivalent explicit
   decision/effect boundary when this vocabulary does not fit the system.
7. **Interface-first collaboration.** Treat APIs, events, schemas, protocols, errors,
   ownership, compatibility, and service expectations as design work, not implementation
   detail.
8. **Data and lifecycle awareness.** Make state ownership, identity, validation,
   consistency, transactions, retention, migration, recovery, and privacy explicit where
   they affect correctness.
9. **Testability and operability by design.** Explain how decisions, components, contracts,
   real external boundaries, failures, and quality attributes can be checked and observed.
10. **Decisions carry rationale and consequences.** Compare realistic alternatives and
    record benefits, costs, reversibility, risks, and revisit conditions for material
    choices.
11. **Least sufficient mechanism.** Prefer the smallest direct design that satisfies
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

- **Domain-Driven Design (DDD):** use when domain language, rules, invariants, ownership, or
  model boundaries are genuinely complex. Define a ubiquitous language and bounded
  contexts first; introduce aggregates, repositories, domain services, or domain events
  only where they protect a concrete invariant or boundary. Do not wrap straightforward
  CRUD in ceremonial domain layers.
- **Clean Architecture or Hexagonal Architecture:** use when dependency direction and
  isolation from several real external adapters improve testability or expected change.
  Add ports at actual seams and keep adapters thin. Do not create one interface and mapping
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

SOLID names can help reviewers discuss responsibility, substitutability, interface size,
and dependency direction. They are heuristics, not a requirement to introduce interfaces,
factories, inheritance, or indirection without a concrete consumer or change pressure.

For every material pattern choice, the design or ADR states the problem, adoption signal,
chosen extent, rejected simpler option, consequences, verification approach, and condition
for removing or revisiting it.
