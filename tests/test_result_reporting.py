from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
PROMPTS = ROOT / "prompts"
GUIDE = ROOT / "docs" / "result-reporting.md"


def guide_text() -> str:
    return GUIDE.read_text(encoding="utf-8")


def prompt_text(command: str) -> str:
    return (PROMPTS / f"{command}.prompt.md").read_text(encoding="utf-8")


def test_shared_guide_defines_one_primary_result_and_secondary_process_status() -> None:
    text = guide_text()

    for result in ("Ready", "Ready after minor fixes", "Not ready", "Cannot assess yet"):
        assert f"**{result}**" in text

    assert "Assessment result: Not ready" in text
    assert "Process status: `Blocked-upstream`" in text
    assert "additional completion" in text
    assert "not a competing engineering verdict" in text
    assert "Never show `Needs rework` and" in text


def test_shared_guide_separates_findings_and_interprets_checker_results() -> None:
    text = guide_text()

    for category in (
        "Product or code problems",
        "Missing verification",
        "Process/documentation problems",
    ):
        assert category in text

    assert "Order findings within each group by practical impact" in text
    assert (
        "The requirements, design, and implementation plan passed their structural checks."
        in text
    )
    assert "Do not present `12/12`" in text
    assert "every required and applicable command completed and succeeded" in text
    assert "Successful partial checks remain supporting evidence" in text
    assert "not a green result" in text
    assert "This result" in text and "takes precedence" in text
    assert "no completed command failed" in text
    assert "put only the base" in text
    assert "A verify-only result does not replace this broader" in text


def test_shared_guide_explains_specialized_terms_and_contains_requested_example() -> None:
    text = guide_text()

    for specialized_term in (
        "governing plan",
        "hash-current approval",
        "route drift",
        "repository hook/gate",
        "positive evidence",
    ):
        assert specialized_term in text

    assert "screen explainer is enabled in every build" in text
    assert "all 188 automated tests pass" in text
    assert "Test the screen with Android TalkBack" in text
    assert "recorded approval that matches its current" in text


@pytest.mark.parametrize(
    "command",
    [
        f"{stage}-{action}"
        for stage in ("spec", "design", "plan", "code")
        for action in ("create", "verify", "review", "assess")
    ]
    + ["workflow-status"],
)
def test_every_human_facing_stage_loads_shared_reporting_guidance(command: str) -> None:
    assert "docs/result-reporting.md" in prompt_text(command)


@pytest.mark.parametrize("stage", ["spec", "design", "plan", "code"])
def test_assessment_prompts_keep_machine_verdict_secondary(stage: str) -> None:
    text = prompt_text(f"{stage}-assess")

    assert "plain-language assessment result" in text
    assert "explained secondary" in text
    assert "process status" in text
    assert "Verdict:" not in text


@pytest.mark.parametrize("stage", ["spec", "design", "plan", "code"])
def test_review_prompts_put_result_before_findings(stage: str) -> None:
    text = prompt_text(f"{stage}-review")

    assert "After the plain-language review result" in text
    assert "Lead with concrete problems" not in text
    assert "Lead with actionable findings" not in text


@pytest.mark.parametrize("stage", ["spec", "design", "plan", "code"])
def test_verification_prompts_use_narrow_plain_results(stage: str) -> None:
    text = prompt_text(f"{stage}-verify")

    assert "Start with one plain result" in text
    assert "End with one plain result" not in text
    assert "Checks passed" in text
    assert "Checks failed" in text
    assert "Checks could not run" in text
    assert "Interpretation" in text or "what the checks establish" in text


@pytest.mark.parametrize("stage", ["spec", "design", "plan", "code"])
def test_assessments_compose_internal_passes_without_invoking_public_skills(
    stage: str,
) -> None:
    text = prompt_text(f"{stage}-assess")

    assert f"prompts/{stage}-verify.prompt.md" in text
    assert f"prompts/{stage}-review.prompt.md" in text
    assert f"$sarathi-{stage}-verify" not in text
    assert f"$sarathi-{stage}-review" not in text


@pytest.mark.parametrize("stage", ["spec", "design"])
def test_create_self_assessment_does_not_invoke_public_assessment_skill(
    stage: str,
) -> None:
    text = prompt_text(f"{stage}-create")

    assert f"prompts/{stage}-assess.prompt.md" in text
    assert f"run `$sarathi-{stage}-assess`" not in text


def test_plan_create_composes_canonical_assessment_prompt() -> None:
    text = prompt_text("plan-create")

    assert "execute the assessment instructions from" in text
    assert "prompts/plan-assess.prompt.md" in text


def test_project_entry_keeps_internal_stage_value_unprefixed() -> None:
    text = (ROOT / "docs" / "project-entry.md").read_text(encoding="utf-8")

    assert 'next_recommended_stage: "spec-create"' in text
    assert 'next_recommended_stage: "$sarathi-' not in text


def test_canonical_prompts_use_host_neutral_stage_recommendations() -> None:
    for path in PROMPTS.glob("*.prompt.md"):
        assert "$sarathi-" not in path.read_text(encoding="utf-8"), path.name

    text = guide_text()
    assert "explicit command or skill form available in the current" in text
    assert "Do not recommend an entry point that was not installed" in text


def test_installer_generated_stage_skills_load_reporting_guidance() -> None:
    for path in (ROOT / "scripts" / "install.sh", ROOT / "scripts" / "install.ps1"):
        text = path.read_text(encoding="utf-8")
        assert "../sarathi/docs/result-reporting.md" in text
        assert "plain engineering outcome" in text
