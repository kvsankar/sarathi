import hashlib
import importlib.util
import json
import subprocess
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


def git(cwd: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def run_check_code(
    tmp_path: Path,
    test_argv: list[str],
    monkeypatch,
    capsys,
    test_body: str | None = None,
    spec_body: str | None = None,
    approvals_body: str | None = None,
    traceability_body: str | None = None,
    extra_args: list[str] | None = None,
):
    plan = tmp_path / "plan.md"
    spec = tmp_path / "spec.md"
    design = tmp_path / "design.md"
    tests = tmp_path / "tests"
    src = tmp_path / "src"
    tests.mkdir(exist_ok=True)
    src.mkdir(exist_ok=True)
    plan.write_text("- PR-AUTH-SIGNIN\n", encoding="utf-8", newline="\n")
    spec.write_text(
        spec_body or "- FR-AUTH-SIGNIN\n- AT-AUTH-SIGNIN\n", encoding="utf-8"
    )
    design.write_text("- COMP-AUTH\n- TEST-AUTH-POLICY\n", encoding="utf-8")
    sdlc = tmp_path / ".sdlc"
    sdlc.mkdir(exist_ok=True)
    if traceability_body is None:
        (sdlc / "test-traceability.yaml").write_text(
            """version: 1
tests:
  - name: test_auth
    path: tests/test_auth.py
    covers:
      - PR-AUTH-SIGNIN
      - FR-AUTH-SIGNIN
      - AT-AUTH-SIGNIN
      - COMP-AUTH
      - TEST-AUTH-POLICY
      - TEST-AUTH-CONTRACT
""",
            encoding="utf-8",
        )
    elif traceability_body:
        (sdlc / "test-traceability.yaml").write_text(
            traceability_body,
            encoding="utf-8",
        )
    (tests / "test_auth.py").write_text(
        test_body
        or (
            "def test_auth():\n    result = 'granted'\n    assert result == 'granted'\n"
        ),
        encoding="utf-8",
    )
    if approvals_body is not None:
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
            "--spec",
            str(spec),
            "--design",
            str(design),
            "--tests-dir",
            str(tests),
            "--src",
            str(src),
            "--tests-argv",
            json.dumps(test_argv),
            "--allow-missing-git-evidence",
            "--allow-missing-tdd-evidence",
            "--json",
            *(extra_args or []),
        ],
    )
    rc = module.main()
    return rc, json.loads(capsys.readouterr().out)


def test_extract_coverage_prefers_labeled_coverage_over_stray_percent():
    check_code = load_check_code()
    output = "100% [=====]\ncoverage: 42%\n98% faster\n"
    assert check_code.extract_coverage(output) == 42.0


def test_extract_coverage_prefers_total_line_over_later_percent():
    check_code = load_check_code()
    output = "Name Stmts Miss Cover\nTOTAL 10 0 100%\n98% faster\n"
    assert check_code.extract_coverage(output) == 100.0


def test_extract_coverage_reads_istanbul_all_files_row():
    check_code = load_check_code()
    output = """
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   85.71 |       50 |     100 |   85.71 |
-------------------|---------|----------|---------|---------|-------------------
"""
    assert check_code.extract_coverage(output) == 85.71


def test_check_code_default_coverage_threshold_is_80(tmp_path, monkeypatch, capsys):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
    )
    assert rc == 0, {
        "gates": report["gates"],
        "approval_requirements": report["approval_requirements"],
        "approval_ledger": report["approval_ledger"],
    }
    assert report["cov_min"] == 80.0
    assert report["coverage_pct"] == 80.0
    assert report["test_traceability"]["source"] == "external"


def test_check_code_rejects_unlabeled_percent_as_coverage(
    tmp_path, monkeypatch, capsys
):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('100% [progress]')"],
        monkeypatch,
        capsys,
    )
    assert rc == 1
    assert report["coverage_pct"] is None
    assert report["gates"]["coverage_ok"] is False


def test_check_code_rejects_id_only_weak_assertion(tmp_path, monkeypatch, capsys):
    weak_test = "def test_auth():\n    assert True\n"

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        weak_test,
    )

    assert rc == 1
    assert report["gates"]["id_assertion_traceability_100"] is False
    assert report["ids_without_nearby_assertion"] == [
        "AT-AUTH-SIGNIN",
        "COMP-AUTH",
        "FR-AUTH-SIGNIN",
        "TEST-AUTH-POLICY",
    ]


