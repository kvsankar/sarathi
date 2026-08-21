import assert from "node:assert/strict";
import test from "node:test";

import {
  compareCodePoints,
  normalizePath,
  pythonReportJson,
  splitLines,
  stableJson,
  uniqueSorted,
} from "../../src/checkers/lib/output.mjs";

test("shared output helpers normalize paths and serialize deterministically", () => {
  assert.equal(normalizePath(".\\docs\\spec.md"), "docs/spec.md");
  assert.deepEqual(uniqueSorted(["b", "a", "b"]), ["a", "b"]);
  assert.equal(
    stableJson({ z: 1, a: { y: 2, b: 3 } }),
    '{\n  "a": {\n    "b": 3,\n    "y": 2\n  },\n  "z": 1\n}\n',
  );
});

test("line splitting matches Python boundaries including CR-only text", () => {
  const boundaries = [
    "\n",
    "\r",
    "\r\n",
    "\v",
    "\f",
    "\x1c",
    "\x1d",
    "\x1e",
    "\x85",
    "\u2028",
    "\u2029",
  ];
  for (const boundary of boundaries) {
    assert.deepEqual(splitLines(`one${boundary}two${boundary}`), [
      "one",
      "two",
    ]);
  }
  assert.deepEqual(splitLines(""), []);
});

test("stable JSON uses Python ordinal key order and exact large integers", () => {
  const value = {
    "😀": 6,
    "\uE000": 5,
    a: 4,
    Z: 3,
    "2": 2,
    "10": 1,
    large: 9007199254740993123456789n,
  };
  assert.equal(compareCodePoints("\uE000", "😀") < 0, true);
  assert.equal(
    stableJson(value),
    '{\n  "10": 1,\n  "2": 2,\n  "Z": 3,\n  "a": 4,\n  "large": 9007199254740993123456789,\n  "\\ue000": 5,\n  "\\ud83d\\ude00": 6\n}\n',
  );
  assert.equal(
    stableJson({ text: "café\u007f" }),
    '{\n  "text": "caf\\u00e9\\u007f"\n}\n',
  );
});

test("checker JSON preserves Python floats, ASCII escaping, and large integers", () => {
  const output = `${pythonReportJson({
    coverage_pct: 100,
    text: "café",
    large: 9007199254740993n,
  })}\n${pythonReportJson({
    values: [null, true, false, 2, Number.NaN, undefined],
    empty: [],
    omitted: undefined,
  })}\n`;
  assert.equal(
    output,
    '{\n  "coverage_pct": 100.0,\n  "text": "caf\\u00e9",\n  "large": 9007199254740993\n}\n' +
      '{\n  "values": [\n    null,\n    true,\n    false,\n    2,\n    null,\n    null\n  ],\n  "empty": []\n}\n',
  );
});
