from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_generalized_product_status_scenarios_are_recorded() -> None:
    scenarios = read("tests/fixtures/product_first_status_scenarios.md")

    for label in ("Scenario A", "Scenario B", "Scenario C", "Scenario D"):
        assert label in scenarios
    for phrase in (
        "established service",
        "shared package",
        "target-owned implementation",
        "extract then reuse",
        "deferred and non-blocking",
        "target report implementation has not started",
    ):
        assert phrase in scenarios
    assert "BPTrial" not in scenarios
    assert "consumer" not in scenarios.casefold()
    assert "The export refactor is complete" in scenarios


def test_product_first_contract_is_wired_into_status_and_planning() -> None:
    skill = read("skills/sarathi/SKILL.md")
    wip = read("docs/work-in-progress.md")
    decomposition = read("docs/work-decomposition.md")
    plan_create = read("prompts/plan-create.prompt.md")
    plan_review = read("prompts/plan-review.prompt.md")
    status_prompt = read("prompts/workflow-status.prompt.md")

    assert "## Supporting Status Rule" in skill
    assert "Never use `complete` without its exact scope" in skill
    for field in (
        "Goal:",
        "Working Today:",
        "Reusable Today:",
        "Current Increment:",
        "Remaining Shared Work:",
        "Target-Owned Work:",
        "Deferred:",
        "Before Coding:",
        "Next Action:",
    ):
        assert field in wip
    for classification in (
        "reuse directly",
        "extract then reuse",
        "target-owned implementation",
        "new behavior",
        "deferred cleanup",
    ):
        assert classification in decomposition
    assert "## Baseline Reuse" in plan_create
    assert "Do not present an existing capability as greenfield work" in plan_create
    assert "Check the baseline" in plan_review
    assert "engineering snapshot shown first" in status_prompt
