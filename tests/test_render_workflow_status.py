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
    }
    assert "Not yet done" in rendered
    assert "No valid decomposition discovered" in rendered
    assert "Feedback not recorded" in rendered
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
Learning Target: validate the public API boundary before expanding the next capability
Feedback Target: API consumer and sandbox response evidence
Feedback Status: requested
Feedback Evidence: docs/reviews/api-boundary.md
Active Learning Wave: WAVE-DEMO-FIRST
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


def test_decomposition_expands_into_child_plan_prs_and_evidence(tmp_path):
    module = load_renderer()
    project = make_decomposed_project(tmp_path)

    model = module.build_model(project)

    assert model["summary"] == {
        "approved_stages": 3,
        "work_items": 2,
        "malformed_work_items": 0,
        "expanded_items": 1,
        "pr_slices": 2,
        "evidenced_prs": 2,
        "assessed_items": 0,
        "completed_items": 0,
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
        "active_wave": "WAVE-DEMO-FIRST",
        "wip_limit": "2",
        "active_slices": "PR-ALPHA-TWO",
        "invalidation_result": "pending feedback",
        "ancestor_impact": ("feedback-required: wait before expanding WORK-DEMO-BETA"),
        "stop_or_replan": ("stop sibling work if the public request shape changes"),
    }
    assert module.explicit_focus_item(model["work_items"], model["wip"])["id"] == (
        "WORK-DEMO-ALPHA"
    )
    assert beta["state"] == "frontier"
    assert beta["child_level"] == "feature"
    assert beta["child_plan"] is None


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
    assert "Demo Alpha is completed" in rendered
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
    assert "Demo Alpha is assessed" in rendered
    assert "Assessed" in rendered
    assert "Assessed learning" in rendered
    assert "Feedback received" in rendered
    assert "revision-proposed: record observed retry timing" in rendered


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
    assert "Not recorded in assessment" in rendered


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
    assert "Executive summary" in first
    assert "Demo Alpha is in progress" in first
    assert "Product/system &rarr; Breakdown plan &rarr; WORK-DEMO-ALPHA" in first
    assert 'aria-label="Current learning loop"' in first
    assert "validate the public API boundary" in first
    assert "Feedback requested" in first
    assert "WAVE-DEMO-FIRST" in first
    assert "PR-ALPHA-TWO" in first
    assert '<details class="learning-details" open>' in first
    assert "Explicit feedback is required before affected work continues." in first
    assert "Workflow tree" in first
    assert re.search(
        r'<details class="tree-branch" data-state="evidence"[^>]* open>', first
    )
    assert re.search(r'<details class="tree-branch" data-state="frontier"[^>]*>', first)
    assert not re.search(
        r'<details class="tree-branch" data-state="frontier"[^>]* open>', first
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
    assert "1 malformed WORK allocation excluded from valid counts" in rendered
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
