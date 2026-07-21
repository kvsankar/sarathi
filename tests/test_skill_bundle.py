import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "sarathi"
SKILL_DOCS = [
    "approval-gates.md",
    "artifact-contracts.md",
    "artifact-formatting.md",
    "assurance-profiles.md",
    "bootstrap-instructions.md",
    "cleanup-pass.md",
    "cross-cutting-concerns.md",
    "design-principles.md",
    "enduring-model.md",
    "feedback-and-learning.md",
    "human-first-artifacts.md",
    "process-maintenance.md",
    "progressive-disclosure.md",
    "project-entry.md",
    "project-quality-gates.md",
    "release-process.md",
    "requirements-model.md",
    "review-verification-checklist.md",
    "simplicity-first.md",
    "simplify-pass.md",
    "slug-id-migration.md",
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


def test_sarathi_skill_contains_version_and_update_checker() -> None:
    manifest = SKILL / "manifest.json"
    checker = SKILL / "scripts" / "check_update.py"

    metadata = json.loads(manifest.read_text(encoding="utf-8"))
    assert metadata["distribution"] == "sarathi-sdlc"
    assert metadata["schema_version"] == 1
    assert metadata["version"]
    assert metadata["update_url"].startswith("https://pypi.org/")
    assert checker.is_file()


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
