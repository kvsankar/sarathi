import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "checkers" / "waves.py"


def load_parser():
    spec = importlib.util.spec_from_file_location("waves", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def test_wave_parser_accepts_ordered_exact_members():
    module = load_parser()
    result = module.parse_learning_waves(
        """# Learning Waves

## WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-CONTRACT, PR-AUTH-SIGNIN
WIP Limit: 2
Feedback/Integration Checkpoint: Review sandbox and contract evidence.
Stop/Replan Triggers: Stop if the token contract changes.
""",
        "docs/plan.md",
    )

    assert result["declared"] is True
    assert result["malformed_ids"] == []
    assert result["waves"][0]["id"] == "WAVE-AUTH-BOUNDARY"
    assert result["waves"][0]["members"] == [
        "PR-AUTH-CONTRACT",
        "PR-AUTH-SIGNIN",
    ]
    assert result["waves"][0]["wip_limit"] == 2


def test_wave_parser_rejects_one_token_extra_token_and_bad_controls():
    module = load_parser()
    result = module.parse_learning_waves(
        """# Learning Waves

## WAVE-AUTH
Order: 1
Members: PR-AUTH-SIGNIN

## WAVE-AUTH-BOUNDARY-EXTRA
Order: later
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN-EXTRA
WIP Limit: 0
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.
"""
    )

    assert result["waves"] == []
    assert result["malformed_ids"] == [
        "WAVE-AUTH",
        "WAVE-AUTH-BOUNDARY-EXTRA",
    ]


def test_wave_parser_reports_duplicate_order_and_membership_candidates():
    module = load_parser()
    result = module.parse_learning_waves(
        """# Learning Waves

## WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN, PR-AUTH-SIGNIN, PR-AUTH
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.

## WAVE-AUTH-RECOVERY
Order: 1
Learning Target: Validate recovery behavior.
Members: PR-AUTH-RECOVERY
WIP Limit: 1
Feedback/Integration Checkpoint: Review recovery evidence.
Stop/Replan Triggers: Stop on recovery contract change.
"""
    )

    assert result["duplicate_orders"] == [1]
    assert result["invalid_members"] == {"WAVE-AUTH-BOUNDARY": ["PR-AUTH"]}
    assert result["duplicate_members"] == {"WAVE-AUTH-BOUNDARY": ["PR-AUTH-SIGNIN"]}


def test_wave_parser_rejects_wave_without_valid_members():
    module = load_parser()
    result = module.parse_learning_waves(
        """# Learning Waves

## WAVE-AUTH-EMPTY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.
"""
    )

    assert result["empty_members"] == ["WAVE-AUTH-EMPTY"]
    assert result["invalid_members"] == {"WAVE-AUTH-EMPTY": ["PR-AUTH"]}


def test_empty_wave_section_is_declared_and_plan_type_controls_member_kind():
    module = load_parser()
    empty = module.parse_learning_waves(
        """# Plan
Plan Type: Implementation

## Learning Waves

## Sequencing & Risks
"""
    )
    breakdown = module.parse_learning_waves(
        """# Plan
Plan Type: Breakdown

## Learning Waves

### WAVE-AUTH-BOUNDARY
Order: 1
Learning Target: Validate the identity boundary.
Members: PR-AUTH-SIGNIN
WIP Limit: 1
Feedback/Integration Checkpoint: Review evidence.
Stop/Replan Triggers: Stop on contract change.
"""
    )

    assert empty["declared"] is True
    assert empty["waves"] == []
    assert breakdown["invalid_member_kinds"] == {
        "WAVE-AUTH-BOUNDARY": ["PR-AUTH-SIGNIN"]
    }


def test_wave_parser_accepts_descriptive_heading_with_hidden_id():
    module = load_parser()
    result = module.parse_learning_waves(
        """# Plan
Plan Type: Breakdown

## Waves

### Validate the identity boundary
<!-- sarathi:wave id="WAVE-AUTH-BOUNDARY" -->
Order: 1
Learning Target: Validate the identity boundary.
Members: WORK-AUTH-CONTRACT
WIP Limit: 1
Feedback/Integration Checkpoint: Review contract evidence.
Stop/Replan Triggers: Stop if the contract changes.
"""
    )

    assert result["malformed_ids"] == []
    assert result["waves"][0]["id"] == "WAVE-AUTH-BOUNDARY"
    assert result["waves"][0]["name"] == "Validate the identity boundary"
