from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "sarathi"
SKILL_DOCS = [
    "approval-gates.md",
    "artifact-formatting.md",
    "bootstrap-instructions.md",
    "cross-cutting-concerns.md",
    "process-maintenance.md",
    "progressive-disclosure.md",
    "project-entry.md",
    "review-verification-checklist.md",
    "srs-authoring.md",
    "work-in-progress.md",
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