def test_check_code_rejects_numbered_ids_in_traceability(tmp_path, monkeypatch, capsys):
    numbered_test = (
        "def test_auth():\n    result = 'granted'\n    assert result == 'granted'\n"
    )
    numbered_traceability = """version: 1
tests:
  - name: test_auth
    covers: [PR-AUTH-10, FR-AUTH-10, AT-AUTH-10, JT-AUTH-10, COMP-AUTH, TEST-AUTH-10]
"""

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        numbered_test,
        traceability_body=numbered_traceability,
    )

    assert rc == 1
    assert report["gates"]["id_format_slug_only"] is False
    assert report["bad_id_format"] == [
        "AT-AUTH-10",
        "FR-AUTH-10",
        "JT-AUTH-10",
        "PR-AUTH-10",
        "TEST-AUTH-10",
    ]


def test_check_code_requires_journey_test_traceability(tmp_path, monkeypatch, capsys):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
    )
    assert rc == 0, {
        "gates": report["gates"],
        "approval_requirements": report["approval_requirements"],
        "approval_ledger": report["approval_ledger"],
    }

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        spec_body="- FR-AUTH-SIGNIN\n- AT-AUTH-SIGNIN\n- JT-AUTH-LOGIN\n",
    )

    assert rc == 1
    assert "JT-AUTH-LOGIN" in report["uncovered_ids"]
    assert "JT-AUTH-LOGIN" in report["ids_without_nearby_assertion"]


def test_check_code_requires_plan_approval_when_enabled(tmp_path, monkeypatch, capsys):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        extra_args=["--require-approvals"],
    )

    assert rc == 1
    assert report["gates"]["required_approvals_present"] is False
    assert report["approval_requirements"][0]["gate"] == "plan.approved"

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
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        approvals_body=approvals,
        extra_args=["--require-approvals"],
    )

    assert report["approval_requirements"][0]["issues"] == []
    assert report["gates"]["required_approvals_present"] is True
    assert rc == 0


def test_check_code_rejects_tautological_assertion(tmp_path, monkeypatch, capsys):
    weak_test = "def test_auth():\n    assert 1 == 1\n"

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        weak_test,
    )

    assert rc == 1
    assert report["gates"]["id_assertion_traceability_100"] is False


def test_check_code_rejects_symbolic_tautological_assertions(
    tmp_path, monkeypatch, capsys
):
    weak_test = "def test_auth():\n    x = 'granted'\n    assert x == x\n"

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        weak_test,
    )

    assert rc == 1
    assert report["gates"]["id_assertion_traceability_100"] is False


def test_check_code_rejects_non_negative_length_oracle(tmp_path, monkeypatch, capsys):
    weak_test = "def test_auth():\n    result = []\n    assert len(result) >= 0\n"

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        weak_test,
    )

    assert rc == 1
    assert report["gates"]["id_assertion_traceability_100"] is False


def test_check_code_rejects_neighbor_assertion_bleed(tmp_path, monkeypatch, capsys):
    neighbor_test = (
        "def test_real_behavior():\n"
        "    result = 'granted'\n"
        "    assert result == 'granted'\n\n"
        "def test_placeholder():\n"
        "    pass\n"
    )
    traceability = """version: 1
tests:
  - name: test_placeholder
    covers:
      - PR-AUTH-SIGNIN
      - FR-AUTH-SIGNIN
      - AT-AUTH-SIGNIN
      - COMP-AUTH
      - TEST-AUTH-POLICY
      - TEST-AUTH-CONTRACT
"""

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        neighbor_test,
        traceability_body=traceability,
    )

    assert rc == 1
    assert report["gates"]["id_assertion_traceability_100"] is False


def test_check_code_requires_external_traceability_by_default(
    tmp_path, monkeypatch, capsys
):
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
    )
    assert rc == 0

    (tmp_path / ".sdlc" / "test-traceability.yaml").unlink()
    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        test_body=(
            "def test_auth():\n"
            '    """Covers PR-AUTH-SIGNIN, FR-AUTH-SIGNIN, AT-AUTH-SIGNIN, '
            'COMP-AUTH, TEST-AUTH-POLICY."""\n'
            "    result = 'granted'\n"
            "    assert result == 'granted'\n"
        ),
        traceability_body="",
    )

    assert rc == 1
    assert report["test_traceability"]["source"] == "missing"
    assert report["gates"]["test_traceability_file_ok"] is False


