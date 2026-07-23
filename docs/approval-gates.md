# Approval Records

Sarathi stores local approvals in YAML files under
`.sdlc/`. These files are project-local and do not depend on Jira, GitHub Issues, Azure
Boards, or any other ticketing system.

The checker verifies that an approval record is well-formed, UTC timestamped, and current
for the exact file bytes it names. It does **not** prove human intent, identity, or external
consent. Treat the file as a local claim that must be visible in reports,
not as an authority system.

Approval means the document is sufficient and safe for the next learning step. It does not
mean the document is final, complete, frozen, or presumed correct. Approval should consider
available feedback from appropriate stakeholders, record feedback not yet obtained, and
expect revision when implementation, integration, deployment, or use produces new evidence.
See [feedback-and-learning.md](feedback-and-learning.md).

## Approval Policy

At project entry, and when requirements begin for a feature, the agent must ask the user to
select or confirm one policy. Show the practical difference in the current context and record
the choice in `.sdlc/process-decisions.yaml` and `.sdlc/wip.md`.

- **Human checkpoints**: stop at every material approval gate for explicit human approval.
  This is the default.
- **Automatic approval for eligible gates**: use a current `.sdlc/gates.yaml` policy to
  record automatic approvals only for its listed scopes and gates. It may support unattended
  delivery when the user explicitly requests it; it never means every gate is automatic.

YOLO, “use your judgment,” or end-to-end wording never selects automatic approval. Release,
production deployment, security/privacy risk acceptance, required UI approval, and any gate
excluded by local policy still require the explicit approval their rule names.

When `.sdlc/process-decisions.yaml` records a policy, it is authoritative: checkers reject an
`auto-approved` record unless the recorded policy is `automatic_eligible_gates`.
`.sdlc/gates.yaml` then limits which automatic gates are eligible; it does not select
automatic approval by itself. When no approval policy is recorded, the default is Human
checkpoints and automatic records are rejected until the user explicitly selects automatic
eligible gates.

## Files

- `.sdlc/approvals.yaml` records local human or automatic approvals.
- `.sdlc/gates.yaml` optionally enables limited auto-approval policy.

Approval records refer to exact file bytes. If an approved document changes, its hash
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

## Approval Names

- `spec.approved`: required before design gate checks.
- `design.approved`: required before plan gate checks.
- `plan.approved`: required before code gate checks.
- `ux.mock.approved`: required before planning or production UI work when the spec says
  `UI Mock Preference: Required`.
- `code_slice.approved`: for teams that want a checked handoff between code slices. Bind
  the record to the current child implementation plan path and SHA-256 so workflow status
  can map the approval to its owning `WORK-*` branch and display `Completed`.
- `release.approved` and `production-deployment.approved`: for release/deploy workflows;
  these should not be auto-approved by default.

## Recording Approvals

Do not claim that an approval proves end-user or stakeholder feedback. Record feedback
source and status separately in the slice handoff and `.sdlc/wip.md`.

When a user explicitly approves a document, update `.sdlc/approvals.yaml` immediately.
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

Use automatic approval only as an explicit local policy for eligible low-risk work.

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

## Checking Approvals

Draft checks do not require approvals. Checks before the next stage do:

```pwsh
python checkers/check_design.py design.md --spec spec.md --require-approvals --json
python checkers/check_plan.py plan.md --spec spec.md --design design.md --require-approvals --json
python checkers/check_code.py --plan plan.md --require-approvals --tests-argv '["pytest","-q"]' --json
```

Use `--approvals <path>` or `--gates-policy <path>` when a project stores the YAML files
somewhere other than `.sdlc/`.
