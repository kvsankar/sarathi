"""Helpers for parsing checker-visible Markdown structure."""

from __future__ import annotations

import re
from collections.abc import Callable

FENCE = re.compile(r"^\s{0,3}(`{3,}|~{3,})")
HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
FORMAT_MARKER = re.compile(
    r'<!--\s*sarathi:artifact-format\s+version="(?P<version>[^"]+)"\s*-->',
    re.I,
)
ANNOTATION = re.compile(r"<!--\s*sarathi:[a-z0-9_-]+\b(?P<attrs>.*?)-->", re.I)
ANNOTATION_ATTR = re.compile(r'([A-Za-z_][A-Za-z0-9_-]*)="([^"]*)"')
PROCESS_ID_HEADING = re.compile(
    r"(?:(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST|MILE|WORK|PR|WAVE)-"
    r"[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)+|"
    r"(?:LAYER|COMP|IFACE|DEC|RISK)-[A-Z][A-Z0-9]*)",
    re.I,
)


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


def annotation_attrs(line: str) -> dict[str, str]:
    """Return normalized attributes from any supported Sarathi HTML annotation."""
    match = ANNOTATION.search(line)
    if not match:
        return {}
    return {
        key.casefold(): value
        for key, value in ANNOTATION_ATTR.findall(match.group("attrs"))
    }


def definition_id(
    line: str,
    id_pattern: re.Pattern,
    lead_pattern: re.Pattern,
    definition_marker: re.Pattern,
) -> str | None:
    """Resolve a legacy visible, structured-comment, or appendix-table definition."""
    attrs = annotation_attrs(line)
    candidate = attrs.get("id")
    if candidate and id_pattern.fullmatch(candidate):
        return candidate
    if definition_marker.match(line):
        match = id_pattern.match(lead_pattern.sub("", line.strip()))
        if match:
            return match.group(0)
    if line.lstrip().startswith("|"):
        cells = [
            cell.strip().replace("`", "") for cell in line.strip().strip("|").split("|")
        ]
        if cells and id_pattern.fullmatch(cells[0]):
            return cells[0]
    return None


def primary_definition_ids(
    text: str, resolver: Callable[[str], object | None]
) -> set[str]:
    """Return non-table definitions, excluding fenced examples."""
    identifiers: set[str] = set()
    for line in strip_fenced_code(text).splitlines():
        if line.lstrip().startswith("|"):
            continue
        resolved = resolver(line)
        if resolved:
            identifiers.add(
                resolved.group(0) if hasattr(resolved, "group") else str(resolved)
            )
    return identifiers


def artifact_format(text: str) -> str:
    """Return the explicit checker contract, leaving unmarked documents legacy."""
    match = FORMAT_MARKER.search(strip_fenced_code(text))
    if not match:
        return "legacy"
    version = match.group("version")
    return (
        f"human-first-v{version}"
        if version in {"2", "3"}
        else f"unsupported-v{version}"
    )


def human_first_issues(
    text: str,
    crux_heading: str | tuple[str, ...],
    supported_formats: tuple[str, ...] = ("human-first-v2",),
) -> list[str]:
    """Check narrow versioned structure without attempting subjective prose scoring."""
    format_name = artifact_format(text)
    if format_name == "legacy":
        return []
    if format_name not in supported_formats:
        return [f"unsupported_artifact_format:{format_name}"]
    visible = strip_fenced_code(text)
    headings = [
        (len(match.group(1)), match.group(2).strip())
        for line in visible.splitlines()
        if (match := HEADING.match(line.strip()))
    ]
    issues: list[str] = []
    level_two = [title for level, title in headings if level == 2]
    accepted = (crux_heading,) if isinstance(crux_heading, str) else crux_heading
    label = accepted[0]
    if not any(heading in accepted for heading in level_two):
        issues.append(f"missing_crux:{label}")
    elif not level_two or level_two[0] not in accepted:
        issues.append(f"crux_not_first_section:{label}")
    trace_positions = [
        index
        for index, (level, title) in enumerate(headings)
        if level == 2 and title.casefold() == "traceability"
    ]
    if not trace_positions:
        issues.append("missing_final_traceability")
    elif trace_positions[-1] != max(
        index for index, (level, _) in enumerate(headings) if level == 2
    ):
        issues.append("traceability_not_final_section")
    for _, title in headings:
        cleaned = title.replace("`", "").replace("*", "").strip()
        if PROCESS_ID_HEADING.fullmatch(cleaned):
            issues.append(f"machine_only_heading:{cleaned}")
    return list(dict.fromkeys(issues))
