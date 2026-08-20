# Security Extra Check

Load this guidance only when the selected Extra Checks include Security or when discovered
evidence activates a material security risk. It teaches a proportionate review method; it
does not add a delivery stage or require a separate threat-model document. Record the
resulting requirements, decisions, work, tests, and remaining risk in the existing spec,
design or Lean plan, implementation plan, code evidence, and review report.

## Threat Review

Work through the changed boundary, not the whole imagined system:

1. **Name what must be protected.** Identify the data, operation, identity, privilege,
   configuration, or service whose confidentiality, integrity, or availability matters.
2. **Draw the attack surface in words.** Name actors, entry points, trust boundaries,
   privileged components, sensitive data movement, and important external dependencies.
3. **Choose credible abuse cases.** Describe how an unauthorized or compromised actor could
   misuse this boundary. Prioritize plausible consequence over a universal threat catalogue.
4. **Assign mitigations.** Put observable security behavior in the spec, boundary and data
   decisions in the design or Lean plan, delivery and evidence ownership in the plan, and
   enforcement plus tests in code.
5. **Test the boundary.** Prefer a test that attempts the abuse through the real enforcement
   point. A helper-unit test or self-authored double cannot by itself prove an authorization,
   parser, secret-store, or external security boundary.
6. **State remaining risk.** Record untested conditions, unavailable environments, accepted
   limitations, owner, and the result that would require replanning or stronger controls.

## Abuse-Case Examples

Use these as shapes, not mandatory categories.

### Cross-tenant access

- **Abuse:** an authenticated user changes an object identifier and reads or modifies
  another tenant's record.
- **Existing-document ownership:** the spec requires denial without data disclosure; the
  design identifies the authorization owner and tenant boundary; the plan assigns boundary
  tests; code enforces the decision at the real request/data seam.
- **Credible evidence:** exercise allowed and denied identities through the public API and
  verify response, stored state, audit signal, and absence of cross-tenant disclosure.

### Untrusted input reaches an interpreter

- **Abuse:** crafted input changes a query, command, template, path, or deserialization
  operation rather than remaining data.
- **Existing-document ownership:** the spec defines rejected behavior and safe errors; the
  design chooses parsing, validation, encoding, and privilege boundaries; the plan assigns
  adversarial cases at the exposed seam.
- **Credible evidence:** boundary tests use representative malicious inputs and verify no
  unintended command, query, file access, side effect, or sensitive error occurs.

### Secret exposure

- **Abuse:** credentials or tokens enter source control, logs, telemetry, error responses,
  build output, or an over-broad runtime context.
- **Existing-document ownership:** the spec states exposure and rotation expectations; the
  design defines secret storage, access, redaction, and lifecycle; the plan assigns config,
  logging, build, and rotation evidence.
- **Credible evidence:** secret scanning, redaction tests, least-privilege configuration
  inspection, and a safe rotation or replacement check where consequence warrants it.

## Credible Evidence

Choose only what the changed risk requires:

- authorization tests across identity, role, tenant, ownership, and default-deny boundaries;
- authentication lifecycle tests for issuance, expiry, revocation, replay, and recovery;
- malicious and malformed input tests at public parsers and interpreters;
- secure failure tests that verify errors and logs do not disclose sensitive data;
- secret/configuration scans plus runtime access and redaction checks;
- dependency, protocol, or identity-provider evidence through an official or real test
  surface rather than only a locally declared substitute;
- audit-event checks that prove the useful security signal without recording secrets; and
- recovery or rollback evidence when a security change can lock out users, corrupt policy,
  or make access broader than intended.

A tool name, scan count, clean report, or passing mock is not sufficient by itself. Explain
which abuse case the evidence exercises, the enforcement boundary it reaches, and what it
still leaves untested.

## Stop Condition

The Security Extra Check is sufficient for the current increment when every material abuse
case has one of: a mitigation with credible evidence, an explicitly accepted remaining risk,
or a blocker with an owner and next action. Stop and revise an earlier document before
affected work continues when the review discovers new security behavior, a changed trust
boundary, an unsafe assumption, or evidence that the planned control is ineffective.
