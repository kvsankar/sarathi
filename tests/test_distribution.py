import importlib.util
import json
import os
import subprocess
import sys
import tomllib
from pathlib import Path

import pytest

from sarathi_sdlc.cli import _install_command, build_parser

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "skills" / "sarathi" / "manifest.json"
UPDATE_SCRIPT = ROOT / "skills" / "sarathi" / "scripts" / "check_update.py"


def load_update_module():
    spec = importlib.util.spec_from_file_location("sarathi_update_check", UPDATE_SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_distribution_and_skill_manifest_versions_match() -> None:
    project = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    assert project["project"]["name"] == "sarathi-sdlc"
    assert manifest == {
        "distribution": "sarathi-sdlc",
        "schema_version": 1,
        "update_url": "https://pypi.org/pypi/sarathi-sdlc/json",
        "version": project["project"]["version"],
    }


def test_github_release_is_created_only_after_pypi_publish() -> None:
    workflow = (ROOT / ".github" / "workflows" / "release.yml").read_text(
        encoding="utf-8"
    )

    publish = workflow.index("  publish:")
    github_release = workflow.index("  github-release:")
    assert publish < github_release
    assert "needs: publish" in workflow[github_release:]
    assert "contents: write" in workflow[github_release:]
    assert 'gh release create "$GITHUB_REF_NAME" dist/*' in workflow[github_release:]
    assert 'gh release upload "$GITHUB_REF_NAME" dist/*' in workflow[github_release:]
    assert workflow[github_release:].count('--repo "$GITHUB_REPOSITORY"') == 3


def test_fresh_update_cache_avoids_network(tmp_path: Path, monkeypatch) -> None:
    update = load_update_module()
    cache = tmp_path / "update.json"
    cache.write_text(
        json.dumps({"checked_at": 1000, "latest_version": "0.1.1"}),
        encoding="utf-8",
    )
    monkeypatch.setenv("SARATHI_UPDATE_CACHE", str(cache))
    monkeypatch.setattr(
        update, "_fetch_latest", lambda _: pytest.fail("unexpected network request")
    )

    assert update.check_update(now=1001) == ("0.3.0", "0.1.1")


def test_stale_update_cache_is_refreshed(tmp_path: Path, monkeypatch) -> None:
    update = load_update_module()
    cache = tmp_path / "update.json"
    cache.write_text(
        json.dumps({"checked_at": 1, "latest_version": "0.1.1"}),
        encoding="utf-8",
    )
    monkeypatch.setenv("SARATHI_UPDATE_CACHE", str(cache))
    monkeypatch.setattr(update, "_fetch_latest", lambda _: "0.3.0")

    assert update.check_update(now=100000) == ("0.3.0", "0.3.0")
    assert json.loads(cache.read_text(encoding="utf-8")) == {
        "checked_at": 100000,
        "latest_version": "0.3.0",
    }


def test_update_notice_requires_approval_and_pins_version(
    tmp_path: Path, monkeypatch, capsys
) -> None:
    update = load_update_module()
    monkeypatch.setenv("SARATHI_UPDATE_CACHE", str(tmp_path / "update.json"))
    monkeypatch.setattr(update, "_fetch_latest", lambda _: "0.3.1")
    monkeypatch.setattr(sys, "argv", [str(UPDATE_SCRIPT)])

    assert update.main() == 0
    notice = capsys.readouterr().out
    assert "installed version is 0.3.0" in notice
    assert "explicit user approval" in notice
    assert "sarathi-sdlc==0.3.1" in notice


def test_failed_update_check_is_cached_and_does_not_block(
    tmp_path: Path, monkeypatch
) -> None:
    update = load_update_module()
    cache = tmp_path / "update.json"
    monkeypatch.setenv("SARATHI_UPDATE_CACHE", str(cache))
    requests = 0

    def fail(_: str) -> str:
        nonlocal requests
        requests += 1
        raise OSError("offline")

    monkeypatch.setattr(update, "_fetch_latest", fail)
    assert update.check_update(now=1000) == ("0.3.0", None)
    assert update.check_update(now=1001) == ("0.3.0", None)
    assert requests == 1


def test_update_check_can_be_disabled(tmp_path: Path, monkeypatch) -> None:
    update = load_update_module()
    monkeypatch.setenv("SARATHI_UPDATE_CHECK", "0")
    monkeypatch.setenv("SARATHI_UPDATE_CACHE", str(tmp_path / "unused.json"))
    monkeypatch.setattr(
        update, "_fetch_latest", lambda _: pytest.fail("unexpected network request")
    )

    assert update.check_update(now=1000) == ("0.3.0", None)


def command_skips_checkers(arguments: list[str]) -> bool:
    args = build_parser().parse_args(["install", *arguments])
    command = _install_command(args)
    return "--no-checkers" in command or "-NoCheckers" in command


def test_implicit_user_install_skips_separate_project_checkers() -> None:
    assert command_skips_checkers([]) is True


def test_project_install_includes_project_checkers_by_default(tmp_path: Path) -> None:
    assert (
        command_skips_checkers(["--target", str(tmp_path), "--scope", "project"])
        is False
    )


def test_user_can_explicitly_request_or_skip_project_checkers() -> None:
    assert command_skips_checkers(["--with-checkers"]) is False
    assert command_skips_checkers(["--no-checkers"]) is True


def test_cli_verbose_flag_is_forwarded_to_platform_installer() -> None:
    args = build_parser().parse_args(["install", "--verbose"])

    command = _install_command(args)
    assert ("-v" if os.name == "nt" else "--verbose") in command


@pytest.mark.skipif(os.name == "nt", reason="asserts the Unix installer wrapper")
def test_cli_dry_run_uses_bundled_installer(tmp_path: Path) -> None:
    environment = os.environ.copy()
    environment["PYTHONPATH"] = str(ROOT / "src")
    environment["SARATHI_BUNDLE_ROOT"] = str(ROOT)
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "sarathi_sdlc",
            "install",
            "--target",
            str(tmp_path),
            "--scope",
            "project",
            "--tools",
            "codex",
            "--no-cross-install",
            "--dry-run",
        ],
        cwd=ROOT,
        env=environment,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "Dry run complete for target:" in result.stdout
    assert "Tools: codex (project scope)" in result.stdout
    assert "Would install Codex skill" not in result.stdout
    assert not (tmp_path / ".codex").exists()
