#!/usr/bin/env python3
# ruff: noqa: E501 - embedded standalone HTML/CSS is clearer without Python wrapping.
"""Render a deterministic HTML view of a Sarathi workflow's expansion state."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

CHECKER_DIR = Path(__file__).resolve().parent
if str(CHECKER_DIR) not in sys.path:
    sys.path.insert(0, str(CHECKER_DIR))

from approvals import load_yaml_file  # noqa: E402

APPROVED_STATUSES = {"approved", "auto-approved"}
EXCLUDED_DIRS = {
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".tox",
    ".venv",
    "__pycache__",
    "dist",
    "node_modules",
    "vendor",
}
METADATA_FIELDS = (
    "Work Scope",
    "Implementation Readiness",
    "Plan Type",
    "Design Depth",
)
WORK_ID = re.compile(r"WORK-[A-Z][A-Z0-9-]*")
PR_ID = re.compile(r"PR-[A-Z][A-Z0-9-]*")
GUIDE_FILENAME = "sarathi-process.html"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def default_guide_source() -> Path | None:
    candidate = CHECKER_DIR.parent / "docs" / "sarathi.html"
    return candidate if candidate.is_file() else None


def relative_path(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def included(path: Path, root: Path) -> bool:
    try:
        parts = path.resolve().relative_to(root.resolve()).parts
    except ValueError:
        return False
    return not any(part in EXCLUDED_DIRS for part in parts)


def discover(root: Path, filename: str) -> list[Path]:
    return sorted(
        (path for path in root.rglob(filename) if included(path, root)),
        key=lambda path: (
            len(path.relative_to(root).parts),
            path.as_posix().casefold(),
        ),
    )


def first_heading(text: str) -> str | None:
    match = re.search(r"(?m)^#\s+(.+?)\s*$", text)
    return match.group(1).strip() if match else None


def metadata(text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for field in METADATA_FIELDS:
        match = re.search(rf"(?mi)^{re.escape(field)}:\s*(.+?)\s*$", text)
        if match:
            result[field] = match.group(1).strip().rstrip(".")
    return result


def canonical_artifact(root: Path, kind: str) -> Path | None:
    candidates = discover(root, f"{kind}.md")
    preferred = [root / "docs" / f"{kind}.md", root / f"{kind}.md"]
    for path in preferred:
        if path in candidates:
            return path
    if kind == "plan":
        for path in candidates:
            if metadata(read_text(path)).get("Plan Type", "").casefold() == "breakdown":
                return path
    return candidates[0] if candidates else None


def resolve_ledger_path(root: Path, raw_path: str) -> Path | None:
    normalized = Path(raw_path.replace("\\", "/"))
    candidates = [root / normalized, root.parent / normalized]
    if normalized.parts and normalized.parts[0].casefold() == root.name.casefold():
        candidates.append(root.joinpath(*normalized.parts[1:]))
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def load_approval_records(root: Path) -> tuple[list[dict[str, Any]], str | None]:
    path = root / ".sdlc" / "approvals.yaml"
    if not path.is_file():
        return [], None
    try:
        loaded = load_yaml_file(path)
    except (OSError, ValueError) as exc:
        return [], str(exc)
    records = loaded.get("approvals") if isinstance(loaded, dict) else None
    if not isinstance(records, list):
        return [], "approvals must be a list"
    return [record for record in records if isinstance(record, dict)], None


def approval_for(
    root: Path, path: Path, gate: str, records: list[dict[str, Any]]
) -> dict[str, Any]:
    current_hash = sha256_file(path)
    path_matches: list[dict[str, Any]] = []
    for record in records:
        artifact = record.get("artifact")
        if record.get("gate") != gate or not isinstance(artifact, dict):
            continue
        resolved = resolve_ledger_path(root, str(artifact.get("path", "")))
        if resolved is None or resolved.resolve() != path.resolve():
            continue
        path_matches.append(record)
    path_matches.sort(key=lambda item: str(item.get("approved_at", "")), reverse=True)
    for record in path_matches:
        artifact = record.get("artifact", {})
        if (
            record.get("status") in APPROVED_STATUSES
            and artifact.get("sha256") == current_hash
        ):
            return {
                "state": "approved",
                "id": record.get("id"),
                "status": record.get("status"),
                "hash": current_hash,
            }
    return {
        "state": "stale" if path_matches else "unapproved",
        "id": path_matches[0].get("id") if path_matches else None,
        "status": path_matches[0].get("status") if path_matches else None,
        "hash": current_hash,
    }


def artifact_model(
    root: Path,
    kind: str,
    path: Path | None,
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    if path is None:
        return {
            "kind": kind,
            "state": "missing",
            "title": kind.title(),
            "path": None,
            "metadata": {},
            "approval": None,
        }
    text = read_text(path)
    gate = f"{kind}.approved"
    approval = approval_for(root, path, gate, records)
    return {
        "kind": kind,
        "state": approval["state"],
        "title": first_heading(text) or kind.title(),
        "path": relative_path(path, root),
        "metadata": metadata(text),
        "approval": approval,
    }


def section(text: str, heading: str) -> str:
    match = re.search(rf"(?ms)^##\s+{re.escape(heading)}\s*$\n(.*?)(?=^##\s+|\Z)", text)
    return match.group(1) if match else ""


def paragraph_field(block: str, label: str) -> str | None:
    match = re.search(
        rf"(?ms)^\s{{2}}{re.escape(label)}:\s*(.+?)"
        rf"(?=\n\s{{2}}[A-Z][A-Za-z /-]+:\s|\Z)",
        block,
    )
    if not match:
        return None
    return " ".join(line.strip() for line in match.group(1).splitlines()).strip()


def work_items(plan_text: str) -> list[dict[str, Any]]:
    body = section(plan_text, "Pull Requests / Child Work Items") or section(
        plan_text, "Pull Requests"
    )
    result: list[dict[str, Any]] = []
    for match in re.finditer(
        r"(?ms)^-\s+(WORK-[A-Z][A-Z0-9-]*)\s*$\n(.*?)(?=^-\s+WORK-|\Z)", body
    ):
        identifier, block = match.groups()
        scope = paragraph_field(block, "Scope")
        result.append(
            {
                "id": identifier,
                "name": identifier.removeprefix("WORK-").replace("-", " ").title(),
                "parent_scope": paragraph_field(block, "Parent scope"),
                "child_scope": paragraph_field(block, "Child scope"),
                "scope": scope,
                "dependencies": paragraph_field(block, "Dependencies"),
                "readiness_target": paragraph_field(block, "Readiness target"),
                "child_requirement": paragraph_field(block, "Required child artifacts")
                or paragraph_field(block, "Required child artifact"),
                "parent_obligations": paragraph_field(
                    block, "Parent IDs / inherited obligations"
                ),
                "done_signal": paragraph_field(block, "Done signal"),
                "risks": paragraph_field(block, "Risks"),
            }
        )
    return result


def parse_wip(root: Path) -> dict[str, Any]:
    path = root / ".sdlc" / "wip.md"
    result: dict[str, Any] = {"exists": path.is_file(), "artifacts": {}}
    if not path.is_file():
        return result
    text = read_text(path)
    for field in (
        "Current Stage",
        "Current Gate",
        "Project Entry Mode",
        "Work Scope",
        "Implementation Readiness",
    ):
        match = re.search(rf"(?mi)^{re.escape(field)}:\s*(.+?)\s*$", text)
        if match:
            result[field] = match.group(1).strip()
    current_artifacts = section(text, "Current Artifacts")
    for line in current_artifacts.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 3 or cells[0] in {"Kind", "---"} or set(cells[0]) == {"-"}:
            continue
        result["artifacts"][cells[1].replace("`", "")] = {
            "kind": cells[0],
            "status": cells[2],
            "notes": cells[3] if len(cells) > 3 else "",
        }
    result["path"] = relative_path(path, root)
    return result


def wip_claim_for(wip: dict[str, Any], path: str) -> dict[str, str] | None:
    normalized = path.replace("\\", "/").lstrip("./")
    for raw_path, claim in wip.get("artifacts", {}).items():
        candidate = str(raw_path).replace("\\", "/").lstrip("./")
        if candidate == normalized or candidate.endswith(f"/{normalized}"):
            return claim
    return None


def child_artifacts(
    root: Path, canonical_paths: dict[str, Path | None]
) -> dict[str, dict[str, Path]]:
    result: dict[str, dict[str, Path]] = {}
    excluded = {path.resolve() for path in canonical_paths.values() if path is not None}
    for path in discover(root, "*.md"):
        if path.resolve() in excluded:
            continue
        text = read_text(path)
        values = metadata(text)
        heading = first_heading(text) or ""
        parent_match = re.search(
            r"(?mi)^Parent Work Item:\s*(WORK-[A-Z][A-Z0-9-]*)\s*$", text
        )
        heading_match = WORK_ID.search(heading)
        identifier = (
            parent_match.group(1)
            if parent_match
            else heading_match.group()
            if heading_match
            else None
        )
        if identifier is None:
            continue
        plan_type = values.get("Plan Type", "").casefold()
        filename = path.stem.casefold()
        heading_text = heading.casefold()
        if plan_type in {"breakdown", "implementation"}:
            kind = "plan"
        elif values.get("Design Depth") or "design" in filename:
            kind = "design"
        elif (
            "spec" in filename or "software requirements specification" in heading_text
        ):
            kind = "spec"
        else:
            continue
        result.setdefault(identifier, {}).setdefault(kind, path)
    return result


def scope_level(value: str | None) -> str | None:
    normalized = str(value or "").casefold()
    if "product" in normalized or "system" in normalized:
        return "product"
    if "feature" in normalized or "component" in normalized:
        return "feature"
    if "slice" in normalized or "change" in normalized:
        return "slice"
    return None


def child_level(item: dict[str, Any], child: dict[str, Any] | None) -> str | None:
    declared = scope_level(item.get("child_scope"))
    if declared:
        return declared
    if child:
        discovered = scope_level(child.get("metadata", {}).get("Work Scope"))
        if discovered:
            return discovered
    return scope_level(item.get("child_requirement"))


def traceability_counts(root: Path) -> tuple[dict[str, int], str | None]:
    path = root / ".sdlc" / "test-traceability.yaml"
    if not path.is_file():
        return {}, None
    try:
        loaded = load_yaml_file(path)
    except (OSError, ValueError) as exc:
        return {}, str(exc)
    tests = loaded.get("tests") if isinstance(loaded, dict) else None
    if not isinstance(tests, list):
        return {}, "tests must be a list"
    counts: dict[str, int] = {}
    for entry in tests:
        if not isinstance(entry, dict):
            continue
        identifier = str(entry.get("plan", ""))
        test_path = resolve_ledger_path(root, str(entry.get("path", "")))
        if not PR_ID.fullmatch(identifier) or test_path is None:
            continue
        counts[identifier] = counts.get(identifier, 0) + 1
    return counts, None


def project_title(root: Path, spec: dict[str, Any]) -> str:
    title = str(spec.get("title") or "").strip()
    if title:
        for separator in (" — ", " - "):
            if separator in title:
                return title.split(separator, 1)[0]
        return re.sub(r"\s+Software Requirements Specification$", "", title).strip()
    return root.name.replace("-", " ").title()


def build_model(root: Path) -> dict[str, Any]:
    root = root.resolve()
    records, approval_error = load_approval_records(root)
    paths = {
        kind: canonical_artifact(root, kind) for kind in ("spec", "design", "plan")
    }
    stages = {
        kind: artifact_model(root, kind, paths[kind], records)
        for kind in ("spec", "design", "plan")
    }
    wip = parse_wip(root)
    linked_artifacts = child_artifacts(root, paths)
    traces, traceability_error = traceability_counts(root)
    parent_text = read_text(paths["plan"]) if paths["plan"] else ""
    items = work_items(parent_text)
    parent_level = scope_level(
        stages["plan"].get("metadata", {}).get("Work Scope")
    ) or scope_level(stages["spec"].get("metadata", {}).get("Work Scope"))
    for item in items:
        item["parent_level"] = parent_level
        linked = linked_artifacts.get(item["id"], {})
        spec_path = linked.get("spec")
        design_path = linked.get("design")
        child_path = linked.get("plan")
        item["child_spec"] = (
            artifact_model(root, "spec", spec_path, records) if spec_path else None
        )
        item["child_design"] = (
            artifact_model(root, "design", design_path, records)
            if design_path
            else None
        )
        if child_path is None:
            item.update(
                {
                    "state": "started"
                    if item["child_spec"] or item["child_design"]
                    else "frontier",
                    "child_plan": None,
                    "child_level": child_level(item, None),
                    "prs": [],
                    "evidence_count": 0,
                    "wip_claim": None,
                }
            )
            continue
        child_text = read_text(child_path)
        child_relative = relative_path(child_path, root)
        prs = []
        for identifier in dict.fromkeys(
            re.findall(r"(?m)^-\s+(PR-[A-Z][A-Z0-9-]*)\s*$", child_text)
        ):
            prs.append({"id": identifier, "evidence_count": traces.get(identifier, 0)})
        evidence_count = sum(pr["evidence_count"] for pr in prs)
        claim = wip_claim_for(wip, child_relative)
        item.update(
            {
                "state": "evidence" if evidence_count else "expanded",
                "child_plan": artifact_model(root, "plan", child_path, records),
                "child_level": None,
                "prs": prs,
                "evidence_count": evidence_count,
                "wip_claim": claim,
            }
        )
        item["child_level"] = child_level(item, item["child_plan"])
    expanded = sum(item["child_plan"] is not None for item in items)
    pr_count = sum(len(item["prs"]) for item in items)
    evidenced_prs = sum(
        pr["evidence_count"] > 0 for item in items for pr in item["prs"]
    )
    source_paths = [path for path in paths.values() if path is not None]
    for optional in (
        root / ".sdlc" / "approvals.yaml",
        root / ".sdlc" / "wip.md",
        root / ".sdlc" / "test-traceability.yaml",
    ):
        if optional.is_file():
            source_paths.append(optional)
    source_paths.extend(
        path for artifacts in linked_artifacts.values() for path in artifacts.values()
    )
    unique_sources = sorted(
        set(source_paths), key=lambda path: relative_path(path, root)
    )
    model: dict[str, Any] = {
        "project": project_title(root, stages["spec"]),
        "stages": stages,
        "wip": wip,
        "work_items": items,
        "summary": {
            "approved_stages": sum(
                stage["state"] == "approved" for stage in stages.values()
            ),
            "work_items": len(items),
            "expanded_items": expanded,
            "pr_slices": pr_count,
            "evidenced_prs": evidenced_prs,
        },
        "approval_error": approval_error,
        "traceability_error": traceability_error,
        "sources": [
            {"path": relative_path(path, root), "sha256": sha256_file(path)}
            for path in unique_sources
        ],
    }
    fingerprint_input = json.dumps(model, sort_keys=True, separators=(",", ":"))
    model["fingerprint"] = hashlib.sha256(fingerprint_input.encode()).hexdigest()[:16]
    return model


def esc(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)


def href_for(root: Path, output: Path, relative: str | None) -> str | None:
    if not relative:
        return None
    target = root / relative
    path = os.path.relpath(target, output.parent).replace(os.sep, "/")
    return quote(path, safe="/._-")


def state_label(state: str) -> str:
    return {
        "approved": "Approved",
        "unapproved": "Present",
        "stale": "Approval stale",
        "missing": "Not yet done",
        "frontier": "Not yet decomposed",
        "expanded": "Plan expanded",
        "started": "Artifacts started",
        "evidence": "Evidence mapped",
        "planned": "PRs planned",
    }.get(state, state.replace("-", " ").title())


def badge(state: str, label: str | None = None) -> str:
    if state == "approved":
        visual, symbol = "success", "&#10003;"
    elif state in {"stale", "unapproved", "expanded", "started", "evidence", "planned"}:
        visual, symbol = "progress", "&#9679;"
    else:
        visual, symbol = "pending", "&#9675;"
    return (
        f'<span class="status status-{visual}"><span aria-hidden="true">{symbol}</span>'
        f"{esc(label or state_label(state))}</span>"
    )


def artifact_link(root: Path, output: Path, stage: dict[str, Any]) -> str:
    href = href_for(root, output, stage.get("path"))
    if href is None:
        return '<span class="empty">No artifact discovered</span>'
    return f'<a href="{href}">{esc(stage["path"])}</a>'


def display_level(level: str | None) -> str:
    return {"product": "Product", "feature": "Feature", "slice": "Slice"}.get(
        str(level), "Level unknown"
    )


def render_artifact_node(
    root: Path,
    output: Path,
    kind: str,
    level: str | None,
    title: str,
    stage: dict[str, Any] | None,
    missing_text: str | None = None,
) -> str:
    state = stage.get("state", "missing") if stage else "missing"
    level_class = level if level in {"product", "feature", "slice"} else "unknown"
    kind_label = {
        "spec": "Spec",
        "design": "Design",
        "plan": "Plan",
    }[kind]
    if stage and stage.get("path"):
        readiness = stage.get("metadata", {}).get("Implementation Readiness")
        details = artifact_link(root, output, stage)
        if readiness:
            details += f"<small>{esc(readiness)}</small>"
    else:
        details = (
            f'<span class="empty">{esc(missing_text)}</span>'
            if missing_text
            else f'<span class="empty">No child {esc(kind_label.casefold())} discovered</span>'
        )
    return f"""
