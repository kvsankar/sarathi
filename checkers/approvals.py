"""Approval ledger helpers for deterministic SDLC gates.

The approval ledger is intentionally local and tool-agnostic. Projects may store
ticket or PR links as evidence, but the mechanical gate only trusts local YAML,
UTC timestamps, and artifact hashes.
"""

from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

UTC_TS = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
APPROVED_STATUSES = {"approved", "auto-approved"}


def _strip_comment(line: str) -> str:
    in_quote: str | None = None
    for i, ch in enumerate(line):
        if ch in {"'", '"'} and (i == 0 or line[i - 1] != "\\"):
            in_quote = None if in_quote == ch else ch
        if ch == "#" and in_quote is None:
            return line[:i]
    return line


def _scalar(raw: str) -> Any:
    value = raw.strip()
    if not value:
        return ""
    if (value[0], value[-1]) in {('"', '"'), ("'", "'")}:
        return value[1:-1]
    if value in {"true", "True"}:
        return True
    if value in {"false", "False"}:
        return False
    if value in {"null", "Null", "None", "~"}:
        return None
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [_scalar(part.strip()) for part in inner.split(",")]
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    return value


def _split_key_value(text: str) -> tuple[str, str]:
    if ":" not in text:
        raise ValueError(f"Expected key/value pair: {text!r}")
    key, value = text.split(":", 1)
    return key.strip(), value.strip()


def _yaml_subset(text: str) -> Any:
    """Parse the small YAML subset used by approval ledgers.

    Supports nested mappings, lists of mappings, scalars, quoted strings,
    booleans, integers, nulls, and simple inline lists. It is not a general YAML
    parser; if PyYAML is installed, `load_yaml_file` uses that instead.
    """

    lines: list[tuple[int, str]] = []
    for raw in text.splitlines():
        cleaned = _strip_comment(raw).rstrip()
        if not cleaned.strip():
            continue
        indent = len(cleaned) - len(cleaned.lstrip(" "))
        lines.append((indent, cleaned.strip()))

    def parse_block(index: int, indent: int) -> tuple[Any, int]:
        if index >= len(lines):
            return {}, index
        if lines[index][1].startswith("- "):
            return parse_list(index, indent)
        return parse_dict(index, indent)

    def parse_dict(index: int, indent: int) -> tuple[dict[str, Any], int]:
        out: dict[str, Any] = {}
        while index < len(lines):
            line_indent, content = lines[index]
            if line_indent < indent or content.startswith("- "):
                break
            if line_indent > indent:
                raise ValueError(f"Unexpected indentation near: {content!r}")
            key, value = _split_key_value(content)
            index += 1
            if value:
                out[key] = _scalar(value)
            elif index < len(lines) and lines[index][0] > line_indent:
                out[key], index = parse_block(index, lines[index][0])
            else:
                out[key] = None
        return out, index

    def parse_list(index: int, indent: int) -> tuple[list[Any], int]:
        out: list[Any] = []
        while index < len(lines):
            line_indent, content = lines[index]
            if line_indent < indent or not content.startswith("- "):
                break
            if line_indent > indent:
                raise ValueError(f"Unexpected list indentation near: {content!r}")
            item_text = content[2:].strip()
            index += 1
            if not item_text:
                if index < len(lines) and lines[index][0] > line_indent:
                    item, index = parse_block(index, lines[index][0])
                else:
                    item = None
            elif ":" in item_text:
                key, value = _split_key_value(item_text)
                item = {key: _scalar(value)} if value else {key: None}
                if not value and index < len(lines) and lines[index][0] > line_indent:
                    item[key], index = parse_block(index, lines[index][0])
                if index < len(lines) and lines[index][0] > line_indent:
                    extra, index = parse_dict(index, lines[index][0])
                    item.update(extra)
            else:
                item = _scalar(item_text)
            out.append(item)
        return out, index

    if not lines:
        return {}
    parsed, final = parse_block(0, lines[0][0])
    if final != len(lines):
        raise ValueError("Could not parse complete YAML subset")
    return parsed


def load_yaml_file(path: Path) -> Any:
    text = path.read_text(encoding="utf-8")
    return _yaml_subset(text)


