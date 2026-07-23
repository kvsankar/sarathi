import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "sarathi"

MARKDOWN_LINK = re.compile(r"\]\(([^)]+)\)")


def test_stage_prompts_have_valid_frontmatter() -> None:
    for path in sorted((ROOT / "prompts").glob("*.prompt.md")):
        text = path.read_text(encoding="utf-8")
        assert text.startswith("---\n"), f"missing frontmatter: {path}"
        _, frontmatter, body = text.split("---", 2)
        fields = {
            key.strip(): value.strip()
            for line in frontmatter.splitlines()
            if ":" in line
            for key, value in [line.split(":", 1)]
        }
        assert fields.get("description"), f"missing description: {path}"
        assert fields.get("agent"), f"missing agent: {path}"
        assert body.strip(), f"empty prompt body: {path}"


def test_documented_local_references_resolve() -> None:
    canonical = [ROOT / "AGENTS.md", ROOT / "README.md"]
    canonical.extend(sorted((ROOT / "docs").glob("*.md")))
    canonical.extend(sorted((ROOT / "prompts").glob("*.md")))
    missing: list[str] = []
    for source in canonical + [SKILL / "SKILL.md"]:
        text = source.read_text(encoding="utf-8")
        for raw_target in MARKDOWN_LINK.findall(text):
            target = raw_target.strip().strip("<>").split("#", 1)[0]
            if not target or "://" in target or target.startswith(("mailto:", "#")):
                continue
            if Path(target).suffix != ".md":
                continue
            if not (source.parent / target).resolve().exists():
                missing.append(f"{source}: {raw_target}")

    assert missing == []
