from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "sarathi"
SKILL_DOCS = [
    "approval-gates.md",
    "artifact-formatting.md",
    "bootstrap-instructions.md",
    "cleanup-pass.md",
    "cross-cutting-concerns.md",
    "feedback-and-learning.md",
    "process-maintenance.md",
    "progressive-disclosure.md",
    "project-entry.md",
    "release-process.md",
    "review-verification-checklist.md",
    "simplify-pass.md",
    "srs-authoring.md",
    "test-ownership.md",
    "work-decomposition.md",
    "work-in-progress.md",
    "workflow-status.md",
]


def source_files(folder: str, pattern: str) -> list[Path]:
    return sorted((ROOT / folder).glob(pattern), key=lambda path: path.name)


def assert_bundled_files_match(folder: str, pattern: str) -> None:
    sources = source_files(folder, pattern)
    bundled = sorted((SKILL / folder).glob(pattern), key=lambda path: path.name)

    assert [path.name for path in bundled] == [path.name for path in sources]
    for source in sources:
        copy = SKILL / folder / source.name
        assert copy.read_bytes() == source.read_bytes()


def test_sarathi_skill_bundles_all_prompts() -> None:
    assert_bundled_files_match("prompts", "*.prompt.md")


def test_sarathi_skill_bundles_all_checkers() -> None:
    assert_bundled_files_match("checkers", "*.py")


def test_sarathi_skill_bundles_shared_docs() -> None:
    assert sorted(path.name for path in (SKILL / "docs").glob("*.md")) == SKILL_DOCS
    for name in SKILL_DOCS:
        assert (SKILL / "docs" / name).read_bytes() == (
            ROOT / "docs" / name
        ).read_bytes()


def test_sarathi_skill_bundles_static_process_guide() -> None:
    source = ROOT / "docs" / "sarathi.html"
    bundled = SKILL / "docs" / "sarathi.html"
    assert bundled.read_bytes() == source.read_bytes()
    guide = source.read_text(encoding="utf-8")
    assert "1. PR-sized leaf" in guide
    assert "2. Decomposable product" in guide
    assert "WORK-FEATURE-ONE" in guide
    assert "WORK-SLICE-A" in guide
    assert "WORK-SYSTEM-INTEGRATION" in guide
    assert "Product plan allocation" in guide
    assert "Integration slice child" in guide
    assert "Background = artifact type" in guide
    assert "Level tag = work scope" in guide
    assert "artifact-spec" in guide
    assert "level-product" in guide
    assert "artifact-work" not in guide
    assert "key-work" not in guide
    assert "Slice A spec + LLD" not in guide
    assert "3. Inspect and adapt" in guide
    assert "Learning-dependent slices:" in guide


def test_feedback_and_learning_policy_is_wired_into_stage_prompts() -> None:
    policy = (ROOT / "docs" / "feedback-and-learning.md").read_text(encoding="utf-8")
    assert "Could feedback from this slice materially invalidate" in policy
    assert "Intra-slice parallelism" in policy
    assert "revision-required" in policy

    for name in (
        "plan-create.prompt.md",
        "plan-review.prompt.md",
        "plan-assess.prompt.md",
        "code-create.prompt.md",
        "code-review.prompt.md",
        "code-assess.prompt.md",
    ):
        prompt = (ROOT / "prompts" / name).read_text(encoding="utf-8")
        assert "docs/feedback-and-learning.md" in prompt
