import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROMPT_REF = re.compile(r"prompts/[A-Za-z0-9._-]+\.prompt\.md")


def project_install_command(target: Path, tool: str) -> list[str]:
    if os.name == "nt":
        return [
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
            tool,
            "-NoCrossInstall",
        ]
    return [
        "bash",
        str(ROOT / "scripts" / "install.sh"),
        "--target",
        str(target),
        "--scope",
        "project",
        "--tools",
        tool,
        "--no-cross-install",
    ]


def run_project_install(target: Path, tool: str) -> None:
    subprocess.run(
        project_install_command(target, tool),
        check=True,
        capture_output=True,
        text=True,
    )


def run_project_copilot_install(target: Path) -> None:
    run_project_install(target, "copilot")


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


def test_prefixed_stage_skills_are_explicit_agent_neutral_and_complete(
    tmp_path: Path,
) -> None:
    run_project_copilot_install(tmp_path)

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        sarathi_prompts = skill_root / "sarathi" / "prompts"
        stage_names = [
            f"{stage}-{action}"
            for stage in ("spec", "design", "plan", "code")
            for action in ("create", "verify", "review", "assess")
        ] + ["workflow-status"]
        for stage_name in stage_names:
            alias = skill_root / f"sarathi-{stage_name}"
            skill_text = (alias / "SKILL.md").read_text(encoding="utf-8")
            agent_text = (alias / "agents" / "openai.yaml").read_text(encoding="utf-8")

            assert f"name: sarathi-{stage_name}" in skill_text
            assert "agent-neutral, explicit-only" in skill_text
            assert "GitHub" not in skill_text
            assert "Copilot" not in skill_text
            assert "allow_implicit_invocation: false" in agent_text
            assert f"$sarathi-{stage_name}" in agent_text
            assert not (skill_root / stage_name).exists()

        for stage in ("spec", "design", "plan", "code"):
            alias = skill_root / f"sarathi-{stage}-assess"
            prompt = alias / "prompts" / f"{stage}-assess.prompt.md"
            prompt_text = prompt.read_text(encoding="utf-8")

            assert (alias / "SKILL.md").is_file()
            references = PROMPT_REF.findall(prompt_text)
            assert references
            for reference in references:
                assert (skill_root / "sarathi" / reference).is_file()
            assert (alias / "checkers" / "check_plan.py").is_file()
            assert sarathi_prompts.is_dir()


def test_upgrade_archives_recognizable_unprefixed_stage_skills_without_data_loss(
    tmp_path: Path,
) -> None:
    run_project_copilot_install(tmp_path)

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        for stage in ("code-create", "code-review"):
            retired = skill_root / stage
            (retired / "prompts" / "nested").mkdir(parents=True)
            (retired / "checkers" / "nested").mkdir(parents=True)
            skill_text = f"""---
name: {stage}
description: user-modified legacy alias
---

This is a direct GitHub Copilot CLI skill alias for the Sarathi {stage} stage.

User-added instructions must survive migration.
"""
            if stage == "code-review":
                (retired / "SKILL.md").write_bytes(
                    skill_text.replace("\n", "\r\n").encode("utf-8")
                )
            else:
                (retired / "SKILL.md").write_text(skill_text, encoding="utf-8")
            (retired / "prompts" / f"{stage}.prompt.md").write_text(
                f"user-modified prompt for {stage}", encoding="utf-8"
            )
            (retired / "prompts" / "nested" / "fixture.txt").write_text(
                f"nested prompt data for {stage}", encoding="utf-8"
            )
            (retired / "checkers" / "check_plan.py").write_text(
                f"# user-modified checker for {stage}", encoding="utf-8"
            )
            (retired / "checkers" / "nested" / "fixture.json").write_text(
                f'{{"stage": "{stage}"}}', encoding="utf-8"
            )
            (retired / "local-notes.md").write_text(
                f"user-owned notes for {stage}", encoding="utf-8"
            )

        unrelated = skill_root / "code-verify"
        unrelated.mkdir()
        (unrelated / "SKILL.md").write_text(
            """---
name: code-verify
description: unrelated user skill
---

This generic skill is not a legacy Sarathi alias.
""",
            encoding="utf-8",
        )

    run_project_copilot_install(tmp_path)

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        archive_root = skill_root.parent / "sarathi-retired-stage-skills"
        for stage in ("code-create", "code-review"):
            archived = archive_root / stage
            assert not (skill_root / stage).exists()
            assert "User-added instructions must survive migration." in (
                archived / "SKILL.md"
            ).read_text(encoding="utf-8")
            if stage == "code-review":
                assert b"\r\n" in (archived / "SKILL.md").read_bytes()
            assert (archived / "prompts" / f"{stage}.prompt.md").read_text(
                encoding="utf-8"
            ) == f"user-modified prompt for {stage}"
            assert (archived / "prompts" / "nested" / "fixture.txt").read_text(
                encoding="utf-8"
            ) == f"nested prompt data for {stage}"
            assert (archived / "checkers" / "check_plan.py").read_text(
                encoding="utf-8"
            ) == f"# user-modified checker for {stage}"
            assert (archived / "checkers" / "nested" / "fixture.json").read_text(
                encoding="utf-8"
            ) == f'{{"stage": "{stage}"}}'
            assert (archived / "local-notes.md").read_text(
                encoding="utf-8"
            ) == f"user-owned notes for {stage}"
            assert (skill_root / f"sarathi-{stage}" / "SKILL.md").is_file()

        assert (skill_root / "code-verify" / "SKILL.md").is_file()


