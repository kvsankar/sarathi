import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROMPT_REF = re.compile(r"prompts/[A-Za-z0-9._-]+\.prompt\.md")


def run_project_copilot_install(target: Path) -> None:
    if os.name == "nt":
        command = [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(ROOT / "scripts" / "install.ps1"),
            "-TargetRoot",
            str(target),
            "-Scope",
            "project",
            "-Tool",
            "copilot",
            "-NoCrossInstall",
        ]
    else:
        command = [
            "bash",
            str(ROOT / "scripts" / "install.sh"),
            "--target",
            str(target),
            "--scope",
            "project",
            "--tools",
            "copilot",
            "--no-cross-install",
        ]
    subprocess.run(command, check=True, capture_output=True, text=True)


def run_installer_dry_run(*, verbose: bool) -> subprocess.CompletedProcess[str]:
    if os.name == "nt":
        command = [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(ROOT / "scripts" / "install.ps1"),
            "-TargetRoot",
            str(ROOT),
            "-Scope",
            "project",
            "-Tool",
            "codex",
            "-NoCheckers",
            "-NoCrossInstall",
            "-DryRun",
        ]
        if verbose:
            command.append("-v")
    else:
        command = [
            "bash",
            str(ROOT / "scripts" / "install.sh"),
            "--target",
            str(ROOT),
            "--scope",
            "project",
            "--tools",
            "codex",
            "--no-checkers",
            "--no-cross-install",
            "--dry-run",
        ]
        if verbose:
            command.append("--verbose")
    return subprocess.run(command, check=True, capture_output=True, text=True)


def test_installer_reports_only_summary_by_default() -> None:
    result = run_installer_dry_run(verbose=False)

    assert result.stderr == ""
    assert result.stdout.splitlines() == [
        f"Dry run complete for target: {ROOT}",
        "Tools: codex (project scope)",
    ]
    assert "Warning:" not in result.stdout
    assert "Destination folders:" not in result.stdout
    assert "Would install Codex" not in result.stdout


def test_verbose_installer_reports_details_without_expected_warnings() -> None:
    result = run_installer_dry_run(verbose=True)

    assert result.stderr == ""
    assert "Note: " in result.stdout
    assert "Warning:" not in result.stdout
    assert "Destination folders:" in result.stdout
    assert "Would install Codex skill" in result.stdout
    assert f"Dry run complete for target: {ROOT}" in result.stdout


def test_direct_assess_aliases_resolve_transitive_prompts(tmp_path: Path) -> None:
    run_project_copilot_install(tmp_path)

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        sarathi_prompts = skill_root / "sarathi" / "prompts"
        for stage in ("spec", "design", "plan", "code"):
            alias = skill_root / f"{stage}-assess"
            prompt = alias / "prompts" / f"{stage}-assess.prompt.md"
            prompt_text = prompt.read_text(encoding="utf-8")

            assert (alias / "SKILL.md").is_file()
            references = PROMPT_REF.findall(prompt_text)
            assert references
            for reference in references:
                assert (skill_root / "sarathi" / reference).is_file()
            assert (alias / "checkers" / "check_plan.py").is_file()
            assert sarathi_prompts.is_dir()


def test_project_install_copies_executable_checker_bundle(tmp_path: Path) -> None:
    run_project_copilot_install(tmp_path)
    checker_dir = tmp_path / "checkers"
    for name in (
        "approvals.py",
        "markdown_structure.py",
        "schemas.py",
        "waves.py",
        "check_plan.py",
    ):
        assert (checker_dir / name).is_file()

    (tmp_path / "plan.md").write_text("# Invalid Plan\n", encoding="utf-8")
    result = subprocess.run(
        [sys.executable, str(checker_dir / "check_plan.py"), "plan.md", "--json"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    report = json.loads(result.stdout)
    assert report["gates"]["has_delivery_items"] is False
