"""Validate the machine-readable workflow values shared by Sarathi checkers."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from approvals import load_yaml_file
from schemas import is_plan_id, is_wave_id

WIP_ENUMS = {
    "Status Result": {
        "ready",
        "ready after minor fixes",
        "not ready",
        "cannot assess yet",
    },
    "Work Scope": {"product/system", "feature/component", "slice/change", "unknown"},
    "Ready To Implement": {"yes", "no", "unknown"},
    "Implementation Readiness": {"code-ready", "decomposable", "not ready", "unknown"},
    "Delivery Assurance Profile": {"lean", "standard", "high-assurance", "unknown"},
    "Review Level": {"lean", "standard", "high-assurance", "unknown"},
    "Delivery Profile": {"lean", "standard", "high-assurance", "unknown"},
    "Approval Policy": {
        "human checkpoints",
        "automatic eligible gates",
        "unknown",
    },
    "Work Outcome": {"product increment", "decision/evidence", "unknown"},
    "Feedback Status": {"received", "requested", "unavailable", "not-applicable"},
}
COMMAND = re.compile(
    r"(?:spec|design|plan|code)-(?:create|verify|review|assess)|workflow-status",
    re.I,
)


def issue(path: str, field: str, value: Any, reason: str) -> dict[str, Any]:
    return {"path": path, "field": field, "value": value, "reason": reason}


def validate_wip(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return [issue(".sdlc/wip.md", "file", None, str(exc))]

    issues: list[dict[str, Any]] = []
    values: dict[str, list[str]] = {}
    fields = {
        *WIP_ENUMS,
        "Current Command",
        "Current Stage",
        "Current Work Group",
        "Active Learning Wave",
        "Current Work",
        "Active Work Item",
        "Parallel Limit",
        "WIP Limit",
        "Active Slices",
    }
    for field in fields:
        values[field] = [
            match.group(1).strip()
            for match in re.finditer(rf"(?mi)^{re.escape(field)}:\s*(.*?)\s*$", text)
        ]

    for field, allowed in WIP_ENUMS.items():
        for value in values[field]:
            if value.casefold() not in allowed:
                issues.append(
                    issue(
                        ".sdlc/wip.md",
                        field,
                        value,
                        f"expected one of: {', '.join(sorted(allowed))}",
                    )
                )
    for field in ("Current Command", "Current Stage"):
        for value in values[field]:
            if not COMMAND.fullmatch(value):
                issues.append(
                    issue(
                        ".sdlc/wip.md",
                        field,
                        value,
                        "expected a command such as plan-review",
                    )
                )
    for field in ("Current Work Group", "Active Learning Wave"):
        for value in values[field]:
            if value.casefold() != "none" and not is_wave_id(value):
                issues.append(
                    issue(
                        ".sdlc/wip.md",
                        field,
                        value,
                        "expected none or a WAVE-AREA-NAME identifier",
                    )
                )
    for field in ("Current Work", "Active Work Item"):
        for value in values[field]:
            if value.casefold() != "none" and not is_plan_id(value, "WORK"):
                issues.append(
                    issue(
                        ".sdlc/wip.md",
                        field,
                        value,
                        "expected none or a WORK-AREA-NAME identifier",
                    )
                )
    for field in ("Parallel Limit", "WIP Limit"):
        for value in values[field]:
            if value.casefold() != "not-recorded" and not (
                value.isdigit() and int(value) > 0
            ):
                issues.append(
                    issue(
                        ".sdlc/wip.md",
                        field,
                        value,
                        "expected a positive integer or not-recorded",
                    )
                )
    for value in values["Active Slices"]:
        identifiers = [item.strip() for item in value.split(",") if item.strip()]
        if value.casefold() != "none" and (
            not identifiers
            or any(
                not (is_plan_id(item, "WORK") or is_plan_id(item, "PR"))
                for item in identifiers
            )
        ):
            issues.append(
                issue(
                    ".sdlc/wip.md",
                    "Active Slices",
                    value,
                    "expected none or comma-separated WORK-/PR- identifiers",
                )
            )
    return issues


def mapping(value: Any, path: str, field: str, issues: list[dict[str, Any]]) -> dict:
    if value is None:
        return {}
    if not isinstance(value, dict):
        issues.append(
            issue(path, field, value, "expected a YAML section with named fields")
        )
        return {}
    return value


def enum_value(
    source: dict,
    key: str,
    allowed: set[str],
    path: str,
    prefix: str,
    issues: list[dict[str, Any]],
) -> None:
    if key not in source:
        return
    value = source[key]
    if not isinstance(value, str) or value.casefold() not in allowed:
        issues.append(
            issue(
                path,
                f"{prefix}.{key}",
                value,
                f"expected one of: {', '.join(sorted(allowed))}",
            )
        )


def validate_process_decisions(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    display_path = ".sdlc/process-decisions.yaml"
    try:
        loaded = load_yaml_file(path)
    except (OSError, ValueError) as exc:
        return [issue(display_path, "file", None, str(exc))]
    if not isinstance(loaded, dict):
        return [
            issue(
                display_path,
                "document",
                loaded,
                "expected a YAML section with named fields",
            )
        ]

    issues: list[dict[str, Any]] = []
    project = mapping(
        loaded.get("project_entry"), display_path, "project_entry", issues
    )
    delivery = mapping(loaded.get("delivery"), display_path, "delivery", issues)
    approval = mapping(loaded.get("approval"), display_path, "approval", issues)
    bootstrap = mapping(loaded.get("bootstrap"), display_path, "bootstrap", issues)
    enum_value(
        project,
        "mode",
        {"greenfield", "brownfield_baseline", "brownfield_delta_only"},
        display_path,
        "project_entry",
        issues,
    )
    enum_value(
        project,
        "scope",
        {"product/system", "feature/component", "slice/change"},
        display_path,
        "project_entry",
        issues,
    )
    enum_value(
        delivery,
        "assurance_profile",
        {"lean", "standard", "high-assurance", "high_assurance"},
        display_path,
        "delivery",
        issues,
    )
    enum_value(
        delivery,
        "work_outcome",
        {"product_increment", "decision_evidence"},
        display_path,
        "delivery",
        issues,
    )
    if "extra_checks" in delivery:
        extra_checks = delivery["extra_checks"]
        valid = (
            isinstance(extra_checks, str) and extra_checks.casefold() == "none"
        ) or (
            isinstance(extra_checks, list)
            and all(isinstance(item, str) and item.strip() for item in extra_checks)
        )
        if not valid:
            issues.append(
                issue(
                    display_path,
                    "delivery.extra_checks",
                    extra_checks,
                    "expected none or a list of non-empty check names",
                )
            )
    enum_value(
        approval,
        "policy",
        {"human_checkpoints", "automatic_eligible_gates"},
        display_path,
        "approval",
        issues,
    )
    enum_value(
        approval,
        "authorization",
        {"explicit_user_choice", "explicit_yolo"},
        display_path,
        "approval",
        issues,
    )
    enum_value(
        bootstrap,
        "status",
        {"injected", "declined", "deferred"},
        display_path,
        "bootstrap",
        issues,
    )
    return issues


def validate_workflow_state(root: Path) -> list[dict[str, Any]]:
    return validate_wip(root / ".sdlc" / "wip.md") + validate_process_decisions(
        root / ".sdlc" / "process-decisions.yaml"
    )
