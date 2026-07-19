"""Command-line entry point for installing the bundled Sarathi assets."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import Sequence

from sarathi_sdlc import __version__


def _bundle_root() -> Path:
    override = os.environ.get("SARATHI_BUNDLE_ROOT")
    if override:
        return Path(override).expanduser().resolve()

    bundled = Path(__file__).resolve().parent / "_bundle"
    if bundled.is_dir():
        return bundled

    source_root = Path(__file__).resolve().parents[2]
    if (source_root / "scripts" / "install.sh").is_file():
        return source_root
    raise RuntimeError("Sarathi package assets are missing; reinstall sarathi-sdlc")


def _install_command(args: argparse.Namespace) -> list[str]:
    root = _bundle_root()
    skip_checkers = (
        not args.checkers
        if args.checkers is not None
        else args.scope == "user" and args.target is None
    )
    if os.name == "nt":
        command = [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(root / "scripts" / "install.ps1"),
        ]
        if args.target:
            command.extend(["-TargetRoot", args.target])
        command.extend(["-Scope", args.scope])
        if args.tools:
            command.extend(["-Tool", args.tools])
        if skip_checkers:
            command.append("-NoCheckers")
        if args.no_cross_install:
            command.append("-NoCrossInstall")
        if args.dry_run:
            command.append("-DryRun")
        if args.verbose:
            command.append("-v")
        return command

    command = ["bash", str(root / "scripts" / "install.sh"), "--scope", args.scope]
    if args.target:
        command.extend(["--target", args.target])
    if args.tools:
        command.extend(["--tools", args.tools])
    if skip_checkers:
        command.append("--no-checkers")
    if args.no_cross_install:
        command.append("--no-cross-install")
    if args.dry_run:
        command.append("--dry-run")
    if args.verbose:
        command.append("--verbose")
    return command


def _run_install(args: argparse.Namespace) -> int:
    return subprocess.run(_install_command(args), check=False).returncode


def _run_update_check(_: argparse.Namespace) -> int:
    checker = _bundle_root() / "scripts" / "check_update.py"
    return subprocess.run(
        [sys.executable, str(checker), "--verbose"], check=False
    ).returncode


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sarathi-sdlc",
        description="Install and inspect the Sarathi software-delivery skill bundle.",
    )
    parser.add_argument("--version", action="version", version=__version__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    install = subparsers.add_parser(
        "install", help="install bundled skills and prompts"
    )
    install.add_argument("--target")
    install.add_argument("--scope", choices=("user", "project"), default="user")
    install.add_argument("--tools", help="comma-separated installer targets")
    checker_mode = install.add_mutually_exclusive_group()
    checker_mode.add_argument(
        "--with-checkers",
        dest="checkers",
        action="store_true",
        help="copy project-local checkers during an implicit user install",
    )
    checker_mode.add_argument(
        "--no-checkers",
        dest="checkers",
        action="store_false",
        help="skip the separate project-local checker copy",
    )
    install.add_argument("--no-cross-install", action="store_true")
    install.add_argument("--dry-run", action="store_true")
    install.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="show destinations, per-tool actions, and install notes",
    )
    install.set_defaults(checkers=None, handler=_run_install)

    update = subparsers.add_parser(
        "check-update", help="check PyPI for a newer Sarathi release"
    )
    update.set_defaults(handler=_run_update_check)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return int(args.handler(args))
    except (OSError, RuntimeError) as exc:
        print(f"sarathi-sdlc: {exc}", file=sys.stderr)
        return 2
