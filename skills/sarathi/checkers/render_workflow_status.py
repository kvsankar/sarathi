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


def implementation_plans(root: Path, parent_plan: Path | None) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for path in discover(root, "*.md"):
        if parent_plan is not None and path.resolve() == parent_plan.resolve():
            continue
        text = read_text(path)
        values = metadata(text)
        if values.get("Plan Type", "").casefold() != "implementation":
            continue
        heading = first_heading(text) or ""
        match = WORK_ID.search(heading)
        if match:
            result[match.group()] = path
    return result


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
    children = implementation_plans(root, paths["plan"])
    traces, traceability_error = traceability_counts(root)
    parent_text = read_text(paths["plan"]) if paths["plan"] else ""
    items = work_items(parent_text)
    for item in items:
        child_path = children.get(item["id"])
        if child_path is None:
            item.update(
                {
                    "state": "frontier",
                    "child_plan": None,
                    "prs": [],
                    "evidence_count": 0,
                    "wip_claim": None,
                }
            )
            continue
        child_text = read_text(child_path)
        child_relative = relative_path(child_path, root)
        child_approval = approval_for(root, child_path, "plan.approved", records)
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
                "child_plan": {
                    "title": first_heading(child_text) or item["id"],
                    "path": child_relative,
                    "metadata": metadata(child_text),
                    "approval": child_approval,
                },
                "prs": prs,
                "evidence_count": evidence_count,
                "wip_claim": claim,
            }
        )
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
    source_paths.extend(children.values())
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
        "evidence": "Evidence mapped",
    }.get(state, state.replace("-", " ").title())


def badge(state: str) -> str:
    return f'<span class="badge badge-{esc(state)}">{esc(state_label(state))}</span>'


def artifact_link(root: Path, output: Path, stage: dict[str, Any]) -> str:
    href = href_for(root, output, stage.get("path"))
    if href is None:
        return '<span class="empty">No artifact discovered</span>'
    return f'<a href="{href}">{esc(stage["path"])}</a>'


def render_stage(root: Path, output: Path, stage: dict[str, Any]) -> str:
    values = stage.get("metadata", {})
    detail = values.get("Implementation Readiness") or values.get("Plan Type") or ""
    approval = stage.get("approval") or {}
    attestation = (
        f'<span title="Hash-current local attestation">{esc(approval.get("id"))}</span>'
        if approval.get("id")
        else "No current attestation"
    )
    return f"""
<li class="stage stage-{esc(stage["state"])}">
  <div class="stage-top"><span class="stage-name">{esc(stage["kind"].title())}</span>{badge(stage["state"])}</div>
  <div class="stage-path">{artifact_link(root, output, stage)}</div>
  <div class="stage-detail">{esc(detail) if detail else '<span class="empty">Not yet known</span>'}</div>
  <div class="stage-attestation">{attestation}</div>
</li>"""


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


def render_work_item(root: Path, output: Path, item: dict[str, Any]) -> str:
    child = item.get("child_plan")
    if child:
        href = href_for(root, output, child["path"])
        child_state = child["approval"]["state"]
        readiness = child["metadata"].get("Implementation Readiness", "Unknown")
        child_html = (
            f'{badge(child_state)}<a href="{href}"><code>{esc(child["path"])}</code></a>'
            f"<small>{esc(readiness)}</small>"
        )
    else:
        child_html = '<span class="empty">Not yet decomposed</span>'
    if item["evidence_count"]:
        claim = item.get("wip_claim") or {}
        claim_text = claim.get("status")
        evidence_html = (
            f"<strong>{item['evidence_count']}</strong> mapped executable-test entries"
            + (f"<small>WIP claim: {esc(claim_text)}</small>" if claim_text else "")
        )
    else:
        evidence_html = '<span class="empty">Not yet known</span>'
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
    return f"""
<article class="work-row" data-state="{esc(item["state"])}" data-search="{esc(searchable)}">
  <div class="work-cell work-identity">
    <div class="cell-label">Parent allocation</div>
    <code>{esc(item["id"])}</code>
    <strong>{esc(item["name"])}</strong>
    {badge(item["state"])}
    <p>{esc(item.get("parent_scope") or "Parent scope not recorded")} &rarr; {esc(item.get("child_scope") or "Child scope not recorded")}</p>
    <p>{esc(item.get("scope") or "Scope not recorded")}</p>
  </div>
  <div class="work-cell">
    <div class="cell-label">Child implementation plan</div>
    {child_html}
  </div>
  <div class="work-cell">
    <div class="cell-label">PR slices</div>
    {render_prs(item["prs"])}
  </div>
  <div class="work-cell">
    <div class="cell-label">Implementation evidence</div>
    <div class="evidence-value">{evidence_html}</div>
  </div>
  <details class="work-details">
    <summary>Evidence and frontier</summary>
    <dl>{details}</dl>
  </details>
</article>"""