<div class="node artifact-{esc(kind)}">
  <div class="node-meta">
    <div class="identity-tags"><span class="level level-{esc(level_class)}">{esc(display_level(level))}</span><span class="kind">{esc(kind_label)}</span></div>
    {badge(state)}
  </div>
  <strong>{esc(title)}</strong>
  <div class="node-detail">{details}</div>
</div>"""


def render_prs(prs: list[dict[str, Any]]) -> str:
    if not prs:
        return '<span class="empty">Not yet known</span>'
    return (
        '<div class="pr-list">'
        + "".join(
            f'<span class="pr"><code>{esc(pr["id"])}</code>'
            f"<small>{pr['evidence_count']} mapped tests</small></span>"
            for pr in prs
        )
        + "</div>"
    )


def render_code_node(item: dict[str, Any]) -> str:
    prs = item["prs"]
    evidence_count = item["evidence_count"]
    state = "evidence" if evidence_count else "planned" if prs else "missing"
    level = item.get("child_level")
    level_class = level if level in {"product", "feature", "slice"} else "unknown"
    if prs:
        detail = f"{len(prs)} PR slice{'s' if len(prs) != 1 else ''}"
        detail += f" &middot; {evidence_count} mapped test entr{'ies' if evidence_count != 1 else 'y'}"
    else:
        detail = '<span class="empty">No implementation PRs discovered</span>'
    return f"""
