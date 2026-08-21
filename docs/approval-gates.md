# Approval Records

Sarathi stores local approvals in YAML files under `.sdlc/`. These files belong to the
project and do not depend on Jira, GitHub Issues, Azure Boards, or another ticketing system.

The checker verifies that an approval record is well-formed, UTC timestamped, and current
for the exact file bytes it names. It does **not** prove human intent, identity, or external
consent. Treat the file as a local claim that reports must identify. It is not proof of
authority.

Approval means the document is sufficient and safe for the next change. It does not
mean the document is final, complete, frozen, or presumed correct. Approval should consider
available feedback from appropriate stakeholders, record feedback not yet obtained, and
expect revision when implementation, integration, deployment, or use produces new evidence.
See [feedback-and-learning.md](feedback-and-learning.md).

## Approval Policy

At project entry, and when requirements begin for a feature, the agent must normally ask the
user to select or confirm one policy. Show the practical difference in the current context
and record the project choice in `.sdlc/process-decisions.yaml`. Record a change-specific
override in its spec or plan. The current-work note links to those sources instead of
copying the policy.

- **Human checkpoints**: stop at every material approval gate for explicit human approval.
  This is the default.
- **Automatic approval for eligible gates**: use a current `.sdlc/gates.yaml` policy to
  record automatic approvals only for its listed scopes and gates. It may support unattended
  delivery when the user explicitly requests it; it never means every gate is automatic.

## YOLO

An explicit YOLO request authorizes autonomous end-to-end execution. The agent selects
`automatic_eligible_gates`, records that the user authorized it through YOLO, and creates or
updates `.sdlc/gates.yaml` so Sarathi's internal document, UI-mock, plan, and code-slice gates
can be recorded as `auto-approved`. The agent may infer the entry mode, assurance profile,
work outcome, implementation decisions, and other reasonable defaults; record important
assumptions, risks, and trade-offs.

YOLO continues across commands and resolves failed checks or missing readiness evidence when
it can do so safely within scope. It does not turn failed checks into passes, invent evidence,
claim human or stakeholder approval, exceed the declared file or work scope, or ignore an
unresolved blocker.

YOLO stops before these actions unless the user gives the separate authorization
required for that concrete action:

- live production deployment or production checks;
- destructive or irreversible data or infrastructure changes;
- acceptance or waiver of unresolved security, privacy, safety, or regulatory risk;
- credentials, permissions, secrets, or external access the agent does not have; and
- communication, financial/legal commitment, or another consequential action affecting a
  third party.

Explicit user restrictions and repository policy further narrow YOLO. For example, `YOLO,
but do not deploy`, `YOLO within these files`, or `YOLO, but stop before migration` must be
recorded and obeyed. An ambiguous request merely to use judgment, make assumptions, or avoid
unnecessary questions does not select YOLO; ask only if the distinction changes execution.

When `.sdlc/process-decisions.yaml` records a policy, it is authoritative: checkers reject an
`auto-approved` record unless the recorded policy is `automatic_eligible_gates`.
`.sdlc/gates.yaml` then limits which automatic gates are eligible; it does not select
automatic approval by itself. When no approval policy is recorded, the default is Human
checkpoints and automatic records are rejected until the user explicitly selects automatic
eligible gates or explicitly requests YOLO.

## Files

- `.sdlc/approvals.yaml` records local human or automatic approvals.
- `.sdlc/gates.yaml` optionally enables limited auto-approval policy.

Approval records refer to exact file bytes. If an approved document changes, its hash
no longer matches and the approval is stale.

Classify the revision using the always-loaded rule in `SKILL.md`. A material revision
requires affected review and approval again. A non-material revision does not require
substantive re-review, but the applicable approval authority must refresh or confirm the
approval for the new file hash; an agent must not silently carry forward human approval.

## Approval File

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
- `design.approved`: required before plan gate checks when the selected profile has a
  standalone design. Lean plans without one require the current `spec.approved` record and
  expose their technical decisions to the plan assessment.
- `plan.approved`: required before code gate checks.
- `ux.mock.approved`: required before planning or production UI work when the spec says
  `UI Mock Preference: Required`.
- `code_slice.approved`: for teams that want approval between code changes. Bind
  the record to the current child implementation plan path and SHA-256 so workflow status
  can map the approval to its owning `WORK-*` branch and display `Completed`.
- `release.approved` and `production-deployment.approved`: for release/deploy workflows;
  these should not be auto-approved by default.

## Recording Approvals

Do not claim that an approval proves end-user or stakeholder feedback. Record the feedback
source and status separately in the change report and `.sdlc/wip.md`.

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

Use automatic approval only through an explicit local policy or explicit YOLO authorization.
YOLO may enable every internal gate needed for its declared scope; repository policy and the
protected boundaries above remain forbidden.

```yaml
version: 1
auto_approval:
  enabled: true
  mode: yolo
  expires_at: "2026-07-08T14:32:18Z"
  allowed_scopes:
    - slice/change
    - feature/component
  allowed_gates:
    - spec.approved
    - design.approved
    - plan.approved
    - ux.mock.approved
    - code_slice.approved
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