def sha256_file(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def valid_utc_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not UTC_TS.fullmatch(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
    except ValueError:
        return False
    return True


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _norm_rel(path: str | Path) -> str:
    return Path(path).as_posix().lstrip("./")


def _norm_project_path(project_root: Path, path: str | Path) -> str:
    candidate = Path(path)
    if candidate.is_absolute():
        try:
            return candidate.resolve().relative_to(project_root.resolve()).as_posix()
        except ValueError:
            return candidate.as_posix()
    return _norm_rel(candidate)


def _policy_allows(
    record: dict[str, Any],
    policy: dict[str, Any],
    now: datetime | None = None,
) -> list[str]:
    issues: list[str] = []
    auto = policy.get("auto_approval") if isinstance(policy, dict) else None
    if not isinstance(auto, dict) or auto.get("enabled") is not True:
        return ["auto approval used but not enabled in gates policy"]
    gate = record.get("gate")
    scope = record.get("scope")
    allowed_gates = {str(x) for x in _as_list(auto.get("allowed_gates"))}
    allowed_scopes = {str(x) for x in _as_list(auto.get("allowed_scopes"))}
    forbidden_gates = {str(x) for x in _as_list(auto.get("forbidden_gates"))}
    if gate in forbidden_gates:
        issues.append(f"gate {gate} is forbidden for auto approval")
    if "*" not in allowed_gates and gate not in allowed_gates:
        issues.append(f"gate {gate} is not allowed for auto approval")
    if "*" not in allowed_scopes and scope not in allowed_scopes:
        issues.append(f"scope {scope} is not allowed for auto approval")
    expires_at = auto.get("expires_at")
    if not valid_utc_timestamp(expires_at):
        issues.append("auto approval policy expires_at must be UTC ISO-8601")
    else:
        expiry = datetime.strptime(str(expires_at), "%Y-%m-%dT%H:%M:%SZ").replace(
            tzinfo=UTC
        )
        if (now or datetime.now(UTC)) >= expiry:
            issues.append("auto approval policy is expired")
    return issues


def validate_approval_record(
    record: Any,
    project_root: Path,
    gates_policy: dict[str, Any] | None = None,
) -> list[str]:
    issues: list[str] = []
    if not isinstance(record, dict):
        return ["approval record must be a mapping"]
    for key in (
        "id",
        "gate",
        "scope",
        "artifact",
        "status",
        "approved_by",
        "approved_at",
    ):
        if not record.get(key):
            issues.append(f"missing {key}")
    if record.get("status") not in APPROVED_STATUSES:
        issues.append("status must be approved or auto-approved")
    if not valid_utc_timestamp(record.get("approved_at")):
        issues.append("approved_at must be UTC ISO-8601 like 2026-07-01T14:32:18Z")
    artifact = record.get("artifact")
    if not isinstance(artifact, dict):
        issues.append("artifact must be a mapping")
        return issues
    for key in ("kind", "path", "sha256"):
        if not artifact.get(key):
            issues.append(f"artifact missing {key}")
    artifact_path = project_root / str(artifact.get("path", ""))
    actual_hash = sha256_file(artifact_path)
    if actual_hash is None:
        issues.append(f"artifact path does not exist: {artifact.get('path')}")
    elif artifact.get("sha256") != actual_hash:
        issues.append(f"artifact hash is stale: {artifact.get('path')}")
    if record.get("status") == "auto-approved":
        issues.extend(_policy_allows(record, gates_policy or {}))
    return issues


def load_approval_context(
    project_root: Path,
    approvals_path: str = ".sdlc/approvals.yaml",
    gates_path: str = ".sdlc/gates.yaml",
) -> dict[str, Any]:
    approvals_file = project_root / approvals_path
    gates_file = project_root / gates_path
    context: dict[str, Any] = {
        "approvals_path": approvals_path,
        "gates_path": gates_path,
        "exists": approvals_file.exists(),
        "records": [],
        "invalid_records": [],
        "load_error": None,
    }
    gates_policy: dict[str, Any] = {}
    try:
        if gates_file.exists():
            loaded_policy = load_yaml_file(gates_file)
            gates_policy = loaded_policy if isinstance(loaded_policy, dict) else {}
        context["gates_policy_exists"] = gates_file.exists()
        context["gates_policy"] = gates_policy
        if not approvals_file.exists():
            return context
        data = load_yaml_file(approvals_file)
        records = data.get("approvals") if isinstance(data, dict) else None
        if not isinstance(records, list):
            context["load_error"] = "approvals must be a list"
            return context
        context["records"] = records
        invalid = []
        for record in records:
            issues = validate_approval_record(record, project_root, gates_policy)
            if issues:
                invalid.append(
                    {
                        "id": record.get("id") if isinstance(record, dict) else None,
                        "issues": issues,
                    }
                )
        context["invalid_records"] = invalid
    except Exception as exc:  # noqa: BLE001 - checker reports deterministic load errors.
        context["load_error"] = str(exc)
    return context


def approval_requirement(
    context: dict[str, Any],
    project_root: Path,
    gate: str,
    artifact_path: str | Path,
    scope: str | None = None,
) -> dict[str, Any]:
    wanted = _norm_project_path(project_root, artifact_path)
    result: dict[str, Any] = {
        "gate": gate,
        "artifact": wanted,
        "scope": scope,
        "approved": False,
        "approval_id": None,
        "status": None,
        "issues": [],
    }
    if context.get("load_error"):
        result["issues"].append(f"approval ledger load failed: {context['load_error']}")
        return result
    if not context.get("exists"):
        result["issues"].append(f"approval ledger missing: {context['approvals_path']}")
        return result
    invalid_by_id = {
        item["id"]: item["issues"] for item in context.get("invalid_records", [])
    }
    for record in context.get("records", []):
        if not isinstance(record, dict):
            continue
        artifact = record.get("artifact")
        if not isinstance(artifact, dict):
            continue
        if record.get("gate") != gate:
            continue
        if scope is not None and record.get("scope") != scope:
            continue
        if _norm_project_path(project_root, str(artifact.get("path", ""))) != wanted:
            continue
        result["approval_id"] = record.get("id")
        result["status"] = record.get("status")
        issues = invalid_by_id.get(record.get("id"), [])
        if issues:
            result["issues"].extend(issues)
            return result
        result["approved"] = True
        return result
    result["issues"].append("matching approval not found")
    return result


def approval_gate_passed(requirements: list[dict[str, Any]]) -> bool:
    return all(item.get("approved") for item in requirements)
