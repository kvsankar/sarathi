#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { packageRoot, resolveBundleRoot } from "../package/paths.mjs";
import { runUpdateCheck } from "../update/check-update.mjs";

interface InstallOptions {
  target?: string;
  scope: "project" | "user";
  tools?: string;
  checkers?: boolean;
  noCrossInstall: boolean;
  dryRun: boolean;
  verbose: boolean;
}

const HELP = `Usage: sarathi-sdlc [--version] <command>

Commands:
  install       Install bundled skills and prompts
  check-update  Check npm for a newer Sarathi release
  check         Run a bundled slice, spec, design, plan, or code checker
  status        Report, check, or write project workflow status

Run sarathi-sdlc <command> --help for command options.`;

const CHECK_HELP = `Usage: sarathi-sdlc check <slice|spec|design|plan|code> [checker options]

Arguments after the checker name are passed to the bundled checker.`;

const INSTALL_HELP = `Usage: sarathi-sdlc install [options]

Options:
  --target <dir>
  --scope <user|project>   Default: user
  --tools <list>           Comma-separated installer targets
  --with-checkers
  --no-checkers
  --no-cross-install
  --dry-run
  -v, --verbose
  -h, --help`;

function valueAfter(argv: string[], index: number): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("-"))
    throw new Error(
      `argument ${argv[index] ?? "option"}: expected one argument`,
    );
  return value;
}

export function parseInstall(argv: string[]): InstallOptions | null {
  const options: InstallOptions = {
    scope: "user",
    noCrossInstall: false,
    dryRun: false,
    verbose: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined) continue;
    if (argument === "-h" || argument === "--help") return null;
    if (
      argument === "--target" ||
      argument === "--scope" ||
      argument === "--tools"
    ) {
      const value = valueAfter(argv, index);
      index += 1;
      if (argument === "--target") options.target = value;
      else if (argument === "--tools") options.tools = value;
      else if (value === "user" || value === "project") options.scope = value;
      else throw new Error("--scope must be user or project");
    } else if (argument === "--with-checkers") {
      if (options.checkers !== undefined)
        throw new Error("--with-checkers and --no-checkers cannot be combined");
      options.checkers = true;
    } else if (argument === "--no-checkers") {
      if (options.checkers !== undefined)
        throw new Error("--with-checkers and --no-checkers cannot be combined");
      options.checkers = false;
    } else if (argument === "--no-cross-install") options.noCrossInstall = true;
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "-v" || argument === "--verbose")
      options.verbose = true;
    else throw new Error(`unrecognized argument: ${argument}`);
  }
  return options;
}

export function installArguments(
  root: string,
  options: InstallOptions,
  platform = process.platform,
): { command: string; args: string[] } {
  const skipCheckers =
    options.checkers === undefined
      ? options.scope === "user" && options.target === undefined
      : !options.checkers;
  if (platform === "win32") {
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      resolve(root, "scripts", "install.ps1"),
    ];
    if (options.target) args.push("-TargetRoot", options.target);
    args.push("-Scope", options.scope);
    if (options.tools) args.push("-Tool", options.tools);
    if (skipCheckers) args.push("-NoCheckers");
    if (options.noCrossInstall) args.push("-NoCrossInstall");
    if (options.dryRun) args.push("-DryRun");
    if (options.verbose) args.push("-v");
    return { command: "powershell.exe", args };
  }
  const args = [
    resolve(root, "scripts", "install.sh"),
    "--scope",
    options.scope,
  ];
  if (options.target) args.push("--target", options.target);
  if (options.tools) args.push("--tools", options.tools);
  if (skipCheckers) args.push("--no-checkers");
  if (options.noCrossInstall) args.push("--no-cross-install");
  if (options.dryRun) args.push("--dry-run");
  if (options.verbose) args.push("--verbose");
  return { command: "bash", args };
}

async function version(): Promise<string> {
  const metadata: unknown = JSON.parse(
    await readFile(resolve(packageRoot(), "package.json"), "utf8"),
  );
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("version" in metadata) ||
    typeof metadata.version !== "string"
  )
    throw new Error("package version is missing");
  return metadata.version;
}

async function runInstall(options: InstallOptions): Promise<number> {
  const root = await resolveBundleRoot();
  const child = installArguments(root, options);
  return await new Promise((done, reject) => {
    const process = spawn(child.command, child.args, { stdio: "inherit" });
    process.once("error", reject);
    process.once("exit", (code, signal) => {
      if (signal) reject(new Error(`installer stopped by ${signal}`));
      else done(code ?? 2);
    });
  });
}

async function runBundled(
  root: string,
  modulePath: string[],
  args: string[],
): Promise<number> {
  return await new Promise((done, reject) => {
    const child = spawn(
      process.execPath,
      [resolve(root, ...modulePath), ...args],
      {
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`command stopped by ${signal}`));
      else done(code ?? 2);
    });
  });
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    if (argv.includes("--version")) {
      console.log(await version());
      return 0;
    }
    const command = argv[0];
    if (!command || command === "-h" || command === "--help") {
      console.log(HELP);
      return command ? 0 : 2;
    }
    if (command === "check-update") {
      const root = await resolveBundleRoot();
      const updateArguments = argv.slice(1);
      if (
        !updateArguments.includes("--verbose") &&
        !updateArguments.includes("--help") &&
        !updateArguments.includes("-h")
      )
        updateArguments.push("--verbose");
      return await runUpdateCheck(updateArguments, {
        manifestPath: resolve(root, "manifest.json"),
      });
    }
    if (command === "install") {
      const options = parseInstall(argv.slice(1));
      if (!options) {
        console.log(INSTALL_HELP);
        return 0;
      }
      return await runInstall(options);
    }
    if (command === "check") {
      const stage = argv[1];
      if (!stage || stage === "-h" || stage === "--help") {
        console.log(CHECK_HELP);
        return stage ? 0 : 2;
      }
      const checker = {
        slice: "check_spec.mjs",
        spec: "check_spec.mjs",
        design: "check_design.mjs",
        plan: "check_plan.mjs",
        code: "check_code.mjs",
      }[stage];
      if (!checker)
        throw new Error("check must name slice, spec, design, plan, or code");
      const root = await resolveBundleRoot();
      const checkerArguments = argv.slice(2);
      if (stage === "slice") checkerArguments.unshift("--slice");
      return await runBundled(root, ["checkers", checker], checkerArguments);
    }
    if (command === "status") {
      const root = await resolveBundleRoot();
      return await runBundled(
        root,
        ["checkers", "render_workflow_status.mjs"],
        argv.slice(1),
      );
    }
    throw new Error(`unrecognized command: ${command}`);
  } catch (error) {
    console.error(
      `sarathi-sdlc: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 2;
  }
}

if (isDirectInvocation(import.meta.url)) process.exitCode = await main();

function isDirectInvocation(metaUrl: string): boolean {
  const invoked = process.argv[1];
  if (!invoked) return false;
  try {
    return realpathSync(invoked) === realpathSync(fileURLToPath(metaUrl));
  } catch {
    return resolve(invoked) === resolve(fileURLToPath(metaUrl));
  }
}
