export const humanFirstSpec = `# Enabled authentication methods
<!-- sarathi:artifact-format version="2" -->

## Product Overview

Consumers need to sign in with any authentication method enabled for their deployment.
Disabled methods must never create a session. Anonymous posting is outside scope. Success
means an enabled method grants access while invalid or disabled credentials fail safely.

## User Needs

### Access protected functionality
<!-- sarathi:requirement id="UN-AUTH-ACCESS" -->

Consumers need authenticated access to protected functionality.

## Non-Goals

Anonymous posting is outside scope.

## Features

### Sign in using an enabled method
<!-- sarathi:requirement id="FEAT-AUTH-LOGIN" refs="UN-AUTH-ACCESS" -->

Consumers can sign in using an enabled method.

## Use Cases

### Sign in to a protected session
<!-- sarathi:requirement id="UC-AUTH-SIGNIN" refs="UN-AUTH-ACCESS FEAT-AUTH-LOGIN FR-AUTH-SIGNIN AT-AUTH-SIGNIN" -->

Primary actor: Consumer.
Supporting actors/systems: Credential store.
Goal: Access protected functionality.
Scope: Authentication boundary.
Trigger: The consumer submits credentials.
Preconditions: An enabled credential exists.
Minimal guarantees: Failure grants no access.
Success guarantees: A protected session is created.
Main success scenario:
1. The consumer submits credentials.
2. The system validates the enabled method.
3. The system creates a protected session.
Alternate flows: An existing valid session remains active.
Error/exception flows: Invalid or disabled credentials deny access safely.
Postconditions: Access is either granted or denied without partial state.
Frequency/importance: High; used for every protected session.
Trace links: Recorded in the structured annotation and final appendix.

## Functional Requirements

### Disabled methods cannot create sessions
<!-- sarathi:requirement id="FR-AUTH-SIGNIN" refs="UC-AUTH-SIGNIN" -->

The system shall create a session only for a valid credential using an enabled method.

## Non-Functional Requirements

### Sign-in response time
<!-- sarathi:requirement id="NFR-PERF-SIGNIN" -->

Sign-in shall complete within 200 ms under the accepted test workload.

## External Interfaces & Contracts

No external interface changes are introduced.

## Acceptance Tests

### Enabled and disabled methods produce different outcomes
<!-- sarathi:acceptance id="AT-AUTH-SIGNIN" refs="UC-AUTH-SIGNIN FR-AUTH-SIGNIN NFR-PERF-SIGNIN" -->

Given valid credentials, when the method is enabled, then access is granted within the
limit. Given the same credentials for a disabled method, when sign-in is attempted, then
no session is created.

## Journey Tests

No ordered multi-scenario journey is required for this bounded change.

## Assumptions & Open Questions

The accepted workload defines the response-time measurement.

## Traceability

| Human outcome | Machine ID | Verified by |
| --- | --- | --- |
| Disabled methods cannot create sessions | FR-AUTH-SIGNIN | AT-AUTH-SIGNIN |
`;

export const humanFirstDesign = `# Authentication identities
<!-- sarathi:artifact-format version="3" -->

## Technical Approach

BPTrial currently stores passwords on its user model. The target model gives a user one
or more identities; each identity owns mechanisms and each mechanism owns its credential.
BPTrial and consumer-backend install the shared neuring-auth wheel independently. BPTrial
routes current password operations through a compatibility adapter without changing its
schema or public API, while consumer starts with separate persistence models. Reset-token
consumption, credential replacement, and session invalidation must be atomic.

## Overview

Work Scope: Feature/component
Design Depth: Feature
Implementation Readiness: Code-ready
Delivery Profile: Standard
Assurance Modules: Security

## Tech Stack

Python and the existing neuring-auth wheel.

## Drivers & Constraints

The compatibility boundary preserves current BPTrial behavior.

## Layers

### Application services
<!-- sarathi:entity id="LAYER-APP" type="layer" name="Application services" -->

Coordinates authentication use cases.

## Components

### BPTrial compatibility adapter
<!-- sarathi:entity id="COMP-AUTH" refs="FR-AUTH-SIGNIN" -->

Routes existing password operations through the shared wheel and uses IFACE-AUTH.

## Interfaces

### Authentication mechanism contract
<!-- sarathi:entity id="IFACE-AUTH" type="interface" name="Authentication mechanism contract" -->

Owner: COMP-AUTH. It validates a mechanism without changing BPTrial's public API.

## Core vs. Shell

Credential policy is pure; persistence and session invalidation remain at the shell.

## Key Flows

The adapter validates the exact identity, replaces the credential, consumes the token,
and invalidates sessions in one transaction.

## Data Model

Consumer owns User, Identity, Mechanism, and Credential records. BPTrial keeps its schema.

## Design Decisions

### Preserve BPTrial storage in the first increment
<!-- sarathi:entity id="DEC-AUTH" -->

The adapter avoids a migration in the compatibility increment.

## Test Strategy

### Compatibility behavior remains unchanged
<!-- sarathi:test id="TEST-AUTH-COMPAT" refs="COMP-AUTH IFACE-AUTH FR-AUTH-SIGNIN" -->

Contract tests execute the adapter through the real wheel and verify current behavior.

## Risks & Trade-offs

### Reset operations could update the wrong identity
<!-- sarathi:entity id="RISK-AUTH" -->

Exact identity binding and an atomic transaction mitigate the risk.

## Traceability

| Human element | Machine ID | Evidence |
| --- | --- | --- |
| BPTrial compatibility adapter | COMP-AUTH | TEST-AUTH-COMPAT |
`;

