# Critical Review — Round 3

A third-round assessment of the Sarathi process definition, following
[`critical-review.md`](critical-review.md) (round 1, pre-remediation) and
[`critical-review-round-2.md`](critical-review-round-2.md) (round 2, post-remediation).

- **Reviewer scope:** the process definition itself — the 16 stage prompts, the 4 checkers
  plus the new `approvals.py`, the skill bundle, `README.md`/`AGENTS.md`, and the new
  deterministic approval-gate and traceability-map mechanisms added since round 2.
- **Date:** 2026-07-02
- **Repository state reviewed:** commit `0ae88dd` "Add APM telemetry lifecycle guidance",
  clean working tree, 51 tests passing, 82% checker coverage.
- **Method:** every gate-behavior claim below was verified by running the checker code
  against crafted probe inputs, not inferred from reading. Where a gate is called gameable
  or false-positive-prone, the probe result is stated.

---

## 1. Verdict

The round-2 recommendations were substantially adopted, and adopted well. Git diff and TDD
evidence are default-on with automatic merge-base resolution; assertion traceability is
same-block instead of line-window and rejects literal tautologies; `check_code.py`
self-coverage rose from 73% to 83%; keyword-style gates are labeled as presence checks that
qualitative review must confirm. The honest-labeling discipline from round 2 has been
maintained through a large volume of new text. This project continues to remediate in good
faith, and the structural spine remains sound.

Round 3 finds two problems that are **new in kind**, not carryovers:

1. **The new "deterministic" gates are deterministic verification of self-attestation.**
   Since round 2, the system grew three evidence stores — `.sdlc/test-traceability.yaml`,
   `.sdlc/approvals.yaml`, and boundary flags such as `real_boundary: true` — and all three
   are authored by the same agent whose work they gate. The checkers now verify, with
   admirable determinism, records the agent wrote about itself. The hash-staleness design in
   the approval ledger is genuinely good engineering, but it authenticates *bytes*, not
   *consent*: nothing distinguishes a human approval from an agent-fabricated one, and the
   prompts instruct the agent to write the approval record itself. Meanwhile the round-1
   instruction that makes this dangerous — "Optimize so `/code-assess` finds nothing to
   fix" — is still present verbatim in `code-create` and `plan-create`.

2. **The process definition is approaching instruction saturation.** The governance text
   (prompts + README + AGENTS.md + SKILL.md) now totals roughly **43,000 words**.
   `design-create` is 791 lines; `code-create` is 493 lines with ~60 obligation-bearing
   lines (must / stop / do not / never / required). Every new cross-cutting concern added
   since round 2 — logging, telemetry, APM, error handling, docs, build, deploy, test
   environments, context-driven scans, journey tests, mock UI, external doubles, approvals —
   was replicated into all four stages, across up to four verbs, plus README, AGENTS.md, the
   SKILL, and the checklist. Growth is multiplicative: O(concerns × stages × verbs ×
   mirrors). This is now the biggest threat to the process actually working, because an
   LLM's instruction-following reliability degrades as instruction count grows — each newly
   pasted concern plausibly *reduces* compliance with the concerns already there.

**Overall:** the enforcement layer is more honest and better tested than ever, but its
authority increasingly rests on files the gated agent writes, and the prompt layer is
growing faster than any agent can faithfully execute. Round 3's work is consolidation and
provenance, not more coverage.

---

## 2. Round-2 recommendation status — verified

| # | Round-2 recommendation | Status | Verification |
|---|---|---|---|
| 1 | Default-on diff/TDD evidence with auto merge-base; never report no-base as pass | **Done** | `require_git`/`require_tdd` default true; `auto_diff_base()` resolves `origin/HEAD` → `origin/main` → `master`; no base yields `diff_loc: None` + reason string, reported as unverified |
| 2 | Reject tautologies; same-block assertion linkage | **Partially done** | `WEAK_ASSERTION` rejects `assert True` and literal `1 == 1` / `"a" == "a"` forms; linkage is per test block, not line window. But symbolic tautologies pass — probe: `assert x == x` and `assert len(r) >= 0` both count as non-trivial |
| 3 | Raise `check_code.py` self-coverage | **Done** | 73% → 83%, with a dedicated 622-line `test_check_code.py`. Note the *newest* module, `approvals.py`, is now the least-covered at 78% — the pattern repeats |
| 4 | Label keyword gates as presence checks needing qualitative confirmation | **Done** | `code-assess` states `tdd_evidence` "is a presence check, not proof"; diff/module size framed as advisory |

