from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def normalized(text: str) -> str:
    return " ".join(text.split())


def test_behavior_changes_use_observed_red_green_refactor() -> None:
    policy = read("docs/test-ownership.md")
    contract = read("docs/artifact-contracts.md")
    create = read("prompts/code-create.prompt.md")
    skill = read("skills/sarathi/SKILL.md")

    for text in (policy, contract, create, skill):
        assert "Red-Green-Refactor" in text

    assert "observe it fail for the expected reason" in policy
    assert "observe the smallest meaningful test fail" in normalized(contract)
    assert "observe it fail for the expected reason" in normalized(create)
    assert "post-hoc regression coverage" in create


def test_plan_and_review_preserve_test_first_evidence() -> None:
    plan_create = read("prompts/plan-create.prompt.md")
    plan_review = read("prompts/plan-review.prompt.md")
    code_review = read("prompts/code-review.prompt.md")
    code_assess = read("prompts/code-assess.prompt.md")

    assert (
        "first behavioral tests that will fail for the expected reason"
        in normalized(plan_create)
    )
    assert "credible Red-Green-Refactor sequence" in normalized(plan_review)
    assert (
        "Do not infer test-first development merely because tests now exist or pass"
        in normalized(code_review)
    )
    assert "test-first evidence for behavior changes" in normalized(code_assess)


def test_process_views_show_tests_and_review_across_every_stage() -> None:
    model = read("docs/enduring-model.md")
    guide = read("docs/sarathi.html")
    prompt = read("docs/sarathi-process-diagram-prompt.md")

    assert "This is a gate around every stage" in model
    assert "Testing also runs through the whole delivery loop" in model
    assert "Test evidence thread" in guide
    assert "Quality gate at every stage" in guide
    assert "Red &rarr; Green &rarr; Refactor" in guide
    assert '"TEST EVIDENCE THROUGH DELIVERY"' in prompt
    assert '"QUALITY GATE AT EVERY STAGE"' in prompt
    assert '"Code — Red → Green → Refactor + exact results"' in prompt
    assert "independent-review eye icons attached to every stage" in prompt


def test_non_red_paths_are_narrow_and_use_replacement_verification() -> None:
    policy = read("docs/test-ownership.md")
    create = read("prompts/code-create.prompt.md")
    review = read("prompts/code-review.prompt.md")

    for phrase in (
        "docs or formatting only",
        "generated output",
        "build/deployment configuration validation",
        "characterization of unchanged legacy behavior",
    ):
        assert phrase in normalized(policy)

    assert "replacement verification" in create
    assert "credible replacement" in review
    assert "ordinary feature behavior" in policy
    assert "defect fixes" in policy
