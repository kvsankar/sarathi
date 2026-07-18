#!/usr/bin/env python3
"""Run the canonical update checker bundled with the Sarathi skill."""

import runpy
from pathlib import Path

runpy.run_path(
    str(
        Path(__file__).resolve().parents[1]
        / "skills"
        / "sarathi"
        / "scripts"
        / "check_update.py"
    ),
    run_name="__main__",
)
