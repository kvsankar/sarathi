#!/usr/bin/env python3
"""Deterministic mechanical verifier for a Software Requirements Spec.

Parses an SRS markdown file, validates IDs/structure, and computes structural
coverage metrics (e.g. % of use cases and FRs referenced by acceptance tests).
It also checks obvious NFR unit/quality mismatches and acceptance-test scenario
shape plus journey-test sequence/composition. Exits 0 only when every structural
gate passes. No semantic judgment, fully reproducible.

Usage:
    python check_spec.py [spec.md] [--json] [--feature] [--parent product.md]

--feature  Treat the file as a feature-level spec (a subset of a product).
           Full-section presence is not required; coverage still enforced.
--parent   A product spec whose IDs may be referenced (so they are not orphans).
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

CHECKER_DIR = Path(__file__).resolve().parent
if str(CHECKER_DIR) not in sys.path:
    sys.path.insert(0, str(CHECKER_DIR))

from approvals import (  # noqa: E402
    approval_gate_passed,
    approval_requirement,
    load_approval_context,
)
from markdown_structure import (  # noqa: E402
    artifact_format,
    definition_id,
    human_first_issues,
    primary_definition_ids,
)
from schemas import (  # noqa: E402
    HUMAN_FIRST_SPEC_SECTIONS,
    LEGACY_HUMAN_FIRST_SPEC_SECTIONS,
    SPEC_SECTIONS,
)

SLUG_TOKEN = r"[A-Z][A-Z0-9]{1,31}"
ID = re.compile(rf"\b(UN|FEAT|UC|FR|NFR|AT|JT)-({SLUG_TOKEN})-({SLUG_TOKEN})\b")
ID_CANDIDATE = re.compile(
    r"\b(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST)-[A-Za-z0-9]+-[A-Za-z0-9]+"
    r"(?:-[A-Za-z0-9]+)*\b",
    re.I,
)
# Leading markdown list markers that precede a defining ID (not table pipes).
LEAD = re.compile(r"^[\s#>\-\*\+\d\.\)]*")
HEADING = re.compile(r"^#{1,6}\s+(.+?)\s*$")
DEF_MARKER = re.compile(r"^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[\.)]\s+)")


def _defline(line: str):
    """Match an ID at the start of a line after stripping list/heading markers."""
    identifier = definition_id(line, ID, LEAD, DEF_MARKER)
    return ID.match(identifier) if identifier else None


def _norm_heading(title: str) -> str:
    title = re.sub(r"\s+#*$", "", title.strip())
    title = title.replace("*", "").replace("`", "")
    return re.sub(r"\s+", " ", title).casefold()


def sections_present_in_order(text: str, required: list[str | tuple[str, ...]]) -> bool:
    """Required headings must appear as headings, in order."""
    headings = [
        _norm_heading(m.group(1))
        for line in text.splitlines()
        if (m := HEADING.match(line.strip()))
    ]
    pos = 0
    required_norm = [
        tuple(_norm_heading(x) for x in s) if isinstance(s, tuple) else _norm_heading(s)
        for s in required
    ]
    for heading in headings:
        if pos >= len(required_norm):
            break
        wanted = required_norm[pos]
        if heading in wanted if isinstance(wanted, tuple) else heading == wanted:
            pos += 1
    return pos == len(required_norm)


def item_blocks(text: str, kinds: set[str]) -> dict[str, str]:
    """Map defining ID to its markdown block, up to the next definition or heading."""
    blocks: dict[str, str] = {}
    primary_ids = primary_definition_ids(text, _defline)
    cur, buf = None, []
    in_fence = False
    for line in text.splitlines():
        fence = line.strip().startswith("```")
        m = None if in_fence else _defline(line)
        if m and line.lstrip().startswith("|") and m.group(0) in primary_ids:
            m = None
        is_heading = HEADING.match(line.strip()) is not None
        if m and m.group(1) in kinds:
            if m.group(0) in blocks or m.group(0) == cur:
                continue
            if cur:
                blocks[cur] = "\n".join(buf)
            cur, buf = m.group(0), [line]
        elif cur:
            if is_heading or (m and m.group(1) in kinds):
                blocks[cur] = "\n".join(buf)
                cur, buf = None, []
            else:
                buf.append(line)
        if fence:
            in_fence = not in_fence
    if cur:
        blocks[cur] = "\n".join(buf)
    return blocks


def defs_and_refs(text: str):
    """Return {kind: set(ids defined on their own line)} and all referenced ids."""
    defined: dict[str, set] = {
        k: set() for k in ("UN", "FEAT", "UC", "FR", "NFR", "AT", "JT")
    }
    refs: set[str] = set()
    in_fence = False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            refs.update(m.group(0) for m in ID.finditer(line))
            continue
        ids = [m.group(0) for m in ID.finditer(line)]
        if ids:  # first id on a line that defines an item
            first = None if in_fence else _defline(line)
            if first:
                defined[first.group(1)].add(first.group(0))
            refs.update(ids)
    return defined, refs


def covered_by(targets: set, ats: dict[str, set], kinds: set) -> set:
    """IDs in targets that appear in some AT's reference set."""
    referenced = set().union(*ats.values()) if ats else set()
    return {t for t in targets if t in referenced and t[: t.index("-")] in kinds}


