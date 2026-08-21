#!/usr/bin/env node
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const CACHE_MILLISECONDS = 24 * 60 * 60 * 1000;
const TIMEOUT_MILLISECONDS = 3_000;
const VERSION = /^(\d+)\.(\d+)\.(\d+)$/u;

interface CacheRecord {
  checked_at: number;
  latest_version: string | null;
}

export interface UpdateOptions {
  manifestPath?: string;
  cachePath?: string;
  now?: number;
  fetchLatest?: (url: string) => Promise<string>;
  enabled?: boolean;
}

export interface UpdateResult {
  current: string;
  latest: string | null;
}

function versionParts(value: string): [number, number, number] {
  const match = VERSION.exec(value);
  if (!match) throw new Error(`unsupported version: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNewer(candidate: string, current: string): boolean {
  const left = versionParts(candidate);
  const right = versionParts(current);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) continue;
    return (left[index] ?? 0) > (right[index] ?? 0);
  }
  return false;
}

function defaultManifestPath(): string {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "manifest.json",
  );
}

function defaultCachePath(): string {
  if (process.env.SARATHI_UPDATE_CACHE)
    return resolve(expandUser(process.env.SARATHI_UPDATE_CACHE));
  const base =
    process.platform === "win32" && process.env.LOCALAPPDATA
      ? process.env.LOCALAPPDATA
      : (process.env.XDG_CACHE_HOME ?? resolve(homedir(), ".cache"));
  return resolve(base, "sarathi-sdlc", "update.json");
}

function expandUser(path: string): string {
  return path === "~"
    ? homedir()
    : path.startsWith("~/") || path.startsWith("~\\")
      ? resolve(homedir(), path.slice(2))
      : path;
}

async function readObject(path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("expected a JSON object");
  return value as Record<string, unknown>;
}

async function freshCache(
  path: string,
  now: number,
): Promise<{ fresh: boolean; latest: string | null }> {
  try {
    const value = await readObject(path);
    const checkedAt = Number(value.checked_at);
    if (
      value.latest_version !== null &&
      typeof value.latest_version !== "string"
    )
      return { fresh: false, latest: null };
    const latest = value.latest_version;
    if (!Number.isFinite(checkedAt)) return { fresh: false, latest: null };
    if (latest !== null) versionParts(latest);
    const age = now - checkedAt;
    return age >= 0 && age < CACHE_MILLISECONDS
      ? { fresh: true, latest }
      : { fresh: false, latest: null };
  } catch {
    return { fresh: false, latest: null };
  }
}

async function fetchLatestVersion(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MILLISECONDS);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "sarathi-sdlc-update-check" },
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`registry returned ${String(response.status)}`);
    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || !("version" in value))
      throw new Error("registry response has no version");
    const latest = Reflect.get(value, "version");
    if (typeof latest !== "string")
      throw new Error("registry version must be a string");
    versionParts(latest);
    return latest;
  } finally {
    clearTimeout(timeout);
  }
}

async function writeCache(path: string, record: CacheRecord): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${String(process.pid)}.tmp`;
  await writeFile(temporary, JSON.stringify(record), "utf8");
  await rename(temporary, path);
}

export async function checkUpdate(
  options: UpdateOptions = {},
): Promise<UpdateResult> {
  const manifest = await readObject(
    options.manifestPath ?? defaultManifestPath(),
  );
  if (typeof manifest.version !== "string")
    throw new Error("manifest version must be a string");
  const current = manifest.version;
  versionParts(current);
  const enabled =
    options.enabled ??
    !new Set(["0", "false", "no"]).has(
      (process.env.SARATHI_UPDATE_CHECK ?? "1").toLowerCase(),
    );
  if (!enabled) return { current, latest: null };

  const now = options.now ?? Date.now();
  const cachePath = options.cachePath ?? defaultCachePath();
  const cached = await freshCache(cachePath, now);
  if (cached.fresh) return { current, latest: cached.latest };

  let latest: string | null;
  try {
    if (typeof manifest.update_url !== "string")
      throw new Error("manifest update URL must be a string");
    latest = await (options.fetchLatest ?? fetchLatestVersion)(
      manifest.update_url,
    );
    versionParts(latest);
  } catch {
    latest = null;
  }
  try {
    await writeCache(cachePath, { checked_at: now, latest_version: latest });
  } catch {
    // Update checks must never block delivery because the cache is unwritable.
  }
  return { current, latest };
}

export function updateNotice(current: string, latest: string): string {
  return (
    `Sarathi SDLC ${latest} is available; installed version is ${current}. ` +
    "Ask for explicit user approval before updating. If approved, install " +
    `the exact version with \`npx --yes sarathi-sdlc@${latest} install\`, then ` +
    "check that manifest.json shows the approved version, then reload or restart the agent tools."
  );
}

export async function runUpdateCheck(
  argv = process.argv.slice(2),
  options: UpdateOptions = {},
): Promise<number> {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log("Usage: sarathi-sdlc check-update [--verbose]");
    return 0;
  }
  const unknown = argv.find((argument) => argument !== "--verbose");
  if (unknown) {
    console.error(`sarathi-sdlc: unrecognized argument: ${unknown}`);
    return 2;
  }
  const verbose = argv.includes("--verbose");
  try {
    const { current, latest } = await checkUpdate(options);
    if (latest !== null && isNewer(latest, current))
      console.log(updateNotice(current, latest));
    else if (verbose && latest === null)
      console.log("Sarathi SDLC update status unavailable.");
    else if (verbose) console.log(`Sarathi SDLC ${current} is current.`);
  } catch (error) {
    if (verbose)
      console.log(
        `Sarathi SDLC update status unavailable (${error instanceof Error ? error.message : String(error)}).`,
      );
  }
  return 0;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  process.exitCode = await runUpdateCheck();
