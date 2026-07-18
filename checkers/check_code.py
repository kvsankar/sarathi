#!/usr/bin/env python3
"""Run a planned verification command and surface explicit code blockers.

This checker records whether the supplied command passed. It can also require
hash-current approvals and surface TODO/FIXME/skip-style markers for explicit
acknowledgement. It deliberately does not infer test quality from coverage,
test names, requirement IDs, or Git history. Those are review concerns.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path

CHECKER_DIR = Path(__file__).resolve().parent
if str(CHECKER_DIR) not in sys.path:
    sys.path.insert(0, str(CHECKER_DIR))

from approvals import (  # noqa: E402
    approval_gate_passed,
    approval_requirement,
    load_approval_context,
)

MARKER_PATTERNS = (
    ("TODO", re.compile(r"\bTODO\b", re.I)),
    ("FIXME", re.compile(r"\bFIXME\b", re.I)),
    ("XXX", re.compile(r"\bXXX\b", re.I)),
    (
        "SKIP",
        re.compile(
            r"(@pytest\.mark\.skip\b|pytest\.skip\s*\(|"
            r"\b(?:it|test|describe)\.skip\s*\(|\bskip\s*\()",
            re.I,
        ),
    ),
    ("SKIPIF", re.compile(r"(@pytest\.mark\.skipif\b|\bskipif\s*\()", re.I)),
    ("XFAIL", re.compile(r"(@pytest\.mark\.xfail\b|\bxfail\s*\()", re.I)),
)
UI_WORK = re.compile(r"^\s*UI Work\s*:\s*Yes\s*$", re.I | re.M)
MOCK_DEP = re.compile(r"^\s*Mock UI Dependency\s*:\s*(?!None\b)(.+)$", re.I | re.M)
UI_MOCK_ARTIFACT = re.compile(r"^\s*UI Mock Artifact\s*:\s*(\S+)\s*$", re.I | re.M)


def arg(flag: str, default: str | None = None) -> str | None:
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def rel_path(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def source_files(root: Path, suffixes: set[str]):
    skipped = {
        ".git",
        ".hg",
        ".svn",
        "node_modules",
        ".venv",
        "venv",
        "__pycache__",
        "dist",
        "build",
    }
    for path in root.rglob("*"):
        if any(part in skipped for part in path.parts):
            continue
        if path.is_file() and path.suffix in suffixes:
            yield path


def marker_hits(files: list[Path], root: Path) -> list[dict]:
    hits: list[dict] = []
    for path in files:
        text = path.read_text(encoding="utf-8", errors="ignore")
        for line_no, line in enumerate(text.splitlines(), 1):
            for marker, pattern in MARKER_PATTERNS:
                if pattern.search(line):
                    hits.append(
                        {
                            "path": rel_path(path, root),
                            "line": line_no,
                            "marker": marker,
                            "text": line.strip(),
                        }
                    )
    return hits


def marker_inventory_hash(markers: list[dict]) -> str:
    payload = json.dumps(markers, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def test_command() -> tuple[list[str] | str | None, bool]:
    """Return an argv command by default; shell execution requires opt-in."""
    argv_json = arg("--tests-argv")
    if argv_json:
        parsed = json.loads(argv_json)
        if not isinstance(parsed, list) or not all(
            isinstance(item, str) for item in parsed
        ):
            raise ValueError("--tests-argv must be a JSON array of strings")
        return parsed, False
    command = arg("--tests")
    if not command:
        return None, False
    if "--tests-shell" in sys.argv:
        return command, True
    return shlex.split(command, posix=os.name != "nt"), False


def command_display(command: list[str] | str | None) -> str | None:
    if command is None:
        return None
    return command if isinstance(command, str) else shlex.join(command)


def main() -> int:
    as_json = "--json" in sys.argv
    plan = Path(arg("--plan", "plan.md") or "plan.md")
    design = Path(arg("--design", "design.md") or "design.md")
    tests_dir = Path(arg("--tests-dir", "tests") or "tests")
    src = Path(arg("--src", ".") or ".")
    src_ext = {
        extension.strip()
        for extension in (arg("--src-ext", ".py,.ts,.tsx,.js,.jsx") or "").split(",")
        if extension.strip()
    }
    require_approvals = "--require-approvals" in sys.argv
    approvals_path = (
        arg("--approvals", ".sdlc/approvals.yaml") or ".sdlc/approvals.yaml"
    )
    gates_path = arg("--gates-policy", ".sdlc/gates.yaml") or ".sdlc/gates.yaml"
    command, use_shell = test_command()

    test_files = (
        list(source_files(tests_dir, {".py", ".ts", ".tsx", ".js", ".jsx"}))
        if tests_dir.exists()
        else []
    )
    source_file_list = list(source_files(src, src_ext))
    code_markers = marker_hits(sorted({*test_files, *source_file_list}), Path.cwd())

    tests_pass: bool | None = None
    tests_exit: int | None = None
    if command:
        result = subprocess.run(
            command, shell=use_shell, capture_output=True, text=True
        )
        tests_exit = result.returncode
        tests_pass = result.returncode == 0

    plan_text = plan.read_text(encoding="utf-8") if plan.exists() else ""
    approval_requirements: list[dict] = []
    approval_context: dict = {}
    if require_approvals or code_markers:
        approval_context = load_approval_context(Path.cwd(), approvals_path, gates_path)
    if require_approvals:
        approval_requirements.append(
            approval_requirement(approval_context, Path.cwd(), "plan.approved", plan)
        )
        design_text = design.read_text(encoding="utf-8") if design.exists() else ""
        mock_match = UI_MOCK_ARTIFACT.search(design_text)
        if (UI_WORK.search(plan_text) or MOCK_DEP.search(plan_text)) and mock_match:
            approval_requirements.append(
                approval_requirement(
                    approval_context,
                    Path.cwd(),
                    "ux.mock.approved",
                    mock_match.group(1),
                )
            )
        elif UI_WORK.search(plan_text) or MOCK_DEP.search(plan_text):
            approval_requirements.append(
                {
                    "gate": "ux.mock.approved",
                    "artifact": None,
                    "scope": None,
                    "approved": False,
                    "approval_id": None,
                    "status": None,
                    "issues": [
                        "UI work declares a mock dependency, but no design mock "
                        "artifact was found"
                    ],
                }
            )

    marker_approval_requirements: list[dict] = []
    marker_inventory_sha = marker_inventory_hash(code_markers) if code_markers else None
    if code_markers:
        marker_approval_requirements.append(
            approval_requirement(
                approval_context,
                Path.cwd(),
                "code.markers.approved",
                "code-marker-inventory",
                artifact_kind="marker-inventory",
                expected_sha256=marker_inventory_sha,
            )
        )

    gates = {
        "verification_command_passed": tests_pass is True,
        "markers_approved": approval_gate_passed(marker_approval_requirements),
    }
    if require_approvals:
        gates["required_approvals_present"] = approval_gate_passed(
            approval_requirements
        )
    report = {
        "verification_command": command_display(command),
        "verification_command_exit": tests_exit,
        "verification_command_passed": tests_pass,
        "approval_requirements": approval_requirements,
        "marker_approval_requirements": marker_approval_requirements,
        "approval_ledger": {
            "path": approvals_path,
            "exists": approval_context.get("exists") if approval_context else None,
            "load_error": (
                approval_context.get("load_error") if approval_context else None
            ),
            "invalid_records": (
                approval_context.get("invalid_records") if approval_context else []
            ),
            "historical_records": (
                approval_context.get("historical_records") if approval_context else []
            ),
        },
        "code_markers": code_markers,
        "marker_inventory_sha256": marker_inventory_sha,
        "marker_hits": len(code_markers),
        "gates": gates,
        "passed": sum(gates.values()),
        "total": len(gates),
    }
    if as_json:
        print(json.dumps(report, indent=2))
    else:
        for key, value in gates.items():
            print(f"{'PASS' if value else 'FAIL'}  {key}")
        command_text = report["verification_command"] or "not provided"
        print(f"\nVerification command: {command_text}")
        print(f"{report['passed']}/{report['total']} gates passed")
    return 0 if all(gates.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
