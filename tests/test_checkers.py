import hashlib
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_checker(name: str):
    path = ROOT / "checkers" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def run_main(module, args, monkeypatch, capsys, cwd: Path):
    monkeypatch.chdir(cwd)
    monkeypatch.setattr(sys, "argv", [module.__file__, *args])
    rc = module.main()
    out = capsys.readouterr().out
    return rc, json.loads(out)


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_approval_ledger(
    root: Path,
    entries: list[dict[str, str]],
    gates_yaml: str | None = None,
) -> None:
    sdlc = root / ".sdlc"
    sdlc.mkdir()
    lines = ["version: 1", "approvals:"]
    for entry in entries:
        lines.extend(
            [
                f"  - id: {entry['id']}",
                f"    gate: {entry['gate']}",
                f"    scope: {entry['scope']}",
                "    artifact:",
                f"      kind: {entry['kind']}",
                f"      path: {entry['path']}",
                f"      sha256: {entry['sha256']}",
                f"    status: {entry.get('status', 'approved')}",
                f"    approved_by: {entry.get('approved_by', 'Test User')}",
                f"    approved_at: {entry.get('approved_at', '2026-07-01T12:00:00Z')}",
            ]
        )
        if "policy" in entry:
            lines.append(f"    policy: {entry['policy']}")
        if "reason" in entry:
            lines.append(f"    reason: {entry['reason']}")
    (sdlc / "approvals.yaml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if gates_yaml:
        (sdlc / "gates.yaml").write_text(gates_yaml, encoding="utf-8")


def write_valid_spec(path: Path) -> None:
    path.write_text(
        """# Mission Statement
Work Scope: Slice/change
Implementation Readiness: Code-ready

# User Needs
- UN-AUTH-ACCESS Users need authenticated access.

# Non-Goals
- Anonymous posting is out of scope.

# Features
- FEAT-AUTH-LOGIN Login satisfies UN-AUTH-ACCESS.

# Use Cases
- UC-AUTH-SIGNIN
  Primary actor: User.
  Supporting actors/systems: Credential store.
  Goal: Sign in to access protected functionality.
  Scope: Authentication boundary.
  Trigger: The user submits valid credentials.
  Preconditions: The user has an existing active credential record.
  Minimal guarantees: Failed attempts do not grant protected access.
  Success guarantees: The user receives authenticated access.
  Main success scenario:
  1. User submits credentials.
  2. System validates the credentials.
  3. System grants authenticated access.
  Alternate flows: If already signed in, the system keeps the current access session.
  Error/exception flows: Invalid credentials deny access with a safe message.
  Postconditions: Authenticated access is available for the user.
  Frequency/importance: High importance; expected on every protected session.
  Trace links: UN-AUTH-ACCESS, FEAT-AUTH-LOGIN, FR-AUTH-SIGNIN,
  NFR-PERF-SIGNIN, AT-AUTH-SIGNIN.

# Functional Requirements
- FR-AUTH-SIGNIN The system shall allow valid users to sign in. UC-AUTH-SIGNIN.

# Non-Functional Requirements
- NFR-PERF-SIGNIN Sign-in shall complete within 200 ms. Verification: timing.

# External Interfaces & Contracts
- No external interfaces are introduced by this slice.

# Acceptance Tests
- AT-AUTH-SIGNIN Given a valid user, when they sign in, then access is granted.
  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.

# Journey Tests
No long-form journey tests are required for this slice.

# Traceability Matrix
UN-AUTH-ACCESS -> FEAT-AUTH-LOGIN -> UC-AUTH-SIGNIN -> FR-AUTH-SIGNIN -> AT-AUTH-SIGNIN.

# Assumptions & Open Questions
- Credentials already exist.
""",
        encoding="utf-8",
    )


def write_valid_design(path: Path) -> None:
    path.write_text(
        """# Overview
Work Scope: Slice/change
Design Depth: LLD
Implementation Readiness: Code-ready

# Tech Stack
Python.

# Drivers & Constraints
FR-AUTH-SIGNIN and UC-AUTH-SIGNIN drive the design.

# Layers
Application Layer handles request orchestration and dependency direction.

<details>
<summary>Machine-readable trace anchors</summary>

<!-- sarathi:entity id="LAYER-APP" type="layer" name="Application Layer" -->

</details>

# Components
- Authentication Boundary
  Responsibility: sign-in policy and identity checks.

```mermaid
flowchart LR
  COMP_AUTH["Authentication Boundary"] --> IFACE_AUTH["Authentication Contract"]
```

<details>
<summary>Machine-readable trace anchors</summary>

<!-- sarathi:entity id="COMP-AUTH" refs="FR-AUTH-SIGNIN UC-AUTH-SIGNIN" -->

</details>

Design ID Glossary:

| ID | Display Name | Type | Responsibility |
| --- | --- | --- | --- |
| COMP-AUTH | Authentication Boundary | Component | Auth policy and identity checks. |

# Interfaces
- Authentication Contract
  Owner: Authentication Boundary. Contract: authenticate credentials.

<details>
<summary>Machine-readable trace anchors</summary>

<!-- sarathi:entity id="IFACE-AUTH" type="interface" name="Authentication Contract" -->
owner: COMP-AUTH

</details>

# Core vs. Shell
Authentication Boundary keeps credential policy pure and I/O at the shell.

# Key Flows
User calls the Authentication Contract, then Authentication Boundary validates
credentials.

# Data Model
No persistent state is introduced.

# Design Decisions
- DEC-AUTH: Existing Credential Store
  Decision: use existing credential store.

# Test Strategy
- TEST-AUTH-POLICY Unit/pure-core tests cover COMP-AUTH policy decisions for
  FR-AUTH-SIGNIN and NFR-PERF-SIGNIN.
- TEST-AUTH-CONTRACT Contract tests cover IFACE-AUTH behavior for COMP-AUTH and
  AT-AUTH-SIGNIN.

# Risks & Trade-offs
- RISK-AUTH: Credential Store Outage
  Risk: credential-store outage blocks sign-in.

# Traceability Matrix
FR-AUTH-SIGNIN -> COMP-AUTH -> IFACE-AUTH -> DEC-AUTH.
""",
        encoding="utf-8",
    )


def write_valid_plan(path: Path) -> None:
    path.write_text(
        (
            """# Overview
Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready

# Strategy
Use Red/Green TDD and one small PR.

# Milestones
- MILE-AUTH-LOGIN Deliver login.

# Pull Requests / Child Work Items
- PR-AUTH-SIGNIN Scope: implement login. LOC 120. Red: failing AT-AUTH-SIGNIN test.
  Green: implement COMP-AUTH. Delivers FR-AUTH-SIGNIN, UC-AUTH-SIGNIN, NFR-PERF-SIGNIN,
  AT-AUTH-SIGNIN, COMP-AUTH, TEST-AUTH-POLICY, and TEST-AUTH-CONTRACT.

# Coverage Map
"""
            "FR-AUTH-SIGNIN, UC-AUTH-SIGNIN, NFR-PERF-SIGNIN, AT-AUTH-SIGNIN, "
            "COMP-AUTH, TEST-AUTH-POLICY, and TEST-AUTH-CONTRACT map to "
            "PR-AUTH-SIGNIN.\n"
            """

# Sequencing & Risks
PR-AUTH-SIGNIN has no dependency.
"""
        ),
        encoding="utf-8",
    )


def test_check_spec_accepts_complete_structural_spec(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 0
    assert report["uc_at_coverage_pct"] == 100.0
    assert report["fr_at_coverage_pct"] == 100.0


def test_check_spec_requires_hash_matched_approval_when_enabled(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    module = load_checker("check_spec")

    rc, report = run_main(
        module,
        ["spec.md", "--require-approvals", "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["required_approvals_present"] is False
    assert report["approval_requirements"][0]["issues"] == [
        "approval ledger missing: .sdlc/approvals.yaml"
    ]

    write_approval_ledger(
        tmp_path,
        [
            {
                "id": "APR-SPEC-PRODUCT",
                "gate": "spec.approved",
                "scope": "product/system",
                "kind": "spec",
                "path": "spec.md",
                "sha256": file_hash(spec_path),
            }
        ],
    )

    rc, report = run_main(
        module,
        ["spec.md", "--require-approvals", "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["gates"]["required_approvals_present"] is True


def test_check_spec_rejects_stale_or_non_utc_approval(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    write_approval_ledger(
        tmp_path,
        [
            {
                "id": "APR-SPEC-PRODUCT",
                "gate": "spec.approved",
                "scope": "product/system",
                "kind": "spec",
                "path": "spec.md",
                "sha256": "0" * 64,
                "approved_at": "2026-07-01T17:30:00+05:30",
            }
        ],
    )
    module = load_checker("check_spec")

    rc, report = run_main(
        module,
        ["spec.md", "--require-approvals", "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    issues = report["approval_requirements"][0]["issues"]
    assert "artifact hash is stale: spec.md" in issues
    assert "approved_at must be UTC ISO-8601 like 2026-07-01T14:32:18Z" in issues


def test_check_spec_accepts_bounded_auto_approval(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    write_approval_ledger(
        tmp_path,
        [
            {
                "id": "APR-AUTO-SPEC",
                "gate": "spec.approved",
                "scope": "product/system",
                "kind": "spec",
                "path": "spec.md",
                "sha256": file_hash(spec_path),
                "status": "auto-approved",
                "approved_by": "AUTO",
                "policy": "internal-prototype",
                "reason": "Allowed by local policy.",
            }
        ],
        gates_yaml="""version: 1
auto_approval:
  enabled: true
  mode: internal-prototype
  expires_at: "2999-01-01T00:00:00Z"
  allowed_scopes:
    - product/system
  allowed_gates:
    - spec.approved
  forbidden_gates:
    - release.approved
    - production-deployment.approved
""",
    )
    module = load_checker("check_spec")

    rc, report = run_main(
        module,
        ["spec.md", "--require-approvals", "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["approval_requirements"][0]["status"] == "auto-approved"


def test_check_spec_rejects_nfr_without_units(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace("200 ms", "soon")
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["nfr_missing_units"] == ["NFR-PERF-SIGNIN"]


def test_check_spec_rejects_numbered_ids(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace("FR-AUTH-SIGNIN", "FR-AUTH-10")
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert "FR-AUTH-10" in report["bad_id_format"]


def test_check_spec_rejects_lowercase_ids(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "FR-AUTH-SIGNIN", "fr-auth-signin"
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert "fr-auth-signin" in report["bad_id_format"]


def test_check_spec_rejects_design_test_obligation_ids(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8") + "\n- TEST-AUTH-POLICY\n"
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert "TEST-AUTH-POLICY" in report["bad_id_format"]


def test_check_spec_rejects_latency_nfr_with_wrong_unit(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "Sign-in shall complete within 200 ms.",
        "Sign-in latency shall support up to 5 users.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["nfr_unit_mismatches"] == ["NFR-PERF-SIGNIN"]


def test_check_spec_rejects_acceptance_test_that_only_namedrops_ids(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "- AT-AUTH-SIGNIN Given a valid user, when they sign in, then "
        "access is granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
        "- AT-AUTH-SIGNIN Covers UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["ats_missing_scenario_shape"] == ["AT-AUTH-SIGNIN"]


def test_check_spec_rejects_journey_without_multiple_ordered_ats(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "No long-form journey tests are required for this slice.",
        "- JT-AUTH-LOGIN Given a valid user, when they sign in, then access is "
        "granted. "
        "Verifies AT-AUTH-SIGNIN.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["jts_missing_sequence"] == ["JT-AUTH-LOGIN"]


def test_check_spec_accepts_journey_composing_ordered_acceptance_tests(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "- AT-AUTH-SIGNIN Given a valid user, when they sign in, then access is "
        "granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
        "- AT-AUTH-SIGNIN Given a valid user, when they sign in, then access is "
        "granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.\n"
        "- AT-AUTH-REFRESH Given a signed-in user, when the session refreshes, then "
        "access remains granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
    )
    text = text.replace(
        "No long-form journey tests are required for this slice.",
        "- JT-AUTH-LOGIN Step 1 verifies AT-AUTH-SIGNIN, then step 2 verifies "
        "AT-AUTH-REFRESH after session refresh; expect access to remain granted.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 0
    assert report["jts_missing_sequence"] == []


def test_check_design_accepts_complete_structural_design(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["comp_req_coverage_pct"] == 100.0
    assert report["comp_test_coverage_pct"] == 100.0


def test_check_design_flags_external_double_without_drift_control(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    fake_host = (
        "Contract: authenticate credentials. Tests use a fake external vendor SDK host."
    )
    design_path.write_text(
        design_path.read_text(encoding="utf-8").replace(
            "Contract: authenticate credentials.",
            fake_host,
        ),
        encoding="utf-8",
    )
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["external_doubles_flagged_as_risk"] is False
    assert report["gates"]["external_doubles_have_real_boundary_mitigation"] is False


def test_check_design_accepts_external_double_with_drift_control(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    fake_host = (
        "Contract: authenticate credentials. Tests use a fake external vendor SDK host."
    )
    contract_test = (
        "- TEST-AUTH-CONTRACT Contract tests cover IFACE-AUTH behavior for "
        "COMP-AUTH and\n"
        "  AT-AUTH-SIGNIN."
    )
    text = design_path.read_text(encoding="utf-8")
    text = text.replace(
        "Contract: authenticate credentials.",
        fake_host,
    )
    text = text.replace(
        contract_test,
        "- TEST-AUTH-CONTRACT Contract tests cover IFACE-AUTH behavior for "
        "COMP-AUTH and\n"
        "  AT-AUTH-SIGNIN.\n"
        "- TEST-AUTH-DRIFT Type-conformance and real-boundary integration tests cover\n"
        "  COMP-AUTH, RISK-DRIFT, and the external vendor SDK contract.",
    )
    text = text.replace(
        "- RISK-AUTH: Credential Store Outage\n"
        "  Risk: credential-store outage blocks sign-in.",
        "- RISK-AUTH: Credential Store Outage\n"
        "  Risk: credential-store outage blocks sign-in.\n"
        "- RISK-DRIFT: Test Double Drift\n"
        "  Risk: test double drift is a verification risk because the fake\n"
        "  external vendor SDK host can diverge from the real boundary.",
    )
    design_path.write_text(text, encoding="utf-8")
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["external_double_drift_risks"] == ["RISK-DRIFT"]
    assert report["external_double_mitigation_tests"] == ["TEST-AUTH-DRIFT"]


def test_check_design_accepts_equivalent_core_shell_section(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    text = design_path.read_text(encoding="utf-8").replace(
        "# Core vs. Shell",
        "# Core vs. Shell / Equivalent Separation",
    )
    design_path.write_text(text, encoding="utf-8")
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["gates"]["sections_present"] is True


def test_check_design_detects_missing_interface_owner(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    text = design_path.read_text(encoding="utf-8").replace("owner: COMP-AUTH", "owner:")
    design_path.write_text(text, encoding="utf-8")
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["iface_owner_issues"] == ["IFACE-AUTH"]


def test_check_design_rejects_numbered_requirement_refs(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    text = design_path.read_text(encoding="utf-8").replace(
        "FR-AUTH-SIGNIN", "FR-AUTH-10"
    )
    design_path.write_text(text, encoding="utf-8")
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert "FR-AUTH-10" in report["bad_id_format"]


def test_check_design_requires_explicit_test_obligations(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    text = design_path.read_text(encoding="utf-8").replace(
        (
            "- TEST-AUTH-POLICY Unit/pure-core tests cover COMP-AUTH policy "
            "decisions for\n"
            "  FR-AUTH-SIGNIN and NFR-PERF-SIGNIN.\n"
            "- TEST-AUTH-CONTRACT Contract tests cover IFACE-AUTH behavior for "
            "COMP-AUTH and\n"
            "  AT-AUTH-SIGNIN.\n"
        ),
        "COMP-AUTH has tests.\n",
    )
    design_path.write_text(text, encoding="utf-8")
    module = load_checker("check_design")

    rc, report = run_main(
        module,
        [str(design_path), "--spec", str(spec_path), "--json"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["test_obligations_declared"] is False
    assert report["gates"]["comp_test_coverage_100"] is False


def test_check_plan_accepts_complete_implementation_plan(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["plan_kind"] == "implementation"
    assert report["at_coverage_pct"] == 100.0
    assert report["test_obligation_coverage_pct"] == 100.0


def test_check_plan_accepts_test_traceability_filename(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    plan_path.write_text(
        plan_path.read_text(encoding="utf-8")
        + "\nTraceability file: `.sdlc/test-traceability.yaml`.\n",
        encoding="utf-8",
    )
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["bad_id_format"] == []


def test_check_plan_rejects_lowercase_pr_ids(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    text = plan_path.read_text(encoding="utf-8").replace(
        "PR-AUTH-SIGNIN", "pr-auth-signin"
    )
    plan_path.write_text(text, encoding="utf-8")
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert "pr-auth-signin" in report["bad_id_format"]


def test_check_plan_flags_external_double_without_mitigation(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    plan_path.write_text(
        plan_path.read_text(encoding="utf-8").replace(
            "Green: implement COMP-AUTH.",
            "Green: implement COMP-AUTH with a fake external vendor SDK host.",
        ),
        encoding="utf-8",
    )
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["external_double_mitigation_present"] is False


def test_check_plan_accepts_external_double_with_real_boundary_mitigation(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    plan_path.write_text(
        plan_path.read_text(encoding="utf-8").replace(
            "Green: implement COMP-AUTH.",
            "Green: implement COMP-AUTH with a fake external vendor SDK host and\n"
            "  a real-boundary integration test for the SDK contract.",
        ),
        encoding="utf-8",
    )
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["gates"]["external_double_mitigation_present"] is True


def test_check_plan_requires_upstream_and_mock_approvals(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    mock_path = tmp_path / "mock-ui.html"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    mock_path.write_text("<main>Approved mock</main>\n", encoding="utf-8")
    spec_path.write_text(
        spec_path.read_text(encoding="utf-8") + "\nUI Mock Preference: Required\n",
        encoding="utf-8",
    )
    design_path.write_text(
        design_path.read_text(encoding="utf-8") + "\nUI Mock Artifact: mock-ui.html\n",
        encoding="utf-8",
    )
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            "plan.md",
            "--spec",
            "spec.md",
            "--design",
            "design.md",
            "--require-approvals",
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["required_approvals_present"] is False
    assert [item["gate"] for item in report["approval_requirements"]] == [
        "spec.approved",
        "ux.mock.approved",
        "design.approved",
    ]

    write_approval_ledger(
        tmp_path,
        [
            {
                "id": "APR-SPEC",
                "gate": "spec.approved",
                "scope": "slice/change",
                "kind": "spec",
                "path": "spec.md",
                "sha256": file_hash(spec_path),
            },
            {
                "id": "APR-MOCK",
                "gate": "ux.mock.approved",
                "scope": "slice/change",
                "kind": "mock-ui",
                "path": "mock-ui.html",
                "sha256": file_hash(mock_path),
            },
            {
                "id": "APR-DESIGN",
                "gate": "design.approved",
                "scope": "slice/change",
                "kind": "design",
                "path": "design.md",
                "sha256": file_hash(design_path),
            },
        ],
    )

    rc, report = run_main(
        module,
        [
            "plan.md",
            "--spec",
            "spec.md",
            "--design",
            "design.md",
            "--require-approvals",
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["gates"]["required_approvals_present"] is True


def test_check_plan_rejects_uncovered_design_test_obligation(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    text = plan_path.read_text(encoding="utf-8")
    text = text.replace(", TEST-AUTH-POLICY, and TEST-AUTH-CONTRACT", "")
    text = text.replace(
        "COMP-AUTH, TEST-AUTH-POLICY, and TEST-AUTH-CONTRACT", "COMP-AUTH"
    )
    plan_path.write_text(text, encoding="utf-8")
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["test_obligation_coverage_100"] is False
    assert report["uncovered_test_obligations"] == [
        "TEST-AUTH-CONTRACT",
        "TEST-AUTH-POLICY",
    ]


def test_check_plan_requires_journey_test_coverage(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "- AT-AUTH-SIGNIN Given a valid user, when they sign in, then access is "
        "granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
        "- AT-AUTH-SIGNIN Given a valid user, when they sign in, then access is "
        "granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.\n"
        "- AT-AUTH-REFRESH Given a signed-in user, when the session refreshes, then "
        "access remains granted.\n"
        "  Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
    )
    text = text.replace(
        "No long-form journey tests are required for this slice.",
        "- JT-AUTH-LOGIN Step 1 verifies AT-AUTH-SIGNIN, then step 2 verifies "
        "AT-AUTH-REFRESH after retry; expect access to remain granted.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["jt_coverage_100"] is False
    assert report["uncovered_jts"] == ["JT-AUTH-LOGIN"]


def test_check_plan_reports_declared_pr_over_loc_target_as_advisory(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    text = plan_path.read_text(encoding="utf-8").replace("LOC 120", "LOC 501")
    plan_path.write_text(text, encoding="utf-8")
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert "pr_size_le_300" not in report["gates"]
    assert report["large_prs"] == ["PR-AUTH-SIGNIN"]
    assert report["loc_advisory"]["status"] == "review"


def test_check_plan_rejects_numbered_pr_ids(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    design_path = tmp_path / "design.md"
    plan_path = tmp_path / "plan.md"
    write_valid_spec(spec_path)
    write_valid_design(design_path)
    write_valid_plan(plan_path)
    text = plan_path.read_text(encoding="utf-8").replace("PR-AUTH-SIGNIN", "PR-AUTH-10")
    plan_path.write_text(text, encoding="utf-8")
    module = load_checker("check_plan")

    rc, report = run_main(
        module,
        [
            str(plan_path),
            "--spec",
            str(spec_path),
            "--design",
            str(design_path),
            "--json",
        ],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert "PR-AUTH-10" in report["bad_id_format"]


def test_check_spec_rejects_terse_use_case_missing_full_template(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8")
    start = text.index("- UC-AUTH-SIGNIN")
    end = text.index("\n\n# Functional Requirements")
    text = (
        text[:start]
        + "- UC-AUTH-SIGNIN Actor: user. Goal: sign in. FEAT-AUTH-LOGIN."
        + text[end:]
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["gates"]["use_cases_have_full_template"] is False
    assert "primary_actor" in report["use_case_template_issues"]["UC-AUTH-SIGNIN"]


def test_check_spec_rejects_obviously_bundled_functional_requirement(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "The system shall allow valid users to sign in.",
        "The system shall allow valid users to sign in and refresh sessions.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["bundled_fr_candidates"] == ["FR-AUTH-SIGNIN"]


def test_check_spec_rejects_acceptance_test_referencing_too_many_requirements(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    original_fr = (
        "- FR-AUTH-SIGNIN The system shall allow valid users to sign in. "
        "UC-AUTH-SIGNIN."
    )
    replacement_frs = (
        "- FR-AUTH-SIGNIN The system shall allow valid users to sign in. "
        "UC-AUTH-SIGNIN.\n"
        "- FR-AUTH-LOCKOUT The system shall deny locked users. UC-AUTH-SIGNIN.\n"
        "- FR-AUTH-AUDIT The system shall record sign-in attempts. UC-AUTH-SIGNIN.\n"
        "- FR-AUTH-SESSION The system shall preserve active sessions. UC-AUTH-SIGNIN.\n"
        "- FR-AUTH-REDIRECT The system shall return users to protected content. "
        "UC-AUTH-SIGNIN."
    )
    text = spec_path.read_text(encoding="utf-8").replace(
        original_fr,
        replacement_frs,
    )
    text = text.replace(
        "Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, and NFR-PERF-SIGNIN.",
        "Verifies UC-AUTH-SIGNIN, FR-AUTH-SIGNIN, FR-AUTH-LOCKOUT, "
        "FR-AUTH-AUDIT, FR-AUTH-SESSION, FR-AUTH-REDIRECT, and NFR-PERF-SIGNIN.",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["overloaded_acceptance_refs"] == ["AT-AUTH-SIGNIN"]


def test_check_spec_requires_source_reconciliation_for_brownfield_baseline(
    tmp_path, monkeypatch, capsys
):
    spec_path = tmp_path / "spec.md"
    write_valid_spec(spec_path)
    text = spec_path.read_text(encoding="utf-8").replace(
        "Work Scope: Slice/change",
        "Work Scope: Product/system\nEntry Mode: Brownfield Baseline Adoption",
    )
    spec_path.write_text(text, encoding="utf-8")
    module = load_checker("check_spec")

    rc, report = run_main(
        module, [str(spec_path), "--json"], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["gates"]["brownfield_sources_reconciled"] is False
    assert (
        "missing_source_reconciliation_section"
        in report["source_reconciliation_issues"]
    )
