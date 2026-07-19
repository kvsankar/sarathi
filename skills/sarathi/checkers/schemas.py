"""Shared structural schemas for Sarathi checker scripts."""

import re

SLUG_TOKEN = r"[A-Z][A-Z0-9]{1,31}"
PLAN_ID_PATTERN = rf"(MILE|WORK|PR)-({SLUG_TOKEN})-({SLUG_TOKEN})"
PLAN_ID = re.compile(rf"(?<![A-Za-z0-9-]){PLAN_ID_PATTERN}(?![A-Za-z0-9-])")
PLAN_ID_FULL = re.compile(PLAN_ID_PATTERN)
PLAN_ID_BY_KIND = {
    kind: re.compile(
        rf"(?<![A-Za-z0-9-]){kind}-{SLUG_TOKEN}-{SLUG_TOKEN}(?![A-Za-z0-9-])"
    )
    for kind in ("MILE", "WORK", "PR")
}
PLAN_ID_CANDIDATE = re.compile(
    r"(?<![A-Za-z0-9-])(?:MILE|WORK|PR)-[A-Za-z0-9]+"
    r"(?:-[A-Za-z0-9]+)*(?![A-Za-z0-9-])",
    re.I,
)
WAVE_ID_PATTERN = rf"WAVE-({SLUG_TOKEN})-({SLUG_TOKEN})"
WAVE_ID_FULL = re.compile(WAVE_ID_PATTERN)
WAVE_ID_CANDIDATE = re.compile(
    r"(?<![A-Za-z0-9-])WAVE-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![A-Za-z0-9-])",
    re.I,
)


def is_plan_id(identifier: str, kind: str | None = None) -> bool:
    """Return whether an identifier follows KIND-AREA-NAME plan grammar."""
    match = PLAN_ID_FULL.fullmatch(identifier)
    return bool(match and (kind is None or match.group(1) == kind))


def is_wave_id(identifier: str) -> bool:
    """Return whether an identifier follows WAVE-AREA-NAME grammar."""
    return WAVE_ID_FULL.fullmatch(identifier) is not None


SPEC_SECTIONS = [
    "Mission Statement",
    "User Needs",
    "Non-Goals",
    "Features",
    "Use Cases",
    "Functional Requirements",
    "Non-Functional Requirements",
    "External Interfaces & Contracts",
    "Acceptance Tests",
    "Journey Tests",
    "Traceability Matrix",
    "Assumptions & Open Questions",
]

HUMAN_FIRST_SPEC_SECTIONS = [
    "Product Overview",
    "Traceability",
]

DESIGN_SECTIONS = [
    "Overview",
    "Tech Stack",
    "Drivers & Constraints",
    "Layers",
    "Components",
    "Interfaces",
    ("Core vs. Shell", "Core vs. Shell / Equivalent Separation"),
    "Key Flows",
    "Data Model",
    "Design Decisions",
    "Test Strategy",
    "Risks & Trade-offs",
    "Traceability Matrix",
]

HUMAN_FIRST_DESIGN_SECTIONS = [
    "Technical Approach",
    "Traceability",
]

PLAN_SECTIONS = [
    "Overview",
    "Strategy",
    "Milestones",
    ("Pull Requests", "Pull Requests / Child Work Items"),
    "Coverage Map",
    "Sequencing & Risks",
]

HUMAN_FIRST_PLAN_SECTIONS = [
    "Implementation Approach",
    "Traceability",
]

PRODUCT_FIRST_PLAN_SECTIONS = [
    "Implementation Approach",
    "Baseline Reuse",
    "Traceability",
]