<div class="node artifact-code">
  <div class="node-meta">
    <div class="identity-tags"><span class="level level-{esc(level_class)}">{esc(display_level(level))}</span><span class="kind">Code + tests</span></div>
    {badge(state)}
  </div>
  <strong>Code + executable tests</strong>
  <div class="node-detail">{detail}</div>
</div>"""


def render_flow(nodes: list[str]) -> str:
    return (
        '<div class="flow">'
        + '<span class="arrow" aria-hidden="true"></span>'.join(nodes)
        + "</div>"
    )


def render_tree_branch(
    root: Path,
    output: Path,
    item: dict[str, Any],
    focus_id: str | None = None,
) -> str:
    child = item.get("child_plan")
    child_level_value = item.get("child_level")
    parent_label = display_level(item.get("parent_level"))
    child_label = display_level(child_level_value)
    plan_type = (
        child.get("metadata", {}).get("Plan Type", "").casefold() if child else ""
    )
    if plan_type == "breakdown":
        plan_title = "Breakdown plan"
    elif plan_type == "implementation" or child_level_value == "slice":
        plan_title = "Implementation plan"
    elif child_level_value == "feature":
        plan_title = "Feature plan"
    else:
        plan_title = "Child plan"
    nodes = [
        render_artifact_node(
            root,
            output,
            "spec",
            child_level_value,
            f"{child_label} spec",
            item.get("child_spec"),
        ),
        render_artifact_node(
            root,
            output,
            "design",
            child_level_value,
            f"{child_label} design / LLD",
            item.get("child_design"),
        ),
        render_artifact_node(
            root, output, "plan", child_level_value, plan_title, child
        ),
        render_code_node(item),
    ]
    searchable = " ".join(
        str(value or "")
        for value in (
            item["id"],
            item["name"],
            item.get("parent_scope"),
            item.get("child_scope"),
            item.get("scope"),
            item.get("parent_obligations"),
            item.get("dependencies"),
            child.get("path") if child else None,
            " ".join(pr["id"] for pr in item["prs"]),
        )
    ).casefold()
    details = "".join(
        f"<dt>{esc(label)}</dt><dd>{esc(item.get(key) or 'Not recorded')}</dd>"
        for label, key in (
            ("Parent scope", "parent_scope"),
            ("Child scope", "child_scope"),
            ("Parent IDs / inherited obligations", "parent_obligations"),
            ("Dependencies", "dependencies"),
            ("Readiness target", "readiness_target"),
            ("Required child artifact", "child_requirement"),
            ("Done signal", "done_signal"),
            ("Risks", "risks"),
        )
    )
    claim = item.get("wip_claim") or {}
    claim_html = (
        f'<p class="wip-claim">WIP claim: {esc(claim.get("status"))}</p>'
        if claim.get("status")
        else ""
    )
    is_focus = item["id"] == focus_id
    branch_status = "Not started" if item["state"] == "frontier" else "In progress"
    open_attribute = " open" if is_focus else ""
    focus_label = '<span class="focus-label">Current focus</span>' if is_focus else ""
    return f"""