Also fixed since round 2 without being asked: the skill bundle is byte-for-byte enforced by
`tests/test_skill_bundle.py` (closing one of the mirror-drift complaints), and module size /
diff size were softened from hard gates to advisory signals with explicit
"do not mechanically split modules" guidance — a sensible correction.

---

## 3. New findings — the self-attestation loop

### 3.1 The traceability map moved the coverage gate *away* from the code

Round 1 criticized inline ID-in-comment traceability as name-matching. The replacement,
`.sdlc/test-traceability.yaml`, is cleaner for the code but **weaker as evidence**: the
`covers:` list of each entry is taken entirely at face value. The only cross-checks are
(a) a test block containing the entry's `name` as a substring exists somewhere under
`--tests-dir`, and (b) at least one matching block contains one non-trivial assertion. A
single real test whose entry lists `covers: [every FR, AT, JT, COMP, TEST in the project]`
yields 100% on `pr_traceability_100`, `id_traceability_100`, and
`id_assertion_traceability_100`. The inline scheme at least required the ID to appear near
the test that claimed it; the map requires nothing but the agent's say-so, and the agent is
the party being graded. The prompts do tell the reviewer to judge this, but the checker
output (`Must be 100%`) still carries the tone of measurement rather than transcription.

### 3.2 Approval provenance is unauthenticated by design, and the agent writes the ledger

`approvals.py` validates shape, UTC format, status vocabulary, policy bounds, and — its best
feature — that the recorded SHA-256 matches current artifact bytes. What it cannot validate
is that a human approved anything. `approved_by` is a free string. And `AGENTS.md` line 383
instructs: *"When the user explicitly approves an artifact or mock, create or update the
matching approval record immediately"* — i.e., the gated agent is the ledger's author. An
agent that (mis)reads a lukewarm "ok, looks fine" as approval, or that is optimizing so the
assess finds nothing to fix, produces a ledger entry indistinguishable from a real one. The
deterministic gate then *launders* that self-attestation into what downstream stages treat
as a hard human gate. This is the round-1 "rhetoric of enforcement vs. reality" pattern
recurring in the newest subsystem: the docs say "deterministic approval gates"; the honest
description is "deterministic staleness detection over an honor-system ledger."

### 3.3 The external-double gates are keyword-presence checks on both ends

- `check_design.py` / `check_plan.py`: if the text mentions mock/fake/stub/mirror near an
  external interface, the gate is satisfied when drift-risk words appear in the risk section
  and mitigation words (real-boundary / conformance / contract test / sandbox…) appear
  nearby. Template sentences satisfy it with no actual mitigation.
- `check_code.py`: `external_doubles_tied_to_reality` passes when at least one entry for the
  boundary carries `real_boundary: true` or `type_conformance: true` — self-declared
  booleans in the same agent-authored YAML as §3.1.

The *policy* here (a double is a liability until tied to reality) is one of the best ideas
added since round 2. Its *enforcement* is two layers of the agent agreeing with itself.

### 3.4 "Optimize so assess finds nothing to fix" survived two remediations

`code-create` line 10 and `plan-create` line 10 still instruct the agent to optimize against
the assessment. Round 1 flagged this as the instruction that converts shallow gates into
coverage theater; the gates got more honest, but the incentive instruction is unchanged.
Combined with §3.1–3.3 it is now an instruction to optimize files the agent itself writes.

---

## 4. New findings — gate correctness defects (all probe-verified)

### 4.1 The marker gate false-positives on plain English and is mis-keyed

- Probe: the comment `# we skip blank lines here` produces a `skip` marker hit. Every
  ordinary English use of "skip" in a comment, docstring, or string becomes a finding that
  requires an explicit human approval record (`code.markers.approved`) before downstream
  progress. This will train users to rubber-stamp the marker gate — approval fatigue that
  degrades the one gate class that is supposed to be a genuine human checkpoint.
- The `etc\.` alternative in `MARKER` is near-dead: `\betc\.\b` requires a word character
  immediately after the period, so `etc.` followed by a space or `)` never matches. Either
  it should be removed or it was meant to catch trailing-`etc.` vagueness and doesn't.
