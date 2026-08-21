#!/usr/bin/env node
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const bundle = resolve(root, "bundle");
const dist = resolve(root, "dist");

async function copyTree(source: string, destination: string): Promise<void> {
  await cp(source, destination, {
    recursive: true,
    filter: (path) =>
      extname(path).toLowerCase() !== ".py" &&
      basename(path) !== "__pycache__" &&
      !path.includes(`${sep}docs${sep}reviews`) &&
      !path.includes(`${sep}docs${sep}research`),
  });
}

async function copyModules(source: string, destination: string): Promise<void> {
  await cp(source, destination, {
    recursive: true,
    filter: (path) => {
      const extension = extname(path);
      return extension === "" || extension === ".mjs";
    },
  });
}

async function metadata(): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(
    await readFile(resolve(root, "package.json"), "utf8"),
  );
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("package.json must contain an object");
  return value as Record<string, unknown>;
}

const wrapper = `#!/usr/bin/env node
import { runStatus } from "./status/cli.mjs";
process.exitCode = await runStatus();
`;

await rm(bundle, { recursive: true, force: true });
await mkdir(bundle, { recursive: true });
for (const directory of ["docs", "prompts", "skills"])
  await copyTree(resolve(root, directory), resolve(bundle, directory));

await mkdir(resolve(bundle, "scripts"), { recursive: true });
for (const file of ["install.ps1", "install.sh"])
  await cp(resolve(root, "scripts", file), resolve(bundle, "scripts", file));

const builtCheckerRoot = resolve(dist, "checkers");
const relocatedStatus = resolve(builtCheckerRoot, "status");
await rm(relocatedStatus, { recursive: true, force: true });
await copyModules(resolve(dist, "status"), relocatedStatus);
for (const file of ["model.mjs", "render.mjs"]) {
  const path = resolve(relocatedStatus, file);
  const source = await readFile(path, "utf8");
  await writeFile(
    path,
    source.replaceAll("../checkers/lib/", "../lib/"),
    "utf8",
  );
}
await writeFile(
  resolve(builtCheckerRoot, "render_workflow_status.mjs"),
  wrapper,
  "utf8",
);
await copyModules(builtCheckerRoot, resolve(bundle, "checkers"));

const updateModule = await readFile(
  resolve(dist, "update", "check-update.mjs"),
  "utf8",
);
await writeFile(
  resolve(bundle, "scripts", "check_update.mjs"),
  updateModule,
  "utf8",
);
const skillScripts = resolve(bundle, "skills", "sarathi", "scripts");
await rm(skillScripts, { recursive: true, force: true });
await mkdir(skillScripts, { recursive: true });
await writeFile(
  resolve(skillScripts, "check_update.mjs"),
  updateModule,
  "utf8",
);

const packageMetadata = await metadata();
const manifest = {
  distribution: String(packageMetadata.name),
  schema_version: 1,
  update_url: `https://registry.npmjs.org/${String(packageMetadata.name)}/latest`,
  version: String(packageMetadata.version),
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(resolve(bundle, "manifest.json"), manifestText, "utf8");
await writeFile(
  resolve(bundle, "skills", "sarathi", "manifest.json"),
  manifestText,
  "utf8",
);
