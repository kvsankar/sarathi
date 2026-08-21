#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

async function object(path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must contain an object`);
  return value as Record<string, unknown>;
}

export async function verifyRelease(
  tag: string,
  repositoryRoot = root,
): Promise<string> {
  const packageMetadata = await object(resolve(repositoryRoot, "package.json"));
  const manifest = await object(
    resolve(repositoryRoot, "skills", "sarathi", "manifest.json"),
  );
  const version = String(packageMetadata.version);
  const expectedTag = `v${version}`;
  if (tag !== expectedTag)
    throw new Error(`tag ${JSON.stringify(tag)} does not match ${expectedTag}`);
  if (manifest.version !== version)
    throw new Error("skill manifest version does not match package version");
  if (manifest.distribution !== packageMetadata.name)
    throw new Error("skill manifest distribution does not match package name");
  if (
    manifest.update_url !==
    `https://registry.npmjs.org/${String(packageMetadata.name)}/latest`
  )
    throw new Error(
      "skill manifest update URL does not match npm package name",
    );
  const changelog = await readFile(
    resolve(repositoryRoot, "CHANGELOG.md"),
    "utf8",
  );
  if (!changelog.includes(`## ${version} - `))
    throw new Error(`CHANGELOG.md has no ${version} release heading`);
  return `Release metadata matches ${expectedTag}.`;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(await verifyRelease(process.argv[2] ?? ""));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
