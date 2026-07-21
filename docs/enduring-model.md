# sarathi's Enduring Model

Sarathi turns accepted intent into the smallest safe working increment, preserves the
decisions and evidence needed to review it, decomposes work that is too complex to reason
about safely as one unit, and adapts the remaining work from real feedback.

This is the stable model. Formatting rules, status fields, identifiers, ledgers, and
checker behavior support it; they are not the identity of the process.

## 1. Deliver In A Learning Loop

```text
accepted intent -> smallest safe increment -> working behavior -> evidence -> feedback -> adapt
```

Specification turns a problem and stakeholder needs into an agreed, testable model of
required behavior: needs lead to features, use cases explain behavior in context,
functional and supplementary requirements make it precise, and acceptance tests and
journeys define observable proof. Design turns accepted requirements and constraints into
an implementable, evolvable technical model. Planning turns the approved
technical model into an executable delivery structure through a Breakdown plan or a PR
graph, including impact, dependencies, sequence, integration, safety, and proof. Code and
tests produce working behavior through short Red-Green-Refactor cycles: observe the
behavioral test fail, make the smallest change that passes it, and improve the code while
the tests stay green. The result then confirms or changes the remaining work. The stages
preserve decisions; they do not form a one-way waterfall.

## 2. Decompose When It Improves Delivery

Ask whether a competent engineer can understand, explain, review, and safely plan the work
as one coherent unit. If not, split it along a natural product or technical boundary.

Stop when each part is understandable, testable, and can be integrated safely. Size alone
is not the test, and splitting work does not automatically require more documents. Use
[work-decomposition.md](work-decomposition.md) for the practical rule.

## 3. Separate Checks From Judgment

Each stage can be created, verified, reviewed, or assessed:

- **Create** writes or revises the work.
- **Verify** runs repeatable checks and states their limits.
- **Review** independently judges whether the result is clear, correct, simple, and safe.
- **Assess** combines verification and review.

This is a gate around every stage, not a footer after implementation. Specifications,
designs, plans, and code each receive repeatable checks and independent judgment before
their result is treated as sufficient for the next learning step.

Testing also runs through the whole delivery loop: specifications define observable
acceptance, designs choose the test architecture, plans assign that evidence to delivery
items, and code develops the behavior test-first and records exact results.

Automatic checks establish only the facts they can observe. They never manufacture human
approval, stakeholder feedback, semantic correctness, or evidence from a real system.

## 4. Preserve Continuity

The accepted documents preserve intent and decisions. Tests and assessment records preserve
evidence. A short current WIP note makes the work resumable without turning chat history or
process bookkeeping into product truth. A new engineer or agent should be able to find the
current boundary, the evidence behind it, and one executable next action.

## 5. Match Assurance To Risk

All production work keeps accepted intent, readiness to implement, credible tests, honest
feedback, human approval points, and safety limits. Review becomes deeper only when the
actual risks demand stronger evidence. High assurance adds proof for material risk; it does
not require the whole project to be designed up front.

## 6. Keep Supporting Rules In Their Place

Documents lead with the product or technical explanation. Status leads with engineering
reality. Existing behavior is reused when appropriate. Traceability metadata stays
available without entering production code or interrupting the explanation. These rules
make the enduring model easier to use; they do not replace the model itself.
