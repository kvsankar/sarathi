# Requirements Model

Sarathi uses a needs-to-evidence requirements model. A specification turns a problem and
stakeholder needs into an agreed, testable model of required system behavior. It preserves
the reasoning from need to observable evidence without prescribing the internal solution.
The model is principally influenced by Leffingwell/Widrig's requirements hierarchy; that
is its provenance, not a methodology that projects must select or name.

## The Hierarchy

1. **Problem, stakeholders, and scope** establish why the work matters, who experiences the
   problem, the product boundary, non-goals, constraints, and observable success.
2. **Stakeholder needs** state outcomes or pains in the problem domain, independently of a
   proposed solution.
3. **Features** are externally visible capabilities derived from those needs.
4. **Use cases** describe actor-goal behavior in context: trigger, preconditions, main flow,
   meaningful alternatives and failures, and postconditions.
5. **Functional requirements** make the required behavior precise as atomic, externally
   observable obligations.
6. **Supplementary requirements** make cross-cutting qualities and constraints measurable,
   including relevant performance, security, privacy, reliability, usability,
   accessibility, interoperability, compliance, operability, migration, deployment, and
   documentation expectations.
7. **Acceptance tests** define black-box scenarios or measurable checks showing whether a
   requirement or use-case outcome is satisfied.
8. **Journey tests** compose acceptance scenarios when confidence depends on a realistic
   sequence across states, actors, screens, APIs, jobs, or services.
9. **Traceability** connects problem and needs through features, use cases, requirements,
   acceptance tests, and journeys so validation and change impact remain reviewable.

The hierarchy is a thinking and validation model, not a demand for identifier-heavy prose.
Documents use descriptive headings and natural language; machine IDs remain in annotations
or the final traceability section.

## Scope It Proportionately

A product or system specification explains enough of the hierarchy to establish its major
capabilities. A feature or change specification may reference accepted parent intent and
describe only its changed needs, behavior, supplementary constraints, acceptance, and
traceability. Use cases add detail when an actor-goal flow matters; journeys when order
matters; and supplementary requirements when scope or risk activates a quality or
constraint. Do not inventory irrelevant categories or repeat inherited content. Compact
does not mean vague: material flows, failures, qualities, and observable results remain
explicit.

Other requirements approaches are optional authoring tools, not Sarathi modes or required
sections. Use a fitting technique only to resolve a concrete gap—for example, Jobs to Be
Done for unclear motivation, story mapping for a substantial journey, EARS for precise
event or state behavior, transition requirements for a real migration, or specification by
example for a difficult business rule.

Requirements state what must be true at the product boundary, not the internal architecture
or delivery sequence. Acceptance and journey tests are requirements-level intent in the
specification, not executable test code. Design chooses the test architecture, planning
assigns executable evidence, and code implements it test-first.
