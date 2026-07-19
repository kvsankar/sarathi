# ruff: noqa: E501 - long fixture lines exercise Markdown annotations and tables verbatim.

import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_checker(name: str):
    path = ROOT / "checkers" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def run_checker(module, args, monkeypatch, capsys, cwd: Path):
    monkeypatch.chdir(cwd)
    monkeypatch.setattr(sys, "argv", [module.__file__, *args, "--json"])
    rc = module.main()
    return rc, json.loads(capsys.readouterr().out)


def human_first_spec() -> str:
    return """# Enabled authentication methods
<!-- sarathi:artifact-format version="2" -->

## Product Overview

Consumers need to sign in with any authentication method enabled for their deployment.
Disabled methods must never create a session. Anonymous posting is outside scope. Success
means an enabled method grants access while invalid or disabled credentials fail safely.

## User Needs

### Access protected functionality
<!-- sarathi:requirement id="UN-AUTH-ACCESS" -->

Consumers need authenticated access to protected functionality.

## Non-Goals

Anonymous posting is outside scope.

## Features

### Sign in using an enabled method
<!-- sarathi:requirement id="FEAT-AUTH-LOGIN" refs="UN-AUTH-ACCESS" -->

Consumers can sign in using an enabled method.

## Use Cases

### Sign in to a protected session
<!-- sarathi:requirement id="UC-AUTH-SIGNIN" refs="UN-AUTH-ACCESS FEAT-AUTH-LOGIN FR-AUTH-SIGNIN AT-AUTH-SIGNIN" -->

Primary actor: Consumer.
Supporting actors/systems: Credential store.
Goal: Access protected functionality.
Scope: Authentication boundary.
Trigger: The consumer submits credentials.
Preconditions: An enabled credential exists.
Minimal guarantees: Failure grants no access.
Success guarantees: A protected session is created.
Main success scenario:
1. The consumer submits credentials.
2. The system validates the enabled method.
3. The system creates a protected session.
Alternate flows: An existing valid session remains active.
Error/exception flows: Invalid or disabled credentials deny access safely.
Postconditions: Access is either granted or denied without partial state.
Frequency/importance: High; used for every protected session.
Trace links: Recorded in the structured annotation and final appendix.

## Functional Requirements

### Disabled methods cannot create sessions
<!-- sarathi:requirement id="FR-AUTH-SIGNIN" refs="UC-AUTH-SIGNIN" -->

The system shall create a session only for a valid credential using an enabled method.

## Non-Functional Requirements

### Sign-in response time
<!-- sarathi:requirement id="NFR-PERF-SIGNIN" -->

Sign-in shall complete within 200 ms under the accepted test workload.

## External Interfaces & Contracts

No external interface changes are introduced.

## Acceptance Tests

### Enabled and disabled methods produce different outcomes
<!-- sarathi:acceptance id="AT-AUTH-SIGNIN" refs="UC-AUTH-SIGNIN FR-AUTH-SIGNIN NFR-PERF-SIGNIN" -->

Given valid credentials, when the method is enabled, then access is granted within the
limit. Given the same credentials for a disabled method, when sign-in is attempted, then
no session is created.

## Journey Tests

No ordered multi-scenario journey is required for this bounded change.

## Assumptions & Open Questions

The accepted workload defines the response-time measurement.

## Traceability

| Human outcome | Machine ID | Verified by |
| --- | --- | --- |
| Disabled methods cannot create sessions | FR-AUTH-SIGNIN | AT-AUTH-SIGNIN |
"""


