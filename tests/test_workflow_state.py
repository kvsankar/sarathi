import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKERS = ROOT / "checkers"


def load_validator():
    if str(CHECKERS) not in sys.path:
        sys.path.insert(0, str(CHECKERS))
    path = CHECKERS / "workflow_state.py"
    spec = importlib.util.spec_from_file_location("workflow_state", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def test_missing_optional_workflow_state_is_valid(tmp_path):
    module = load_validator()

    assert module.validate_workflow_state(tmp_path) == []


def test_canonical_and_legacy_machine_values_are_valid(tmp_path):
    module = load_validator()
    write(
        tmp_path / ".sdlc" / "wip.md",
        """# Current work
Status Result: Ready after minor fixes
Work Scope: slice/change
Current Command: code-create
Ready To Implement: Yes
Feedback Status: requested
Current Work Group: WAVE-AUTH-BOUNDARY
Current Work: WORK-AUTH-SIGNIN
Parallel Limit: 2
Active Slices: PR-AUTH-CODE, PR-AUTH-TESTS

Delivery Profile: Standard
Assurance Modules: Security
""",
    )
    write(
        tmp_path / ".sdlc" / "process-decisions.yaml",
        """project_entry:
  mode: brownfield_delta_only
  scope: feature/component
delivery:
  assurance_profile: standard
  work_outcome: product_increment
  extra_checks: [security, accessibility]
approval:
  policy: human_checkpoints
  authorization: explicit_user_choice
bootstrap:
  status: injected
""",
    )

    assert module.validate_workflow_state(tmp_path) == []


def test_invalid_machine_values_report_file_field_value_and_reason(tmp_path):
    module = load_validator()
    write(
        tmp_path / ".sdlc" / "wip.md",
        """# Current work
Status Result: Mostly ready
Current Command: coding
Feedback Status: waiting
Current Work: WORK-1
Parallel Limit: 0
""",
    )
    write(
        tmp_path / ".sdlc" / "process-decisions.yaml",
        """delivery:
  assurance_profile: stanard
  extra_checks: security
approval:
  policy: sometimes_automatic
""",
    )

    issues = module.validate_workflow_state(tmp_path)

    assert {item["field"] for item in issues} == {
        "Status Result",
        "Current Command",
        "Feedback Status",
        "Current Work",
        "Parallel Limit",
        "delivery.assurance_profile",
        "delivery.extra_checks",
        "approval.policy",
    }
    assert all(item["path"].startswith(".sdlc/") for item in issues)
    assert all(item["value"] is not None for item in issues)
    assert all(item["reason"] for item in issues)