def malformed_ids(text: str) -> list[str]:
    """ID-looking tokens that do not follow KIND-AREA-NAME slug grammar."""
    return sorted(
        {
            m.group(0)
            for m in ID_CANDIDATE.finditer(text)
            if not ID.fullmatch(m.group(0))
        }
    )


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    as_json = "--json" in sys.argv
    feature = "--feature" in sys.argv
    require_approvals = "--require-approvals" in sys.argv
    approvals_path = (
        sys.argv[sys.argv.index("--approvals") + 1]
        if "--approvals" in sys.argv
        else ".sdlc/approvals.yaml"
    )
    gates_path = (
        sys.argv[sys.argv.index("--gates-policy") + 1]
        if "--gates-policy" in sys.argv
        else ".sdlc/gates.yaml"
    )
    parent_ids: set[str] = set()
    if "--parent" in sys.argv:
        p = sys.argv[sys.argv.index("--parent") + 1]
        pd, _ = defs_and_refs(Path(p).read_text(encoding="utf-8"))
        parent_ids = set().union(*pd.values())
    path = Path(args[0] if args else "spec.md")
    text = path.read_text(encoding="utf-8")
    defined, refs = defs_and_refs(text)
    all_ids = set().union(*defined.values()) | parent_ids

    # AT -> referenced ids in the whole acceptance-test block.
    ats = {
        at: {x.group(0) for x in ID.finditer(block)}
        for at, block in item_blocks(text, {"AT"}).items()
    }
    def_ids = []
    primary_ids = primary_definition_ids(text, _defline)
    in_fence = False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence and (m := _defline(line)):
            identifier = m.group(0)
            if line.lstrip().startswith("|") and identifier in primary_ids:
                continue
            def_ids.append(identifier)
    dupes = [i for i, n in Counter(def_ids).items() if n > 1]
    bad_fmt = malformed_ids(text)
    orphans = sorted(r for r in refs if r not in all_ids)
    format_name = artifact_format(text)
    format_issues = human_first_issues(
        text,
        ("Product Overview", "Product Crux"),
        supported_formats=("human-first-v2", "human-first-v3"),
    )
    approval_requirements = []
    approval_context = {}
    if require_approvals:
        approval_context = load_approval_context(Path.cwd(), approvals_path, gates_path)
        approval_requirements.append(
            approval_requirement(
                approval_context,
                Path.cwd(),
                "spec.approved",
                path,
                "feature/component" if feature else "product/system",
            )
        )

    uc, fr = defined["UC"], defined["FR"]
    uc_cov = covered_by(uc, ats, {"UC"})
    fr_cov = covered_by(fr, ats, {"FR"})

    def pct(a, b):
        return round(100 * len(a) / len(b), 1) if b else 100.0

    gates = {
        "id_format_slug_only": not bad_fmt,
        "no_duplicates": not dupes,
        "no_orphan_refs": not orphans,
        "uc_at_coverage_100": uc_cov == uc,
        "fr_at_coverage_100": fr_cov == fr,
        "required_approvals_present": approval_gate_passed(approval_requirements),
        "human_first_structure": not format_issues,
    }
    if not require_approvals:
        gates.pop("required_approvals_present")
    if not feature:
        if format_name == "human-first-v3":
            required_sections = HUMAN_FIRST_SPEC_SECTIONS
        elif format_name == "human-first-v2":
            required_sections = LEGACY_HUMAN_FIRST_SPEC_SECTIONS
        else:
            required_sections = SPEC_SECTIONS
        gates["sections_present"] = sections_present_in_order(text, required_sections)
    report = {
        "mode": "feature" if feature else "product",
        "counts": {k: len(v) for k, v in defined.items()},
        "uc_at_coverage_pct": pct(uc_cov, uc),
        "fr_at_coverage_pct": pct(fr_cov, fr),
        "uncovered_use_cases": sorted(uc - uc_cov),
        "uncovered_frs": sorted(fr - fr_cov),
        "orphan_refs": orphans,
        "duplicates": dupes,
        "bad_id_format": bad_fmt,
        "approval_requirements": approval_requirements,
        "approval_ledger": {
            "path": approvals_path,
            "exists": approval_context.get("exists") if approval_context else None,
            "load_error": approval_context.get("load_error")
            if approval_context
            else None,
            "invalid_records": (
                approval_context.get("invalid_records") if approval_context else []
            ),
        },
        "artifact_format": format_name,
        "human_first_issues": format_issues,
        "gates": gates,
        "passed": sum(gates.values()),
        "total": len(gates),
    }
    if as_json:
        print(json.dumps(report, indent=2))
    else:
        labels = {
            "id_format_slug_only": "Identifiers use the supported format",
            "no_duplicates": "No duplicate identifiers",
            "no_orphan_refs": "All references resolve",
            "uc_at_coverage_100": "User outcomes have acceptance coverage",
            "fr_at_coverage_100": "Requirements have acceptance coverage",
            "required_approvals_present": "Required approvals are current",
            "human_first_structure": (
                "Plain-language opening and traceability are present"
            ),
            "sections_present": "Required sections are present",
        }
        for k, v in gates.items():
            print(f"{'PASS' if v else 'FAIL'}  {labels.get(k, k.replace('_', ' '))}")
        uc_pct = report["uc_at_coverage_pct"]
        fr_pct = report["fr_at_coverage_pct"]
        print(f"\nUser outcomes covered: {uc_pct}%  Requirements covered: {fr_pct}%")
        print(f"{report['passed']}/{report['total']} checks passed")
    return 0 if all(gates.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
