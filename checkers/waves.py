"""Deterministic parser for ordered learning-wave declarations in plans."""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

CHECKER_DIR = Path(__file__).resolve().parent
if str(CHECKER_DIR) not in sys.path:
    sys.path.insert(0, str(CHECKER_DIR))

from markdown_structure import annotation_attrs, strip_fenced_code  # noqa: E402
from schemas import (  # noqa: E402
    PLAN_ID_CANDIDATE,
    WAVE_ID_CANDIDATE,
    is_plan_id,
    is_wave_id,
)

HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
WAVE_FIELDS = (
    ("Order", "order"),
    ("Learning Target", "learning_target"),
    ("Members", "members_raw"),
    ("WIP Limit", "wip_limit"),
    ("Feedback/Integration Checkpoint", "checkpoint"),
    ("Stop/Replan Triggers", "stop_or_replan"),
)


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
        rf"(?:\*\*)?\s*:\s*(.+?)\s*$",
        block,
    )
    return match.group(1).strip() if match else None


def parse_learning_waves(text: str, plan_path: str | None = None) -> dict[str, Any]:
    """Parse an optional ``Learning Waves`` section without inventing status."""
    text = strip_fenced_code(text)
    body = _section(text, "Waves") or _section(text, "Learning Waves")
    result: dict[str, Any] = {
        "declared": body is not None,
        "waves": [],
        "malformed_ids": [],
        "duplicates": [],
        "missing_fields": {},
        "invalid_orders": [],
        "invalid_wip_limits": [],
        "duplicate_orders": [],
        "invalid_members": {},
        "invalid_member_kinds": {},
        "duplicate_members": {},
        "empty_members": [],
    }
    if body is None:
        return result

    plan_type_match = re.search(
        r"(?mi)^\s*(?:[-*+]\s+)?(?:\*\*)?Plan Type(?:\*\*)?\s*:\s*"
        r"(Breakdown|Implementation)\s*$",
        text,
    )
    expected_member_kind = (
        "WORK"
        if plan_type_match and plan_type_match.group(1).casefold() == "breakdown"
        else "PR"
        if plan_type_match
        else None
    )

    lines = body.splitlines()
    starts: list[tuple[int, str, str]] = []
    for index, line in enumerate(lines):
        heading = HEADING.match(line.strip())
        if not heading:
            continue
        candidate = WAVE_ID_CANDIDATE.search(heading.group(2))
        if candidate:
            starts.append((index, candidate.group(), heading.group(2).strip()))
            continue
        for following in lines[index + 1 :]:
            if not following.strip():
                continue
            attrs = annotation_attrs(following)
            identifier = attrs.get("id")
            if identifier and identifier.casefold().startswith("wave-"):
                starts.append((index, identifier, heading.group(2).strip()))
            break

    seen_ids: list[str] = []
    orders: list[int] = []
    for position, (start, identifier, heading) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
        block = "\n".join(lines[start + 1 : end])
        if not is_wave_id(identifier):
            result["malformed_ids"].append(identifier)
            continue
        seen_ids.append(identifier)
        fields = {key: _field(block, label) for label, key in WAVE_FIELDS}
        missing = [key for _, key in WAVE_FIELDS if not fields[key]]
        if missing:
            result["missing_fields"][identifier] = missing

        order_text = fields["order"] or ""
        order = (
            int(order_text) if order_text.isdigit() and int(order_text) > 0 else None
        )
        if order is None:
            result["invalid_orders"].append(identifier)
        else:
            orders.append(order)

        members_raw = fields["members_raw"] or ""
        candidates = [
            match.group() for match in PLAN_ID_CANDIDATE.finditer(members_raw)
        ]
        members = [
            member
            for member in candidates
            if is_plan_id(member, "WORK") or is_plan_id(member, "PR")
        ]
        if not members:
            result["empty_members"].append(identifier)
        invalid_members = [member for member in candidates if member not in members]
        if invalid_members:
            result["invalid_members"][identifier] = sorted(
                dict.fromkeys(invalid_members)
            )
        wrong_kinds = [
            member
            for member in members
            if expected_member_kind
            and not member.startswith(f"{expected_member_kind}-")
        ]
        if wrong_kinds:
            result["invalid_member_kinds"][identifier] = sorted(
                dict.fromkeys(wrong_kinds)
            )
        repeated_members = sorted(
            member for member, count in Counter(members).items() if count > 1
        )
        if repeated_members:
            result["duplicate_members"][identifier] = repeated_members
        wip_limit_text = str(fields["wip_limit"] or "")
        wip_limit = (
            int(wip_limit_text)
            if wip_limit_text.isdigit() and int(wip_limit_text) > 0
            else None
        )
        if wip_limit is None:
            result["invalid_wip_limits"].append(identifier)
        result["waves"].append(
            {
                "id": identifier,
                "name": (
                    identifier.removeprefix("WAVE-").replace("-", " ").title()
                    if WAVE_ID_CANDIDATE.search(heading)
                    else heading.replace("*", "").replace("`", "").strip()
                ),
                "heading": heading,
                "order": order,
                "learning_target": fields["learning_target"],
                "members": list(dict.fromkeys(members)),
                "wip_limit": wip_limit,
                "checkpoint": fields["checkpoint"],
                "stop_or_replan": fields["stop_or_replan"],
                "plan_path": plan_path,
            }
        )

    result["duplicates"] = sorted(
        identifier for identifier, count in Counter(seen_ids).items() if count > 1
    )
    result["duplicate_orders"] = sorted(
        order for order, count in Counter(orders).items() if count > 1
    )
    result["malformed_ids"] = sorted(dict.fromkeys(result["malformed_ids"]))
    result["invalid_orders"] = sorted(dict.fromkeys(result["invalid_orders"]))
    result["invalid_wip_limits"] = sorted(dict.fromkeys(result["invalid_wip_limits"]))
    result["empty_members"] = sorted(dict.fromkeys(result["empty_members"]))
    return result
