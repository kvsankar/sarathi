#!/usr/bin/env python3
"""Deterministic mechanical verifier for a Work Plan.

Parses a plan markdown file, validates IDs/structure, and computes structural
metrics: every spec FR/AT/JT, design COMP, and design TEST obligation is referenced
by child WORK items or PRs; implementation PRs do not depend on a later PR;
optional Breakdown-plan waves are well formed and only name known children; and
bounded slices remain structurally traceable.
Exits 0 only when every structural gate passes. No semantic judgment, reproducible.

Usage:
    python check_plan.py [plan.md] [--json] [--feature] [--parent product.md]
                         [--spec spec.md] [--design design.md]
                         [--inherited-subset]

--feature  Treat as a feature-level plan (subset of a product).
--parent   A product plan whose IDs may be referenced.
--spec     Spec file: every FR-/AT-/JT- must be covered by a WORK item or PR.
--design   Design file: every COMP-/TEST- must be covered by a WORK item or PR.
--inherited-subset
           Validate cited parent spec/design IDs without requiring the plan to allocate
           every obligation in those parent artifacts.
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
    strip_fenced_code,
)
from schemas import (  # noqa: E402
    HUMAN_FIRST_PLAN_SECTIONS,
    PLAN_ID,
    PLAN_ID_BY_KIND,
    PLAN_ID_CANDIDATE,
    PLAN_SECTIONS,
    PRODUCT_FIRST_PLAN_SECTIONS,
    SLUG_TOKEN,
)
from waves import parse_learning_waves  # noqa: E402

ID = PLAN_ID
FR = re.compile(rf"\bFR-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
UC = re.compile(rf"\bUC-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
NFR = re.compile(rf"\bNFR-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
AT = re.compile(rf"\bAT-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
JT = re.compile(rf"\bJT-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
COMP = re.compile(rf"\bCOMP-{SLUG_TOKEN}\b")
TEST = re.compile(rf"\bTEST-{SLUG_TOKEN}-{SLUG_TOKEN}\b")
PR_REF = PLAN_ID_BY_KIND["PR"]
VALID_ANY = re.compile(
    rf"(?:(?:MILE|WORK|PR|FR|UC|NFR|AT|JT)-{SLUG_TOKEN}-{SLUG_TOKEN}|"
    rf"TEST-{SLUG_TOKEN}-{SLUG_TOKEN}|COMP-{SLUG_TOKEN})"
)
NON_PLAN_ID_CANDIDATE = re.compile(
    r"(?<![A-Za-z0-9-])(?:(?:FR|UC|NFR|AT|JT|TEST)-[A-Za-z0-9]+"
    r"-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*|COMP-[A-Za-z0-9]+"
    r"(?:-[A-Za-z0-9]+)*)"
    r"(?![A-Za-z0-9-])",
    re.I,
)
UI_MOCK_REQUIRED = re.compile(r"^\s*UI Mock Preference\s*:\s*Required\s*$", re.I | re.M)
UI_INTENT_ARTIFACT = re.compile(
    r"^\s*(?:UI Mock|Approved Prototype) Artifact\s*:\s*(\S+)\s*$", re.I | re.M
)
SLICE_SCOPE = re.compile(r"^\s*Work Scope\s*:\s*Slice/change\s*$", re.I | re.M)
LEAN_CHANGE_RECORD = re.compile(r"^\s*Lean Change Record\s*:\s*Yes\s*$", re.I | re.M)
INHERITED_INTENT_RECORD = re.compile(
    r"^\s*Inherited Intent Record\s*:\s*Yes\s*$", re.I | re.M
)
DELIVERY_PROFILE = re.compile(r"^\s*Delivery Profile\s*:\s*(.+?)\s*$", re.I | re.M)
IMPLEMENTATION_READINESS = re.compile(
    r"^\s*Implementation Readiness\s*:\s*(.+?)\s*$", re.I | re.M
)
PARENT_WORK_ITEM = re.compile(
    r"^\s*Parent Work Item\s*:\s*(WORK-[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*)\s*$",
    re.I | re.M,
)
EXTERNAL_DOUBLE = re.compile(
    r"\b(?:external|vendor|sdk|api|cli|host|service|broker|driver|"
    r"database|file format)"
    r"\b(?:(?!\n\n).){0,160}\b(?:mock|fake|stub|test double|mirror|mirrored|"
    r"re-?declar|hand-?cop(?:y|ied)|hand-?authored|local interface|do not import)\b|"
    r"\b(?:mock|fake|stub|test double|mirror|mirrored|re-?declar|hand-?cop(?:y|ied)|"
    r"hand-?authored|local interface|do not import)\b(?:(?!\n\n).){0,160}"
    r"\b(?:external|vendor|sdk|api|cli|host|service|broker|driver|"
    r"database|file format)\b",
    re.I | re.S,
)
REAL_BOUNDARY = re.compile(
    r"\b(?:real[- ]boundary|real dependency|real external|official conformance|"
    r"type[- ]conformance|contract test|integration test|vendor sandbox|emulator|"
    r"captured real|generated client|schema|openapi|asyncapi)\b",
    re.I,
)
LEAD = re.compile(r"^[\s#>\-\*\+0-9.\)]*")
HEADING = re.compile(r"^#{1,6}\s+(.+?)\s*$")
DEF_MARKER = re.compile(r"^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[\.)]\s+)")
WORK_ALLOCATION_FIELDS = {
    "Parent scope": "parent_scope",
    "Child scope": "child_scope",
    "Scope": "scope",
    "Parent IDs / inherited obligations": "parent_obligations",
    (
        "Required child artifacts",
        "Required child documents",
    ): "required_child_artifacts",
}
LEAN_CHANGE_FIELDS = (
    "Why Lean",
    "Changed Behavior",
    "Parent IDs / inherited obligations",
    "Acceptance & Verification",
    "Escalate If",
)
INHERITED_INTENT_FIELDS = (
    "Why Direct",
    "Acceptance & Verification",
)
WORK_CLASSIFICATIONS = {
    "reuse directly",
    "extract then reuse",
    "target-owned implementation",
    "new behavior",
    "deferred cleanup",
}
WORK_CLASSIFICATION = re.compile(
    r"(?im)^\s*(?:[-*+]\s+)?(?:\*\*)?Work Classification(?:\*\*)?\s*:\s*(.+?)\s*$"
)


def _defline(line: str):
    identifier = definition_id(line, ID, LEAD, DEF_MARKER)
    return ID.match(identifier) if identifier else None


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
    candidates = {
        *(m.group(0) for m in PLAN_ID_CANDIDATE.finditer(text)),
        *(m.group(0) for m in NON_PLAN_ID_CANDIDATE.finditer(text)),
    }
    return sorted(
        identifier for identifier in candidates if not VALID_ANY.fullmatch(identifier)
    )


def external_double_mentions(text: str) -> list[str]:
    return [
        re.sub(r"\s+", " ", m.group(0)).strip() for m in EXTERNAL_DOUBLE.finditer(text)
    ]


def missing_work_allocation_fields(block: str) -> list[str]:
    missing = []
    for label, key in WORK_ALLOCATION_FIELDS.items():
        labels = (label,) if isinstance(label, str) else label
        patterns = [
            re.compile(
                rf"(?im)^\s*(?:[-*+]\s+)?(?:\*\*)?{re.escape(candidate)}"
                rf"(?:\*\*)?\s*:\s*\S"
            )
            for candidate in labels
        ]
        if not any(pattern.search(block) for pattern in patterns):
            missing.append(key)
    return missing


def inherited_intent_record_issues(text: str, implementation_plan: bool) -> list[str]:
    """Check a compact plan that inherits accepted parent intent and architecture."""
    legacy_lean = LEAN_CHANGE_RECORD.search(text) is not None
    inherited_intent = INHERITED_INTENT_RECORD.search(text) is not None
    if not (legacy_lean or inherited_intent):
        return []
    issues = []
    if legacy_lean:
        profile = DELIVERY_PROFILE.search(text)
        if not profile or profile.group(1).strip().casefold() != "lean":
            issues.append("delivery_profile_must_be_lean")
        if not SLICE_SCOPE.search(text):
            issues.append("work_scope_must_be_slice_change")
    readiness = IMPLEMENTATION_READINESS.search(text)
    if not readiness or readiness.group(1).strip().casefold() != "code-ready":
        issues.append("implementation_readiness_must_be_code_ready")
    if not implementation_plan:
        issues.append("plan_type_must_be_implementation")
    if legacy_lean and not PARENT_WORK_ITEM.search(text):
        issues.append("parent_work_item_missing_or_invalid")
    for label in LEAN_CHANGE_FIELDS if legacy_lean else INHERITED_INTENT_FIELDS:
        pattern = re.compile(
            rf"(?im)^\s*(?:[-*+]\s+)?(?:\*\*)?{re.escape(label)}"
            rf"(?:\*\*)?\s*:\s*\S"
        )
        if not pattern.search(text):
            field_key = label.casefold().replace(" ", "_").replace("/", "_")
            issues.append(f"missing_{field_key.replace('&', 'and')}")
    return issues


def work_classification_issues(blocks: dict[str, str]) -> dict[str, dict]:
    """Return missing, repeated, or unsupported per-delivery classifications."""
    issues: dict[str, dict] = {}
    for identifier, block in blocks.items():
        if block.lstrip().startswith("|"):
            issues[identifier] = {
                "reason": "descriptive_delivery_block_required",
                "values": [],
            }
            continue
        values = [match.strip() for match in WORK_CLASSIFICATION.findall(block)]
        normalized = [value.casefold() for value in values]
        if len(values) != 1:
            issues[identifier] = {
                "reason": "exactly_one_classification_required",
                "values": values,
            }
        elif normalized[0] not in WORK_CLASSIFICATIONS:
            issues[identifier] = {
                "reason": "unsupported_classification",
                "values": values,
            }
    return issues


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    as_json = "--json" in sys.argv
    feature = "--feature" in sys.argv
    inherited_subset = "--inherited-subset" in sys.argv
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
    format_name = artifact_format(text)
    format_issues = human_first_issues(
        text,
        ("Implementation Approach", "Implementation Crux"),
        ("human-first-v2", "human-first-v3"),
    )
    cited = {
        "fr": {m.group(0) for m in FR.finditer(text)},
        "uc": {m.group(0) for m in UC.finditer(text)},
        "nfr": {m.group(0) for m in NFR.finditer(text)},
        "at": {m.group(0) for m in AT.finditer(text)},
        "jt": {m.group(0) for m in JT.finditer(text)},
        "comp": {m.group(0) for m in COMP.finditer(text)},
        "test": {m.group(0) for m in TEST.finditer(text)},
    }
    defined, refs = defs_and_refs(text)
    all_ids = set().union(*defined.values()) | parent_ids
    wave_result = parse_learning_waves(text, str(path))

    # Per-delivery blocks: from one WORK/PR def line to the next def/heading.
    lines = text.splitlines()
    primary_delivery_ids = primary_definition_ids(text, _defline)
    pr_blocks: dict[str, str] = {}
    work_blocks: dict[str, str] = {}
    cur, buf = None, []
    in_fence = False
    for line in lines:
        fence = line.strip().startswith("```")
        m = None if in_fence else _defline(line)
        if m and line.lstrip().startswith("|") and m.group(0) in primary_delivery_ids:
            m = None
        if m and m.group(1) in {"WORK", "PR"}:
            existing = m.group(0) in pr_blocks or m.group(0) in work_blocks
            if existing:
                continue
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

    incomplete_work_allocations = {
        identifier: missing_work_allocation_fields(block)
        for identifier, block in work_blocks.items()
        if missing_work_allocation_fields(block)
    }
    classification_issues = work_classification_issues({**work_blocks, **pr_blocks})
    classification_values = [
        value.strip() for value in WORK_CLASSIFICATION.findall(strip_fenced_code(text))
    ]
    expected_classifications = len(defined["WORK"] | defined["PR"])
    classification_count_valid = len(
        classification_values
    ) == expected_classifications and all(
        value.casefold() in WORK_CLASSIFICATIONS for value in classification_values
    )
    baseline_reuse_present = bool(section_text(text, "Baseline Reuse").strip())
    plan_type_match = re.search(r"(?mi)^Plan Type:\s*(.+?)\s*$", text)
    breakdown_plan = bool(
        plan_type_match and plan_type_match.group(1).strip().casefold() == "breakdown"
    )
    implementation_plan = bool(
        plan_type_match
        and plan_type_match.group(1).strip().casefold() == "implementation"
    )
    lean_change_record = LEAN_CHANGE_RECORD.search(text) is not None
    inherited_intent_record = INHERITED_INTENT_RECORD.search(text) is not None
    compact_record = lean_change_record or inherited_intent_record
    lean_change_issues = inherited_intent_record_issues(text, implementation_plan)
    work_ids = set(work_blocks) if breakdown_plan else set()
    wave_member_counts = Counter(
        member for wave in wave_result["waves"] for member in wave["members"]
    )
    unknown_wave_members = sorted(set(wave_member_counts) - work_ids)
    unscheduled_work_items = sorted(work_ids - set(wave_member_counts))
    duplicate_wave_members = sorted(
        member for member, count in wave_member_counts.items() if count > 1
    )

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
            identifier = m.group(0)
            if line.lstrip().startswith("|") and identifier in primary_delivery_ids:
                continue
            def_ids.append(identifier)
    dupes = [i for i, n in Counter(def_ids).items() if n > 1]
    bad = malformed_ids(text)
    orphans = sorted(r for r in refs if r not in all_ids)
    ext_double_mentions = external_double_mentions(text)
    external_double_mitigation_present = (
        not ext_double_mentions or REAL_BOUNDARY.search(delivery_text) is not None
    )
    approval_requirements = []
    approval_context = {}
    if require_approvals:
        approval_context = load_approval_context(Path.cwd(), approvals_path, gates_path)
    if require_approvals:
        if "--spec" in sys.argv:
            spec_path = sys.argv[sys.argv.index("--spec") + 1]
            approval_requirements.append(
                approval_requirement(
                    approval_context, Path.cwd(), "spec.approved", spec_path
                )
            )
            if UI_MOCK_REQUIRED.search(Path(spec_path).read_text(encoding="utf-8")):
                mock_match = UI_INTENT_ARTIFACT.search(
                    Path(spec_path).read_text(encoding="utf-8")
                    + "\n"
                    + design_text
                    + "\n"
                    + text
                )
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
                            "issues": [
                                "Approved UI intent artifact is required by the spec"
                            ],
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

    available = {
        "fr": spec_frs,
        "uc": spec_ucs,
        "nfr": spec_nfrs,
        "at": spec_ats,
        "jt": spec_jts,
        "comp": design_comps,
        "test": design_tests,
    }
    unknown_inherited = {
        key: sorted(values - available[key]) for key, values in cited.items()
    }

    def coverage_gate(covered: set, required: set, key: str) -> bool:
        if inherited_subset:
            return not unknown_inherited[key]
        return covered == required

    wave_declaration_valid = bool(
        wave_result["declared"] and wave_result["waves"]
    ) and not (
        wave_result["malformed_ids"]
        or wave_result["duplicates"]
        or wave_result["missing_fields"]
        or wave_result["invalid_orders"]
        or wave_result["invalid_wip_limits"]
        or wave_result["duplicate_orders"]
        or wave_result["invalid_members"]
        or wave_result["invalid_member_kinds"]
        or wave_result["duplicate_members"]
        or wave_result["empty_members"]
    )
    gates = {
        "has_delivery_items": bool(work_blocks or pr_blocks),
        "id_format_slug_only": not bad,
        "no_duplicates": not dupes,
        "no_orphan_refs": not orphans,
        "fr_coverage_100": coverage_gate(fr_c, spec_frs, "fr"),
        "uc_coverage_100": coverage_gate(uc_c, spec_ucs, "uc"),
        "nfr_coverage_100": coverage_gate(nfr_c, spec_nfrs, "nfr"),
        "at_coverage_100": coverage_gate(at_c, spec_ats, "at"),
        "jt_coverage_100": coverage_gate(jt_c, spec_jts, "jt"),
        "comp_coverage_100": coverage_gate(comp_c, design_comps, "comp"),
        "test_obligation_coverage_100": coverage_gate(test_c, design_tests, "test"),
        "external_double_mitigation_present": external_double_mitigation_present,
        "work_allocations_well_formed": not incomplete_work_allocations,
        "learning_waves_well_formed": (
            True
            if implementation_plan or not wave_result["declared"]
            else wave_declaration_valid
        ),
        "learning_wave_members_complete": (
            True
            if implementation_plan or not wave_result["declared"]
            else not (unknown_wave_members or duplicate_wave_members)
        ),
        "lean_change_record_well_formed": (
            not lean_change_record or not lean_change_issues
        ),
        "inherited_intent_record_well_formed": (
            not inherited_intent_record or not lean_change_issues
        ),
        "no_forward_deps": not fwd,
        "required_approvals_present": approval_gate_passed(approval_requirements),
        "human_first_structure": not format_issues,
        "baseline_reuse_classified": (
            format_name != "human-first-v3"
            or (
                baseline_reuse_present
                and classification_count_valid
                and not classification_issues
            )
        ),
    }
    if not require_approvals:
        gates.pop("required_approvals_present")
    if not feature:
        required_sections = (
            PRODUCT_FIRST_PLAN_SECTIONS
            if format_name == "human-first-v3"
            else HUMAN_FIRST_PLAN_SECTIONS
            if format_name == "human-first-v2"
            else PLAN_SECTIONS
        )
        gates["sections_present"] = sections_present_in_order(text, required_sections)
    report = {
        "mode": "feature" if feature else "product",
        "counts": {k: len(v) for k, v in defined.items()},
        "plan_kind": (
            "breakdown" if work_blocks and not pr_blocks else "implementation"
        ),
        "implementation_plan": implementation_plan,
        "lean_change_record": {
            "declared": lean_change_record,
            "issues": lean_change_issues,
            "replaces": ["child spec", "child design", "child plan"]
            if lean_change_record
            else [],
        },
        "inherited_intent_record": {
            "declared": inherited_intent_record,
            "legacy_lean_marker": lean_change_record,
            "issues": lean_change_issues,
            "replaces": ["child spec", "child design"] if compact_record else [],
        },
        "inherited_subset_mode": inherited_subset,
        "unknown_inherited_refs": unknown_inherited,
        "work_items": sorted(work_blocks),
        "incomplete_work_allocations": incomplete_work_allocations,
        "baseline_reuse": {
            "section_present": baseline_reuse_present,
            "allowed_classifications": sorted(WORK_CLASSIFICATIONS),
            "classifications": classification_values,
            "expected_count": expected_classifications,
            "issues": classification_issues,
        },
        "learning_waves": wave_result["waves"],
        "learning_wave_issues": {
            key: wave_result[key]
            for key in (
                "malformed_ids",
                "duplicates",
                "missing_fields",
                "invalid_orders",
                "invalid_wip_limits",
                "duplicate_orders",
                "invalid_members",
                "invalid_member_kinds",
                "duplicate_members",
                "empty_members",
            )
        },
        "unknown_wave_members": unknown_wave_members,
        "unscheduled_work_items": unscheduled_work_items,
        "unassigned_wave_members": unscheduled_work_items,
        "duplicate_wave_members": duplicate_wave_members,
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
        "external_double_mentions": ext_double_mentions,
        "external_double_mitigation_present": external_double_mitigation_present,
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
            "has_delivery_items": "At least one change is planned",
            "id_format_slug_only": "Identifiers use the supported format",
            "no_duplicates": "No duplicate identifiers",
            "no_orphan_refs": "All references resolve",
            "external_double_mitigation_present": (
                "External test substitutes have a real-dependency check"
            ),
            "work_allocations_well_formed": "Child work has the required links",
            "learning_waves_well_formed": "Work groups are valid",
            "learning_wave_members_complete": "Work group members resolve",
            "no_forward_deps": "Planned changes are in dependency order",
            "required_approvals_present": "Required approvals are current",
            "human_first_structure": (
                "Plain-language opening and traceability are present"
            ),
            "baseline_reuse_classified": (
                "Existing, shared, target-owned, new, and deferred work is classified"
            ),
            "sections_present": "Required sections are present",
        }
        for k, v in gates.items():
            print(f"{'PASS' if v else 'FAIL'}  {labels.get(k, k.replace('_', ' '))}")
        print(
            f"\nRequirements covered: {report['fr_coverage_pct']}%"
            f"  User outcomes covered: {report['uc_coverage_pct']}%"
            f"  Acceptance covered: {report['at_coverage_pct']}%"
            f"  Components covered: {report['comp_coverage_pct']}%"
            f"  Required tests covered: {report['test_obligation_coverage_pct']}%"
        )
        print(f"{report['passed']}/{report['total']} checks passed")
    return 0 if all(gates.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
