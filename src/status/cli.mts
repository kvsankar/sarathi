#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildModel } from "./model.mjs";
import {
  GUIDE_FILENAME,
  normalizeRenderedHtml,
  renderHtml,
} from "./render.mjs";

interface Options {
  root: string;
  output?: string;
  guideSource?: string;
  check: boolean;
  write: boolean;
  help: boolean;
}

const HELP = `Usage: sarathi-sdlc status [project-root] [options]

Without a mode, status prints the current recorded state and does not write files.

Options:
  --check                 Verify that generated HTML is current without writing
  --write                 Generate deterministic status and process-guide HTML
  --output <path>         Status HTML path (default: docs/sdlc-status.html)
  --guide-source <path>   Static Sarathi process guide source
  -h, --help              Show this help`;

function parseArgs(argv: string[]): Options {
  let root: string | undefined;
  let output: string | undefined;
  let guideSource: string | undefined;
  let check = false;
  let write = false;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined) continue;
    if (argument === "--check") {
      check = true;
      continue;
    }
    if (argument === "--write") {
      write = true;
      continue;
    }
    if (argument === "-h" || argument === "--help") {
      help = true;
      continue;
    }
    if (argument === "--output" || argument === "--guide-source") {
      index += 1;
      const value = argv[index];
      if (!value)
        throw new Error(`argument ${argument}: expected one argument`);
      if (argument === "--output") output = value;
      else guideSource = value;
      continue;
    }
    if (
      argument.startsWith("--output=") ||
      argument.startsWith("--guide-source=")
    ) {
      const [option, value] = argument.split("=", 2);
      if (!value)
        throw new Error(
          `argument ${option ?? "option"}: expected one argument`,
        );
      if (option === "--output") output = value;
      else guideSource = value;
      continue;
    }
    if (argument.startsWith("-"))
      throw new Error(`unrecognized argument: ${argument}`);
    if (root !== undefined)
      throw new Error(`unrecognized argument: ${argument}`);
    root = argument;
  }
  if (check && write) throw new Error("--check and --write cannot be combined");
  return {
    root: resolve(root ?? process.cwd()),
    ...(output === undefined ? {} : { output }),
    ...(guideSource === undefined ? {} : { guideSource }),
    check,
    write,
    help,
  };
}

async function isFile(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function defaultGuideSource(): Promise<string | null> {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    resolve(here, "..", "..", "docs", "sarathi.html"),
    resolve(here, "..", "docs", "sarathi.html"),
  ])
    if (await isFile(candidate)) return candidate;
  return null;
}

export async function runStatus(argv = process.argv.slice(2)): Promise<number> {
  let options: Options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`error: ${errorMessage(error)}`);
    return 2;
  }
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  if (!(await isDirectory(options.root))) {
    console.error(`error: project root does not exist: ${options.root}`);
    return 2;
  }
  const output = options.output
    ? resolveArgument(process.cwd(), options.output)
    : resolve(options.root, "docs", "sdlc-status.html");
  try {
    const model = await buildModel(options.root);
    if (!options.check && !options.write) {
      printSummary(model);
      return 0;
    }
    const guideSource = options.guideSource
      ? resolveArgument(process.cwd(), options.guideSource)
      : await defaultGuideSource();
    if (!guideSource)
      throw new Error("static process guide not found; pass --guide-source");
    if (!(await isFile(guideSource)))
      throw new Error(`process guide does not exist: ${guideSource}`);
    const guideOutput = join(dirname(output), GUIDE_FILENAME);
    const rendered = Buffer.from(
      normalizeRenderedHtml(
        renderHtml(model, options.root, output, GUIDE_FILENAME),
      ),
      "utf8",
    );
    const guide = Buffer.from(
      (await readFile(guideSource, "utf8"))
        .replaceAll("\r\n", "\n")
        .replaceAll("\r", "\n"),
      "utf8",
    );
    if (options.check) {
      if (!(await matches(output, rendered))) {
        console.error(`status page is out of date; regenerate: ${output}`);
        return 1;
      }
      if (!(await matches(guideOutput, guide))) {
        console.error(
          `copied process guide is out of date; regenerate: ${guideOutput}`,
        );
        return 1;
      }
      return 0;
    }
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, rendered);
    await writeFile(guideOutput, guide);
    console.log(`wrote ${output}`);
    console.log(`wrote ${guideOutput}`);
    return 0;
  } catch (error) {
    console.error(`error: ${errorMessage(error)}`);
    return 2;
  }
}

function printSummary(model: Record<string, unknown>): void {
  const wip = record(model.wip);
  const product = record(wip.product_status);
  const learning = record(wip.learning);
  const lines: [string, unknown][] = [
    ["Status", product.status_result],
    ["Summary", product.status_summary],
    ["Last completed", wip["Last Completed"]],
    ["Current work", learning.active_work_item ?? wip["Work Target"]],
    ["Next action", product.next_action],
    ["Blockers", product.blockers],
    ["Review point", wip["Planned Review Point"]],
  ];
  for (const [label, value] of lines) {
    const rendered = typeof value === "string" ? value.trim() : "";
    if (rendered) console.log(`${label}: ${rendered}`);
  }
  if (!lines.some(([, value]) => typeof value === "string" && value.trim()))
    console.log("Status: No current work is recorded");
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function resolveArgument(base: string, path: string): string {
  return isAbsolute(path) ? resolve(path) : resolve(base, path);
}
async function matches(path: string, expected: Buffer): Promise<boolean> {
  try {
    return (await readFile(path)).equals(expected);
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}
async function isDirectory(path: string): Promise<boolean> {
  try {
    const { stat } = await import("node:fs/promises");
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}
function errorCode(error: unknown): unknown {
  return error && typeof error === "object" && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (isDirectInvocation(import.meta.url)) process.exitCode = await runStatus();

function isDirectInvocation(metaUrl: string): boolean {
  const invoked = process.argv[1];
  if (!invoked) return false;
  try {
    return realpathSync(invoked) === realpathSync(fileURLToPath(metaUrl));
  } catch {
    return resolve(invoked) === resolve(fileURLToPath(metaUrl));
  }
}
