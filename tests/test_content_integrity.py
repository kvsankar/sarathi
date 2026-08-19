import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "sarathi"

MARKDOWN_LINK = re.compile(r"\]\(([^)]+)\)")
SKILL_FRONTMATTER = re.compile(r"^---\n(.*?)\n---", re.DOTALL)
REFERENCE_MAP_ROW = re.compile(r"^\| `(docs/[^`]+\.md)` \|", re.MULTILINE)


def test_sarathi_skill_has_valid_metadata() -> None:
    text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    match = SKILL_FRONTMATTER.match(text)
    assert match is not None, "SKILL.md must start with YAML frontmatter"

    metadata = yaml.safe_load(match.group(1))
    assert isinstance(metadata, dict)
    assert set(metadata) <= {
        "name",
        "description",
        "license",
        "allowed-tools",
        "metadata",
    }

    name = metadata.get("name")
    assert isinstance(name, str) and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name)
    assert len(name) <= 64

    description = metadata.get("description")
    assert isinstance(description, str) and description.strip()
    assert len(description) <= 1024
    assert "<" not in description and ">" not in description


def test_yolo_policy_is_canonical_and_selects_internal_auto_approval() -> None:
    approval_policy = (ROOT / "docs" / "approval-gates.md").read_text(encoding="utf-8")
    assert "An explicit YOLO request authorizes autonomous end-to-end execution" in (
        approval_policy
    )
    assert "`automatic_eligible_gates`" in approval_policy
    assert "live production deployment or production checks" in approval_policy

    for path in (
        ROOT / "AGENTS.md",
        ROOT / "README.md",
        ROOT / "skills" / "sarathi" / "SKILL.md",
    ):
        text = path.read_text(encoding="utf-8")
        assert "never selects automatic approval" not in text
        assert "approval-gates.md" in text


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


def test_progressive_disclosure_maps_every_shared_document() -> None:
    disclosure = (ROOT / "docs" / "progressive-disclosure.md").read_text(
        encoding="utf-8"
    )
    on_demand = disclosure.split("## On-Demand References", 1)[1].split(
        "## Command Prompt Loading", 1
    )[0]
    mapped = REFERENCE_MAP_ROW.findall(on_demand)
    expected = sorted(f"docs/{path.name}" for path in (ROOT / "docs").glob("*.md"))

    assert len(mapped) == len(set(mapped)), "reference map contains duplicate rows"
    assert sorted(mapped) == expected


def test_assurance_profiles_define_distinct_paths_with_full_stage_assessment() -> None:
    profiles = (ROOT / "docs" / "assurance-profiles.md").read_text(encoding="utf-8")
    normalized = " ".join(profiles.split())

    assert "spec -> implementation plan -> code" in profiles
    assert "spec -> design -> implementation plan -> code" in profiles
    assert (
        "spec -> design -> breakdown plan -> child implementation plan(s) "
        "-> code slices" in profiles
    )
    assert "not by weakening checks or review" in normalized
    assert "profile changes where assurance occurs" in normalized


def test_stage_prompts_route_and_check_lean_without_standalone_design() -> None:
    spec_create = (ROOT / "prompts" / "spec-create.prompt.md").read_text(
        encoding="utf-8"
    )
    plan_create = (ROOT / "prompts" / "plan-create.prompt.md").read_text(
        encoding="utf-8"
    )
    plan_verify = (ROOT / "prompts" / "plan-verify.prompt.md").read_text(
        encoding="utf-8"
    )

    assert "Recommend `plan-create` for Lean" in spec_create
    assert "for Lean without a design" in plan_create
    assert "For Lean without a standalone design" in plan_verify
    assert "check_plan.py plan.md --spec spec.md --json" in plan_verify


def test_workflow_terminology_has_one_canonical_example() -> None:
    terminology = (ROOT / "docs" / "workflow-terminology.md").read_text(
        encoding="utf-8"
    )
    normalized = " ".join(terminology.split())
    skill = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    disclosure = (ROOT / "docs" / "progressive-disclosure.md").read_text(
        encoding="utf-8"
    )

    for label in ("Work target", "Scope", "Stage", "Action", "Command"):
        assert f"**{label}:**" in terminology
    assert "**Current activity:** Review the design" in normalized
    assert "A stage is never a combined value" in normalized
    assert "docs/workflow-terminology.md" in skill
    assert "docs/workflow-terminology.md" in disclosure
