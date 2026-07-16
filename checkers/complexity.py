"""Parse the shared qualitative complexity-budget artifact contract."""

from __future__ import annotations

import re
from typing import Any

from markdown_structure import strip_fenced_code

HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
COMMON_FIELDS = (
    ("Mental Model", "mental_model"),
    ("Current Consumers", "current_consumers"),
    ("Proposed Additions", "proposed_additions"),
    ("Existing Evidence Reused", "existing_evidence_reused"),
    ("Deleted or Deferred", "deleted_or_deferred"),
)
PLAN_FIELD = ("Implementation PR Count", "implementation_pr_count")


def _normalized_heading(value: str) -> str:
    return re.sub(
        r"\s+", " ", value.replace("*", "").replace("`", "").strip()
    ).casefold()


def _section(text: str, title: str) -> str | None:
    wanted = _normalized_heading(title)
    lines = text.splitlines()
    start = None
    level = 0
    for index, line in enumerate(lines):
        match = HEADING.match(line.strip())
        if match and _normalized_heading(match.group(2)) == wanted:
            start = index + 1
            level = len(match.group(1))
            break
    if start is None:
        return None
    end = len(lines)
    for index in range(start, len(lines)):
        match = HEADING.match(lines[index].strip())
        if match and len(match.group(1)) <= level:
            end = index
            break
    return "\n".join(lines[start:end])


def _field(block: str, label: str) -> str | None:
    match = re.search(
        rf"(?mi)^\s*(?:[-*+]\s+)?(?:\*\*)?{re.escape(label)}"
        rf"(?:\*\*)?\s*:\s*(\S.*?)\s*$",
        block,
    )
    return match.group(1).strip() if match else None


def parse_complexity_budget(text: str, *, plan: bool = False) -> dict[str, Any]:
    """Return exact budget fields without making a qualitative judgment."""
    text = strip_fenced_code(text)
    body = _section(text, "Complexity Budget")
    fields = (*COMMON_FIELDS, PLAN_FIELD) if plan else COMMON_FIELDS
    values = {key: _field(body or "", label) for label, key in fields}
    missing = [key for _, key in fields if not values[key]]
    pr_count = None
    invalid_pr_count = False
    if plan and values[PLAN_FIELD[1]]:
        raw_count = str(values[PLAN_FIELD[1]])
        invalid_pr_count = not raw_count.isdigit()
        if not invalid_pr_count:
            pr_count = int(raw_count)
    return {
        "declared": body is not None,
        "fields": values,
        "missing_fields": missing,
        "implementation_pr_count": pr_count,
        "invalid_implementation_pr_count": invalid_pr_count,
    }
