"""Helpers for parsing checker-visible Markdown structure."""

from __future__ import annotations

import re

FENCE = re.compile(r"^\s{0,3}(`{3,}|~{3,})")


def strip_fenced_code(text: str) -> str:
    """Replace fenced blocks with blank lines so examples cannot satisfy contracts."""
    output = []
    marker = None
    minimum = 0
    for line in text.splitlines():
        match = FENCE.match(line)
        if marker is None and match:
            marker = match.group(1)[0]
            minimum = len(match.group(1))
            output.append("")
            continue
        if marker is not None:
            trailing = line[match.end() :] if match else ""
            if (
                match
                and match.group(1)[0] == marker
                and len(match.group(1)) >= minimum
                and not trailing.strip()
            ):
                marker = None
                minimum = 0
            output.append("")
            continue
        output.append(line)
    return "\n".join(output)