def test_check_code_allows_inline_traceability_only_with_legacy_flag(
    tmp_path, monkeypatch, capsys
):
    inline_test = (
        "def test_auth():\n"
        '    """Covers PR-AUTH-SIGNIN, FR-AUTH-SIGNIN, AT-AUTH-SIGNIN, '
        'COMP-AUTH, TEST-AUTH-POLICY."""\n'
        "    result = 'granted'\n"
        "    assert result == 'granted'\n"
    )

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        test_body=inline_test,
        traceability_body="",
        extra_args=["--allow-inline-test-traceability"],
    )

    assert rc == 0
    assert report["test_traceability"]["source"] == "inline_legacy"


def test_check_code_reports_oversized_modules_as_advisory_by_default(
    tmp_path, monkeypatch, capsys
):
    source = tmp_path / "src" / "large.py"
    source.parent.mkdir(exist_ok=True)
    source.write_text("x = 1\nx = 2\n", encoding="utf-8")

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        extra_args=["--max-loc", "1"],
    )

    assert rc == 0
    assert report["module_size_enforced"] is False
    assert report["module_size_advisory"]["status"] == "review"
    assert str(source) in report["oversized_modules"]
    assert report["gates"]["module_size_ok"] is True


def test_check_code_enforces_oversized_modules_when_requested(
    tmp_path, monkeypatch, capsys
):
    source = tmp_path / "src" / "large.py"
    source.parent.mkdir(exist_ok=True)
    source.write_text("x = 1\nx = 2\n", encoding="utf-8")

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        extra_args=["--max-loc", "1", "--enforce-max-loc"],
    )

    assert rc == 1
    assert report["module_size_enforced"] is True
    assert report["gates"]["module_size_ok"] is False


def test_check_code_surfaces_markers_for_approval(tmp_path, monkeypatch, capsys):
    test_body = (
        "def test_auth():\n"
        "    result = 'granted'  # TODO remove fixture shortcut\n"
        "    assert result == 'granted'\n"
    )

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        test_body=test_body,
    )

    assert rc == 1
    assert report["code_markers"][0]["marker"] == "TODO"
    assert report["gates"]["markers_approved"] is False
    assert report["marker_approval_requirements"][0]["gate"] == (
        "code.markers.approved"
    )
    assert report["marker_approval_requirements"][0]["artifact"] == (
        "code-marker-inventory"
    )
    assert report["marker_inventory_sha256"]


def test_check_code_does_not_treat_plain_english_skip_as_marker(
    tmp_path, monkeypatch, capsys
):
    test_body = (
        "def test_auth():\n"
        "    # we skip blank lines in the parser fixture\n"
        "    result = 'granted'\n"
        "    assert result == 'granted'\n"
    )

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        test_body=test_body,
    )

    assert rc == 0
    assert report["code_markers"] == []


def test_check_code_accepts_approved_markers(tmp_path, monkeypatch, capsys):
    test_body = (
        "def test_auth():\n"
        "    result = 'granted'  # TODO remove fixture shortcut\n"
        "    assert result == 'granted'\n"
    )
    module = load_check_code()
    marker_inventory = [
        {
            "path": "tests/test_auth.py",
            "line": 2,
            "marker": "TODO",
            "text": "result = 'granted'  # TODO remove fixture shortcut",
        }
    ]
    marker_hash = module.marker_inventory_hash(marker_inventory)
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
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        test_body=test_body,
        approvals_body=approvals,
    )

    assert rc == 0
    assert report["gates"]["markers_approved"] is True
    assert report["marker_approval_requirements"][0]["issues"] == []


def test_check_code_rejects_stale_marker_inventory_approval(
    tmp_path, monkeypatch, capsys
):
    test_body = (
        "def test_auth():\n"
        "    result = 'granted'  # TODO remove fixture shortcut\n"
        "    assert result == 'granted'\n"
    )
    approvals = """version: 1
approvals:
  - id: APR-MARKERS
    gate: code.markers.approved
    scope: slice/change
    artifact:
      kind: marker-inventory
      path: code-marker-inventory
      sha256: 0000000000000000000000000000000000000000000000000000000000000000
    status: approved
    approved_by: Test User
    approved_at: "2026-07-01T12:00:00Z"
"""

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        test_body=test_body,
        approvals_body=approvals,
    )

    assert rc == 1
    assert report["gates"]["markers_approved"] is False
    assert report["marker_approval_requirements"][0]["issues"] == [
        "matching approval not found"
    ]


def test_check_code_rejects_double_only_external_boundary(
    tmp_path, monkeypatch, capsys
):
    traceability = """version: 1
tests:
  - name: test_auth
    path: tests/test_auth.py
    level: unit
    boundary: vendor-sdk
    uses_double: true
    covers:
      - PR-AUTH-SIGNIN
      - FR-AUTH-SIGNIN
      - AT-AUTH-SIGNIN
      - COMP-AUTH
      - TEST-AUTH-POLICY
"""

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        traceability_body=traceability,
    )

    assert rc == 1
    assert report["gates"]["external_doubles_tied_to_reality"] is False
    assert report["external_boundary_verification"]["double_only_boundaries"] == [
        "vendor-sdk"
    ]


