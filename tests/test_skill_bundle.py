import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "sarathi"


def test_sarathi_skill_contains_version_and_update_checker() -> None:
    manifest = SKILL / "manifest.json"
    checker = SKILL / "scripts" / "check_update.py"

    metadata = json.loads(manifest.read_text(encoding="utf-8"))
    assert metadata["distribution"] == "sarathi-sdlc"
    assert metadata["schema_version"] == 1
    assert metadata["version"]
    assert metadata["update_url"].startswith("https://pypi.org/")
    assert checker.is_file()


def test_sarathi_skill_defines_material_revision_globally() -> None:
    skill_text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    normalized = " ".join(skill_text.split())

    assert "## Revision Classification" in skill_text
    assert "A revision is material when it changes accepted behavior" in normalized
    assert "when uncertain, treat it as material." in normalized


def test_sarathi_skill_source_contains_only_skill_specific_files() -> None:
    assert sorted(path.name for path in SKILL.iterdir()) == [
        "SKILL.md",
        "agents",
        "manifest.json",
        "scripts",
    ]


def test_only_top_level_skill_allows_implicit_invocation() -> None:
    skill_text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    normalized = " ".join(skill_text.split())
    metadata = (SKILL / "agents" / "openai.yaml").read_text(encoding="utf-8")

    assert "allow_implicit_invocation: true" in metadata
    assert "not ordinary code generation" in skill_text
    assert "never select a command skill unless the user names it" in normalized
    assert "An ordinary code request does not invoke Sarathi." in normalized