- **The marker approval is keyed to the wrong artifact.** `check_code.py` records the
  `code.markers.approved` requirement against the *plan file's* hash. Consequence in both
  directions: markers can multiply after approval and the approval stays valid as long as
  `plan.md` is unchanged, while an unrelated plan edit silently invalidates a legitimate
  marker approval. The approval should bind to the marker inventory (e.g., a hash of the
  marker list or of the files containing them).
- Cosmetic but confusing: the report emits the marker count under the key `vague_hits`, a
  leftover name from the removed vagueness scan.

### 4.2 TDD evidence passes on ordinary commit messages

Probe: a log containing `Add signin implementation` and `fix failing test on CI` satisfies
both `TDD_RED` and `TDD_GREEN` (`green` matches `implement|implementation`;
`red` matches `failing test`). So the default-on hard gate `tdd_evidence_ok`:

- **false-passes** any repo whose commits mention "implementation" and any test fix, and
- **false-fails** an honest TDD repo whose messages are plain ("Add row-win detection"),
  pushing users toward `--allow-missing-tdd-evidence` or toward decorating messages.

A hard gate that is easy to satisfy accidentally and easy to fail honestly mostly generates
flag traffic. The prompts do label it a presence check, but it still contributes to
pass/fail exit status by default.

### 4.3 The coverage parser cannot read the ecosystems the prompts promise

The prompts list thirteen ecosystems and name `vitest`/`jest` coverage explicitly.
`extract_coverage` accepts only a `TOTAL … NN%` row (pytest-cov/coverage.py style) or a
`coverage: NN%` label. Probe: a standard jest/vitest text summary
(`All files | 85.71 | …`) returns `None`, so `coverage_ok` hard-fails a JS/TS project with
real 85% coverage. Multi-language on the prompt surface, Python-shaped in the gate. Go
(`ok … coverage: 62.5% of statements`) happens to match the label pattern; most other listed
ecosystems do not.

### 4.4 Tautology detection is literal-only

Probe: `assert x == x` and `assert len(r) >= 0` both count as non-trivial assertions for
`id_assertion_traceability_100`. Round 2's fix caught literal constants only. This is an
accepted limitation of lexical gates — but it should be listed in the checker-limits text,
which currently implies tautologies are "rejected."

### 4.5 The hand-rolled YAML parser contradicts its own documentation

