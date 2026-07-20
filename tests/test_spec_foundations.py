from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def normalized(text: str) -> str:
    return " ".join(text.split())


def test_spec_uses_one_proportionate_needs_to_evidence_model() -> None:
    model = read("docs/requirements-model.md")
    contract = read("docs/artifact-contracts.md")
    create = read("prompts/spec-create.prompt.md")
    review = read("prompts/spec-review.prompt.md")
    enduring = read("docs/enduring-model.md")
    human_first = read("docs/human-first-artifacts.md")

    assert "needs-to-evidence requirements model" in model
    assert "principally influenced by Leffingwell/Widrig" in model
    assert (
        "optional authoring tools, not Sarathi modes or required sections"
        in normalized(model)
    )
    assert "agreed, testable model of required system behavior" in normalized(model)
    for text in (contract, create, review):
        assert "docs/requirements-model.md" in text
    assert "needs lead to features" in normalized(enduring)
    assert "stakeholder needs lead to features" in normalized(human_first)
    assert "must not flatten that reasoning into a generic summary" in normalized(
        human_first
    )


def test_requirements_hierarchy_runs_from_problem_to_observable_evidence() -> None:
    model = read("docs/requirements-model.md")

    ordered = (
        "Problem, stakeholders, and scope",
        "Stakeholder needs",
        "Features",
        "Use cases",
        "Functional requirements",
        "Supplementary requirements",
        "Acceptance tests",
        "Journey tests",
        "Traceability",
    )
    positions = [model.index(item) for item in ordered]
    assert positions == sorted(positions)
    assert "main flow" in model
    assert "alternatives and failures" in normalized(model)
    assert (
        "requirements-level intent in the specification, not executable test code"
        in normalized(model)
    )


def test_spec_create_and_review_preserve_derivation_not_just_sections() -> None:
    create = read("prompts/spec-create.prompt.md")
    review = read("prompts/spec-review.prompt.md")

    assert "Derive features from stakeholder needs" in create
    assert "meaningful alternate and failure flows" in normalized(create)
    assert "black-box acceptance tests" in create
    assert "Define journey tests" in normalized(create)
    assert "Check the requirements derivation" in review
    assert "Missing or cosmetic links require `Needs rework`" in normalized(review)


def test_process_views_show_the_complete_spec_model() -> None:
    skill = read("skills/sarathi/SKILL.md")
    guide = read("docs/sarathi.html")
    prompt = read("docs/sarathi-process-diagram-prompt.md")

    assert (
        "Needs → features → use cases → requirements → acceptance and journeys" in skill
    )
    assert "How is the required behavior defined?" in guide
    assert "scope and non-goals" in guide
    assert "main, alternate and failure flows" in normalized(guide)
    assert "supplementary requirements; acceptance tests and journeys" in normalized(
        guide.replace("black-box ", "")
    )
    assert '"SPEC — DEFINE THE REQUIREMENTS"' in prompt
    assert '"Use cases: main, alternate, failure flows"' in prompt
    assert '"Black-box acceptance tests + journeys"' in prompt
    assert '"Traceability: needs → observable evidence"' in prompt
    assert '"SPEC — WHAT MUST BE TRUE"' not in prompt


def test_detailed_srs_skill_keeps_the_same_organizing_model() -> None:
    skill = read("skills/srs-authoring/SKILL.md")
    quality = read("skills/srs-authoring/references/srs-quality.md")
    detailed = read("docs/srs-authoring.md")

    for text in (skill, quality, detailed):
        assert "needs-to-evidence" in text
    for text in (skill, quality):
        assert "not modes or required sections" in normalized(text)
    assert "Traceability preserves the reasoning; it does not replace it" in normalized(
        skill
    )
    assert "Visible headings and prose use descriptive language" in skill
    for text in (quality, detailed):
        assert "do not require a universal checklist" in normalized(text)
        assert "either write measurable `NFR-` items or explicitly defer" not in text


def test_version_three_enforces_new_product_specs_without_breaking_version_two() -> (
    None
):
    contract = read("docs/artifact-contracts.md")
    create = read("prompts/spec-create.prompt.md")
    checker = read("checkers/check_spec.py")
    schemas = read("checkers/schemas.py")

    assert "New and materially revised specs use format version 3" in normalized(
        contract
    )
    assert 'sarathi:artifact-format version="3"' in create
    assert 'format_name == "human-first-v3"' in checker
    assert "LEGACY_HUMAN_FIRST_SPEC_SECTIONS" in checker
    assert "LEGACY_HUMAN_FIRST_SPEC_SECTIONS" in schemas
    assert "HUMAN_FIRST_SPEC_SECTIONS" in schemas
