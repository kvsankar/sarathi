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
    source_body: str | None = None,
    approvals_body: str | None = None,
    extra_args: list[str] | None = None,
    src_inputs: list[Path] | None = None,
    test_inputs: list[Path] | None = None,
):
    plan = tmp_path / "plan.md"
    design = tmp_path / "design.md"
    tests = tmp_path / "tests"
    src = tmp_path / "src"
    tests.mkdir(exist_ok=True)
    src.mkdir(exist_ok=True)
    plan.write_text("- PR-AUTH-SIGNIN\n- AT-AUTH-RESET\n", encoding="utf-8")
    design.write_text("", encoding="utf-8")
    (tests / "test_auth.py").write_text(test_body, encoding="utf-8")
    if source_body is not None:
        (src / "app.py").write_text(source_body, encoding="utf-8")
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
            *[
                item
                for path in (test_inputs or [tests])
                for item in ("--tests-dir", str(path))
            ],
            *[item for path in (src_inputs or [src]) for item in ("--src", str(path))],
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
        "source_process_ids_absent": True,
        "scan_inputs_valid": True,
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


def test_check_code_reports_markers_without_blocking(tmp_path, monkeypatch, capsys):
    test_body = "def test_auth():\n    assert True  # TODO remove fixture shortcut\n"
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_body=test_body,
    )

    assert rc == 0
    assert report["code_markers"][0]["marker"] == "TODO"
    assert report["marker_hits"] == 1


def test_check_code_reports_skips_and_expected_failures_without_blocking(
    tmp_path, monkeypatch, capsys
):
    test_body = """import pytest

@pytest.mark.skip
def test_auth():
    pass

@pytest.mark.skipif(True, reason="different environment")
def test_environment_boundary():
    pass

@pytest.mark.xfail(reason="known upstream behavior")
def test_expected_failure():
    pass
"""
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_body=test_body,
    )

    assert rc == 0
    assert "skipped_tests_absent" not in report["gates"]
    assert {hit["marker"] for hit in report["test_skip_markers"]} == {
        "SKIP",
        "SKIPIF",
        "XFAIL",
    }


def test_check_code_allows_an_ordinary_production_skip_method(
    tmp_path, monkeypatch, capsys
):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        source_body="def skip(item):\n    return item\n",
    )

    assert rc == 0
    assert report["test_skip_markers"] == []


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


def test_check_code_detects_only_canonical_process_ids(tmp_path, monkeypatch, capsys):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        source_body="""values = {
    "client_id": "test-client-id",
    "client_secret": "test-client-secret",
    "state": "test-state-token",
}
# FR-AUTH-LOGIN TEST-AUTH-SESSION COMP-AUTH
""",
        test_body="""def test_state_token_is_preserved():
    assert True

def test_client_id_is_sent():
    assert True
""",
    )

    assert rc == 1
    assert {hit["identifier"] for hit in report["process_id_hits"]} == {
        "COMP-AUTH",
        "FR-AUTH-LOGIN",
        "TEST-AUTH-SESSION",
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
            "def test_replayed_reset_token_cannot_change_password():\n"
            "    assert True\n\n"
            "def test_pr_creation_succeeds():\n"
            "    assert True\n\n"
            "def test_test_state_token_is_preserved():\n"
            "    assert True\n"
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


def test_check_code_scans_a_supplied_test_file(tmp_path, monkeypatch, capsys):
    supplied_test = tmp_path / "test_environment.py"
    supplied_test.write_text(
        'import pytest\n\ndef test_boundary():\n    pytest.skip("PostgreSQL only")\n',
        encoding="utf-8",
    )

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        test_inputs=[supplied_test],
    )

    assert rc == 0
    assert report["test_skip_markers"][0]["path"] == "test_environment.py"


def test_check_code_scans_a_supplied_directory_recursively(
    tmp_path, monkeypatch, capsys
):
    source_root = tmp_path / "bounded"
    nested = source_root / "nested" / "auth.py"
    nested.parent.mkdir(parents=True)
    nested.write_text("# FR-AUTH-LOGIN\n", encoding="utf-8")

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        src_inputs=[source_root],
    )

    assert rc == 1
    assert report["process_id_hits"][0]["path"] == "bounded/nested/auth.py"


def test_check_code_scans_all_repeated_inputs(tmp_path, monkeypatch, capsys):
    first = tmp_path / "first.py"
    second = tmp_path / "second.py"
    first.write_text("# FR-AUTH-LOGIN\n", encoding="utf-8")
    second.write_text("# TEST-AUTH-SESSION\n", encoding="utf-8")

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        src_inputs=[first, second],
    )

    assert rc == 1
    assert {hit["path"] for hit in report["process_id_hits"]} == {
        "first.py",
        "second.py",
    }


def test_check_code_reports_missing_and_invalid_scan_inputs(
    tmp_path, monkeypatch, capsys
):
    unsupported = tmp_path / "source.txt"
    unsupported.write_text("FR-AUTH-LOGIN\n", encoding="utf-8")

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "pass"],
        monkeypatch,
        capsys,
        src_inputs=[tmp_path / "missing.py", unsupported],
    )

    assert rc == 1
    assert report["gates"]["scan_inputs_valid"] is False
    assert report["scan_input_issues"] == [
        {"path": "missing.py", "reason": "does not exist"},
        {"path": "source.txt", "reason": "unsupported source extension .txt"},
    ]
