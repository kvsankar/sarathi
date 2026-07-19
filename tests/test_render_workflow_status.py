import hashlib
import importlib.util
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "checkers" / "render_workflow_status.py"


def load_renderer():
    spec = importlib.util.spec_from_file_location("render_workflow_status", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def write(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def spec_text(title: str = "Example Service") -> str:
    return f"""# {title} - Software Requirements Specification

## Mission Statement

Work Scope: product/system

Implementation Readiness: Decomposable
"""


def test_renderer_parses_hidden_work_and_pr_ids_with_descriptive_names():
    module = load_renderer()
    plan = """# Human-first plan

## Pull Requests / Child Work Items

### First runnable slice
<!-- sarathi:delivery id="WORK-DEMO-ALPHA" -->
Scope: establish the first runnable slice.

### Compatibility adapter
<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->
Scope: route password operations through the adapter.
"""

    items, malformed = module.work_items(plan)
    prs = module.plan_prs(plan, {"PR-AUTH-COMPAT": 2})

    assert malformed == []
    assert items[0]["id"] == "WORK-DEMO-ALPHA"
    assert items[0]["name"] == "First runnable slice"
    assert items[0]["scope"] == "establish the first runnable slice."
    assert prs == [
        {
            "id": "PR-AUTH-COMPAT",
            "name": "Compatibility adapter",
            "evidence_count": 2,
        }
    ]


def test_renderer_accepts_plain_wip_field_names(tmp_path):
    module = load_renderer()
    write(
        tmp_path / ".sdlc" / "wip.md",
        """# SDLC Work In Progress
Current Stage: code-create
Review Level: Standard
Extra Checks: documentation

## Results And Feedback
Expected Result: Confirm the public behavior.
Feedback From: API consumer
Feedback Status: requested
Feedback Evidence: docs/review.md
Current Work Group: WAVE-DEMO-NEXT
Current Work: WORK-DEMO-ALPHA
Parallel Limit: 1
What Changed: Nothing yet.
Documents To Update: none
Stop Conditions: Stop if the API changes.
""",
    )

    result = module.parse_wip(tmp_path)

    assert result["Review Level"] == "Standard"
    assert result["Extra Checks"] == "documentation"
    assert result["learning"]["target"] == "Confirm the public behavior."
    assert result["learning"]["active_work_item"] == "WORK-DEMO-ALPHA"
    assert result["learning"]["stop_or_replan"] == "Stop if the API changes."


def test_renderer_parses_table_only_delivery_definitions():
    module = load_renderer()
    plan = """# Human-first plan

## Pull Requests / Child Work Items

The delivery details use descriptive headings.

## Traceability

| Machine ID | Human delivery item | Evidence |
| --- | --- | --- |
| WORK-DEMO-ALPHA | First runnable slice | acceptance evidence |
| PR-AUTH-COMPAT | Compatibility adapter | compatibility tests |
"""

    items, malformed = module.work_items(plan)
    prs = module.plan_prs(plan, {"PR-AUTH-COMPAT": 1})

    assert malformed == []
    assert [(item["id"], item["name"]) for item in items] == [
        ("WORK-DEMO-ALPHA", "First runnable slice")
    ]
    assert prs == [
        {
            "id": "PR-AUTH-COMPAT",
            "name": "Compatibility adapter",
            "evidence_count": 1,
        }
    ]


def test_spec_only_leaves_downstream_stages_visibly_empty(tmp_path):
    module = load_renderer()
    project = tmp_path / "example"
    write(project / "docs" / "spec.md", spec_text())

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert model["stages"]["spec"]["state"] == "unapproved"
    assert model["stages"]["design"]["state"] == "missing"
    assert model["stages"]["plan"]["state"] == "missing"
    assert model["summary"] == {
        "approved_stages": 0,
        "work_items": 0,
        "malformed_work_items": 0,
        "expanded_items": 0,
        "pr_slices": 0,
        "evidenced_prs": 0,
        "assessed_items": 0,
        "completed_items": 0,
        "learning_waves": 0,
        "completed_waves": 0,
        "active_waves": 0,
    }
    assert "Not yet done" in rendered
    assert "No child work planned" in rendered
    assert "Not recorded" in rendered
    assert 'href="sarathi-process.html">Process guide</a>' in rendered
    parser = HTMLParser()
    parser.feed(rendered)
    parser.close()


def make_decomposed_project(tmp_path: Path) -> Path:
    project = tmp_path / "demo"
    spec = write(project / "docs" / "spec.md", spec_text())
    design = write(
        project / "docs" / "design.md",
        """# Example Service - Software Design Document

## Overview

Work Scope: product/system

Design Depth: HLD

Implementation Readiness: Decomposable
""",
    )
    plan = write(
        project / "docs" / "plan.md",
        """# Example Service Work Plan

## Overview

Work Scope: product/system

Plan Type: Breakdown

Implementation Readiness: Decomposable

## Pull Requests / Child Work Items

- WORK-DEMO-ALPHA

  Parent scope: product/system.

  Child scope: slice/change.

  Scope: establish the first runnable slice.

  Parent IDs / inherited obligations: FR-ALPHA and TEST-ALPHA.

  Required child artifacts: slice spec, LLD, and implementation plan.

  Dependencies: approved spec and design only.

  Readiness target: Code-ready after exact files and tests are named.

  Risks: boundary behavior may still be unknown.

  Done signal: the public behavior has executable evidence.

  Learning target: prove the first runnable slice at the real boundary.

  Feedback target: API consumer and sandbox response evidence.

  Feedback method: review the generated contract examples and sandbox trace.

  Invalidation question: does the boundary reject the planned request shape?

  Dependency types: execution: none; learning: none; integration: shared API contract.

  Learning wave: WAVE-DEMO-FIRST.

  Stop/replan trigger: stop sibling work if the public request shape changes.

- WORK-DEMO-BETA

  Parent scope: product/system.

  Child scope: feature/component.

  Scope: add the second capability.

  Parent IDs / inherited obligations: FR-BETA and TEST-BETA.

  Required child artifacts: feature spec, design, and plan.

  Dependencies: WORK-DEMO-ALPHA.

  Readiness target: Code-ready after decomposition.

  Risks: integration details remain unknown.

  Done signal: acceptance evidence exists.

## Coverage Map
""",
    )
    child = write(
        project / "docs" / "plans" / "work_alpha.md",
        """# WORK-DEMO-ALPHA Implementation Plan

## Overview

Work Scope: slice/change

Plan Type: Implementation

Implementation Readiness: Code-ready

## Pull Requests / Child Work Items

- PR-ALPHA-ONE

- PR-ALPHA-TWO

## Learning Waves

### WAVE-DEMO-FIRST
Order: 1
Learning Target: Validate the public API boundary.
Members: PR-ALPHA-ONE
WIP Limit: 1
Feedback/Integration Checkpoint: Review the contract and consumer evidence.
Stop/Replan Triggers: Stop if the public request shape changes.

### WAVE-DEMO-NEXT
Order: 2
Learning Target: Exercise edge behavior after the boundary is accepted.
Members: PR-ALPHA-TWO
WIP Limit: 1
Feedback/Integration Checkpoint: Review regression and edge-case evidence.
Stop/Replan Triggers: Replan if Wave 1 changes the public contract.
""",
    )
    write(
        project / "docs" / "work" / "alpha" / "spec.md",
        """# Alpha Slice - Software Requirements Specification

Parent Work Item: WORK-DEMO-ALPHA

Work Scope: slice/change

Implementation Readiness: Code-ready
""",
    )
    write(
        project / "docs" / "work" / "alpha" / "design.md",
        """# Alpha Slice Design

Parent Work Item: WORK-DEMO-ALPHA

Work Scope: slice/change

Design Depth: LLD

Implementation Readiness: Code-ready
""",
    )
    approvals = f"""version: 1
approvals:
  - id: APR-SPEC
    gate: spec.approved
    scope: product/system
    artifact:
      kind: spec
      path: demo/docs/spec.md
      sha256: "{digest(spec)}"
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:00Z"
  - id: APR-DESIGN
    gate: design.approved
    scope: product/system
    artifact:
      kind: design
      path: demo/docs/design.md
      sha256: "{digest(design)}"
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:01Z"
  - id: APR-PLAN
    gate: plan.approved
    scope: product/system
    artifact:
      kind: plan
      path: demo/docs/plan.md
      sha256: "{digest(plan)}"
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:02Z"
  - id: APR-CHILD
    gate: plan.approved
    scope: slice/change
    artifact:
      kind: plan
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:03Z"
"""
    write(project / ".sdlc" / "approvals.yaml", approvals)
    write(
        project / ".sdlc" / "wip.md",
        """# SDLC Work In Progress

Current Stage: code-create
Current Gate: human-review
Delivery Profile: Standard
Assurance Modules: external integration, documentation
Learning Target: validate the public API boundary before expanding the next capability
Feedback Target: API consumer and sandbox response evidence
Feedback Status: requested
Feedback Evidence: docs/reviews/api-boundary.md
Active Learning Wave: WAVE-DEMO-NEXT
WIP Limit: 2
Active Slices: PR-ALPHA-TWO
Invalidation Result: pending feedback
Ancestor Impact: feedback-required: wait before expanding WORK-DEMO-BETA
Stop Or Replan Triggers: stop sibling work if the public request shape changes

## Current Artifacts

| Kind | Path | Status | Notes |
| --- | --- | --- | --- |
| Child plan | demo/docs/plans/work_alpha.md | approved and implemented | Done. |
""",
    )
    write(
        project / ".sdlc" / "test-traceability.yaml",
        """tests:
  - name: test_alpha_one
    path: tests/test_alpha.py
    plan: PR-ALPHA-ONE
  - name: test_alpha_two
    path: tests/test_alpha.py
    plan: PR-ALPHA-TWO
  - name: test_alpha_edge
    path: tests/test_alpha.py
    plan: PR-ALPHA-TWO
""",
    )
    write(project / "tests" / "test_alpha.py", "def test_placeholder():\n    pass\n")
    return project


def test_pr_sized_root_plan_renders_ordered_pr_waves(tmp_path):
    module = load_renderer()
    project = tmp_path / "leaf"
    write(
        project / "docs" / "spec.md",
        """# Leaf - Software Requirements Specification
Work Scope: slice/change
Implementation Readiness: Code-ready
""",
    )
    write(
        project / "docs" / "design.md",
        """# Leaf Design
Work Scope: slice/change
Design Depth: LLD
Implementation Readiness: Code-ready
""",
    )
    write(
        project / "docs" / "plan.md",
        """# Leaf Implementation Plan
Work Scope: slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready

## Pull Requests / Child Work Items
- PR-LEAF-BOUNDARY Scope: establish the boundary.
- PR-LEAF-FINISH Scope: finish the behavior.

## Learning Waves

### WAVE-LEAF-BOUNDARY
Order: 1
Learning Target: Validate the smallest runnable boundary.
Members: PR-LEAF-BOUNDARY
WIP Limit: 1
Feedback/Integration Checkpoint: Review boundary evidence.
Stop/Replan Triggers: Stop if the boundary changes.

### WAVE-LEAF-FINISH
Order: 2
Learning Target: Complete behavior after boundary feedback.
Members: PR-LEAF-FINISH
WIP Limit: 1
Feedback/Integration Checkpoint: Review acceptance evidence.
Stop/Replan Triggers: Replan if the first wave changes intent.
""",
    )
    write(
        project / ".sdlc" / "wip.md",
        """# SDLC Work In Progress
Current Stage: code-create
Current Gate: wave-checkpoint
Active Learning Wave: WAVE-LEAF-BOUNDARY
Active Slices: PR-LEAF-BOUNDARY
""",
    )
    write(
        project / ".sdlc" / "test-traceability.yaml",
        """tests:
  - name: test_leaf_boundary
    path: tests/test_leaf.py
    plan: PR-LEAF-BOUNDARY
""",
    )
    write(project / "tests" / "test_leaf.py", "def test_leaf():\n    assert True\n")

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )
    waves = model["learning_waves"]["sequences"][0]["waves"]

    assert model["work_items"] == []
    assert [pr["id"] for pr in model["root_prs"]] == [
        "PR-LEAF-BOUNDARY",
        "PR-LEAF-FINISH",
    ]
    assert model["summary"]["pr_slices"] == 2
    assert waves[0]["member_states"][0]["state"] == "in-progress"
    assert waves[1]["member_states"][0]["state"] == "not-started"
    assert "Product delivery plan" in rendered
    assert "Slice workflow" in rendered
    assert "No valid decomposition discovered" not in rendered
    assert "WAVE-LEAF-BOUNDARY" in rendered
    assert "PR-LEAF-FINISH" in rendered


def test_decomposition_expands_into_child_plan_prs_and_evidence(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)

    model = module.build_model(project)

    assert model["delivery"] == {
        "profile": "Standard",
        "modules": "external integration, documentation",
    }
    assert model["summary"] == {
        "approved_stages": 3,
        "work_items": 2,
        "malformed_work_items": 0,
        "expanded_items": 1,
        "pr_slices": 2,
        "evidenced_prs": 2,
        "assessed_items": 0,
        "completed_items": 0,
        "learning_waves": 2,
        "completed_waves": 0,
        "active_waves": 2,
    }
    alpha, beta = model["work_items"]
    assert alpha["state"] == "evidence"
    assert alpha["parent_scope"] == "product/system."
    assert alpha["child_scope"] == "slice/change."
    assert alpha["parent_level"] == "product"
    assert alpha["child_level"] == "slice"
    assert alpha["parent_obligations"] == "FR-ALPHA and TEST-ALPHA."
    assert alpha["child_requirement"] == "slice spec, LLD, and implementation plan."
    assert alpha["child_spec"]["path"] == "docs/work/alpha/spec.md"
    assert alpha["child_design"]["path"] == "docs/work/alpha/design.md"
    assert alpha["child_plan"]["approval"]["state"] == "approved"
    assert alpha["evidence_count"] == 3
    assert alpha["wip_claim"]["status"] == "approved and implemented"
    assert alpha["learning_target"] == (
        "prove the first runnable slice at the real boundary."
    )
    assert alpha["learning_wave"] == "WAVE-DEMO-FIRST."
    assert alpha["stop_or_replan"] == (
        "stop sibling work if the public request shape changes."
    )
    assert model["wip"]["learning"] == {
        "target": (
            "validate the public API boundary before expanding the next capability"
        ),
        "feedback_target": "API consumer and sandbox response evidence",
        "feedback_status": "requested",
        "feedback_evidence": "docs/reviews/api-boundary.md",
        "active_wave": "WAVE-DEMO-NEXT",
        "wip_limit": "2",
        "active_slices": "PR-ALPHA-TWO",
        "invalidation_result": "pending feedback",
        "ancestor_impact": ("feedback-required: wait before expanding WORK-DEMO-BETA"),
        "stop_or_replan": ("stop sibling work if the public request shape changes"),
    }
    assert module.explicit_focus_item(model["work_items"], model["wip"])["id"] == (
        "WORK-DEMO-ALPHA"
    )
    sequence = model["learning_waves"]["sequences"][0]
    assert sequence["plan_path"] == "docs/plans/work_alpha.md"
    assert [wave["id"] for wave in sequence["waves"]] == [
        "WAVE-DEMO-FIRST",
        "WAVE-DEMO-NEXT",
    ]
    assert sequence["waves"][0]["member_states"] == [
        {
            "id": "PR-ALPHA-ONE",
            "state": "evidence",
            "detail": "1 mapped tests",
        }
    ]
    assert sequence["waves"][1]["active"] is True
    assert beta["state"] == "frontier"
    assert beta["child_level"] == "feature"
    assert beta["child_plan"] is None


def test_lean_change_record_replaces_child_spec_and_design_nodes(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    child.write_text(
        child.read_text(encoding="utf-8")
        + """
Delivery Profile: Lean
Lean Change Record: Yes
Why Lean: The boundary is local, reversible, and covered by existing fixtures.
Changed Behavior: Add one validation rule; do not change the public contract.
Parent IDs / inherited obligations: FR-ALPHA and TEST-ALPHA.
Acceptance & Verification: Focused validation and acceptance tests pass.
Escalate If: The public contract or stored data must change.
""",
        encoding="utf-8",
    )
    (project / "docs" / "work" / "alpha" / "spec.md").unlink()
    (project / "docs" / "work" / "alpha" / "design.md").unlink()

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    alpha = model["work_items"][0]
    assert alpha["child_spec"] is None
    assert alpha["child_design"] is None
    assert alpha["child_plan"]["metadata"]["Lean Change Record"] == "Yes"
    assert "Compact plan" in rendered
    assert "Slice spec" not in rendered


def test_inherited_intent_record_replaces_child_spec_and_design_nodes(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    child.write_text(
        child.read_text(encoding="utf-8")
        + "\nInherited Intent Record: Yes\nWhy Direct: accepted parent intent.\n",
        encoding="utf-8",
    )
    (project / "docs" / "work" / "alpha" / "spec.md").unlink()
    (project / "docs" / "work" / "alpha" / "design.md").unlink()

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert (
        model["work_items"][0]["child_plan"]["metadata"]["Inherited Intent Record"]
        == "Yes"
    )
    assert "Compact plan" in rendered
    assert "Slice spec" not in rendered


def test_stale_approval_is_distinct_from_missing_approval(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    spec = project / "docs" / "spec.md"
    spec.write_text(spec.read_text(encoding="utf-8") + "\nChanged.\n", encoding="utf-8")

    model = module.build_model(project)

    assert model["stages"]["spec"]["state"] == "stale"
    assert model["stages"]["design"]["state"] == "approved"


def test_hash_current_code_slice_approval_marks_work_completed(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    approvals = project / ".sdlc" / "approvals.yaml"
    approvals.write_text(
        approvals.read_text(encoding="utf-8")
        + f"""  - id: APR-CODE-DEMO-ALPHA
    gate: code_slice.approved
    scope: slice/change
    artifact:
      kind: plan
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    status: approved
    approved_by: tester
    approved_at: "2026-07-15T00:00:04Z"
""",
        encoding="utf-8",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert model["work_items"][0]["state"] == "completed"
    assert model["work_items"][0]["code_slice_approval"]["state"] == "approved"
    assert model["summary"]["completed_items"] == 1
    assert "WORK-DEMO-ALPHA" in rendered
    assert "Completed" in rendered


def test_hash_current_passing_code_assessment_marks_work_assessed(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    write(
        project / ".sdlc" / "code-assessments.yaml",
        f"""version: 1
assessments:
  - id: ASSESS-CODE-DEMO-ALPHA
    work_item: WORK-DEMO-ALPHA
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    verdict: Pass
    assessed_at: "2026-07-15T00:00:04Z"
    learning:
      target: Prove the API boundary with a consumer-visible example.
      feedback_target: API consumer review.
      feedback_status: received
      feedback_evidence: docs/reviews/api-boundary.md
      invalidation_result: The request-shape assumption held.
      ancestor_impact:
        spec: "no-change: accepted behavior remains correct"
        design: "revision-proposed: record observed retry timing"
        plan: "no-change: remaining work is unaffected"
      stop_or_replan: Stop if the provider contract changes.
""",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert model["work_items"][0]["state"] == "assessed"
    assert model["work_items"][0]["code_assessment"]["verdict"] == "Pass"
    assert model["work_items"][0]["code_assessment"]["learning"] == {
        "target": "Prove the API boundary with a consumer-visible example.",
        "feedback_target": "API consumer review.",
        "feedback_status": "received",
        "feedback_evidence": "docs/reviews/api-boundary.md",
        "invalidation_result": "The request-shape assumption held.",
        "ancestor_impact": (
            "design: revision-proposed: record observed retry timing; "
            "plan: no-change: remaining work is unaffected; "
            "spec: no-change: accepted behavior remains correct"
        ),
        "stop_or_replan": "Stop if the provider contract changes.",
    }
    assert model["summary"]["assessed_items"] == 1
    assert "WORK-DEMO-ALPHA" in rendered
    assert "Assessed" in rendered
    assert "What we learned" in rendered
    assert "Feedback received" in rendered
    assert "revision-proposed: record observed retry timing" in rendered


def test_hash_current_wave_checkpoint_closes_one_wave_only(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    write(
        project / ".sdlc" / "wave-checkpoints.yaml",
        f"""version: 1
checkpoints:
  - id: CHECK-WAVE-DEMO-FIRST
    wave: WAVE-DEMO-FIRST
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    members:
      - PR-ALPHA-ONE
    status: completed
    completed_at: "2026-07-15T00:00:04Z"
    learning:
      target: Validate the public API boundary.
      feedback_target: API consumer review.
      feedback_status: received
      feedback_evidence: docs/reviews/api-boundary.md
      invalidation_result: The request-shape assumption held.
      ancestor_impact:
        spec: "no-change: accepted behavior remains correct"
        design: "no-change: boundary design remains valid"
        plan: "no-change: Wave 2 may continue"
      stop_or_replan: Stop if the provider contract changes.
""",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )
    waves = model["learning_waves"]["sequences"][0]["waves"]

    assert model["work_items"][0]["state"] == "evidence"
    assert model["summary"]["completed_waves"] == 1
    assert model["summary"]["active_waves"] == 1
    assert waves[0]["state"] == "completed"
    assert waves[0]["member_states"][0]["state"] == "completed"
    assert waves[1]["state"] == "in-progress"
    assert 'class="waves-view"' not in rendered
    assert "Plan checks needing attention" not in rendered


def test_stale_wave_checkpoint_does_not_complete_wave(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    write(
        project / ".sdlc" / "wave-checkpoints.yaml",
        f"""version: 1
checkpoints:
  - id: CHECK-WAVE-DEMO-FIRST
    wave: WAVE-DEMO-FIRST
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{"0" * 64}"
    members:
      - PR-ALPHA-ONE
    status: completed
""",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert model["summary"]["completed_waves"] == 0
    assert "wave checkpoint plan hash is stale" in rendered


def test_malformed_wave_declaration_stays_visible_for_repair(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    child.write_text(
        child.read_text(encoding="utf-8").replace("WAVE-DEMO-FIRST", "WAVE-FIRST"),
        encoding="utf-8",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert model["summary"]["learning_waves"] == 1
    assert model["learning_waves"]["issues"][0]["message"] == (
        "malformed wave IDs: WAVE-FIRST"
    )
    assert "Plan checks needing attention" in rendered
    assert "WAVE-FIRST" in rendered


def test_legacy_passing_assessment_without_learning_remains_valid(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    write(
        project / ".sdlc" / "code-assessments.yaml",
        f"""version: 1
assessments:
  - id: ASSESS-CODE-DEMO-LEGACY
    work_item: WORK-DEMO-ALPHA
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    verdict: Pass
""",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert model["work_items"][0]["state"] == "assessed"
    assert model["work_items"][0]["code_assessment"]["learning"] == {}
    assert "Not recorded" in rendered


def test_stale_code_assessment_remains_evidence(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    write(
        project / ".sdlc" / "code-assessments.yaml",
        f"""version: 1
assessments:
  - id: ASSESS-CODE-DEMO-STALE
    work_item: WORK-DEMO-ALPHA
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{"0" * 64}"
    verdict: Pass
""",
    )

    model = module.build_model(project)

    assert model["work_items"][0]["state"] == "evidence"
    assert model["work_items"][0]["code_assessment"] is None
    assert model["summary"]["assessed_items"] == 0


def test_latest_nonpassing_assessment_supersedes_earlier_pass(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    child = project / "docs" / "plans" / "work_alpha.md"
    write(
        project / ".sdlc" / "code-assessments.yaml",
        f"""version: 1
assessments:
  - id: ASSESS-CODE-DEMO-PASS
    work_item: WORK-DEMO-ALPHA
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    verdict: Pass
  - id: ASSESS-CODE-DEMO-FIXES
    work_item: WORK-DEMO-ALPHA
    plan:
      path: demo/docs/plans/work_alpha.md
      sha256: "{digest(child)}"
    verdict: Pass-with-fixes
""",
    )

    model = module.build_model(project)

    assert model["work_items"][0]["state"] == "evidence"
    assert model["work_items"][0]["code_assessment"] is None


def test_output_is_deterministic_escaped_and_checkable(tmp_path, monkeypatch):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    spec = project / "docs" / "spec.md"
    spec.write_text(spec_text("Example <script>"), encoding="utf-8")
    output = project / "docs" / "sdlc-status.html"

    first_model = module.build_model(project)
    second_model = module.build_model(project)
    first = module.render_html(first_model, project, output, module.GUIDE_FILENAME)
    second = module.render_html(second_model, project, output, module.GUIDE_FILENAME)

    assert first.encode() == second.encode()
    assert "<script> - Sarathi" not in first
    assert "Example &lt;script&gt;" in first
    assert "Delivery progress" in first
    assert "Product delivery plan" in first
    assert "WORK-DEMO-ALPHA" in first
    assert 'aria-label="Workflow details"' in first
    assert "validate the public API boundary" in first
    assert "WAVE-DEMO-FIRST" in first
    assert "WAVE-DEMO-NEXT" in first
    assert "Wave 1" in first
    assert "Implementation PRs" in first
    assert "PR-ALPHA-ONE" in first
    assert "PR-ALPHA-TWO" in first
    assert '<dialog id="approval-details"' in first
    assert 'id="approval-details-trigger"' in first
    assert "APR-SPEC covers an earlier version" in first
    assert "review the current document and approve this version" in first
    assert 'class="operational-details"' not in first
    assert "Workflow and learning details" not in first
    assert ">Work</h2>" in first
    assert "mapped test" in first
    assert "Evidence mapped" in first
    assert 'class="waves-view"' not in first
    assert re.search(
        r'<details class="tree-branch"[^>]*data-state="evidence"[^>]* open>', first
    )
    assert re.search(
        r'<details class="tree-branch"[^>]*data-state="frontier"[^>]*>', first
    )
    assert not re.search(
        r'<details class="tree-branch"[^>]*data-state="frontier"[^>]* open>', first
    )
    assert "Current focus" in first
    assert "Expand all" in first
    assert "Collapse all" in first
    assert 'class="status status-success"' in first
    assert 'class="status status-progress"' in first
    assert 'class="status status-pending"' in first
    assert "No child spec discovered" in first
    assert "Code + executable tests" in first

    monkeypatch.setattr(
        sys, "argv", [str(SCRIPT), str(project), "--output", str(output)]
    )
    assert module.main() == 0
    expected = output.read_bytes()
    guide = output.with_name(module.GUIDE_FILENAME)
    expected_guide = (
        (ROOT / "docs" / "sarathi.html")
        .read_text(encoding="utf-8")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .encode("utf-8")
    )
    assert guide.read_bytes() == expected_guide
    assert b"\r" not in guide.read_bytes()
    assert b'href="sdlc-status.html"' in guide.read_bytes()
    monkeypatch.setattr(
        sys,
        "argv",
        [str(SCRIPT), str(project), "--output", str(output), "--check"],
    )
    assert module.main() == 0
    output.write_text("stale\n", encoding="utf-8")
    assert module.main() == 1
    assert output.read_bytes() != expected


def test_malformed_work_allocation_is_visible_but_excluded(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    plan = project / "docs" / "plan.md"
    plan.write_text(
        plan.read_text(encoding="utf-8").replace("WORK-DEMO-BETA", "WORK-SHARING"),
        encoding="utf-8",
    )

    model = module.build_model(project)
    rendered = module.render_html(
        model,
        project,
        project / "docs" / "sdlc-status.html",
        module.GUIDE_FILENAME,
    )

    assert [item["id"] for item in model["work_items"]] == ["WORK-DEMO-ALPHA"]
    assert model["malformed_allocations"] == ["WORK-SHARING"]
    assert model["summary"]["work_items"] == 1
    assert model["summary"]["malformed_work_items"] == 1
    assert "1 invalid work item excluded from the totals" in rendered
    assert "WORK-SHARING" in rendered
    assert "Use <code>WORK-AREA-NAME</code>" in rendered


def test_check_detects_stale_static_process_guide(tmp_path, monkeypatch):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    output = project / "docs" / "sdlc-status.html"
    argv = [str(SCRIPT), str(project), "--output", str(output)]

    monkeypatch.setattr(sys, "argv", argv)
    assert module.main() == 0
    guide = output.with_name(module.GUIDE_FILENAME)
    guide.write_text("stale\n", encoding="utf-8")

    monkeypatch.setattr(sys, "argv", [*argv, "--check"])
    assert module.main() == 1


def test_missing_static_process_guide_is_an_error(tmp_path, monkeypatch):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)
    output = project / "docs" / "sdlc-status.html"

    monkeypatch.setattr(module, "default_guide_source", lambda: None)
    monkeypatch.setattr(
        sys, "argv", [str(SCRIPT), str(project), "--output", str(output)]
    )

    assert module.main() == 2
    assert not output.exists()
