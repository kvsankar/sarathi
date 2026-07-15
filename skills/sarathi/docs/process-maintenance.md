# Process Maintenance

Sarathi should stay usable under real delivery pressure. Additions to the process
must improve judgment without turning every prompt into a checklist wall.

## Prompt Budget

- Keep stage prompts focused on stage-specific actions, gates, and stop conditions.
- Put repeated policy in shared docs such as
  [project-entry.md](project-entry.md), [progressive-disclosure.md](progressive-disclosure.md),
  [work-in-progress.md](work-in-progress.md),
  [bootstrap-instructions.md](bootstrap-instructions.md),
  [artifact-formatting.md](artifact-formatting.md), and
  [cross-cutting-concerns.md](cross-cutting-concerns.md),
  [work-decomposition.md](work-decomposition.md), and
  [feedback-and-learning.md](feedback-and-learning.md), and reference it from prompts.
- Prefer one crisp stage instruction plus one shared reference over copying a concern into
  every create, verify, review, and assess prompt.
- Keep `SKILL.md` as the always-loaded routing kernel. It should select the project entry
  mode and stage, then load the selected stage prompt and triggered shared docs on demand.
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

## Sub-Agent Independence

- Verification, review, and assessment prompts must require sub-agents when the host exposes
  sub-agent capability.
- Do not describe sub-agent use as optional, preferred, or "when convenient" for verify,
  review, assess, or create-stage self-assessment loops.
- If a host lacks sub-agent capability, prompts may allow a degraded same-agent path only
  with explicit disclosure that the result was not independent.
- Keep the canonical details in [review-verification-checklist.md](review-verification-checklist.md)
  and reference that shared rule instead of copying long sub-agent policy into every prompt.

## Evidence Language

Use precise language:

- "Structural check passed" means shape, references, hashes, and declared evidence are
  internally consistent.
- "Claim" means an agent/project-authored file or field such as
  `.sdlc/wip.md`, `.sdlc/process-decisions.yaml`, `.sdlc/test-traceability.yaml`,
  `.sdlc/approvals.yaml`, or `real_boundary: true`.
- "Verified" should be reserved for evidence backed by a command, observed output, real
  dependency, generated artifact, hash-current attestation, or qualitative review.

Do not let a green checker result imply semantic correctness, human consent, true TDD
history, or real-boundary execution unless the evidence actually proves that.

## Change And Release Records

- Update top-level `CHANGELOG.md` for user-visible prompt, skill, checker, installer, and
  documentation changes.
- Use [release-process.md](release-process.md) when preparing a version bump, release
  commit, or Git tag.
- Keep release notes focused on behavior, compatibility, install impact, checker policy,
  and maintainer workflow. Avoid burying important process changes in generic refactor
  wording.
- Do not tag a release until `pyproject.toml`, `CHANGELOG.md`, bundled skill docs, and
  installer dry runs are consistent.