def test_legacy_alias_recognition_is_crlf_safe_in_both_installers() -> None:
    bash = (ROOT / "scripts" / "install.sh").read_text(encoding="utf-8")
    powershell = (ROOT / "scripts" / "install.ps1").read_text(encoding="utf-8")

    assert "tr -d '\\r'" in bash
    assert r'\r?$"' in powershell


def test_codex_only_upgrade_archives_legacy_aliases_from_shared_skill_roots(
    tmp_path: Path,
) -> None:
    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        retired = skill_root / "code-review"
        retired.mkdir(parents=True)
        (retired / "SKILL.md").write_text(
            """---
name: code-review
description: legacy
---

This is a direct GitHub Copilot CLI skill alias for the Sarathi code-review stage.
""",
            encoding="utf-8",
        )

    run_project_install(tmp_path, "codex")

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        assert not (skill_root / "code-review").exists()
        assert (
            skill_root.parent
            / "sarathi-retired-stage-skills"
            / "code-review"
            / "SKILL.md"
        ).is_file()


def test_invalid_tool_does_not_archive_or_copy_before_failure(tmp_path: Path) -> None:
    retired = tmp_path / ".agents" / "skills" / "code-review"
    retired.mkdir(parents=True)
    (retired / "SKILL.md").write_text(
        """---
name: code-review
description: legacy
---

This is a direct GitHub Copilot CLI skill alias for the Sarathi code-review stage.
""",
        encoding="utf-8",
    )

    result = subprocess.run(
        project_install_command(tmp_path, "codxe"),
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0
    assert retired.is_dir()
    assert not (tmp_path / "checkers").exists()
    assert not (tmp_path / ".agents" / "sarathi-retired-stage-skills").exists()


def test_dry_run_previews_archive_without_moving_legacy_alias(tmp_path: Path) -> None:
    retired = tmp_path / ".agents" / "skills" / "code-review"
    retired.mkdir(parents=True)
    (retired / "SKILL.md").write_text(
        """---
name: code-review
description: legacy
---

This is a direct GitHub Copilot CLI skill alias for the Sarathi code-review stage.
""",
        encoding="utf-8",
    )
    archived = tmp_path / ".agents" / "sarathi-retired-stage-skills" / "code-review"
    archived.mkdir(parents=True)
    (archived / "earlier-copy.md").write_text("keep", encoding="utf-8")
    collision_free = archived.parent / "code-review-1"
    command = project_install_command(tmp_path, "codex")
    command.append("-DryRun" if os.name == "nt" else "--dry-run")

    result = subprocess.run(command, check=True, capture_output=True, text=True)

    assert (
        f"Would archive retired unprefixed Sarathi stage skill -> {collision_free}"
        in result.stdout
    )
    assert retired.is_dir()
    assert (archived / "earlier-copy.md").read_text(encoding="utf-8") == "keep"
    assert not collision_free.exists()


def test_upgrade_uses_collision_free_archive_name_and_removes_generic_alias(
    tmp_path: Path,
) -> None:
    run_project_copilot_install(tmp_path)
    skill_root = tmp_path / ".agents" / "skills"
    retired = skill_root / "code-create"
    retired.mkdir()
    (retired / "SKILL.md").write_text(
        """---
name: code-create
description: legacy
---

This is a direct GitHub Copilot CLI skill alias for the Sarathi code-create stage.
""",
        encoding="utf-8",
    )
    archived = skill_root.parent / "sarathi-retired-stage-skills" / "code-create"
    archived.mkdir(parents=True)
    (archived / "earlier-copy.md").write_text("keep both", encoding="utf-8")

    run_project_copilot_install(tmp_path)

    collision_free = archived.parent / "code-create-1"
    assert not retired.exists()
    assert (archived / "earlier-copy.md").read_text(encoding="utf-8") == "keep both"
    assert (collision_free / "SKILL.md").is_file()


def test_project_install_assembles_canonical_docs_into_skill(tmp_path: Path) -> None:
    run_project_copilot_install(tmp_path)

    expected = sorted((ROOT / "docs").iterdir(), key=lambda path: path.name)
    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        installed_docs = skill_root / "sarathi" / "docs"
        assert sorted(path.name for path in installed_docs.iterdir()) == [
            path.name for path in expected
        ]
        for source in expected:
            assert (installed_docs / source.name).read_bytes() == source.read_bytes()


def test_project_install_rebuilds_owned_bundle_subdirectories(tmp_path: Path) -> None:
    run_project_copilot_install(tmp_path)

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        bundle = skill_root / "sarathi"
        (bundle / "docs" / "retired.md").write_text("retired", encoding="utf-8")
        (bundle / "prompts" / "retired.prompt.md").write_text(
            "retired", encoding="utf-8"
        )
        (bundle / "checkers" / "retired.py").write_text("retired", encoding="utf-8")
        (bundle / "local-notes.md").write_text("keep", encoding="utf-8")
        retired_srs = skill_root / "srs-authoring"
        retired_srs.mkdir()
        (retired_srs / "SKILL.md").write_text("user-owned", encoding="utf-8")

    run_project_copilot_install(tmp_path)

    for skill_root in (
        tmp_path / ".github" / "skills",
        tmp_path / ".agents" / "skills",
    ):
        bundle = skill_root / "sarathi"
        assert not (bundle / "docs" / "retired.md").exists()
        assert not (bundle / "prompts" / "retired.prompt.md").exists()
        assert not (bundle / "checkers" / "retired.py").exists()
        assert (bundle / "local-notes.md").is_file()
        assert (skill_root / "srs-authoring" / "SKILL.md").is_file()


def test_bash_installer_removes_only_exact_retired_srs_authoring_variants(
    tmp_path: Path,
) -> None:
    script_text = (ROOT / "scripts" / "install.sh").read_text(encoding="utf-8")
    start = script_text.index("remove_retired_srs_authoring() {")
    end = script_text.index("\n}\n\ncopy_skill_folder", start) + 2
    cleanup_script = tmp_path / "remove-retired-srs.sh"
    cleanup_script.write_text(
        "#!/usr/bin/env bash\nset -euo pipefail\n"
        + script_text[start:end]
        + '\nremove_retired_srs_authoring "$1"\n',
        encoding="utf-8",
    )
    cleanup_script.chmod(0o755)

    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    fake_sha = fake_bin / "sha256sum"
    fake_sha.write_text(
        "#!/usr/bin/env bash\n"
        'case "$1" in\n'
        '  */SKILL.md) value="$SARATHI_TEST_SKILL_HASH" ;;\n'
        '  */agents/openai.yaml) value="$SARATHI_TEST_AGENT_HASH" ;;\n'
        '  */references/srs-quality.md) value="$SARATHI_TEST_REFERENCE_HASH" ;;\n'
        "  *) exit 1 ;;\n"
        "esac\n"
        'printf \'%s  %s\\n\' "$value" "$1"\n',
        encoding="utf-8",
    )
    fake_sha.chmod(0o755)

    variants = (
        (
            "cd6f56c6759a2ab9c1f15e926b1f0f254a12fe7d7ceecb3b574794345d6a0647",
            "092fa2f148f507e84b1cb6374d272c94ad9e7f9dce9d7974ebd7354910c7969b",
        ),
        (
            "2e9aa5cb0c985397b5ecdfcdf74985fbef4205e8e81aa2d73bbefbbeea6550ee",
            "824c0bbc14f8fc0788a6ec78d6c4f88a9c416473b9f7fd2d5be2c9133aa520b2",
        ),
    )
    agent_hash = "960503fe7ddf3a3bd675cc2373438eb271e29bcef84eaf65eb3914e5640a3c0b"
    environment = os.environ | {
        "PATH": f"{fake_bin}{os.pathsep}{os.environ['PATH']}",
        "SARATHI_TEST_AGENT_HASH": agent_hash,
    }
    for index, (skill_hash, reference_hash) in enumerate(variants):
        skill_root = tmp_path / f"variant-{index}"
        retired = skill_root / "srs-authoring"
        (retired / "agents").mkdir(parents=True)
        (retired / "references").mkdir()
        (retired / "SKILL.md").write_text("fixture", encoding="utf-8")
        (retired / "agents" / "openai.yaml").write_text("fixture", encoding="utf-8")
        (retired / "references" / "srs-quality.md").write_text(
            "fixture", encoding="utf-8"
        )

        subprocess.run(
            ["bash", str(cleanup_script), str(skill_root)],
            check=True,
            capture_output=True,
            text=True,
            env=environment
            | {
                "SARATHI_TEST_SKILL_HASH": skill_hash,
                "SARATHI_TEST_REFERENCE_HASH": reference_hash,
            },
        )
        assert not retired.exists()

    preserved = tmp_path / "modified"
    retired = preserved / "srs-authoring"
    (retired / "agents").mkdir(parents=True)
    (retired / "references").mkdir()
    (retired / "SKILL.md").write_text("fixture", encoding="utf-8")
    (retired / "agents" / "openai.yaml").write_text("fixture", encoding="utf-8")
    (retired / "references" / "srs-quality.md").write_text("fixture", encoding="utf-8")
    subprocess.run(
        ["bash", str(cleanup_script), str(preserved)],
        check=True,
        capture_output=True,
        text=True,
        env=environment
        | {
            "SARATHI_TEST_SKILL_HASH": variants[0][0],
            "SARATHI_TEST_REFERENCE_HASH": "modified",
        },
    )
    assert retired.is_dir()

    with_extra_directory = tmp_path / "with-extra-directory"
    retired = with_extra_directory / "srs-authoring"
    (retired / "agents").mkdir(parents=True)
    (retired / "references").mkdir()
    (retired / "local-notes").mkdir()
    (retired / "SKILL.md").write_text("fixture", encoding="utf-8")
    (retired / "agents" / "openai.yaml").write_text("fixture", encoding="utf-8")
    (retired / "references" / "srs-quality.md").write_text("fixture", encoding="utf-8")
    subprocess.run(
        ["bash", str(cleanup_script), str(with_extra_directory)],
        check=True,
        capture_output=True,
        text=True,
        env=environment
        | {
            "SARATHI_TEST_SKILL_HASH": variants[0][0],
            "SARATHI_TEST_REFERENCE_HASH": variants[0][1],
        },
    )
    assert (retired / "local-notes").is_dir()


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