`approvals.py` line 64 states: *"if PyYAML is installed, `load_yaml_file` uses that
instead."* It does not — `load_yaml_file` unconditionally calls the ~130-line hand-rolled
subset parser. In a process whose code-create rules insist public docs must match actual
behavior, the newest module ships a docstring describing behavior that does not exist.
Either implement the PyYAML fallback or fix the docstring. Relatedly, `approvals.py` is the
least-tested checker module (78%, below the repo's own 80% bar), repeating the round-2
pattern where the newest, riskiest code gets the least verification.

---

## 5. New findings — process shape

### 5.1 Instruction saturation is now the top architectural risk

Measured, not impressionistic: ~43,000 words of governance text across prompts, README,
AGENTS.md, and SKILL.md; `design-create` 791 lines; `code-create` 493 lines with roughly 60
lines carrying must/stop/never/only-when obligations; `spec-create` 520 lines for what is
framed as "one focused question at a time" interviewing. Since round 2, at least ten
cross-cutting concerns were each threaded through four stage-create prompts, the verify/
review/assess triads, README, AGENTS.md, and the checklist — that is the accretion pattern,
visible directly in the recent commit log (journey tests → logging/errors → test governance
→ approval gates → boundary gates → environment gates → APM lifecycle).

Three concrete consequences:

1. **Compliance dilution.** LLM instruction-following degrades with instruction count. Every
   pasted concern competes for the same attention budget; the marginal APM paragraph
   plausibly costs more in lost compliance with existing TDD/scope rules than it buys in
   telemetry coverage. The process has no mechanism that notices this trade-off — text only
   ever gets added.
2. **Halt storms or silent satisficing.** `code-create` now contains upwards of a dozen
   distinct "stop and ask for an upstream revision" triggers (touch set, quality gates,
   build/deploy, logging/telemetry, docs, environments, context-driven concerns, mock UI,
   markers, boundary fixtures…). On a real project either the agent stops constantly —
   ceremony that will get the process bypassed (round 1 §5.1, sharper now) — or it satisfices
   silently, and nothing detects which happened.
3. **Unchecked mirrors.** The prompt↔skill-bundle mirror is now test-enforced (good). The
   other mirrors are not: README ↔ AGENTS.md restate the same content at length; each
   `*-assess` prompt hand-duplicates its `*-verify` and `*-review` siblings (e.g.
   spec: 178 vs 62+93 lines); the checklist table restates all of it again. These copies are
   kept aligned only by editor discipline, which is precisely what round 1 flagged about the
   prompt/checker section lists before `schemas.py` fixed that instance.

### 5.2 The verify/review/assess split tripled the command surface

8 prompts became 16. The verbs are conceptually clean, but `assess = verify + review` is
implemented as a third hand-maintained restatement rather than composition, and every host
tool now carries 16 commands plus a skill plus per-stage aliases. The cost lands on both the
maintainer (three files to edit per behavioral change per stage) and the user (choosing among
four verbs × four stages).

### 5.3 One PR boundary runs the test suite three to four times

`code-create` step 5 runs `check_code.py` (which runs the suite), then the pre-commit gate
(suite again for most configs), then `/code-assess` (whose Verification A runs `check_code.py`
— the suite a third time), plus three upstream checkers. Nothing in the process acknowledges
suite runtime; for a codebase with a minutes-long suite the per-slice loop is expensive
enough that users will trim it ad hoc, unguided.

### 5.4 Carried over, still open

- `design.html` / `plan.html` companions remain duplicate sources of truth with no
  generation or comparison check (round 1 §5.3, round 2 §3.6).
- Same-model creation/review ceiling: disclosed honestly, mitigated by the sub-agent split
  where available; unchanged where not. Likely the prompt-level ceiling, as round 2 noted.
- Windows/PowerShell-first examples throughout.

---

## 6. Risk summary

| # | Finding | Severity | Why it matters |
|---|---------|----------|----------------|
| 3.1–3.3 | Traceability, approvals, and boundary evidence are agent-authored self-attestation verified deterministically | **High** | The gates with the most authority in the process rest on files the gated party writes; green output launders claims into "hard gate passed" |
| 5.1 | Instruction saturation (~43k words, multiplicative concern replication) | **High** | Degrades agent compliance with *all* rules, including the oldest and most important ones; no counter-pressure exists |
| 3.4 | "Optimize so assess finds nothing to fix" still present | **Med-High** | Actively steers the agent toward the blind spots of §3.1–3.3 |
| 4.1 | Marker gate: English "skip" false positives; approval keyed to plan hash | **Medium** | Approval fatigue on the one genuine human checkpoint; approvals valid/stale for wrong reasons |
| 4.3 | Coverage parser fails standard jest/vitest output | **Medium** | Hard-fails healthy JS/TS projects; contradicts the multi-ecosystem promise |
| 4.2 | TDD evidence gate false-passes and false-fails on ordinary messages | **Medium** | Default-on hard gate that mostly generates escape-flag traffic |
| 5.2/5.3 | 16-command surface; suite runs 3–4× per PR boundary | **Medium** | Adoption and cost friction; invites unguided trimming |
| 4.5 | approvals.py docstring claims nonexistent PyYAML fallback; 78% coverage | **Low-Med** | Doc/behavior mismatch inside the newest gate code; repeats "newest code least tested" |
| 4.4 | Symbolic tautologies pass assertion gate | **Low** | Known lexical limit; just needs honest labeling |
| 5.4 | HTML mirrors; same-model review; platform bias | **Low** | Carried over, disclosed |

---

## 7. Recommendations (prioritized)

### Do first — reverse the incentive and provenance gaps

1. **Delete or invert the "Optimize so `/code-assess` finds nothing to fix" instruction**
   in `code-create` and `plan-create`. Replace with: *"Aim to pass review honestly. Do not
   tailor artifacts, traceability entries, or approval records to the checkers' blind
   spots; the reviewer's job is to find what the checkers cannot."* One-line change, closes
   the standing invitation.
2. **Reframe `.sdlc/*.yaml` as claims, not evidence, everywhere the prompts and checker
   output speak.** The verify/assess reports should render traceability and boundary flags
   as "agent-declared, structurally consistent" rather than `Must be 100%` measurements, and
   the qualitative reviewer should spot-check a sample of `covers:` claims against actual
   test bodies (an explicit instruction with a number, e.g. "verify 3 entries").
3. **Give approvals human provenance.** Cheapest viable options, in increasing strength:
   require the *user* to run a one-line approve command themselves (a tiny
   `checkers/approve.py <gate> <artifact>` the human invokes, so the ledger entry originates
   outside the agent's turn); and/or have the stopping handoff echo every approval record the
   agent wrote this session so fabrication is at least visible; and/or bind approvals to a
   git commit authored by the user. Until then, rename the feature honestly: it is staleness
   detection, not approval verification.

### Do next — fix the defective gates

1. **Marker gate:** match framework skip constructs (`@pytest.mark.skip`, `.skip(`,
   `it.skip`, `xfail(...)`) rather than the bare words `skip`/`skipif` anywhere; drop or fix
   `etc\.`; key `code.markers.approved` to the marker inventory (hash the marker list or the
   containing files), not `plan.md`; rename `vague_hits`.
2. **Coverage:** accept machine-readable coverage artifacts (`coverage.json`, `lcov.info`,
   `coverage-summary.json`) as first-class inputs, or add the jest/vitest/istanbul
   `All files` row to the label patterns. Test each ecosystem the prompts name, or stop
   naming them.
3. **TDD evidence:** either demote `tdd_evidence_ok` from exit-status gate to reported
   evidence (the prompts already treat it as such), or define and document an explicit
   commit-trailer convention (`TDD: red`, `TDD: green`) in `code-create` and match only
   that. Tighten `TDD_GREEN` regardless — `implement|implementation` matches nearly every
   repository on earth.
4. **approvals.py:** implement the PyYAML fallback or correct the docstring; add tests for
   the uncovered parser branches; bring the module to the repo's own 80% bar.
5. Extend `WEAK_ASSERTION` to symbolic self-comparison (`assert X == X` for identical token
   sequences) and add "symbolic tautologies pass" to the checker-limits text either way.

### Do to survive — put the process on a diet

1. **Adopt a prompt budget and a shared concerns reference.** Extract the ten cross-cutting
   concern blocks (logging/telemetry/APM, error handling, docs, build/deploy, environments,
   context scan, mock UI, doubles, markers, approvals) into one canonical reference document
   with a stage-responsibility table; reduce each stage prompt to its stage-specific delta
   plus a pointer. Target: create prompts ≤250 lines. Treat prompt line count as a gate on
   *this* repo the way LOC advisories gate product repos — the process should eat its own
   advisory cooking.
2. **Compose instead of copying for `assess`.** Generate the assess prompts from
   verify + review sources (the same move `schemas.py` made for section lists), or make the
   assess prompt literally instruct "run `/x-verify`, then `/x-review`" without restating
   their content. Same for the README ↔ AGENTS.md overlap: pick one owner per topic and
   link.
3. **Acknowledge suite cost.** State in `code-create`/`code-assess` when a prior green run
   in the same turn may be reused as evidence instead of rerunning, and let `check_code.py`
   accept a recorded result file for the inner loop while keeping the fresh run for the
   final gate.
4. **Consolidate the review rounds** (this document included) into a living findings
   register with statuses, so round N+1 verifies deltas instead of re-narrating; the
   current pattern accumulates prose that itself needs syncing.

---

## 8. Bottom line

Rounds 1 and 2 fixed the honesty of the gates; round 3 finds the gates honest but
increasingly aimed at the wrong target. The deterministic layer now spends most of its rigor
verifying internally consistent paperwork that the gated agent authors — traceability maps,
approval ledgers, boundary flags — while the instruction layer has grown past the point
where full compliance is realistic for any model, and still contains the one sentence that
tells the agent to optimize against its own assessor. The individual gate bugs (markers,
coverage parsing, TDD keywords) are afternoon-sized fixes. The structural work of round 3 is
different in kind from rounds 1–2: not adding or hardening checks, but **removing weight and
moving trust** — shrink the prompts to what an agent can actually follow, and move approval
and traceability provenance outside the loop of the party being judged. The spine is still
worth it; it is now carrying more armor than it can walk in.