<details class="tree-branch" data-state="{esc(item["state"])}" data-search="{esc(searchable)}"{open_attribute}>
  <summary class="branch-summary">
    <span class="branch-title"><code>{esc(item["id"])}</code><strong>{esc(item["name"])}</strong></span>
    <span class="branch-path">{esc(parent_label)} &rarr; {esc(child_label)}</span>
    {focus_label}
    {badge(item["state"], branch_status)}
  </summary>
  <div class="branch-content">
    {render_flow(nodes)}
    <details class="branch-details">
      <summary>Scope, allocation, PRs, and evidence</summary>
      <div class="detail-layout"><dl>{details}</dl><div><h3>PR evidence</h3>{render_prs(item["prs"])}{claim_html}</div></div>
    </details>
  </div>
</details>"""


def render_html(
    model: dict[str, Any],
    root: Path,
    output: Path,
    guide_href: str | None = None,
) -> str:
    stages = model["stages"]
    root_level = (
        scope_level(stages["spec"].get("metadata", {}).get("Work Scope")) or "product"
    )
    root_nodes = [
        render_artifact_node(
            root,
            output,
            "spec",
            root_level,
            "Product spec",
            stages["spec"],
            "No product spec discovered",
        ),
        render_artifact_node(
            root,
            output,
            "design",
            root_level,
            "Product design / HLD",
            stages["design"],
            "No product design discovered",
        ),
        render_artifact_node(
            root,
            output,
            "plan",
            root_level,
            "Product Breakdown plan",
            stages["plan"],
            "No product plan discovered",
        ),
    ]
    root_flow = render_flow(root_nodes)
    active_items = [item for item in model["work_items"] if item["state"] != "frontier"]
    focus = next(
        (item for item in active_items if item.get("wip_claim")),
        active_items[0] if active_items else None,
    )
    focus_id = focus["id"] if focus else None
    branches = "".join(
        render_tree_branch(root, output, item, focus_id) for item in model["work_items"]
    )
    if not branches:
        branches = """