def render_html(
    model: dict[str, Any],
    root: Path,
    output: Path,
    guide_href: str | None = None,
) -> str:
    stages = model["stages"]
    stage_html = "".join(
        render_stage(root, output, stages[kind]) for kind in ("spec", "design", "plan")
    )
    implementation_state = (
        "evidence" if model["summary"]["evidenced_prs"] else "missing"
    )
    stage_html += f"""
<li class="stage stage-{implementation_state}">
  <div class="stage-top"><span class="stage-name">Implementation</span>{badge(implementation_state)}</div>
  <div class="stage-path">{model["summary"]["evidenced_prs"]} PR slices with mapped tests</div>
  <div class="stage-detail">{model["summary"]["expanded_items"]} of {model["summary"]["work_items"]} workstreams expanded</div>
  <div class="stage-attestation">Evidence is not a completion claim</div>
</li>"""
    rows = "".join(render_work_item(root, output, item) for item in model["work_items"])
    if not rows:
        rows = """
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
  color-scheme: light dark;
  --bg: #f4f6f8;
  --surface: #ffffff;
  --surface-alt: #edf1f4;
  --text: #17212b;
  --muted: #5d6975;
  --line: #c8d0d7;
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
.semantic-note {{ border-left: 4px solid var(--evidence); padding: 0.75rem 1rem; background: var(--surface); }}
.semantic-note strong {{ display: block; margin-bottom: 0.2rem; }}
.semantic-note p {{ margin: 0; color: var(--muted); }}
.current-state {{ display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin-top: 0.75rem; font-size: 0.88rem; }}
.current-state span {{ color: var(--muted); }}
.current-state strong {{ color: var(--text); }}
h2 {{ font-size: 1.15rem; margin: 1.75rem 0 0.75rem; }}
.stage-rail {{ list-style: none; display: grid; grid-template-columns: repeat(4, minmax(13rem, 1fr)); gap: 0; margin: 0; padding: 0; overflow-x: auto; background: var(--surface); border: 1px solid var(--line); }}
.stage {{ min-width: 13rem; padding: 1rem; border-right: 1px solid var(--line); position: relative; }}
.stage:last-child {{ border-right: 0; }}
.stage-top {{ display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }}
.stage-name {{ font-weight: 750; }}
.stage-path, .stage-detail, .stage-attestation {{ margin-top: 0.55rem; font-size: 0.82rem; overflow-wrap: anywhere; }}
.stage-detail, .stage-attestation {{ color: var(--muted); }}
.badge {{ display: inline-flex; width: fit-content; align-items: center; min-height: 1.5rem; padding: 0.12rem 0.45rem; border-radius: 4px; font-size: 0.7rem; font-weight: 750; white-space: nowrap; }}
.badge-approved {{ color: var(--approved); background: var(--approved-bg); }}
.badge-stale, .badge-unapproved, .badge-expanded {{ color: var(--stale); background: var(--stale-bg); }}
.badge-evidence {{ color: var(--evidence); background: var(--evidence-bg); }}
.badge-missing, .badge-frontier {{ color: var(--missing); background: var(--missing-bg); }}
.metrics {{ display: grid; grid-template-columns: repeat(4, minmax(9rem, 1fr)); border: 1px solid var(--line); background: var(--surface); }}
.metric {{ padding: 0.9rem 1rem; border-right: 1px solid var(--line); }}
.metric:last-child {{ border-right: 0; }}
.metric strong {{ display: block; font-size: 1.35rem; }}
.metric span {{ color: var(--muted); font-size: 0.78rem; }}
.toolbar {{ display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.25rem; padding: 0.75rem; border: 1px solid var(--line); background: var(--surface); }}
.search {{ flex: 1 1 18rem; min-width: 0; }}
.search input {{ width: 100%; min-height: 2.4rem; border: 1px solid var(--line); background: var(--bg); color: var(--text); padding: 0.5rem 0.65rem; font: inherit; }}
.filters {{ display: flex; flex-wrap: wrap; gap: 0.75rem; }}
.filters label {{ display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; }}
.work-header, .work-row {{ display: grid; grid-template-columns: 1.35fr 1fr 1.25fr 1fr; }}
.work-header {{ background: #293744; color: #fff; font-size: 0.74rem; font-weight: 750; text-transform: uppercase; }}
.work-header div {{ padding: 0.6rem 0.75rem; border-right: 1px solid #53616d; }}
.work-row {{ border: 1px solid var(--line); border-top: 0; background: var(--surface); }}
.work-row[hidden] {{ display: none; }}
.work-cell {{ min-width: 0; padding: 0.8rem; border-right: 1px solid var(--line); overflow-wrap: anywhere; }}
.work-cell:nth-child(4) {{ border-right: 0; }}
.cell-label {{ display: none; color: var(--muted); font-size: 0.7rem; font-weight: 750; margin-bottom: 0.35rem; text-transform: uppercase; }}
.work-identity {{ display: grid; align-content: start; gap: 0.35rem; }}
.work-identity p {{ color: var(--muted); font-size: 0.8rem; margin: 0.2rem 0 0; }}
.work-cell > a, .work-cell > small, .evidence-value small {{ display: block; margin-top: 0.45rem; }}
.work-cell small {{ color: var(--muted); }}
.pr-list {{ display: grid; gap: 0.4rem; }}
.pr {{ display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; border-bottom: 1px solid var(--surface-alt); padding-bottom: 0.3rem; }}
.pr small {{ white-space: nowrap; }}
.empty {{ color: var(--muted); font-style: italic; }}
.work-details {{ grid-column: 1 / -1; border-top: 1px solid var(--line); padding: 0.55rem 0.8rem; background: var(--surface-alt); }}
.work-details summary {{ cursor: pointer; font-size: 0.78rem; font-weight: 700; }}
.work-details dl {{ display: grid; grid-template-columns: 10rem 1fr; gap: 0.35rem 0.75rem; font-size: 0.8rem; }}
.work-details dt {{ color: var(--muted); font-weight: 700; }}
.work-details dd {{ margin: 0; }}
.empty-state {{ padding: 2rem; border: 1px solid var(--line); background: var(--surface); text-align: center; }}
.empty-state span {{ display: block; color: var(--muted); margin-top: 0.35rem; }}
.provenance {{ margin-top: 1.5rem; border-top: 1px solid var(--line); padding-top: 0.75rem; }}
.provenance summary {{ cursor: pointer; font-weight: 700; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.78rem; }}
th, td {{ padding: 0.45rem; border: 1px solid var(--line); text-align: left; overflow-wrap: anywhere; }}
.warning {{ color: #8a3b12; font-weight: 700; }}
@media (prefers-color-scheme: dark) {{
  :root {{ --bg: #11171d; --surface: #192129; --surface-alt: #222c35; --text: #edf2f5; --muted: #aeb9c2; --line: #3b4853; --approved-bg: #143d2c; --stale-bg: #493b10; --evidence-bg: #15374f; --missing-bg: #303a43; }}
  a {{ color: #79c4f2; }}
}}
@media (max-width: 760px) {{
  h1 {{ font-size: 1.5rem; }}
  .topbar-inner {{ align-items: start; flex-direction: column; }}
  .topbar-meta {{ align-items: start; flex-direction: column-reverse; gap: 0.4rem; }}
  .snapshot {{ text-align: left; }}
  .metrics {{ grid-template-columns: repeat(2, 1fr); }}
  .metric:nth-child(2) {{ border-right: 0; }}
  .metric:nth-child(-n+2) {{ border-bottom: 1px solid var(--line); }}
  .work-header {{ display: none; }}
  .work-row {{ display: block; margin-top: 0.75rem; border-top: 1px solid var(--line); }}
  .work-cell {{ border-right: 0; border-bottom: 1px solid var(--line); }}
  .cell-label {{ display: block; }}
  .work-details dl {{ grid-template-columns: 1fr; }}
  .work-details dd {{ margin-bottom: 0.45rem; }}
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
  <section class="semantic-note" aria-label="Evidence semantics">
    <strong>Visibility, not a completion estimate</strong>
    <p>Presence, hash-current attestations, decomposition, and mapped executable-test evidence are shown separately. WIP status remains a project-authored claim.</p>
    <div class="current-state"><span>Current stage <strong>{esc(current_stage)}</strong></span><span>Current gate <strong>{esc(current_gate)}</strong></span></div>
    {approval_note}
    {traceability_note}
  </section>
  <h2>Artifact gates</h2>
  <ol class="stage-rail">{stage_html}</ol>
  <h2>Expansion summary</h2>
  <div class="metrics">
    <div class="metric"><strong>{model["summary"]["approved_stages"]} / 3</strong><span>hash-current artifact attestations</span></div>
    <div class="metric"><strong>{model["summary"]["work_items"]}</strong><span>parent-plan allocations</span></div>
    <div class="metric"><strong>{model["summary"]["expanded_items"]}</strong><span>allocations with child plans</span></div>
    <div class="metric"><strong>{model["summary"]["evidenced_prs"]} / {model["summary"]["pr_slices"]}</strong><span>PR slices with mapped tests</span></div>
  </div>
  <h2>Known-unknown expansion map</h2>
  <div class="toolbar">
    <label class="search"><input id="search" type="search" placeholder="Search allocations, dependencies, or PRs" aria-label="Search allocations"></label>
    <div class="filters" aria-label="Status filters">
      <label><input type="checkbox" data-filter="evidence" checked> Evidence mapped</label>
      <label><input type="checkbox" data-filter="expanded" checked> Expanded</label>
      <label><input type="checkbox" data-filter="frontier" checked> Frontier</label>
    </div>
  </div>
  <div class="work-header" aria-hidden="true"><div>Parent allocation</div><div>Child implementation plan</div><div>PR slices</div><div>Implementation evidence</div></div>
  <section id="work-items" aria-label="Workflow expansion">{rows}</section>
  <details class="provenance">
    <summary>Snapshot provenance</summary>
    <table><thead><tr><th>Source</th><th>SHA-256 prefix</th></tr></thead><tbody>{source_rows}</tbody></table>
  </details>
</main>
<script type="application/json" id="workflow-model">{embedded_model}</script>
<script>
(() => {{
  const query = document.querySelector('#search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const rows = [...document.querySelectorAll('.work-row')];
  const apply = () => {{
    const wanted = query.value.trim().toLocaleLowerCase();
    const enabled = new Set(filters.filter(item => item.checked).map(item => item.dataset.filter));
    rows.forEach(row => {{
      row.hidden = !enabled.has(row.dataset.state) || !row.dataset.search.includes(wanted);
    }});
  }};
  query.addEventListener('input', apply);
  filters.forEach(item => item.addEventListener('change', apply));
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
