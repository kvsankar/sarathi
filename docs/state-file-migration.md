# Migrating Legacy State Files

Load this reference only when a project contains one of these legacy files or migration is
explicitly requested:

- `.sdlc/artifact-paths.yaml`
- `.sdlc/code-assessments.yaml`
- `.sdlc/wave-checkpoints.yaml`

Migration is optional. Sarathi continues to read these files, so an existing project does
not need bookkeeping work before delivery can continue.

## Artifact Paths

Move the complete `canonical` and `children` mappings from `artifact-paths.yaml` under an
`artifact_paths` key in `process-decisions.yaml`. Preserve any existing project-entry,
delivery, approval, and bootstrap decisions.

```yaml
artifact_paths:
  canonical:
    spec: docs/features/auth/auth-signin.spec.md
    design: docs/features/auth/auth-signin.design.md
    plan: docs/features/auth/auth-signin.plan.md
  children:
    WORK-AUTH-SIGNIN:
      plan: docs/features/auth/auth-signin.plan.md
```

When both locations exist, `process-decisions.yaml` is authoritative.

## Delivery Records

Create `.sdlc/delivery-records.yaml` with `version: 1` and one `records` list. Copy every
legacy assessment into that list and add `kind: code_assessment`. Copy every legacy
checkpoint and add `kind: wave_checkpoint`. Do not otherwise change IDs, plan paths, hashes,
members, verdicts, status, timestamps, or learning evidence.

```yaml
version: 1
records:
  - kind: code_assessment
    id: ASSESS-CODE-AUTH-SIGNIN
    # remaining assessment fields stay unchanged
  - kind: wave_checkpoint
    id: CHECK-WAVE-AUTH-BOUNDARY
    # remaining checkpoint fields stay unchanged
```

Sarathi falls back to a legacy file when the consolidated file has no record of that kind.
This permits assessment and checkpoint records to move separately.

## Safe Completion

Render workflow status before and after migration and compare the engineering state, active
work, assessments, and completed groups. Keep the legacy files until that comparison is
satisfactory. Removing them is optional and should be a separate, explicit cleanup step;
their presence does not change the result once the corresponding consolidated records exist.