<div class="empty-state">
  <strong>No decomposition discovered</strong>
  <span>A breakdown plan with WORK identifiers will expand this view.</span>
</div>"""
    source_rows = "".join(
        f'<tr><td><a href="{href_for(root, output, source["path"])}">{esc(source["path"])}</a></td>'
        f"<td><code>{esc(source['sha256'][:16])}</code></td></tr>"
        for source in model["sources"]
    )
    wip = model["wip"]
    current_stage = wip.get("Current Stage", "Not recorded")
    current_gate = wip.get("Current Gate", "Not recorded")
    summary = model["summary"]
    awaiting_count = summary["work_items"] - summary["expanded_items"]
    parent_gate_text = (
        "Parent gates approved"
        if summary["approved_stages"] == 3
        else f"{summary['approved_stages']} of 3 parent gates approved"
    )
    if focus:
        focus_name = focus.get("name") or focus["id"]
        focus_level = display_level(focus.get("child_level"))
        focus_breadcrumb = (
            f"Product/system &rarr; Breakdown plan &rarr; {esc(focus['id'])}"
            f" &rarr; {esc(focus_level)} work"
        )
        focus_heading = f"{esc(focus_name)} is in progress"
        focus_detail = (
            f"{len(focus['prs'])} PR slice"
            f"{'s' if len(focus['prs']) != 1 else ''} &middot; "
            f"{focus['evidence_count']} mapped test entr"
            f"{'ies' if focus['evidence_count'] != 1 else 'y'}"
        )
        missing_focus = [
            label
            for label, key in (("Spec", "child_spec"), ("Design / LLD", "child_design"))
            if not focus.get(key)
        ]
        attention = (
            f"Expected child {' and '.join(missing_focus)} not discovered."
            if missing_focus
            else "No artifact gaps discovered on the current branch."
        )
    else:
        focus_name = "No active allocation"
        focus_breadcrumb = "Product/system &rarr; Breakdown plan"
        focus_heading = "Decomposition is ready to begin"
        focus_detail = "No allocation has started"
        attention = "Choose a WORK item and create its required child artifacts."
    expansion_text = (
        f"{summary['expanded_items']} of {summary['work_items']} allocations "
        f"have child plans; {awaiting_count} await decomposition."
    )
    if focus:
        overall_state, overall_label = "started", "In progress"
    elif summary["work_items"]:
        overall_state, overall_label = "missing", "Ready to decompose"
    elif any(stage["state"] != "missing" for stage in stages.values()):
        overall_state, overall_label = "started", "In progress"
    else:
        overall_state, overall_label = "missing", "Not started"
    if summary["approved_stages"] == 3:
        parent_state = "approved"
    elif any(stage["state"] != "missing" for stage in stages.values()):
        parent_state = "started"
    else:
        parent_state = "missing"
    approval_note = (
        f'<p class="warning">Approval ledger could not be parsed: {esc(model["approval_error"])}</p>'
        if model.get("approval_error")
        else ""
    )
    traceability_note = (
        f'<p class="warning">Traceability ledger could not be parsed: {esc(model["traceability_error"])}</p>'
        if model.get("traceability_error")
        else ""
    )
    guide_link = (
        f'<a class="process-guide" href="{esc(guide_href)}">Process guide</a>'
        if guide_href
        else ""
    )
    embedded_model = json.dumps(model, sort_keys=True).replace("</", "<\\/")
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(model["project"])} - Sarathi workflow status</title>
<style>
:root {{
  --bg: #f4f6f8;
  --surface: #ffffff;
  --surface-alt: #edf1f4;
  --text: #17212b;
  --muted: #5d6975;
  --line: #c8d0d7;
  --product: #2457a6;
  --feature: #9a6200;
  --slice: #197653;
  --spec: #2457a6;
  --spec-bg: #edf4fd;
  --design: #9a6200;
  --design-bg: #fff6e3;
  --plan: #197653;
  --plan-bg: #eaf7f1;
  --code: #6247a8;
  --code-bg: #f2effc;
  --approved: #18794e;
  --approved-bg: #dff3e8;
  --stale: #9a6700;
  --stale-bg: #fff1c2;
  --evidence: #0969a8;
  --evidence-bg: #dceefb;
  --missing: #66707a;
  --missing-bg: #e7ebee;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.45;
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--text); }}
a {{ color: #075d91; text-underline-offset: 0.18em; }}
code {{ font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; overflow-wrap: anywhere; }}
.topbar {{ background: #17212b; color: #fff; padding: 1.25rem max(1rem, calc((100vw - 92rem) / 2)); }}
.topbar-inner {{ display: flex; align-items: end; justify-content: space-between; gap: 1rem; }}
.topbar-meta {{ display: flex; align-items: end; gap: 1rem; }}
.process-guide {{ color: #b9d9eb; font-size: 0.82rem; font-weight: 700; white-space: nowrap; }}
.eyebrow {{ color: #a9c7d8; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }}
h1 {{ margin: 0.25rem 0 0; font-size: 2.25rem; line-height: 1.15; }}
.snapshot {{ color: #d8e1e8; font-size: 0.82rem; text-align: right; }}
main {{ max-width: 92rem; margin: 0 auto; padding: 1.25rem; }}
h2 {{ font-size: 1.15rem; margin: 1.75rem 0 0.75rem; }}
.executive {{ border: 1px solid var(--line); border-left: 5px solid var(--stale); background: var(--surface); }}
.executive-head {{ display: flex; align-items: start; justify-content: space-between; gap: 1rem; padding: 1rem 1.1rem 0.85rem; }}
.executive-kicker {{ color: var(--stale); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }}
.executive h2 {{ margin: 0.2rem 0; font-size: 1.35rem; }}
.focus-path {{ margin: 0; color: var(--muted); font-size: 0.82rem; font-weight: 650; }}
.executive-summary {{ margin: 0; padding: 0 1.1rem 0.9rem; color: var(--muted); font-size: 0.9rem; }}
.executive-summary strong {{ color: var(--text); }}
.executive-facts {{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--line); }}
.executive-fact {{ min-width: 0; padding: 0.75rem 1.1rem; border-right: 1px solid var(--line); }}
.executive-fact:last-child {{ border-right: 0; }}
.executive-fact span {{ display: block; color: var(--muted); font-size: 0.68rem; font-weight: 750; text-transform: uppercase; }}
.executive-fact strong {{ display: block; margin-top: 0.2rem; font-size: 0.82rem; overflow-wrap: anywhere; }}
.executive-fact-attention strong {{ color: #8a3b12; }}
.read-note {{ border-top: 1px solid var(--line); padding: 0.5rem 1.1rem; color: var(--muted); font-size: 0.76rem; }}
.read-note summary {{ cursor: pointer; font-weight: 700; }}
.read-note p {{ margin: 0.5rem 0; }}
.status {{ display: inline-flex; width: fit-content; align-items: center; gap: 0.3rem; min-height: 1.5rem; padding: 0.12rem 0.45rem; border-radius: 4px; font-size: 0.7rem; font-weight: 780; white-space: nowrap; }}
.status-success {{ color: var(--approved); background: var(--approved-bg); }}
.status-progress {{ color: var(--stale); background: var(--stale-bg); }}
.status-pending {{ color: var(--missing); background: var(--missing-bg); }}
.legend {{ margin: 0.65rem 0; color: var(--muted); font-size: 0.78rem; }}
.legend > summary {{ cursor: pointer; font-weight: 750; }}
.encoding {{ display: grid; gap: 0.45rem; margin: 0.65rem 0 0; color: var(--muted); font-size: 0.78rem; font-weight: 700; }}
.encoding-row {{ display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem 0.9rem; }}
.encoding-label {{ flex: 0 0 12rem; color: var(--text); }}
.key {{ display: inline-flex; align-items: center; gap: 0.35rem; }}
.key::before {{ width: 1.1rem; height: 0.8rem; border: 1px solid var(--line); border-left-width: 4px; border-radius: 2px; content: ""; }}
.key-spec::before {{ border-left-color: var(--spec); background: var(--spec-bg); }}
.key-design::before {{ border-left-color: var(--design); background: var(--design-bg); }}
.key-plan::before {{ border-left-color: var(--plan); background: var(--plan-bg); }}
.key-code::before {{ border-left-color: var(--code); background: var(--code-bg); }}
.tree-panel {{ padding: 1rem; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }}
.product-heading {{ display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.65rem; }}
.product-heading strong {{ font-size: 0.9rem; }}
.flow {{ display: flex; align-items: stretch; gap: 0.5rem; min-width: 0; }}
.node {{ flex: 1 1 0; min-width: 0; min-height: 7.2rem; padding: 0.75rem; border: 1px solid var(--line); border-left-width: 4px; border-radius: 4px; overflow-wrap: anywhere; }}
.artifact-spec {{ border-left-color: var(--spec); background: var(--spec-bg); }}
.artifact-design {{ border-left-color: var(--design); background: var(--design-bg); }}
.artifact-plan {{ border-left-color: var(--plan); background: var(--plan-bg); }}
.artifact-code {{ border-left-color: var(--code); background: var(--code-bg); }}
.node-meta, .identity-tags {{ display: flex; align-items: center; gap: 0.35rem; }}
.node-meta {{ justify-content: space-between; }}
.identity-tags {{ min-width: 0; flex-wrap: wrap; }}
.level, .kind {{ display: inline-flex; align-items: center; min-height: 1.25rem; padding: 0.12rem 0.4rem; border-radius: 3px; font-size: 0.64rem; font-weight: 800; line-height: 1; text-transform: uppercase; }}
.level {{ border: 1px solid currentColor; background: #fff; }}
.level-product {{ color: var(--product); }}
.level-feature {{ color: var(--feature); }}
.level-slice {{ color: var(--slice); }}
.level-unknown {{ color: var(--missing); }}
.kind {{ color: #465563; background: rgb(255 255 255 / 72%); }}
.node > strong {{ display: block; margin-top: 0.55rem; font-size: 0.9rem; }}
.node-detail {{ margin-top: 0.35rem; color: var(--muted); font-size: 0.75rem; }}
.node-detail small {{ display: block; margin-top: 0.25rem; }}
.arrow {{ display: grid; flex: 0 0 1.65rem; place-items: center; color: #758391; font-family: Consolas, monospace; font-size: 1.1rem; font-weight: 800; }}
.arrow::before {{ content: "\\2192"; }}
.branches {{ display: grid; gap: 0.45rem; margin: 1rem 0 0 1.25rem; padding-left: 1.25rem; border-left: 2px solid #aab6c0; }}
.tree-branch {{ position: relative; min-width: 0; border: 1px solid var(--line); border-radius: 4px; background: var(--surface); }}
.tree-branch::before {{ position: absolute; top: 1.15rem; left: -1.4rem; width: 1.25rem; border-top: 2px solid #aab6c0; content: ""; }}
.tree-branch[hidden] {{ display: none; }}
.branch-summary {{ display: flex; align-items: center; gap: 0.5rem 0.75rem; min-height: 2.5rem; padding: 0.45rem 0.65rem; cursor: pointer; list-style-position: outside; }}
.branch-title {{ display: flex; flex: 1 1 22rem; min-width: 0; align-items: baseline; gap: 0.55rem; }}
.branch-title code {{ color: #52616f; font-size: 0.72rem; font-weight: 800; }}
.branch-title strong {{ overflow-wrap: anywhere; font-size: 0.82rem; }}
.branch-path {{ color: var(--muted); font-size: 0.72rem; font-weight: 700; white-space: nowrap; }}
.focus-label {{ color: var(--stale); font-size: 0.68rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; }}
.branch-content {{ padding: 0.25rem 0.75rem 0.75rem; border-top: 1px solid var(--line); }}
.branch-details {{ margin-top: 0.4rem; border-top: 1px dashed var(--line); padding-top: 0.35rem; }}
.branch-details summary {{ cursor: pointer; color: var(--muted); font-size: 0.75rem; font-weight: 700; }}
.detail-layout {{ display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(14rem, 0.8fr); gap: 1rem; padding: 0.75rem; background: var(--surface-alt); }}
.detail-layout dl {{ display: grid; grid-template-columns: 10rem 1fr; gap: 0.35rem 0.75rem; margin: 0; font-size: 0.78rem; }}
.detail-layout dt {{ color: var(--muted); font-weight: 700; }}
.detail-layout dd {{ margin: 0; overflow-wrap: anywhere; }}
.detail-layout h3 {{ margin: 0 0 0.5rem; font-size: 0.82rem; }}
.wip-claim {{ margin: 0.5rem 0 0; color: var(--muted); font-size: 0.75rem; }}
.tree-heading {{ display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-top: 1.4rem; }}
.tree-heading h2 {{ margin: 0; }}
.tree-heading p {{ margin: 0.15rem 0 0; color: var(--muted); font-size: 0.78rem; }}
.toolbar {{ display: flex; flex: 0 1 42rem; align-items: center; justify-content: end; gap: 0.5rem; }}
.search {{ flex: 1 1 18rem; min-width: 0; }}
.search input {{ width: 100%; min-height: 2.3rem; border: 1px solid var(--line); background: var(--surface); color: var(--text); padding: 0.45rem 0.65rem; font: inherit; font-size: 0.82rem; }}
.tree-action {{ min-height: 2.3rem; border: 1px solid var(--line); border-radius: 3px; background: var(--surface); color: var(--text); padding: 0.4rem 0.65rem; font: inherit; font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; }}
.tree-action:hover {{ background: var(--surface-alt); }}
.pr-list {{ display: grid; gap: 0.4rem; }}
.pr {{ display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; border-bottom: 1px solid var(--surface-alt); padding-bottom: 0.3rem; }}
.pr small {{ white-space: nowrap; }}
.empty {{ color: var(--muted); font-style: italic; }}
.empty-state {{ padding: 2rem; border: 1px solid var(--line); background: var(--surface); text-align: center; }}
.empty-state span {{ display: block; color: var(--muted); margin-top: 0.35rem; }}
.provenance {{ margin-top: 1.5rem; border-top: 1px solid var(--line); padding-top: 0.75rem; }}
.provenance summary {{ cursor: pointer; font-weight: 700; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.78rem; }}
th, td {{ padding: 0.45rem; border: 1px solid var(--line); text-align: left; overflow-wrap: anywhere; }}
.warning {{ color: #8a3b12; font-weight: 700; }}
@media (max-width: 760px) {{
  h1 {{ font-size: 1.5rem; }}
  .topbar-inner {{ align-items: start; flex-direction: column; }}
  .topbar-meta {{ align-items: start; flex-direction: column-reverse; gap: 0.4rem; }}
  .snapshot {{ text-align: left; }}
  .executive-head {{ flex-direction: column; }}
  .executive-facts {{ grid-template-columns: 1fr 1fr; }}
  .executive-fact:nth-child(2) {{ border-right: 0; }}
  .executive-fact:nth-child(-n+2) {{ border-bottom: 1px solid var(--line); }}
  .tree-heading {{ align-items: stretch; flex-direction: column; }}
  .toolbar {{ flex: 1 1 auto; flex-wrap: wrap; justify-content: start; }}
  .search {{ flex-basis: 100%; }}
  .encoding-label {{ flex-basis: 100%; }}
  .tree-panel {{ padding: 0.75rem; }}
  .product-heading {{ align-items: start; flex-direction: column; }}
  .flow {{ flex-direction: column; }}
  .node {{ min-height: 0; }}
  .arrow {{ min-height: 1rem; transform: rotate(90deg); }}
  .branches {{ margin-left: 0.35rem; padding-left: 0.85rem; }}
  .tree-branch::before {{ left: -1rem; width: 0.85rem; }}
  .branch-summary {{ align-items: start; flex-wrap: wrap; }}
  .branch-title {{ flex-basis: 100%; }}
  .branch-path {{ margin-right: auto; white-space: normal; }}
  .detail-layout, .detail-layout dl {{ grid-template-columns: 1fr; }}
  .detail-layout dd {{ margin-bottom: 0.35rem; }}
}}
</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <div><div class="eyebrow">Sarathi workflow status</div><h1>{esc(model["project"])}</h1></div>
    <div class="topbar-meta">{guide_link}<div class="snapshot">Snapshot <code>{esc(model["fingerprint"])}</code></div></div>
  </div>
</header>
<main>
  <section class="executive" aria-labelledby="executive-title">
    <div class="executive-head">
      <div>
        <div class="executive-kicker">Executive summary</div>
        <h2 id="executive-title">{focus_heading}</h2>
        <p class="focus-path">{focus_breadcrumb}</p>
      </div>
      {badge(overall_state, overall_label)}
    </div>
    <p class="executive-summary"><strong>{esc(parent_gate_text)}.</strong> {esc(expansion_text)}</p>
    <div class="executive-facts">
      <div class="executive-fact"><span>Current stage</span><strong>{esc(current_stage)}</strong></div>
      <div class="executive-fact"><span>Next gate</span><strong>{esc(current_gate)}</strong></div>
      <div class="executive-fact"><span>Implementation evidence</span><strong>{focus_detail}</strong></div>
      <div class="executive-fact executive-fact-attention"><span>Needs attention</span><strong>{esc(attention)}</strong></div>
    </div>
    <details class="read-note">
      <summary>How to read this status</summary>
      <p>Green checks mean hash-current approval. Amber dots mean work or evidence is present but not complete. Gray circles mean not started. Mapped tests are implementation evidence, not a completion estimate; WIP status remains a project-authored claim.</p>
      {approval_note}
      {traceability_note}
    </details>
  </section>
  <div class="tree-heading">
    <div><h2>Workflow tree</h2><p>Open an allocation to inspect its artifact path.</p></div>
    <div class="toolbar">
      <label class="search"><input id="search" type="search" placeholder="Filter allocations" aria-label="Filter allocations"></label>
      <button class="tree-action" id="expand-all" type="button">Expand all</button>
      <button class="tree-action" id="collapse-all" type="button">Collapse all</button>
    </div>
  </div>
  <details class="legend">
    <summary>Legend</summary>
    <div class="encoding" aria-label="Tree encoding">
      <div class="encoding-row"><span class="encoding-label">Background = artifact type</span><span class="key key-spec">Spec</span><span class="key key-design">Design</span><span class="key key-plan">Plan</span><span class="key key-code">Code + tests</span></div>
      <div class="encoding-row"><span class="encoding-label">Level tag = work scope</span><span class="level level-product">Product</span><span class="level level-feature">Feature</span><span class="level level-slice">Slice</span></div>
      <div class="encoding-row"><span class="encoding-label">Status = observed state</span>{badge("approved")}{badge("started", "In progress")}{badge("missing", "Not started")}</div>
    </div>
  </details>
  <section class="tree-panel" aria-label="Workflow expansion tree">
    <div class="product-heading"><strong>Product workflow</strong>{badge(parent_state, parent_gate_text)}</div>
    {root_flow}
    <div id="work-items" class="branches">{branches}</div>
  </section>
  <details class="provenance">
    <summary>Snapshot provenance</summary>
    <table><thead><tr><th>Source</th><th>SHA-256 prefix</th></tr></thead><tbody>{source_rows}</tbody></table>
  </details>
</main>
<script type="application/json" id="workflow-model">{embedded_model}</script>
<script>
(() => {{
  const query = document.querySelector('#search');
  const rows = [...document.querySelectorAll('.tree-branch')];
  const apply = () => {{
    const wanted = query.value.trim().toLocaleLowerCase();
    rows.forEach(row => {{
      const matches = row.dataset.search.includes(wanted);
      row.hidden = !matches;
      if (wanted && matches) row.open = true;
    }});
  }};
  query.addEventListener('input', apply);
  document.querySelector('#expand-all').addEventListener('click', () => rows.forEach(row => {{ row.open = true; }}));
  document.querySelector('#collapse-all').addEventListener('click', () => rows.forEach(row => {{ row.open = false; }}));
}})();
</script>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path.cwd())
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--guide-source",
        type=Path,
        help="static Sarathi process guide to publish beside the status page",
    )
    parser.add_argument("--check", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    output = (args.output or root / "docs" / "sdlc-status.html").resolve()
    if not root.is_dir():
        print(f"error: project root does not exist: {root}", file=sys.stderr)
        return 2
    guide_source = (
        args.guide_source.resolve() if args.guide_source else default_guide_source()
    )
    if guide_source is None:
        print(
            "error: static process guide not found; pass --guide-source",
            file=sys.stderr,
        )
        return 2
    if not guide_source.is_file():
        print(f"error: process guide does not exist: {guide_source}", file=sys.stderr)
        return 2
    guide_output = output.with_name(GUIDE_FILENAME)
    try:
        model = build_model(root)
        rendered = render_html(model, root, output, GUIDE_FILENAME).encode("utf-8")
        guide_bytes = (
            guide_source.read_text(encoding="utf-8")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
            .encode("utf-8")
        )
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    if args.check:
        if not output.is_file() or output.read_bytes() != rendered:
            print(f"stale generated workflow status: {output}", file=sys.stderr)
            return 1
        if not guide_output.is_file() or guide_output.read_bytes() != guide_bytes:
            print(f"stale static process guide: {guide_output}", file=sys.stderr)
            return 1
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(rendered)
    guide_output.write_bytes(guide_bytes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
