# Cross-Cutting Concerns

Use this as the ownership map for extra risk checks that span multiple SDLC stages. First
select a delivery profile and triggered modules using
[assurance-profiles.md](assurance-profiles.md). Stage prompts reference the relevant rows
instead of repeating this table or activating every concern by default.

| Concern | Spec owns | Design/ADR owns | Plan owns | Code/verify/assess owns |
| --- | --- | --- | --- | --- |
| Logging, telemetry, APM | Human/agent/operator diagnostics, privacy constraints, APM needs or non-goals. | Event/metric/trace contracts, correlation, redaction, dashboards, alerts, provider choices. | PR allocation, commands, environments, thresholds, dashboards/alerts. | Instrumentation, tests for stable signals, redaction, exporter/config checks. |
| Error handling | User/API/operator error behavior and failure categories. | Layer mapping, recovery, retries, fallbacks, degraded modes, safe messages. | Failure-path tests and implementation slices. | Realistic failure tests, readable UI/API messages, logs without leaks. |
| External boundaries and doubles | Exact contracts and real-boundary acceptance criteria. | Drift risk, import/type strategy, ADR drift control, real-boundary/test-conformance design. | Unit vs contract/integration allocation, real-boundary smoke PRs. | Doubles flagged as risk, real/type conformance evidence, no primary seam covered only by fakes. |
| Test environments | Externally relevant environment needs or non-goals. | Developer environment plus recommended shared integration, staging, canary, synthetic monitors. | Setup, data/secrets, reset, smoke/canary/rollback, ownership. | Run planned environment checks; no live production checks without explicit approval. |
| UI mock gate | Mock preference: Required, Optional, Not needed, or Deferred. | Mock file/screens/states/flows when required. | PRs tied to approved mock and visual/accessibility checks. | Block production UI work if required mock is missing or unapproved. |
| Build and deployment | Build/release/deploy needs or non-goals. | Build output, package, release, environment, deployment, rollback strategy. | Build/deploy files, dry-run/lint/plan/smoke, rollback PRs. | Build outputs, deployment validation, docs, no live deployment without approval. |
| User/developer docs | Audiences, needs, acceptance criteria, non-goals. | Doc architecture, source locations, generated docs, publishing, validation. | Doc files and checks assigned to PRs. | Docs updated and validated with implementation. |
| Context-driven reviews/tests | Domain risks: performance, security, privacy, accessibility, resilience, cost, compatibility, etc. | Tactics, ADRs, risks, test obligations. | Dedicated review/test PRs or explicit deferrals. | Run planned checks; stop to revise earlier documents when new material risk appears. |
| Approval records | Gates that need explicit user review or accepted automatic policy. | Gate points and document ownership. | Approval dependencies and scope. | Check that the local approval matches the current file; report its source and limits. |
| Requirement links | Requirement and acceptance IDs. | Component and test obligation IDs. | PR assignment and planned coverage. | Inspect the implemented tests and their pass/fail checks; use an inventory only when the project needs one. |
| Cross-scope test ownership | Product, feature, and slice `AT-`/`JT-` intent at the appropriate level. | Executable `TEST-` obligations and pass/fail checks for local, feature-composition, and product-composition evidence. | Parent obligations assigned to child work/PRs, including explicit integration leaves when evidence spans children. | Code-ready leaves implement assigned parent/local tests; execution results remain distinct from link claims. |
