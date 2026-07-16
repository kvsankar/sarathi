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
