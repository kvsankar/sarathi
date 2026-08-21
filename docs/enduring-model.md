# sarathi's Enduring Model

Sarathi turns agreed requirements into the smallest safe working change. It keeps the
decisions and results needed for review, splits work only when one change would be too hard
to understand safely, and changes the remaining plan when real feedback arrives.

The name comes from the Mahabharata, where Krishna serves as Arjuna's *sarathi*—his
charioteer and counsel. Krishna helps Arjuna see clearly and act with purpose without
replacing his agency. In the same spirit, sarathi guides engineers and AI agents through
complex software decisions while keeping human judgment responsible for the destination.

This is the stable model. Formatting rules, status fields, identifiers, ledgers, and
checker behavior support it; they are not the identity of the process.

## 1. Deliver In A Learning Loop

```text
accepted intent -> smallest safe increment -> working behavior -> evidence -> feedback -> adapt
```

The spec says what must work and how people can observe success.

The design explains how the important parts of the system will support those requirements.

The plan says what will change, in what order, what depends on what, and how success will be
checked. It may keep one coherent change together or split broad work into useful children.

Code and tests make the change work through short Red-Green-Refactor cycles: see a meaningful
test fail, make the smallest change that passes it, then improve the code while tests stay
green.

The result may confirm or change what comes next. The stages preserve decisions; they are
not a one-way waterfall. A profile may combine design with planning, but the plan must still
state the technical decisions needed for safe implementation.

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

This happens throughout the work, not only after implementation. Specs, designs, plans, and
code each receive repeatable checks and independent review before dependent work begins.

Testing also runs through the whole delivery loop: specifications define observable
acceptance, designs choose the test architecture, plans assign that evidence to delivery
items, and code develops the behavior test-first and records exact results.

Automatic checks establish only the facts they can observe. They never manufacture human
approval, stakeholder feedback, semantic correctness, or evidence from a real system.

## 4. Make Work Easy To Resume

Accepted documents keep the requirements and decisions. Tests and assessment records keep
the observed results. A short WIP note lets a new engineer or agent find what is happening,
why, and what to do next without relying on chat history.

## 5. Match The Path And Review Timing To Risk

All production work keeps approved requirements, a code-ready plan, meaningful tests, honest
feedback, required approvals, and safety limits. Lean combines design with planning;
Standard keeps spec, design, plan, and code separate; High-assurance reviews a full package
and smaller changes around important risks. Every stage in the chosen path receives complete
checks and independent review. Profiles change the path and review timing, not reviewer care.

## 6. Keep Supporting Rules In Their Place

Documents lead with the product or technical explanation. Status leads with engineering
reality. Existing behavior is reused when appropriate. Traceability metadata stays
available without entering production code or interrupting the explanation. These rules
make the enduring model easier to use; they do not replace the model itself.
