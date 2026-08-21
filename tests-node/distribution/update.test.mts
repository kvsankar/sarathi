import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  checkUpdate,
  isNewer,
  updateNotice,
} from "../../src/update/check-update.mjs";

async function fixture(): Promise<{
  manifest: string;
  cache: string;
}> {
  const root = await mkdtemp(resolve(tmpdir(), "sarathi-update-"));
  const manifest = resolve(root, "manifest.json");
  await writeFile(
    manifest,
    JSON.stringify({
      version: "0.9.0",
      update_url: "https://registry.invalid/latest",
    }),
    "utf8",
  );
  return { manifest, cache: resolve(root, "update.json") };
}

test("fresh 24-hour cache avoids the registry", async () => {
  const paths = await fixture();
  await writeFile(
    paths.cache,
    JSON.stringify({ checked_at: 1_000, latest_version: "0.9.1" }),
    "utf8",
  );
  const result = await checkUpdate({
    manifestPath: paths.manifest,
    cachePath: paths.cache,
    now: 1_001,
    fetchLatest: () => {
      throw new Error("unexpected registry request");
    },
  });
  assert.deepEqual(result, { current: "0.9.0", latest: "0.9.1" });
});

test("stale cache is refreshed", async () => {
  const paths = await fixture();
  await writeFile(
    paths.cache,
    JSON.stringify({ checked_at: 1, latest_version: "0.9.1" }),
    "utf8",
  );
  assert.deepEqual(
    await checkUpdate({
      manifestPath: paths.manifest,
      cachePath: paths.cache,
      now: 100_000_000,
      fetchLatest: () => Promise.resolve("0.10.0"),
    }),
    { current: "0.9.0", latest: "0.10.0" },
  );
  assert.deepEqual(JSON.parse(await readFile(paths.cache, "utf8")), {
    checked_at: 100_000_000,
    latest_version: "0.10.0",
  });
});

test("registry and cache failures never block", async () => {
  const paths = await fixture();
  const blocked = resolve(paths.cache, "blocked");
  await mkdir(resolve(paths.cache), { recursive: true });
  await writeFile(blocked, "not a directory", "utf8");
  const result = await checkUpdate({
    manifestPath: paths.manifest,
    cachePath: resolve(blocked, "update.json"),
    now: 1_000,
    fetchLatest: () => {
      throw new Error("offline");
    },
  });
  assert.deepEqual(result, { current: "0.9.0", latest: null });
});

test("failed registry result is cached for the normal interval", async () => {
  const paths = await fixture();
  let requests = 0;
  const fetchLatest = (): never => {
    requests += 1;
    throw new Error("offline");
  };
  assert.deepEqual(
    await checkUpdate({
      manifestPath: paths.manifest,
      cachePath: paths.cache,
      now: 1_000,
      fetchLatest,
    }),
    { current: "0.9.0", latest: null },
  );
  assert.deepEqual(
    await checkUpdate({
      manifestPath: paths.manifest,
      cachePath: paths.cache,
      now: 1_001,
      fetchLatest,
    }),
    { current: "0.9.0", latest: null },
  );
  assert.equal(requests, 1);
});

test("disabled update check avoids cache and registry access", async () => {
  const paths = await fixture();
  assert.deepEqual(
    await checkUpdate({
      manifestPath: paths.manifest,
      cachePath: paths.cache,
      enabled: false,
      fetchLatest: () => {
        throw new Error("unexpected registry request");
      },
    }),
    { current: "0.9.0", latest: null },
  );
  await assert.rejects(readFile(paths.cache), /ENOENT/u);
});

test("versions compare lexicographically and update notice pins npx", () => {
  assert.equal(isNewer("1.0.0", "0.99.99"), true);
  assert.equal(isNewer("0.10.0", "1.0.0"), false);
  assert.equal(isNewer("0.9.0", "0.9.0"), false);
  const notice = updateNotice("0.9.0", "0.10.0");
  assert.match(notice, /explicit user approval/u);
  assert.match(notice, /`npx --yes sarathi-sdlc@0\.10\.0 install`/u);
  assert.match(notice, /manifest\.json shows the approved version/u);
});
