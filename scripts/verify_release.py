#!/usr/bin/env python3
"""Verify that release metadata agrees with a proposed Git tag."""

from __future__ import annotations

import argparse
import json
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("tag", help="release tag in vMAJOR.MINOR.PATCH form")
    args = parser.parse_args()

    project = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    manifest = json.loads(
        (ROOT / "skills" / "sarathi" / "manifest.json").read_text(encoding="utf-8")
    )
    version = str(project["project"]["version"])
    expected_tag = f"v{version}"
    if args.tag != expected_tag:
        parser.error(f"tag {args.tag!r} does not match package version {version!r}")
    if manifest.get("version") != version:
        parser.error("skill manifest version does not match package version")
    if project["project"]["name"] != manifest.get("distribution"):
        parser.error("skill manifest distribution does not match package name")
    print(f"Release metadata matches {expected_tag}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