def human_first_design() -> str:
    return """# Authentication identities
<!-- sarathi:artifact-format version="2" -->

## Technical Approach

BPTrial currently stores passwords on its user model. The target model gives a user one
or more identities; each identity owns mechanisms and each mechanism owns its credential.
BPTrial and consumer-backend install the shared neuring-auth wheel independently. BPTrial
routes current password operations through a compatibility adapter without changing its
schema or public API, while consumer starts with separate persistence models. Reset-token
consumption, credential replacement, and session invalidation must be atomic.

## Overview

Work Scope: Feature/component
Design Depth: Feature
Implementation Readiness: Code-ready
Delivery Profile: Standard
Assurance Modules: Security

## Tech Stack

Python and the existing neuring-auth wheel.

## Drivers & Constraints

The compatibility boundary preserves current BPTrial behavior.

## Layers

### Application services
<!-- sarathi:entity id="LAYER-APP" type="layer" name="Application services" -->

Coordinates authentication use cases.

## Components

### BPTrial compatibility adapter
<!-- sarathi:entity id="COMP-AUTH" refs="FR-AUTH-SIGNIN" -->

Routes existing password operations through the shared wheel and uses IFACE-AUTH.

## Interfaces

### Authentication mechanism contract
<!-- sarathi:entity id="IFACE-AUTH" type="interface" name="Authentication mechanism contract" -->

Owner: COMP-AUTH. It validates a mechanism without changing BPTrial's public API.

## Core vs. Shell

Credential policy is pure; persistence and session invalidation remain at the shell.

## Key Flows

The adapter validates the exact identity, replaces the credential, consumes the token,
and invalidates sessions in one transaction.

## Data Model

Consumer owns User, Identity, Mechanism, and Credential records. BPTrial keeps its schema.

## Design Decisions

### Preserve BPTrial storage in the first increment
<!-- sarathi:entity id="DEC-AUTH" -->

The adapter avoids a migration in the compatibility increment.

## Test Strategy

### Compatibility behavior remains unchanged
<!-- sarathi:test id="TEST-AUTH-COMPAT" refs="COMP-AUTH IFACE-AUTH FR-AUTH-SIGNIN" -->

Contract tests execute the adapter through the real wheel and verify current behavior.

## Risks & Trade-offs

### Reset operations could update the wrong identity
<!-- sarathi:entity id="RISK-AUTH" -->

Exact identity binding and an atomic transaction mitigate the risk.

## Traceability

| Human element | Machine ID | Evidence |
| --- | --- | --- |
| BPTrial compatibility adapter | COMP-AUTH | TEST-AUTH-COMPAT |
"""


def human_first_plan() -> str:
    return """# Authentication compatibility increment
<!-- sarathi:artifact-format version="3" -->

## Implementation Approach

Route BPTrial password operations through the compatibility adapter, keeping its schema
and public API unchanged. Add the consumer identity persistence model separately. Verify
current BPTrial behavior and atomic reset behavior using behavioral test names.

## Baseline Reuse

The established service already provides password behavior. This slice reuses the shared
contract and adds only the established service's compatibility routing. Target persistence
is separate work; no new authentication behavior or deferred cleanup is included.

## Overview

Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready
Delivery Profile: Standard
Assurance Modules: Security

## Direct-To-Code Decision

- Inherited Sources: accepted authentication requirements and design.
- Reviewable Increment: BPTrial compatibility routing.
- Unresolved Blocker: none.
- Smallest Additional Artifact: none.

## Strategy

Implement one reversible compatibility increment and reuse existing tests.

## Milestones

Deliver the compatibility boundary.

## Pull Requests / Child Work Items

### Route password operations through the adapter
<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->

Work Classification: target-owned implementation
Scope: Add the adapter routing without schema or API changes.
Planned Touch Set: authentication adapter and focused tests.
Verification: behavioral compatibility and reset-replay tests pass.

## Coverage Map

Accepted compatibility behavior maps to the single delivery item.

## Sequencing & Risks

Add the adapter, route operations, then run compatibility and atomicity checks. Revert the
routing if existing behavior changes.

## Traceability

| Human delivery item | Machine ID | Evidence |
| --- | --- | --- |
| Route password operations through the adapter | PR-AUTH-COMPAT | compatibility tests |
"""


def small_change_plan() -> str:
    return """# Reject a replayed reset token

<!-- sarathi:artifact-format version="3" -->

## Implementation Approach

Reject a second use of a consumed password-reset token. Keep token issuance, password
policy, persistence schema, and public responses unchanged. Add one behavioral regression
test and pass the existing reset suite.

## Baseline Reuse

Replay handling already exists in the current reset path. Change that path directly; no
shared extraction, target-owned integration, or deferred cleanup is needed.

## Overview

Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready
Delivery Profile: Lean
Assurance Modules: Security

## Strategy

Add the failing replay test, consume tokens through the existing path, then refactor.

## Milestones

Deliver replay protection.

## Pull Requests / Child Work Items

### Reject a consumed token
<!-- sarathi:delivery id="PR-RESET-REPLAY" -->

Work Classification: reuse directly
Scope: Reject a second redemption without changing other reset behavior.
Verification: the behavioral replay test and existing reset suite pass.

## Coverage Map

The replay behavior maps to the single delivery item.

## Sequencing & Risks

Test, implement, and rerun the reset suite. Revert if issuance or responses change.

## Traceability

| Human delivery item | Machine ID | Evidence |
| --- | --- | --- |
| Reject a consumed token | PR-RESET-REPLAY | replay regression test |
"""


