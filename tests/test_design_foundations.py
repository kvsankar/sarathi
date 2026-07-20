from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_design_is_an_implementable_evolvable_technical_model() -> None:
    contract = read("docs/artifact-contracts.md")
    prompt = read("prompts/design-create.prompt.md")
    skill = read("skills/sarathi/SKILL.md")
    model = read("docs/enduring-model.md")

    definition = (
        "accepted requirements and constraints into an implementable, evolvable "
        "technical model"
    )
    for text in (contract, prompt, model):
        assert definition in " ".join(text.split())

    assert "Architecture, boundaries, decisions, quality attributes" in skill
    assert "How the system will change" not in skill


def test_design_selects_boundaries_for_the_kind_of_system() -> None:
    contract = read("docs/artifact-contracts.md")
    create = read("prompts/design-create.prompt.md")
    review = read("prompts/design-review.prompt.md")

    for context in (
        "Backend or service",
        "Web frontend",
        "Mobile app",
        "Data or ML system",
        "Library, SDK or CLI",
        "Infrastructure or operations",
    ):
        assert context in contract

    assert "API contracts; database schema, data ownership" in contract
    assert "applicable database-schema and API boundaries must never be" in contract
    assert "left implicit" in contract
    assert "database schema/data ownership and API contracts" in create
    assert "Backend designs must make applicable API" in review
    assert "database-schema boundaries reviewable" in review
    assert "not a universal checklist" in contract


def test_current_and_target_state_are_conditional_change_guidance() -> None:
    create = read("prompts/design-create.prompt.md")
    human_first = read("docs/human-first-artifacts.md")
    review = read("prompts/design-review.prompt.md")

    assert "For changes to an existing system" in create
    assert "For an existing-system change" in human_first
    assert "For an existing-system change" in review


def test_process_views_use_the_architectural_design_definition() -> None:
    guide = read("docs/sarathi.html")
    image_prompt = read("docs/sarathi-process-diagram-prompt.md")

    assert "How is the solution shaped?" in guide
    assert "How will the system change?" not in guide
    assert "Technical model understood" in guide
    assert "Change understood" not in guide
    assert '"DESIGN — SHAPE THE SOLUTION"' in image_prompt
    assert '"DESIGN — HOW THE SYSTEM CHANGES"' not in image_prompt
