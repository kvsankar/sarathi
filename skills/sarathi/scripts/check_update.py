#!/usr/bin/env python3
"""Fail-open, cached update check for an installed Sarathi bundle."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

CACHE_SECONDS = 24 * 60 * 60
TIMEOUT_SECONDS = 3
VERSION_PATTERN = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def _manifest_path() -> Path:
    return Path(__file__).resolve().parents[1] / "manifest.json"


def _cache_path() -> Path:
    override = os.environ.get("SARATHI_UPDATE_CACHE")
    if override:
        return Path(override).expanduser()
    if os.name == "nt" and os.environ.get("LOCALAPPDATA"):
        base = Path(os.environ["LOCALAPPDATA"])
    else:
        base = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
    return base / "sarathi-sdlc" / "update.json"


def _version_tuple(value: str) -> tuple[int, int, int]:
    match = VERSION_PATTERN.fullmatch(value)
    if not match:
        raise ValueError(f"unsupported version: {value}")
    return tuple(int(part) for part in match.groups())  # type: ignore[return-value]


def _read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("expected a JSON object")
    return value


def _fresh_cached_version(path: Path, now: float) -> tuple[bool, str | None]:
    try:
        cache = _read_json(path)
        checked_at = float(cache["checked_at"])
        raw_latest = cache["latest_version"]
        latest = None if raw_latest is None else str(raw_latest)
        if latest is not None:
            _version_tuple(latest)
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return False, None
    fresh = 0 <= now - checked_at < CACHE_SECONDS
    return fresh, latest if fresh else None


def _fetch_latest(url: str) -> str:
    request = urllib.request.Request(
        url, headers={"User-Agent": "sarathi-sdlc-update-check"}
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        payload = json.load(response)
    latest = str(payload["info"]["version"])
    _version_tuple(latest)
    return latest


def _write_cache(path: Path, now: float, latest: str | None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps({"checked_at": now, "latest_version": latest}, sort_keys=True),
        encoding="utf-8",
    )
    temporary.replace(path)


def check_update(*, now: float | None = None) -> tuple[str, str | None]:
    manifest = _read_json(_manifest_path())
    current = str(manifest["version"])
    _version_tuple(current)

    if os.environ.get("SARATHI_UPDATE_CHECK", "1").lower() in {"0", "false", "no"}:
        return current, None

    checked_at = time.time() if now is None else now
    cache_path = _cache_path()
    cache_is_fresh, latest = _fresh_cached_version(cache_path, checked_at)
    if not cache_is_fresh:
        try:
            latest = _fetch_latest(str(manifest["update_url"]))
        except (OSError, TypeError, ValueError, KeyError, urllib.error.URLError):
            latest = None
        _write_cache(cache_path, checked_at, latest)
    return current, latest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    try:
        current, latest = check_update()
    except (
        KeyError,
        OSError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
        urllib.error.URLError,
    ) as exc:
        if args.verbose:
            print(f"Sarathi SDLC update status unavailable ({exc}).")
        return 0

    if latest is not None and _version_tuple(latest) > _version_tuple(current):
        print(
            f"Sarathi SDLC {latest} is available; installed version is {current}. "
            "Ask for explicit user approval before updating. If approved, install "
            f"the exact version with `uvx --from sarathi-sdlc=={latest} "
            "sarathi-sdlc install`, verify the installed manifest, and reload the "
            "agent tools."
        )
    elif latest is None and args.verbose:
        print("Sarathi SDLC update status unavailable.")
    elif args.verbose:
        print(f"Sarathi SDLC {current} is current.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
