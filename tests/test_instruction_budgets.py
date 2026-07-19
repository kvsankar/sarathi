import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROMPTS = ROOT / "prompts"


def size(path: Path) -> tuple[int, int]:
    return len(path.read_text(encoding="utf-8").splitlines()), path.stat().st_size


def test_always_loaded_instruction_budgets() -> None:
    limits = {
        ROOT / "AGENTS.md": (240, 14_000),
        ROOT / "skills" / "sarathi" / "SKILL.md": (180, 10_000),
    }

    for path, (line_limit, byte_limit) in limits.items():
        lines, bytes_ = size(path)
        assert lines <= line_limit, f"{path.name}: {lines} > {line_limit} lines"
        assert bytes_ <= byte_limit, f"{path.name}: {bytes_} > {byte_limit} bytes"


def test_stage_prompt_budgets() -> None:
    limits = {
        "create": (120, 7_500),
        "assess": (80, 5_000),
        "review": (80, 5_000),
        "verify": (120, 6_000),
        "status": (80, 5_000),
    }
    total_lines = 0
    total_bytes = 0

    for path in PROMPTS.glob("*.prompt.md"):
        lines, bytes_ = size(path)
        total_lines += lines
        total_bytes += bytes_
        command = path.name.removesuffix(".prompt.md")
        kind = "status" if command == "workflow-status" else command.split("-")[-1]
        line_limit, byte_limit = limits[kind]
        assert lines <= line_limit, f"{path.name}: {lines} > {line_limit} lines"
        assert bytes_ <= byte_limit, f"{path.name}: {bytes_} > {byte_limit} bytes"

    assert total_lines <= 1_400
    assert total_bytes <= 90_000


def test_create_prompts_make_optional_references_explicit() -> None:
    for stage in ("spec", "design", "plan", "code"):
        text = (PROMPTS / f"{stage}-create.prompt.md").read_text(encoding="utf-8")
        assert "## Triggered References" in text
        assert "Load only when the trigger applies:" in text


def test_removed_loc_policy_has_no_active_remnants() -> None:
    active = [
        ROOT / "AGENTS.md",
        ROOT / "README.md",
        *PROMPTS.glob("*.prompt.md"),
        *(ROOT / "checkers").glob("*.py"),
    ]
    forbidden = ("--loc-target", "--max-loc", "--max-diff-loc", "--enforce-max-loc")

    for path in active:
        text = path.read_text(encoding="utf-8").casefold()
        for token in forbidden:
            assert token not in text, f"removed LOC option remains in {path}: {token}"


def test_core_instructions_use_plain_language_without_weakening_gates() -> None:
    active = [ROOT / "AGENTS.md", ROOT / "skills" / "sarathi" / "SKILL.md"]
    active.extend(PROMPTS.glob("*.prompt.md"))
    forbidden_phrases = (
        "governing artifact",
        "mechanical verifier",
        "qualitative reviewer",
        "verification oracle",
        "ancestor-impact review",
        "hash-current attestation",
        "qualitative judgment",
        "mechanical verification",
        "complexity budget",
        "ceremony budget",
        "direct-to-code",
        "inherited intent record",
        "assurance modules",
        "learning target",
        "ancestor impact",
        "implementation readiness",
    )

    for path in active:
        text = path.read_text(encoding="utf-8").casefold()
        for phrase in forbidden_phrases:
            assert phrase not in text, f"avoidable jargon remains in {path}: {phrase}"

    skill = (ROOT / "skills" / "sarathi" / "SKILL.md").read_text(encoding="utf-8")
    code_create = (PROMPTS / "code-create.prompt.md").read_text(encoding="utf-8")
    approval_rules = (ROOT / "docs" / "approval-gates.md").read_text(encoding="utf-8")
    feedback_rules = (ROOT / "docs" / "feedback-and-learning.md").read_text(
        encoding="utf-8"
    )
    maintenance = (ROOT / "docs" / "process-maintenance.md").read_text(encoding="utf-8")

    assert "specific implementation plan that\nis ready to implement" in skill
    assert "plan.complexity-approved" not in skill
    assert re.search(
        r"A primary external boundary cannot rely only.*"
        r"explicitly accepts the remaining risk",
        skill,
        re.DOTALL,
    )
    assert "End the turn before starting the next stage" in skill
    assert "Block unless the plan is specific enough to implement" in code_create
    assert "smallest meaningful test" in code_create
    assert "Sarathi does not require one" in code_create
    assert "explicit user approval" in code_create
    assert "revision-required" in code_create
    assert "changes needed in the spec, design, remaining plan" in code_create
    assert re.search(
        r"hash\s+no longer matches and the approval is stale", approval_rules
    )
    assert "revision-required" in feedback_rules
    assert "before affected work" in feedback_rules
    assert "## Plain Language" in maintenance

    for stage in ("spec", "design", "plan", "code"):
        assess = (PROMPTS / f"{stage}-assess.prompt.md").read_text(encoding="utf-8")
        assert "**Check pass**" in assess
        assert "**Review pass**" in assess
        assert "different fresh sub-agent" in assess
