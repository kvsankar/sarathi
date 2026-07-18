from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_planning_defaults_to_direct_implementation() -> None:
    prompt = read("prompts/plan-create.prompt.md")
    policy = read("docs/work-decomposition.md")
    assert "## Direct-To-Code Decision" in prompt
    assert "feature/component may be code-ready directly" in prompt
    assert "Many screens" in policy
    assert "do not justify decomposition" in policy
    assert "Ceremony Budget" in policy


def test_inherited_intent_is_delta_only() -> None:
    policy = read("docs/work-decomposition.md")
    spec = read("prompts/spec-create.prompt.md")
    design = read("prompts/design-create.prompt.md")
    assert "never rebuild the parent inventory" in policy
    assert "Never\nreproduce the complete parent requirement inventory" in spec
    assert "Do not repeat parent architecture" in design


def test_required_scenarios_and_neuring_dogfood_are_recorded() -> None:
    scenarios = read("tests/fixtures/execution_first_scenarios.md")
    dogfood = read("docs/simplicity-first.md")
    for label in ("Scenario A", "Scenario B", "Scenario C", "Scenario D"):
        assert label in scenarios
    assert "## Dogfood: Neuring Consumer Android" in dogfood
    assert "backend and BLE integration out of scope" in dogfood
    assert "stakeholder UI review" in dogfood


def test_local_fixes_use_focused_rereview() -> None:
    checklist = read("docs/review-verification-checklist.md")
    plan_assess = read("prompts/plan-assess.prompt.md")
    assert "Run mechanical verification once per artifact revision" in checklist
    assert "focused\nre-review" in checklist
    assert "unless scope or\ncontrolling intent changed materially" in plan_assess
