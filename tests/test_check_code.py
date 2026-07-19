import hashlib
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECK_CODE = ROOT / "checkers" / "check_code.py"


def load_check_code():
    spec = importlib.util.spec_from_file_location("check_code", CHECK_CODE)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def run_check_code(
    tmp_path: Path,
    test_argv: list[str],
    monkeypatch,
    capsys,
    *,
    test_body: str = "def test_auth():\n    assert True\n",
    approvals_body: str | None = None,
    extra_args: list[str] | None = None,
):
    plan = tmp_path / "plan.md"
    design = tmp_path / "design.md"
    tests = tmp_path / "tests"
    src = tmp_path / "src"
    tests.mkdir(exist_ok=True)
    src.mkdir(exist_ok=True)
    plan.write_text("- PR-AUTH-SIGNIN\n", encoding="utf-8")
    design.write_text("", encoding="utf-8")
    (tests / "test_auth.py").write_text(test_body, encoding="utf-8")
    if approvals_body is not None:
        sdlc = tmp_path / ".sdlc"
        sdlc.mkdir(exist_ok=True)
        (sdlc / "approvals.yaml").write_text(approvals_body, encoding="utf-8")
    module = load_check_code()
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            str(CHECK_CODE),
            "--plan",
            str(plan),
            "--design",
            str(design),
            "--tests-dir",
            str(tests),
            "--src",
            str(src),
            "--tests-argv",
            json.dumps(test_argv),
            "--json",
            *(extra_args or []),
        ],
    )
    return module.main(), json.loads(capsys.readouterr().out)


def test_check_code_records_a_passing_verification_command(
    tmp_path, monkeypatch, capsys
):
    rc, report = run_check_code(
        tmp_path, [sys.executable, "-c", "print('tests passed')"], monkeypatch, capsys
    )

    assert rc == 0
    assert report["verification_command_passed"] is True
    assert report["verification_command_exit"] == 0
    assert report["gates"] == {
        "verification_command_passed": True,
        "markers_approved": True,
        "source_process_ids_absent": True,
    }


def test_check_code_fails_when_the_verification_command_fails(
    tmp_path, monkeypatch, capsys
):
    rc, report = run_check_code(
        tmp_path, [sys.executable, "-c", "raise SystemExit(3)"], monkeypatch, capsys
    )

    assert rc == 1
    assert report["verification_command_passed"] is False
    assert report["verification_command_exit"] == 3


def test_check_code_requires_plan_approval_only_when_requested(
    tmp_path, monkeypatch, capsys
):
    command = [sys.executable, "-c", "pass"]
    rc, report = run_check_code(
        tmp_path, command, monkeypatch, capsys, extra_args=["--require-approvals"]
    )
    assert rc == 1
    assert report["gates"]["required_approvals_present"] is False

    plan_hash = hashlib.sha256((tmp_path / "plan.md").read_bytes()).hexdigest()
    approvals = f"""version: 1
approvals:
  - id: APR-PLAN
    gate: plan.approved
    scope: slice/change
    artifact:
      kind: plan
      path: plan.md
      sha256: {plan_hash}
    status: approved
    approved_by: Test User
    approved_at: "2026-07-01T12:00:00Z"
"""
    rc, report = run_check_code(
        tmp_path,
        command,
        monkeypatch,
        capsys,
        approvals_body=approvals,
        extra_args=["--require-approvals"],
    )
    assert rc == 0
    assert report["gates"]["required_approvals_present"] is True


def test_check_code_surfaces_markers_for_explicit_approval(
    tmp_path, monkeypatch, capsys
):
    test_body = "def test_auth():\n    assert True  # TODO remove fixture shortcut\n"
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_body=test_body,
    )

    assert rc == 1
    assert report["code_markers"][0]["marker"] == "TODO"
    assert report["gates"]["markers_approved"] is False


def test_check_code_accepts_a_current_marker_approval(tmp_path, monkeypatch, capsys):
    test_body = "def test_auth():\n    assert True  # TODO remove fixture shortcut\n"
    marker_inventory = [
        {
            "path": "tests/test_auth.py",
            "line": 2,
            "marker": "TODO",
            "text": "assert True  # TODO remove fixture shortcut",
        }
    ]
    marker_hash = load_check_code().marker_inventory_hash(marker_inventory)
    approvals = f"""version: 1
approvals:
  - id: APR-MARKERS
    gate: code.markers.approved
    scope: slice/change
    artifact:
      kind: marker-inventory
      path: code-marker-inventory
      sha256: {marker_hash}
    status: approved
    approved_by: Test User
    approved_at: "2026-07-01T12:00:00Z"
"""
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_body=test_body,
        approvals_body=approvals,
    )
    assert rc == 0
    assert report["gates"]["markers_approved"] is True


def test_check_code_rejects_process_ids_in_source_and_tests(
    tmp_path, monkeypatch, capsys
):
    test_body = """def test_at_auth_reset_replay():
    assert True  # Covers FR-AUTH-RESET
"""

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_body=test_body,
    )

    assert rc == 1
    assert report["gates"]["source_process_ids_absent"] is False
    assert {hit["identifier"] for hit in report["process_id_hits"]} == {
        "AT-AUTH-RESET",
        "FR-AUTH-RESET",
    }


def test_check_code_accepts_behavioral_test_names_without_process_ids(
    tmp_path, monkeypatch, capsys
):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_body=(
            "def test_replayed_reset_token_cannot_change_password():\n    assert True\n"
        ),
    )

    assert rc == 0
    assert report["gates"]["source_process_ids_absent"] is True
    assert report["process_id_hits"] == []


def test_check_code_can_exclude_an_explicit_generated_traceability_artifact(
    tmp_path, monkeypatch, capsys
):
    generated = tmp_path / "src" / "generated_traceability.py"
    generated.parent.mkdir()
    generated.write_text(
        'mapping = {"FR-AUTH-RESET": "test_reset"}\n', encoding="utf-8"
    )

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        extra_args=["--generated-traceability-path", str(generated)],
    )

    assert rc == 0
    assert report["process_id_hits"] == []
    assert report["generated_traceability_paths"] == ["src/generated_traceability.py"]


def test_check_code_scans_common_non_python_source_by_default(
    tmp_path, monkeypatch, capsys
):
    go_source = tmp_path / "src" / "service.go"
    go_source.parent.mkdir()
    go_source.write_text(
        "package service\n\n// Covers FR-AUTH-RESET\n", encoding="utf-8"
    )

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
    )

    assert rc == 1
    assert report["process_id_hits"][0]["path"] == "src/service.go"
    assert report["process_id_hits"][0]["identifier"] == "FR-AUTH-RESET"
