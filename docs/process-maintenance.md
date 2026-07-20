# Process Maintenance

Sarathi should stay usable under real delivery pressure. Additions to the process
must improve judgment without turning every prompt into a checklist wall.

## Prompt Budget

- Keep stage prompts focused on stage-specific actions, gates, and stop conditions.
- Keep Sarathi's identity anchored in [enduring-model.md](enduring-model.md). Treat status
  formats, identifier placement, compatibility rules, and checker fixes as supporting
  guidance rather than the top-level process story.
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
- Keep `SKILL.md` as the short instruction file that is always loaded. It should select the project entry
  mode and stage, then load the selected stage prompt and triggered shared docs on demand.
- Enforce repository prompt budgets in tests. A budget increase requires an explicit
  rationale and removal or consolidation elsewhere; do not make the threshold advisory.
- Keep the routing skill and repository agent instructions below their tested budgets.
- Prefer short core instructions plus only the extra checks required by
  [assurance-profiles.md](assurance-profiles.md) over universal concern lists.
- Apply [simplicity-first.md](simplicity-first.md): process requirements stay outside
product architecture, and new generic machinery requires concrete evidence.

## Plain Language

- Write for a capable software practitioner who has not learned Sarathi's vocabulary.
- Prefer `document`, `check`, `review`, `parent`, `child`, `existing system`, and
  `pass/fail result` over `artifact`, `mechanical verification`, `qualitative judgment`,
  `ancestor`, `descendant`, `brownfield`, and `oracle` in explanatory prose.
- Keep exact machine-readable field names and values when checkers depend on them. Explain
  an unfamiliar field in ordinary words where it first appears.
- Use one term for one idea. Do not create a synonym merely to sound formal.
- Never soften `must`, `block`, `stop`, approval boundaries, evidence limits, or safety
  rules while simplifying the wording.

## Adding A Risk Check

Before adding a new concern, decide:

- Which scope owns it first: product/system, feature/component, or slice/change.
- Which document or code owns each decision: spec, design/ADR, plan, code/tests,
  deployment, or docs.
- Which checks are repeatable program checks and which require independent judgment.
- Which evidence is an agent-authored claim, and which evidence comes from an independent
  command, real system, file hash, or observed output.
- Whether the concern needs explicit approval, an approval record, or just a review
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

- "Automatic checks passed" means shape, references, hashes, and declared evidence are
  internally consistent.
- "Claim" means an agent/project-authored file or field such as
  `.sdlc/wip.md`, `.sdlc/process-decisions.yaml`, `.sdlc/test-traceability.yaml`,
  `.sdlc/approvals.yaml`, or `real_boundary: true`.
- "Verified" should be reserved for evidence backed by a command, observed output, real
  dependency, generated file, matching approval record, or independent review.

Do not let a green checker result imply semantic correctness, human consent, or
real-boundary execution unless the evidence actually proves that.

## Change And Release Records

- Update top-level `CHANGELOG.md` for user-visible prompt, skill, checker, installer, and
  documentation changes.
- Use [release-process.md](release-process.md) when preparing a version bump, release
  commit, or Git tag.
- Keep release notes focused on behavior, compatibility, install impact, checker policy,
  and maintainer workflow. Avoid burying important process changes in generic refactor
  wording.
- Do not tag a release until `pyproject.toml`, `skills/sarathi/manifest.json`,
  `CHANGELOG.md`, built distributions, bundled skill docs, and installer dry runs are
  consistent.
