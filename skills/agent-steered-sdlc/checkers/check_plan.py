#!/usr/bin/env python3
"""Deterministic mechanical verifier for a Work Plan.

Parses a plan markdown file, validates IDs/structure, and computes structural
metrics: every spec FR/AT/JT, design COMP, and design TEST obligation is referenced
by child WORK items or PRs; implementation PRs include Red+Green step text, do not
depend on a later PR, and report LOC sizing as advisory reviewability evidence.
Exits 0 only when every structural gate passes. No semantic judgment, reproducible.

Usage:
    python check_plan.py [plan.md] [--json] [--feature] [--parent product.md]
                         [--spec spec.md] [--design design.md]
                         [--loc-target 500]

--feature  Treat as a feature-level plan (subset of a product).
--parent   A product plan whose IDs may be referenced.
--spec     Spec file: every FR-/AT-/JT- must be covered by a WORK item or PR.
--design   Design file: every COMP-/TEST- must be covered by a WORK item or PR.
--loc-target  Advisory changed-LOC target for reviewable PR sizing. Default: 500.
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
from schemas import PLAN_SECTIONS  # noqa: E402

SLUG_TOKEN = r"[A-Z][A-Z0-9]{1,31}"
ID = re.compile(rf"\b(MILE|WORK|PR)-({SLUG_TOKEN})-({SLUG_TOKEN})\b")
FR = re.compile(rf"\bFR-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
UC = re.compile(rf"\bUC-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
NFR = re.compile(rf"\bNFR-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
AT = re.compile(rf"\bAT-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
JT = re.compile(rf"\bJT-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
COMP = re.compile(rf"\bCOMP-{SLUG_TOKEN}\b")
TEST = re.compile(rf"\bTEST-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
PR_REF = re.compile(rf"\bPR-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
VALID_ANY = re.compile(
    rf"\b(?:(?:MILE|WORK|PR|FR|UC|NFR|AT|JT)-{SLUG_TOKEN}-{SLUG_TOKEN}|"
    rf"TEST-{SLUG_TOKEN}-{SLUG_TOKEN}|COMP-{SLUG_TOKEN})\b"
)
ID_CANDIDATE = re.compile(
    r"\b(?:MILE|WORK|PR|FR|UC|NFR|AT|JT|TEST|COMP)(?:-[A-Za-z0-9]+)+\b",
    re.I,
)
LOC = re.compile(r"(?:\b(\d+)\s*loc\b|\bloc\s*[:=]?\s*(\d+)\b)", re.I)
VAGUE = re.compile(r"\b(?:and/or|tbd|as appropriate|as needed|various)\b|etc\.", re.I)
UI_MOCK_REQUIRED = re.compile(r"^\s*UI Mock Preference\s*:\s*Required\s*$", re.I | re.M)
UI_MOCK_ARTIFACT = re.compile(r"^\s*UI Mock Artifact\s*:\s*(\S+)\s*$", re.I | re.M)
LEAD = re.compile(r"^[\s#>\-\*\+0-9.\)]*")
HEADING = re.compile(r"^#{1,6}\s+(.+?)\s*$")
DEF_MARKER = re.compile(r"^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[\.)]\s+)")
DEFAULT_LOC_TARGET = 500


def _defline(line: str):
    if not DEF_MARKER.match(line):
        return None
    return ID.match(LEAD.sub("", line.strip()))


def _norm_heading(title: str) -> str:
    title = re.sub(r"\s+#*$", "", title.strip())
    title = title.replace("*", "").replace("`", "")
    return re.sub(r"\s+", " ", title).casefold()


def sections_present_in_order(text: str, required: list[str | tuple[str, ...]]) -> bool:
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
        matched = heading in wanted if isinstance(wanted, tuple) else heading == wanted
        if matched:
            pos += 1
    return pos == len(required_norm)


def section_text(text: str, title: str) -> str:
    wanted = _norm_heading(title)
    lines = text.splitlines()
    start = None
    start_level = 0
    for i, line in enumerate(lines):
        if (m := HEADING.match(line.strip())) and _norm_heading(m.group(1)) == wanted:
            start, start_level = i + 1, len(line) - len(line.lstrip("#"))
            break
    if start is None:
        return ""
    end = len(lines)
    for i in range(start, len(lines)):
        head = HEADING.match(lines[i].strip())
        level = len(lines[i]) - len(lines[i].lstrip("#"))
        if head and level <= start_level:
            end = i
            break
    return "\n".join(lines[start:end])


def defs_and_refs(text: str):
    defined: dict[str, set] = {k: set() for k in ("MILE", "WORK", "PR")}
    refs: set[str] = set()
    in_fence = False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            refs.update(m.group(0) for m in ID.finditer(line))
            continue
        if [m.group(0) for m in ID.finditer(line)]:
            first = None if in_fence else _defline(line)
            if first:
                defined[first.group(1)].add(first.group(0))
            refs.update(m.group(0) for m in ID.finditer(line))
    return defined, refs


def ids_from(path: str, pat: re.Pattern) -> set:
    return {m.group(0) for m in pat.finditer(Path(path).read_text(encoding="utf-8"))}


def malformed_ids(text: str) -> list[str]:
    """ID-looking tokens that do not follow plan/spec/design slug grammar."""
    return sorted(
        {
            m.group(0)
            for m in ID_CANDIDATE.finditer(text)
            if not VALID_ANY.fullmatch(m.group(0))
        }
    )


def loc_values(block: str) -> list[int]:
    return [int(left or right) for left, right in LOC.findall(block)]


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    as_json = "--json" in sys.argv
    feature = "--feature" in sys.argv
    require_approvals = "--require-approvals" in sys.argv
    loc_target = (
        int(sys.argv[sys.argv.index("--loc-target") + 1])
        if "--loc-target" in sys.argv
        else DEFAULT_LOC_TARGET
    )
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
        parent_text = Path(sys.argv[sys.argv.index("--parent") + 1]).read_text(
            encoding="utf-8"
        )
        pd, _ = defs_and_refs(parent_text)
        parent_ids = set().union(*pd.values())

    def spec_ids(pat):
        if "--spec" not in sys.argv:
            return set()
        return ids_from(sys.argv[sys.argv.index("--spec") + 1], pat)

    spec_frs = spec_ids(FR)
    spec_ucs = spec_ids(UC)
    spec_nfrs = spec_ids(NFR)
    spec_ats = spec_ids(AT)
    spec_jts = spec_ids(JT)
    design_path = (
        sys.argv[sys.argv.index("--design") + 1] if "--design" in sys.argv else None
    )
    design_text = Path(design_path).read_text(encoding="utf-8") if design_path else ""
    design_comps = ids_from(design_path, COMP) if design_path else set()
    design_tests = ids_from(design_path, TEST) if design_path else set()
    path = Path(args[0] if args else "plan.md")
    text = path.read_text(encoding="utf-8")
    defined, refs = defs_and_refs(text)
    all_ids = set().union(*defined.values()) | parent_ids

    # Per-delivery blocks: from one WORK/PR def line to the next def/heading.
    lines = text.splitlines()
    pr_blocks: dict[str, str] = {}
    work_blocks: dict[str, str] = {}
    cur, buf = None, []
    in_fence = False
    for line in lines:
        fence = line.strip().startswith("```")
        m = None if in_fence else _defline(line)
        if m and m.group(1) in {"WORK", "PR"}:
            if cur:
                (pr_blocks if cur.startswith("PR-") else work_blocks)[cur] = "\n".join(
                    buf
                )
            cur, buf = m.group(0), [line]
        elif cur:
            if line.startswith("## ") or (m and m.group(1) in {"MILE", "WORK", "PR"}):
                (pr_blocks if cur.startswith("PR-") else work_blocks)[cur] = "\n".join(
                    buf
                )
                cur = None
                buf = []
            else:
                buf.append(line)
        if fence:
            in_fence = not in_fence
    if cur:
        (pr_blocks if cur.startswith("PR-") else work_blocks)[cur] = "\n".join(buf)

    large_prs = [
        p for p, b in pr_blocks.items() if any(n > loc_target for n in loc_values(b))
    ]
    missing_loc = [p for p, b in pr_blocks.items() if not loc_values(b)]
    no_tdd = [
        p
        for p, b in pr_blocks.items()
        if not (re.search(r"\bred\b", b, re.I) and re.search(r"\bgreen\b", b, re.I))
    ]
    pr_order = {p: i for i, p in enumerate(pr_blocks)}
    fwd = []
    for p, b in pr_blocks.items():
        for r in PR_REF.findall(b):
            if r != p and r in pr_order and pr_order[r] > pr_order[p]:
                fwd.append(p)
                break

    delivery_blocks = list(work_blocks.values()) + list(pr_blocks.values())
    delivery_text = (
        "\n".join(delivery_blocks) + "\n" + section_text(text, "Coverage Map")
    )

    def cover(need, pat):
        return need & {m.group(0) for m in pat.finditer(delivery_text)}

    fr_c, uc_c, nfr_c = cover(spec_frs, FR), cover(spec_ucs, UC), cover(spec_nfrs, NFR)
    at_c, comp_c = cover(spec_ats, AT), cover(design_comps, COMP)
    jt_c = cover(spec_jts, JT)
    test_c = cover(design_tests, TEST)
    def_ids = []
    in_fence = False
    for line in lines:
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence and (m := _defline(line)):
            def_ids.append(m.group(0))
    dupes = [i for i, n in Counter(def_ids).items() if n > 1]
    bad = malformed_ids(text)
    orphans = sorted(r for r in refs if r not in all_ids)
    vague = len(VAGUE.findall(text))
    approval_requirements = []
    approval_context = {}
    if require_approvals:
        approval_context = load_approval_context(Path.cwd(), approvals_path, gates_path)
        if "--spec" in sys.argv:
            spec_path = sys.argv[sys.argv.index("--spec") + 1]
            approval_requirements.append(
                approval_requirement(
                    approval_context, Path.cwd(), "spec.approved", spec_path
                )
            )
            if UI_MOCK_REQUIRED.search(Path(spec_path).read_text(encoding="utf-8")):
                mock_match = UI_MOCK_ARTIFACT.search(design_text)
                if mock_match:
                    approval_requirements.append(
                        approval_requirement(
                            approval_context,
                            Path.cwd(),
                            "ux.mock.approved",
                            mock_match.group(1),
                        )
                    )
                else:
                    approval_requirements.append(
                        {
                            "gate": "ux.mock.approved",
                            "artifact": None,
                            "scope": None,
                            "approved": False,
                            "approval_id": None,
                            "status": None,
                            "issues": ["UI Mock Artifact is required by the spec"],
                        }
                    )
        if design_path:
            approval_requirements.append(
                approval_requirement(
                    approval_context, Path.cwd(), "design.approved", design_path
                )
            )

    def pct(a, b):
        return round(100 * len(a) / len(b), 1) if b else 100.0

    gates = {
        "has_delivery_items": bool(work_blocks or pr_blocks),
        "id_format_slug_only": not bad,
        "no_duplicates": not dupes,
        "no_orphan_refs": not orphans,
        "fr_coverage_100": fr_c == spec_frs,
        "uc_coverage_100": uc_c == spec_ucs,
        "nfr_coverage_100": nfr_c == spec_nfrs,
        "at_coverage_100": at_c == spec_ats,
        "jt_coverage_100": jt_c == spec_jts,
        "comp_coverage_100": comp_c == design_comps,
        "test_obligation_coverage_100": test_c == design_tests,
        "pr_tdd_red_green": not no_tdd,
        "no_forward_deps": not fwd,
        "required_approvals_present": approval_gate_passed(approval_requirements),
        "no_vagueness": vague == 0,
    }
    if not require_approvals:
        gates.pop("required_approvals_present")
    if not feature:
        gates["sections_present"] = sections_present_in_order(text, PLAN_SECTIONS)
    report = {
        "mode": "feature" if feature else "product",
        "counts": {k: len(v) for k, v in defined.items()},
        "plan_kind": (
            "breakdown" if work_blocks and not pr_blocks else "implementation"
        ),
        "work_items": sorted(work_blocks),
        "fr_coverage_pct": pct(fr_c, spec_frs),
        "uc_coverage_pct": pct(uc_c, spec_ucs),
        "nfr_coverage_pct": pct(nfr_c, spec_nfrs),
        "at_coverage_pct": pct(at_c, spec_ats),
        "jt_coverage_pct": pct(jt_c, spec_jts),
        "comp_coverage_pct": pct(comp_c, design_comps),
        "test_obligation_coverage_pct": pct(test_c, design_tests),
        "uncovered_frs": sorted(spec_frs - fr_c),
        "uncovered_ucs": sorted(spec_ucs - uc_c),
        "uncovered_nfrs": sorted(spec_nfrs - nfr_c),
        "uncovered_ats": sorted(spec_ats - at_c),
        "uncovered_jts": sorted(spec_jts - jt_c),
        "uncovered_comps": sorted(design_comps - comp_c),
        "uncovered_test_obligations": sorted(design_tests - test_c),
        "loc_target": loc_target,
        "large_prs": sorted(large_prs),
        "prs_missing_loc": sorted(missing_loc),
        "loc_advisory": {
            "status": "ok" if not large_prs and not missing_loc else "review",
            "message": (
                "LOC estimates are advisory reviewability signals. Exceeding the "
                "target is allowed with rationale; do not remove useful comments, "
                "tests, docs, or readable structure merely to fit the target."
            ),
        },
        "prs_missing_tdd": sorted(no_tdd),
        "forward_deps": sorted(fwd),
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
        "orphan_refs": orphans,
        "duplicates": dupes,
        "bad_id_format": bad,
        "vague_hits": vague,
        "gates": gates,
        "passed": sum(gates.values()),
        "total": len(gates),
    }
    if as_json:
        print(json.dumps(report, indent=2))
    else:
        for k, v in gates.items():
            print(f"{'PASS' if v else 'FAIL'}  {k}")
        print(
            f"\nFR {report['fr_coverage_pct']}%  UC {report['uc_coverage_pct']}%"
            f"  NFR {report['nfr_coverage_pct']}%  AT {report['at_coverage_pct']}%"
            f"  JT {report['jt_coverage_pct']}%  COMP {report['comp_coverage_pct']}%"
            f"  TEST {report['test_obligation_coverage_pct']}%"
        )
        print(f"{report['passed']}/{report['total']} gates passed")
    return 0 if all(gates.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