def high_assurance_migration_design() -> str:
    return """# Account ownership migration

<!-- sarathi:artifact-format version="2" -->

## Technical Approach

The legacy service owns account records today; the target service will own them after a
staged migration. Copy and reconcile records before switching writes. During dual-read,
the legacy record remains authoritative. Roll back by restoring legacy-only writes until
reconciliation proves the target complete. A failed copy or mismatched record stops the
cutover without deleting source data. Success requires rehearsal, integrity counts,
failure-path tests, rollback proof, and observed reconciliation evidence.

## Overview

Work Scope: Feature/component
Design Depth: Feature
Implementation Readiness: Code-ready
Delivery Profile: High-assurance
Assurance Modules: Data and migration, Reliability and operations

## Data Ownership And Migration

The source owns data before cutover; the target owns data only after the verified switch.

## Rollback And Failure Behavior

Rollback restores legacy-only writes. Any integrity mismatch blocks cutover.

## Verification Evidence

Rehearsal, reconciliation, rollback, and failure injection must pass at the real database
boundary.

## Traceability

| Machine ID | Human risk | Evidence |
| --- | --- | --- |
| RISK-MIGRATION | Incomplete or divergent target data | rehearsal and reconciliation |
"""


def test_human_first_spec_resolves_annotations_and_checks_structure(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "spec.md"
    path.write_text(human_first_spec(), encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_spec"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["artifact_format"] == "human-first-v2"
    assert report["counts"]["FR"] == 1
    assert report["counts"]["AT"] == 1
    assert report["gates"]["human_first_structure"] is True


def test_version_two_requires_the_plain_opening_heading(tmp_path, monkeypatch, capsys):
    spec_path = tmp_path / "spec.md"
    spec_path.write_text(
        human_first_spec().replace("## Product Overview", "## Product Crux", 1),
        encoding="utf-8",
    )
    module = load_checker("check_spec")

    rc, report = run_checker(module, [str(spec_path)], monkeypatch, capsys, tmp_path)

    assert rc == 1
    assert "missing_crux:Product Overview" in report["human_first_issues"]


def test_human_first_design_and_plan_accept_descriptive_headings(
    tmp_path, monkeypatch, capsys
):
    spec = tmp_path / "spec.md"
    design = tmp_path / "design.md"
    plan = tmp_path / "plan.md"
    spec.write_text(human_first_spec(), encoding="utf-8")
    design.write_text(human_first_design(), encoding="utf-8")
    plan.write_text(human_first_plan(), encoding="utf-8")

    design_rc, design_report = run_checker(
        load_checker("check_design"),
        [str(design), "--component", "--spec", str(spec)],
        monkeypatch,
        capsys,
        tmp_path,
    )
    plan_rc, plan_report = run_checker(
        load_checker("check_plan"),
        [str(plan), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert design_rc == 0
    assert design_report["gates"]["human_first_structure"] is True
    assert plan_rc == 0
    assert plan_report["counts"]["PR"] == 1
    assert plan_report["gates"]["human_first_structure"] is True


def test_full_human_first_artifacts_use_the_new_section_contract(
    tmp_path, monkeypatch, capsys
):
    spec = tmp_path / "spec.md"
    plan = tmp_path / "plan.md"
    spec.write_text(human_first_spec(), encoding="utf-8")
    plan.write_text(human_first_plan(), encoding="utf-8")

    spec_rc, spec_report = run_checker(
        load_checker("check_spec"), [str(spec)], monkeypatch, capsys, tmp_path
    )
    plan_rc, plan_report = run_checker(
        load_checker("check_plan"), [str(plan)], monkeypatch, capsys, tmp_path
    )

    assert spec_rc == 0
    assert spec_report["gates"]["sections_present"] is True
    assert plan_rc == 0
    assert plan_report["gates"]["sections_present"] is True


def test_human_first_plan_requires_baseline_reuse_and_one_classification_per_item(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "plan.md"
    path.write_text(
        human_first_plan()
        .replace("## Baseline Reuse", "## Existing Context")
        .replace("Work Classification: target-owned implementation\n", ""),
        encoding="utf-8",
    )

    rc, report = run_checker(
        load_checker("check_plan"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["baseline_reuse_classified"] is False
    assert report["baseline_reuse"] == {
        "section_present": False,
        "allowed_classifications": [
            "deferred cleanup",
            "extract then reuse",
            "new behavior",
            "reuse directly",
            "target-owned implementation",
        ],
        "classifications": [],
        "expected_count": 1,
        "issues": {
            "PR-AUTH-COMPAT": {
                "reason": "exactly_one_classification_required",
                "values": [],
            }
        },
    }


def test_human_first_plan_rejects_an_unsupported_work_classification(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "plan.md"
    path.write_text(
        human_first_plan().replace(
            "Work Classification: target-owned implementation",
            "Work Classification: build the whole capability",
        ),
        encoding="utf-8",
    )

    rc, report = run_checker(
        load_checker("check_plan"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["baseline_reuse_classified"] is False
    assert report["baseline_reuse"]["issues"]["PR-AUTH-COMPAT"]["reason"] == (
        "unsupported_classification"
    )


def test_new_format_rejects_machine_only_visible_headings(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "plan.md"
    path.write_text(
        human_first_plan().replace(
            "### Route password operations through the adapter\n",
            "### PR-AUTH-COMPAT\n",
        ),
        encoding="utf-8",
    )

    rc, report = run_checker(
        load_checker("check_plan"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["gates"]["human_first_structure"] is False
    assert "machine_only_heading:PR-AUTH-COMPAT" in report["human_first_issues"]


def test_version_two_traceability_table_can_define_a_delivery_id_without_visible_id(
    tmp_path, monkeypatch, capsys
):
    text = (
        human_first_plan()
        .replace('version="3"', 'version="2"')
        .replace('<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->\n', "")
        .replace(
            "| Human delivery item | Machine ID | Evidence |\n"
            "| --- | --- | --- |\n"
            "| Route password operations through the adapter | PR-AUTH-COMPAT | compatibility tests |",
            "| Machine ID | Human delivery item | Evidence |\n"
            "| --- | --- | --- |\n"
            "| PR-AUTH-COMPAT | Route password operations through the adapter | compatibility tests |",
        )
    )
    path = tmp_path / "plan.md"
    path.write_text(text, encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_plan"), [str(path)], monkeypatch, capsys, tmp_path
    )

    assert rc == 0
    assert report["counts"]["PR"] == 1


def test_version_three_requires_a_descriptive_block_for_each_delivery_id(
    tmp_path, monkeypatch, capsys
):
    text = (
        human_first_plan()
        .replace('<!-- sarathi:delivery id="PR-AUTH-COMPAT" -->\n', "")
        .replace(
            "| Route password operations through the adapter | PR-AUTH-COMPAT | compatibility tests |",
            "| PR-AUTH-COMPAT | Route password operations through the adapter | compatibility tests |",
        )
    )
    path = tmp_path / "plan.md"
    path.write_text(text, encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_plan"), [str(path)], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["gates"]["baseline_reuse_classified"] is False
    assert report["baseline_reuse"]["issues"]["PR-AUTH-COMPAT"]["reason"] == (
        "descriptive_delivery_block_required"
    )


def test_version_three_rejects_a_stray_global_classification(
    tmp_path, monkeypatch, capsys
):
    text = human_first_plan().replace(
        "Work Classification: target-owned implementation\n", ""
    )
    text = text.replace(
        "## Traceability\n",
        "Work Classification: target-owned implementation\n\n## Traceability\n",
    )
    path = tmp_path / "plan.md"
    path.write_text(text, encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_plan"), [str(path)], monkeypatch, capsys, tmp_path
    )

    assert rc == 1
    assert report["gates"]["baseline_reuse_classified"] is False
    assert report["baseline_reuse"]["issues"]["PR-AUTH-COMPAT"]["reason"] == (
        "exactly_one_classification_required"
    )


def test_unversioned_legacy_artifact_remains_accepted(tmp_path, monkeypatch, capsys):
    path = tmp_path / "plan.md"
    path.write_text(
        """# Overview
Work Scope: Slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready

## Direct-To-Code Decision
- Inherited Sources: accepted intent.
- Reviewable Increment: one change.
- Unresolved Blocker: none.
- Smallest Additional Artifact: none.

# Strategy
Use one focused change.

# Milestones
- MILE-AUTH-COMPAT Deliver compatibility.

# Pull Requests / Child Work Items
- PR-AUTH-COMPAT
  Scope: preserve compatibility.
  Verification: focused tests pass.

# Coverage Map
PR-AUTH-COMPAT covers the increment.

# Sequencing & Risks
PR-AUTH-COMPAT has no dependency.
""",
        encoding="utf-8",
    )

    rc, report = run_checker(
        load_checker("check_plan"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["artifact_format"] == "legacy"
    assert report["gates"]["human_first_structure"] is True


def test_version_two_plan_remains_accepted_without_baseline_classification(
    tmp_path, monkeypatch, capsys
):
    text = human_first_plan().replace('version="3"', 'version="2"')
    baseline_start = text.index("## Baseline Reuse")
    overview_start = text.index("## Overview")
    text = (text[:baseline_start] + text[overview_start:]).replace(
        "Work Classification: target-owned implementation\n", ""
    )
    path = tmp_path / "plan.md"
    path.write_text(text, encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_plan"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 0
    assert report["artifact_format"] == "human-first-v2"
    assert report["gates"]["baseline_reuse_classified"] is True


def test_unknown_format_version_does_not_fall_back_to_legacy(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "plan.md"
    path.write_text(
        human_first_plan().replace('version="3"', 'version="4"'), encoding="utf-8"
    )

    rc, report = run_checker(
        load_checker("check_plan"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["artifact_format"] == "unsupported-v4"
    assert report["human_first_issues"] == [
        "unsupported_artifact_format:unsupported-v4"
    ]


def test_plan_only_format_version_is_not_accepted_for_other_artifacts(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "spec.md"
    path.write_text(
        human_first_spec().replace('version="2"', 'version="3"'), encoding="utf-8"
    )

    rc, report = run_checker(
        load_checker("check_spec"),
        [str(path), "--feature"],
        monkeypatch,
        capsys,
        tmp_path,
    )

    assert rc == 1
    assert report["artifact_format"] == "human-first-v3"
    assert report["human_first_issues"] == [
        "unsupported_artifact_format:human-first-v3"
    ]


def test_dogfood_covers_all_requested_scenarios():
    guide = (ROOT / "docs" / "human-first-artifacts.md").read_text(encoding="utf-8")

    for phrase in (
        "BPTrial",
        "consumer-backend",
        "neuring-auth wheel",
        "Identity",
        "Mechanism",
        "Credential",
        "compatibility adapter",
        "Small behavior change",
        "High-assurance migration",
        "Existing legacy document",
        "test_replayed_reset_token_cannot_change_password",
        "test_at_auth_reset_replay",
    ):
        assert phrase in guide


def test_small_change_stays_compact_and_human_first(tmp_path, monkeypatch, capsys):
    path = tmp_path / "plan.md"
    text = small_change_plan()
    path.write_text(text, encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_plan"), [str(path)], monkeypatch, capsys, tmp_path
    )
    rendered_opening = re.sub(r"<!--.*?-->", "", text, flags=re.S).split(
        "## Traceability", 1
    )[0]

    assert rc == 0
    assert report["counts"]["PR"] == 1
    assert len(rendered_opening.split()) < 180
    assert not re.search(r"\b(?:PR|WORK|FR|COMP|TEST)-[A-Z]", rendered_opening)


def test_high_assurance_migration_adds_evidence_not_identifier_prose(
    tmp_path, monkeypatch, capsys
):
    path = tmp_path / "design.md"
    text = high_assurance_migration_design()
    path.write_text(text, encoding="utf-8")

    rc, report = run_checker(
        load_checker("check_design"),
        [str(path), "--component"],
        monkeypatch,
        capsys,
        tmp_path,
    )
    rendered_opening = re.sub(r"<!--.*?-->", "", text, flags=re.S).split(
        "## Traceability", 1
    )[0]

    assert rc == 0
    for concept in (
        "owns",
        "migration",
        "Roll back",
        "failed",
        "reconciliation evidence",
    ):
        assert concept in rendered_opening
    assert not re.search(r"\b(?:FR|COMP|TEST|RISK)-[A-Z]", rendered_opening)
