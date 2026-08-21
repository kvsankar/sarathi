import assert from "node:assert/strict";
import test from "node:test";

import {
  isPlanId,
  isWaveId,
  planIdCandidates,
  waveIdCandidates,
} from "../../src/checkers/lib/schemas.mjs";

test("identifier schemas accept semantic slugs and reject placeholders", () => {
  assert.equal(isPlanId("PR-AUTH-2FA", "PR"), true);
  assert.equal(isPlanId("WORK-AUTH-SIGNIN"), true);
  assert.equal(isPlanId("PR-AUTH-10"), false);
  assert.equal(isPlanId("PR-AUTH-SIGNIN-EXTRA"), false);
  assert.equal(isWaveId("WAVE-AUTH-BOUNDARY"), true);
  assert.equal(isWaveId("WAVE-AUTH"), false);
});

test("candidate scanners preserve malformed whole identifiers", () => {
  assert.deepEqual(planIdCandidates("PR-AUTH PR-AUTH-SIGNIN-EXTRA"), [
    "PR-AUTH",
    "PR-AUTH-SIGNIN-EXTRA",
  ]);
  assert.deepEqual(waveIdCandidates("WAVE-AUTH WAVE-AUTH-BOUNDARY-EXTRA"), [
    "WAVE-AUTH",
    "WAVE-AUTH-BOUNDARY-EXTRA",
  ]);
});
