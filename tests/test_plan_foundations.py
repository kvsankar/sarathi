from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def normalized(text: str) -> str:
    return " ".join(text.split())


def test_planning_creates_an_executable_delivery_structure() -> None:
    contract = read("docs/artifact-contracts.md")
    prompt = read("prompts/plan-create.prompt.md")
    skill = read("skills/sarathi/SKILL.md")
    model = read("docs/enduring-model.md")

    definition = "approved technical model into an executable delivery structure"
    for text in (contract, prompt, model):
        assert definition in normalized(text)

    assert "Impact, breakdown or PR graph" in skill
    assert "The steps to implement and verify the change" not in skill


def test_breakdown_and_implementation_plans_have_distinct_graphs() -> None:
    contract = read("docs/artifact-contracts.md")
    prompt = read("prompts/plan-create.prompt.md")
    review = read("prompts/plan-review.prompt.md")

    assert "Breakdown plan" in contract
    assert "independently useful child outcomes" in contract
    assert "Implementation plan" in contract
    assert "graph of reviewable PRs" in contract
    assert "one-PR change is a valid graph with one node" in contract
    assert "one cohesive PR is a valid one-node graph" in prompt
    assert "A one-PR plan is a one-node graph" in normalized(review)
    assert "does not authorize code" in normalized(prompt)


def test_plans_include_proportionate_impact_and_delivery_topology() -> None:
    contract = read("docs/artifact-contracts.md")
    prompt = read("prompts/plan-create.prompt.md")
    review = read("prompts/plan-review.prompt.md")

    for surface in (
        "modules",
        "files",
        "APIs",
        "database schemas or migrations",
        "tests",
        "configuration",
        "build/deployment",
        "observability",
        "documentation",
    ):
        assert surface in contract

    assert "added, changed, removed, or deliberately untouched" in contract
    assert "affected consumers, owners, compatibility concerns" in contract
    assert "dependency graph, merge/delivery order, parallel paths" in contract
    assert "Do not use LOC estimates" in prompt
    assert "Do not demand irrelevant entries" in review


def test_impact_precedes_reuse_and_one_node_plans_avoid_empty_topology() -> None:
    contract = read("docs/artifact-contracts.md")
    prompt = read("prompts/plan-create.prompt.md")
    review = read("prompts/plan-review.prompt.md")

    assert contract.index("1. **Impact Map**") < contract.index("2. **Baseline Reuse**")
    assert prompt.index("`## Impact Map`") < prompt.index("`## Baseline Reuse`")
    assert "omits empty topology fields" in prompt
    assert "when there is more than one PR" in normalized(prompt)
    assert "omits empty topology fields" in review
    assert "When there is more than one PR" in normalized(review)


def test_process_views_show_both_plan_shapes() -> None:
    guide = read("docs/sarathi.html")
    image_prompt = read("docs/sarathi-process-diagram-prompt.md")

    assert "How will delivery be structured?" in guide
    assert "Breakdown child outcomes or Implementation PR graph" in guide
    assert "What is the next safe increment?" not in guide
    assert '"PLAN — STRUCTURE THE DELIVERY"' in image_prompt
    assert '"Breakdown: child outcomes + dependencies"' in image_prompt
    assert '"Implementation: PR graph + sequence"' in image_prompt
    assert '"PLAN — NEXT SAFE INCREMENT"' not in image_prompt