export const humanFirstPlan = `# Authentication compatibility increment
<!-- sarathi:artifact-format version="3" -->

## Implementation Approach

Route BPTrial password operations through the compatibility adapter, keeping its schema
and public API unchanged. Add the consumer identity persistence model separately. Verify
current BPTrial behavior and atomic reset behavior using behavioral test names.

## Baseline Reuse

The established service already provides password behavior. This slice reuses the shared
contract and adds only the established service's compatibility routing. Target persistence
is separate work; no new authentication behavior or deferred cleanup is included.

## Overview

Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready
Delivery Profile: Standard
Assurance Modules: Security

## Direct-To-Code Decision

- Inherited Sources: accepted authentication requirements and design.
- Reviewable Increment: BPTrial compatibility routing.
- Unresolved Blocker: none.
- Smallest Additional Artifact: none.

## Strategy

Implement one reversible compatibility increment and reuse existing tests.

## Milestones

Deliver the compatibility boundary.

## Pull Requests / Child Work Items

### Route password operations through the adapter
<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->

Work Classification: target-owned implementation
Scope: Add the adapter routing without schema or API changes.
Planned Touch Set: authentication adapter and focused tests.
Verification: behavioral compatibility and reset-replay tests pass.

## Coverage Map

Accepted compatibility behavior maps to the single delivery item.

## Sequencing & Risks

Add the adapter, route operations, then run compatibility and atomicity checks. Revert the
routing if existing behavior changes.

## Traceability

| Human delivery item | Machine ID | Evidence |
| --- | --- | --- |
| Route password operations through the adapter | PR-AUTH-COMPAT | compatibility tests |
`;

export const smallChangePlan = `# Reject a replayed reset token

<!-- sarathi:artifact-format version="3" -->

## Implementation Approach

Reject a second use of a consumed password-reset token. Keep token issuance, password
policy, persistence schema, and public responses unchanged. Add one behavioral regression
test and pass the existing reset suite.

## Baseline Reuse

Replay handling already exists in the current reset path. Change that path directly; no
shared extraction, target-owned integration, or deferred cleanup is needed.

## Overview

Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready
Delivery Profile: Lean
Assurance Modules: Security

## Strategy

Add the failing replay test, consume tokens through the existing path, then refactor.

## Milestones

Deliver replay protection.

## Pull Requests / Child Work Items

### Reject a consumed token
<!-- sarathi:delivery id="PR-RESET-REPLAY" -->

Work Classification: reuse directly
Scope: Reject a second redemption without changing other reset behavior.
Verification: the behavioral replay test and existing reset suite pass.

## Coverage Map

The replay behavior maps to the single delivery item.

## Sequencing & Risks

Test, implement, and rerun the reset suite. Revert if issuance or responses change.

## Traceability

| Human delivery item | Machine ID | Evidence |
| --- | --- | --- |
| Reject a consumed token | PR-RESET-REPLAY | replay regression test |
`;

export const migrationDesign = `# Account ownership migration

<!-- sarathi:artifact-format version="3" -->

## Technical Approach

The legacy service owns account records today; the target service will own them after a
staged migration. Copy and reconcile records before switching writes. During dual-read,
the legacy record remains authoritative. Roll back by restoring legacy-only writes until
reconciliation proves the target complete. A failed copy or mismatched record stops the
cutover without deleting source data. Success requires rehearsal, integrity counts,
failure-path tests, rollback proof, and observed reconciliation evidence.

## Overview

Work Scope: Feature/component
Design Depth: Feature
Implementation Readiness: Code-ready
Delivery Profile: High-assurance
Assurance Modules: Data and migration, Reliability and operations

## Data Ownership And Migration

The source owns data before cutover; the target owns data only after the verified switch.

## Rollback And Failure Behavior

Rollback restores legacy-only writes. Any integrity mismatch blocks cutover.

## Verification Evidence

Rehearsal, reconciliation, rollback, and failure injection must pass at the real database
boundary.

## Traceability

| Machine ID | Human risk | Evidence |
| --- | --- | --- |
| RISK-MIGRATION | Incomplete or divergent target data | rehearsal and reconciliation |
`;
