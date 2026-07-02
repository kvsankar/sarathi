# Slug ID Migration

Agent-Steered SDLC now uses slug-only IDs for specs, plans, and design test obligations.

## What Changed

Old IDs used numeric leaves:

```text
FR-AUTH-10
AT-AUTH-20
JT-AUTH-30
PR-AUTH-10
TEST-AUTH-10
```

New IDs use descriptive slug leaves:

```text
FR-AUTH-SIGNIN
AT-AUTH-SIGNIN
JT-AUTH-ONBOARDING
PR-AUTH-SIGNIN
TEST-AUTH-POLICY
```

Design entity IDs already used slug-only form and stay unchanged:

```text
COMP-AUTH
IFACE-AUTH
DEC-AUTH
RISK-AUTH
```

Spec IDs, plan IDs, and design `TEST-` obligations use `KIND-AREA-NAME`. `AREA` and `NAME`
are uppercase slug tokens, 2-32 characters each, using `A-Z` and digits only after the first
character. Do not use trailing numbers or internal hyphens.

## Affected Kinds

- Spec IDs: `UN-AREA-NAME`, `FEAT-AREA-NAME`, `UC-AREA-NAME`, `FR-AREA-NAME`,
  `NFR-AREA-NAME`, `AT-AREA-NAME`, `JT-AREA-NAME`.
- Plan IDs: `MILE-AREA-NAME`, `WORK-AREA-NAME`, `PR-AREA-NAME`.
- Design entity IDs: unchanged `LAYER-SLUG`, `COMP-SLUG`, `IFACE-SLUG`, `DEC-SLUG`,
  `RISK-SLUG`.
- Design test obligation IDs: `TEST-AREA-NAME`.

## Manual Migration

1. Create a mapping table for every old numbered ID.

   ```text
   FR-AUTH-10 -> FR-AUTH-SIGNIN
   AT-AUTH-10 -> AT-AUTH-SIGNIN
   JT-AUTH-10 -> JT-AUTH-ONBOARDING
   PR-AUTH-10 -> PR-AUTH-SIGNIN
   TEST-AUTH-10 -> TEST-AUTH-POLICY
   ```

2. Replace every occurrence in specs, designs, plans, traceability matrices, and
   `.sdlc/test-traceability.yaml`. Remove artifact IDs from test names, source comments, and
   docstrings unless the project has explicitly adopted inline metadata.

3. Keep the area token stable when possible and make the name token describe the behavior,
   requirement, acceptance scenario, or PR purpose.

4. Do not rename design entity IDs unless they already violate design's `KIND-SLUG`
   convention. Do rename old numbered design test placeholders to `TEST-AREA-NAME`.

5. Re-run the checkers:

   ```pwsh
   python checkers/check_spec.py spec.md --json
   python checkers/check_design.py design.md --spec spec.md --json
   python checkers/check_plan.py plan.md --spec spec.md --design design.md --json
   python checkers/check_code.py --plan plan.md --tests-argv '["pytest","-q"]' --json
   ```

   If `python` is unavailable, try `python3`, then `uv run python`.

## Common Failures

- `bad_id_format`: an old numeric ID, lowercase ID, too-short token, too-long token, or
  extra hyphenated token remains.
- `orphan_refs`: a reference was renamed but its definition was not, or the reverse.
- Coverage below 100%: an acceptance test, journey test, design `TEST-` obligation, work
  item, PR, or executable test still points at the old ID or omits the new one.
