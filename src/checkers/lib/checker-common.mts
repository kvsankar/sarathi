/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-non-null-assertion */
import { readFile } from "node:fs/promises";

import { compareCodePoints, pythonReportJson, splitLines } from "./output.mjs";

export const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
export const DEF_MARKER = /^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/;
export const LEAD = /^[\s#>\-*+\d.)]*/;

export function valuesAfter(argv: readonly string[], flag: string): string[] {
  return argv.flatMap((value, index) =>
    value === flag && argv[index + 1] !== undefined ? [argv[index + 1]!] : [],
  );
}

export function valueAfter(
  argv: readonly string[],
  flag: string,
  fallback?: string,
): string | undefined {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
}

export function positional(argv: readonly string[]): string[] {
  const valueFlags = new Set([
    "--approvals",
    "--gates-policy",
    "--parent",
    "--spec",
    "--design",
    "--plan",
    "--tests",
    "--tests-argv",
    "--tests-dir",
    "--src",
    "--src-ext",
    "--generated-traceability-path",
  ]);
  const output: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]!;
    if (valueFlags.has(value)) {
      index += 1;
    } else if (!value.startsWith("-")) {
      output.push(value);
    }
  }
  return output;
}

export function normalizeHeading(title: string): string {
  return title
    .trim()
    .replace(/\s+#+$/, "")
    .replaceAll("*", "")
    .replaceAll("`", "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function sectionsPresentInOrder(
  text: string,
  required: readonly (string | readonly string[])[],
): boolean {
  const headings = splitLines(text).flatMap((line) => {
    const match = HEADING.exec(line.trim());
    return match?.[2] ? [normalizeHeading(match[2])] : [];
  });
  let position = 0;
  for (const heading of headings) {
    const wanted = required[position];
    if (wanted === undefined) break;
    const choices = typeof wanted === "string" ? [wanted] : wanted;
    if (choices.map(normalizeHeading).includes(heading)) position += 1;
  }
  return position === required.length;
}

export function sectionText(text: string, title: string): string {
  const lines = splitLines(text);
  const wanted = normalizeHeading(title);
  let start = -1;
  let level = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = HEADING.exec(lines[index]!.trim());
    if (match?.[2] && normalizeHeading(match[2]) === wanted) {
      start = index + 1;
      level = match[1]?.length ?? 0;
      break;
    }
  }
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    const match = HEADING.exec(lines[index]!.trim());
    if (match && (match[1]?.length ?? 0) <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

export function allMatches(text: string, pattern: RegExp): string[] {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))].map(
    (match) => match[0],
  );
}

export function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function sorted(values: Iterable<string>): string[] {
  return [...values].sort(compareCodePoints);
}

export function percentage(
  covered: Set<string>,
  required: Set<string>,
): number {
  if (required.size === 0) return 100;
  const numerator = 1000 * covered.size;
  const quotient = Math.floor(numerator / required.size);
  const remainder = numerator % required.size;
  const doubled = 2 * remainder;
  const rounded =
    doubled < required.size
      ? quotient
      : doubled > required.size
        ? quotient + 1
        : quotient % 2 === 0
          ? quotient
          : quotient + 1;
  return rounded / 10;
}

export async function readUtf8(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export function printJson(value: unknown): void {
  process.stdout.write(`${pythonReportJson(value)}\n`);
}

export function pythonRepr(value: unknown): string {
  if (value === null) return "None";
  if (typeof value === "string") return `'${value.replaceAll("'", "\\'")}'`;
  return String(value);
}

export function isDirectInvocation(metaUrl: string): boolean {
  const invoked = process.argv[1];
  if (!invoked) return false;
  return (
    new URL(metaUrl).pathname.toLocaleLowerCase("en-US") ===
    new URL(
      `file:///${invoked.replaceAll("\\", "/")}`,
    ).pathname.toLocaleLowerCase("en-US")
  );
}
