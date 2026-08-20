import json
from pathlib import Path

import yaml

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


def test_sarathi_skill_source_contains_only_skill_specific_files() -> None:
    assert sorted(path.name for path in SKILL.iterdir()) == [
        "SKILL.md",
        "agents",
        "manifest.json",
        "scripts",
    ]


def test_top_level_skill_allows_implicit_invocation() -> None:
    metadata = yaml.safe_load(
        (SKILL / "agents" / "openai.yaml").read_text(encoding="utf-8")
    )

    assert metadata["policy"]["allow_implicit_invocation"] is True
