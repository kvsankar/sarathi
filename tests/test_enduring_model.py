import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def normalized(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def test_enduring_model_leads_with_delivery_and_decomposition() -> None:
    model = read("docs/enduring-model.md")
    readme = read("README.md")
    skill = read("skills/sarathi/SKILL.md")

    statement = (
        "Sarathi turns accepted intent into the smallest safe working increment, "
        "preserves the decisions and evidence needed to review it, decomposes work "
        "that is too complex to reason about safely as one unit, and adapts the "
        "remaining work from real feedback."
    )
    for text in (model, readme, skill):
        assert statement in normalized(text)
        assert (
            "accepted intent -> smallest safe increment -> working behavior -> "
            "evidence -> feedback -> adapt"
        ) in text

    for heading in (
        "## 1. Deliver In A Learning Loop",
        "## 2. Decompose When It Improves Delivery",
        "## 3. Separate Checks From Judgment",
        "## 4. Preserve Continuity",
        "## 5. Match Assurance To Risk",
        "## 6. Keep Supporting Rules In Their Place",
    ):
        assert heading in model


def test_recent_safeguards_are_supporting_rules_not_the_process_title() -> None:
    model = read("docs/enduring-model.md")
    prompt = read("docs/sarathi-process-diagram-prompt.md")

    assert "These rules\nmake the enduring model easier to use" in model
    assert '"SARATHI — ADAPTIVE SOFTWARE DELIVERY"' in prompt
    assert '"CAN THE WORK BE UNDERSTOOD AS ONE COHERENT UNIT?"' in prompt
    assert "Decomposition reduces mental load" in prompt
    assert "safer decision, clearer ownership" not in prompt
    assert 'Do not use "product-first" as the title' in prompt
    assert "no project-specific examples" in prompt
    assert "no version numbers" in prompt


def test_decomposition_policy_distinguishes_splitting_from_more_documents() -> None:
    skill = read("skills/sarathi/SKILL.md")
    policy = read("docs/work-decomposition.md")

    assert "If a competent engineer can understand" in skill
    assert "natural product or technical" in skill
    assert "A split does not require a new document chain" in normalized(skill)
    assert "Split the work only when" not in skill
    assert "Decomposing work does not automatically mean creating more" in policy
    assert "Any new document answers only that question" in policy