def test_check_code_accepts_external_double_with_real_boundary_test(
    tmp_path, monkeypatch, capsys
):
    traceability = """version: 1
tests:
  - name: test_auth
    path: tests/test_auth.py
    level: unit
    boundary: vendor-sdk
    uses_double: true
    covers:
      - PR-AUTH-SIGNIN
      - FR-AUTH-SIGNIN
      - AT-AUTH-SIGNIN
      - COMP-AUTH
      - TEST-AUTH-POLICY
  - name: test_auth
    path: tests/test_auth.py
    level: integration
    boundary: vendor-sdk
    real_boundary: true
    covers:
      - PR-AUTH-SIGNIN
      - TEST-AUTH-POLICY
"""

    rc, report = run_check_code(
        tmp_path,
        [sys.executable, "-c", "print('coverage: 80%')"],
        monkeypatch,
        capsys,
        traceability_body=traceability,
    )

    assert rc == 0
    assert report["gates"]["external_doubles_tied_to_reality"] is True
    assert report["external_boundary_verification"]["double_only_boundaries"] == []


def test_git_diff_loc_measures_actual_changed_lines(tmp_path):
    check_code = load_check_code()
    git(tmp_path, "init")
    git(tmp_path, "config", "user.email", "test@example.com")
    git(tmp_path, "config", "user.name", "Test User")
    source = tmp_path / "app.py"
    source.write_text("one\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "baseline")

    source.write_text("one\ntwo\nthree\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "change")

    diff_loc, evidence = check_code.git_diff_loc(tmp_path, "HEAD~1")
    assert diff_loc == 2
    assert evidence == "explicit:HEAD~1"


def test_git_diff_loc_refuses_default_branch_without_review_base(tmp_path):
    check_code = load_check_code()
    git(tmp_path, "init")
    git(tmp_path, "config", "user.email", "test@example.com")
    git(tmp_path, "config", "user.name", "Test User")
    source = tmp_path / "app.py"
    source.write_text("one\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "baseline")

    diff_loc, evidence = check_code.git_diff_loc(tmp_path, None)
    assert diff_loc is None
    assert evidence == "on_default_branch_no_review_base"


def test_git_diff_loc_uses_auto_merge_base_on_feature_branch(tmp_path):
    check_code = load_check_code()
    git(tmp_path, "init")
    git(tmp_path, "config", "user.email", "test@example.com")
    git(tmp_path, "config", "user.name", "Test User")
    source = tmp_path / "app.py"
    source.write_text("one\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "baseline")
    git(tmp_path, "checkout", "-b", "feature")
    source.write_text("one\ntwo\nthree\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "red: failing test\ngreen: implementation")

    diff_loc, evidence = check_code.git_diff_loc(tmp_path, None)
    assert diff_loc == 2
    assert evidence == "merge_base:master"


def test_git_tdd_evidence_reads_red_and_green_markers(tmp_path):
    check_code = load_check_code()
    git(tmp_path, "init")
    git(tmp_path, "config", "user.email", "test@example.com")
    git(tmp_path, "config", "user.name", "Test User")
    source = tmp_path / "app.py"
    source.write_text("one\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "baseline")
    source.write_text("one\ntest\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "auth red", "-m", "TDD: red")
    source.write_text("one\ntest\nimpl\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "auth green", "-m", "TDD: green")

    evidence = check_code.git_tdd_evidence(tmp_path, "HEAD~2")
    assert evidence == {
        "available": True,
        "base": "explicit:HEAD~2",
        "red_marker": True,
        "green_marker": True,
    }


def test_git_tdd_evidence_ignores_ordinary_commit_words(tmp_path):
    check_code = load_check_code()
    git(tmp_path, "init")
    git(tmp_path, "config", "user.email", "test@example.com")
    git(tmp_path, "config", "user.name", "Test User")
    source = tmp_path / "app.py"
    source.write_text("one\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "baseline")
    source.write_text("one\ntest\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "fix failing test on CI")
    source.write_text("one\ntest\nimpl\n", encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "Add signin implementation")

    evidence = check_code.git_tdd_evidence(tmp_path, "HEAD~2")
    assert evidence == {
        "available": True,
        "base": "explicit:HEAD~2",
        "red_marker": False,
        "green_marker": False,
    }
