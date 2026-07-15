# Approval Gates

Sarathi supports local approval attestation gates through YAML files under
`.sdlc/`. These files are project-local and do not depend on Jira, GitHub Issues, Azure
Boards, or any other ticketing system.

The checker verifies that an approval record is well-formed, UTC timestamped, and current
for the artifact bytes it names. It does **not** prove human intent, identity, or external
consent. Treat the ledger as a structured local attestation that must be visible in reports,
not as an authority system.

## Files

- `.sdlc/approvals.yaml` records local human or auto approval attestations.
- `.sdlc/gates.yaml` optionally enables bounded auto-approval policy.

Approval records attest to exact artifact bytes. If an approved artifact changes, its hash
no longer matches and the approval is stale.

## Approval Ledger

```yaml
version: 1
approvals:
  - id: APR-SPEC-PRODUCT
    gate: spec.approved
    scope: product/system
    artifact:
      kind: spec
      path: spec.md
      sha256: "<sha256>"
    status: approved
    approved_by: "K. Sankar"
    approved_at: "2026-07-01T14:32:18Z"
```

`approved_at` must be UTC ISO 8601 and must end in `Z`.

## Gate Names

- `spec.approved`: required before downstream design gate checks.
- `design.approved`: required before downstream plan gate checks.
- `plan.approved`: required before downstream code gate checks.
- `ux.mock.approved`: required before planning or production UI work when the spec says
  `UI Mock Preference: Required`.
- `code.markers.approved`: required before downstream progress when code/tests contain
  TODO/FIXME/XXX/skip/xfail markers that the user explicitly accepts for the current code
  slice. The checker reports the marker locations; do not add SDLC-specific annotations to
  app code.
- `code_slice.approved`: for teams that want a checked handoff between code slices. Bind
  the record to the current child implementation plan path and SHA-256 so workflow status
  can map the approval to its owning `WORK-*` branch and display `Completed`.
- `release.approved` and `production-deployment.approved`: for release/deploy workflows;
  these should not be auto-approved by default.

## Recording Approvals

When a user explicitly approves an artifact, update `.sdlc/approvals.yaml` immediately.
Compute the SHA-256 from the current file bytes. On Windows:

```pwsh
(Get-FileHash spec.md -Algorithm SHA256).Hash.ToLower()
```

On macOS/Linux/WSL:

```sh
sha256sum spec.md
```

Use the current UTC time:

```pwsh
(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

```sh
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

## Auto Approval

Use auto-approval only as an explicit local policy for low-risk work, such as internal
prototypes.

```yaml
version: 1
auto_approval:
  enabled: true
  mode: internal-prototype
  expires_at: "2026-07-08T14:32:18Z"
  allowed_scopes:
    - slice/change
    - feature/component
  allowed_gates:
    - spec.approved
    - design.approved
    - plan.approved
  forbidden_gates:
    - release.approved
    - production-deployment.approved
    - security-risk.accepted
    - privacy-risk.accepted
```

An auto-approved record uses `status: auto-approved`, `approved_by: AUTO`, a UTC
`approved_at`, and a reason. Auto approval is a local policy shortcut, not human approval;
reports must say when a gate passed through auto approval.

## Checker Use

Draft checks do not require approvals. Gate checks do:

```pwsh
python checkers/check_design.py design.md --spec spec.md --require-approvals --json
python checkers/check_plan.py plan.md --spec spec.md --design design.md --require-approvals --json
python checkers/check_code.py --plan plan.md --require-approvals --tests-argv '["pytest","-q"]' --json
```

Use `--approvals <path>` or `--gates-policy <path>` when a project stores the YAML files
somewhere other than `.sdlc/`.

Marker approvals use the same ledger but bind to a marker inventory hash rather than a
source file hash. This prevents an approval for one TODO/skip inventory from silently
covering a different inventory later.
