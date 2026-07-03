# Cross-Cutting Concerns

Use this as the shared map for concerns that span multiple SDLC stages. Stage prompts should
reference the relevant row instead of repeating all details.

| Concern | Spec owns | Design/ADR owns | Plan owns | Code/verify/assess owns |
| --- | --- | --- | --- | --- |
| Logging, telemetry, APM | Human/agent/operator diagnostics, privacy constraints, APM needs or non-goals. | Event/metric/trace contracts, correlation, redaction, dashboards, alerts, provider choices. | PR allocation, commands, environments, thresholds, dashboards/alerts. | Instrumentation, tests for stable signals, redaction, exporter/config checks. |
| Error handling | User/API/operator error behavior and failure categories. | Layer mapping, recovery, retries, fallbacks, degraded modes, safe messages. | Failure-path tests and implementation slices. | Realistic failure tests, readable UI/API messages, logs without leaks. |
| External boundaries and doubles | Exact contracts and real-boundary acceptance criteria. | Drift risk, import/type strategy, ADR drift control, real-boundary/test-conformance design. | Unit vs contract/integration allocation, real-boundary smoke PRs. | Doubles flagged as risk, real/type conformance evidence, no primary seam covered only by fakes. |
| Test environments | Externally relevant environment needs or non-goals. | Developer environment plus recommended shared integration, staging, canary, synthetic monitors. | Setup, data/secrets, reset, smoke/canary/rollback, ownership. | Run planned environment checks; no live production checks without explicit approval. |
| UI mock gate | Mock preference: Required, Optional, Not needed, or Deferred. | Mock artifact/screens/states/flows when required. | PRs tied to approved mock and visual/accessibility checks. | Block production UI work if required mock is missing or unapproved. |
| Build and deployment | Build/release/deploy needs or non-goals. | Artifact, package, release, environment, deployment, rollback strategy. | Build/deploy files, dry-run/lint/plan/smoke, rollback PRs. | Build artifacts, deployment validation, docs, no live deployment without approval. |
| User/developer docs | Audiences, needs, acceptance criteria, non-goals. | Doc architecture, source locations, generated docs, publishing, validation. | Doc files and checks assigned to PRs. | Docs updated and validated with implementation. |
| Context-driven reviews/tests | Domain risks: performance, security, privacy, accessibility, resilience, cost, compatibility, etc. | Tactics, ADRs, risks, test obligations. | Dedicated review/test PRs or explicit deferrals. | Run planned checks; stop for upstream revision when new material risk appears. |
| Approval attestations | Gates that need explicit user review or accepted auto policy. | Gate points and artifact ownership. | Approval dependencies and scope. | Verify hash-current local attestation; report source and limitations. |
| Traceability | Requirement and acceptance IDs. | Component and test obligation IDs. | PR allocation and planned coverage. | `.sdlc/test-traceability.yaml` as a claim map; spot-check mapped tests and oracles. |
