# Process Maintenance

Agent-Steered SDLC should stay usable under real delivery pressure. Additions to the process
must improve judgment without turning every prompt into a checklist wall.

## Prompt Budget

- Keep stage prompts focused on stage-specific actions, gates, and stop conditions.
- Put repeated policy in shared docs such as
  [cross-cutting-concerns.md](cross-cutting-concerns.md) and reference it from prompts.
- Prefer one crisp stage instruction plus one shared reference over copying a concern into
  every create, verify, review, and assess prompt.
- Treat create prompts over roughly 250 lines and assess prompts over roughly 200 lines as
  candidates for consolidation unless the extra length is demonstrably stage-specific.

## Adding A Cross-Cutting Concern

Before adding a new concern, decide:

- Which scope owns it first: product/system, feature/component, or slice/change.
- Which artifact owns each decision: spec, design/ADR, plan, code/tests, deployment, or docs.
- Which checks are deterministic structure checks and which are qualitative judgment.
- Which evidence is an agent-authored claim, and which evidence comes from an independent
  command, real system, artifact hash, or observed output.
- Whether the concern needs a hard human gate, an approval attestation, or just a review
  finding.

## Evidence Language

Use precise language:

- "Structural check passed" means shape, references, hashes, and declared evidence are
  internally consistent.
- "Claim" means an agent/project-authored file such as `.sdlc/test-traceability.yaml`,
  `.sdlc/approvals.yaml`, or a `real_boundary: true` field.
- "Verified" should be reserved for evidence backed by a command, observed output, real
  dependency, generated artifact, hash-current attestation, or qualitative review.

Do not let a green checker result imply semantic correctness, human consent, true TDD
history, or real-boundary execution unless the evidence actually proves that.
