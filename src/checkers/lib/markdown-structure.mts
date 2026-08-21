import { splitLines } from "./output.mjs";

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const FORMAT_MARKER =
  /<!--\s*sarathi:artifact-format\s+version="(?<version>[^"]+)"\s*-->/i;
const ANNOTATION = /<!--\s*sarathi:[a-z0-9_-]+\b(?<attrs>.*?)-->/i;
const ANNOTATION_ATTR = /([A-Za-z_][A-Za-z0-9_-]*)="([^"]*)"/g;
const PROCESS_ID_HEADING =
  /(?:(?:UN|FEAT|UC|FR|NFR|AT|JT|TEST|MILE|WORK|PR|WAVE)-(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}-(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}|(?:LAYER|COMP|IFACE|DEC|RISK)-(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32})/i;

export function stripFencedCode(text: string): string {
  const output: string[] = [];
  let marker: string | undefined;
  let minimum = 0;
  for (const line of splitLines(text)) {
    const match = FENCE.exec(line);
    if (marker === undefined && match?.[1]) {
      marker = match[1][0];
      minimum = match[1].length;
      output.push("");
      continue;
    }
    if (marker !== undefined) {
      const trailing = match ? line.slice(match[0].length) : "";
      if (
        match?.[1]?.[0] === marker &&
        match[1].length >= minimum &&
        trailing.trim() === ""
      ) {
        marker = undefined;
        minimum = 0;
      }
      output.push("");
      continue;
    }
    output.push(line);
  }
  return output.join("\n");
}

export function annotationAttrs(line: string): Record<string, string> {
  const match = ANNOTATION.exec(line);
  const attrs = match?.groups?.attrs;
  if (attrs === undefined) return {};
  return Object.fromEntries(
    [...attrs.matchAll(ANNOTATION_ATTR)].map((attribute) => [
      attribute[1]?.toLocaleLowerCase("en-US"),
      attribute[2],
    ]),
  ) as Record<string, string>;
}

export function artifactFormat(text: string): string {
  const match = FORMAT_MARKER.exec(stripFencedCode(text));
  if (match === null) return "legacy";
  const version = match.groups?.version;
  return version === "2" || version === "3"
    ? `human-first-v${version}`
    : `unsupported-v${version ?? ""}`;
}

export function humanFirstIssues(
  text: string,
  cruxHeading: string | readonly string[],
  supportedFormats: readonly string[] = ["human-first-v2"],
): string[] {
  const formatName = artifactFormat(text);
  if (formatName === "legacy") return [];
  if (!supportedFormats.includes(formatName)) {
    return [`unsupported_artifact_format:${formatName}`];
  }
  const headings = splitLines(stripFencedCode(text))
    .map((line) => HEADING.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      level: match[1]?.length ?? 0,
      title: match[2]?.trim() ?? "",
    }));
  const levelTwo = headings
    .filter(({ level }) => level === 2)
    .map(({ title }) => title);
  const accepted =
    typeof cruxHeading === "string" ? [cruxHeading] : cruxHeading;
  const label = accepted[0] ?? "";
  const issues: string[] = [];
  if (!levelTwo.some((heading) => accepted.includes(heading))) {
    issues.push(`missing_crux:${label}`);
  } else if (!accepted.includes(levelTwo[0] ?? "")) {
    issues.push(`crux_not_first_section:${label}`);
  }
  const tracePositions = headings.flatMap(({ level, title }, index) =>
    level === 2 && title.toLocaleLowerCase("en-US") === "traceability"
      ? [index]
      : [],
  );
  if (tracePositions.length === 0) {
    issues.push("missing_final_traceability");
  } else {
    const finalLevelTwo = headings.reduce(
      (last, heading, index) => (heading.level === 2 ? index : last),
      -1,
    );
    if (tracePositions.at(-1) !== finalLevelTwo) {
      issues.push("traceability_not_final_section");
    }
  }
  for (const { title } of headings) {
    const cleaned = title.replaceAll("`", "").replaceAll("*", "").trim();
    if (
      PROCESS_ID_HEADING.test(cleaned) &&
      cleaned.match(PROCESS_ID_HEADING)?.[0] === cleaned
    ) {
      issues.push(`machine_only_heading:${cleaned}`);
    }
  }
  return [...new Set(issues)];
}

export function definitionId(
  line: string,
  idPattern: RegExp,
  leadPattern: RegExp,
  definitionMarker: RegExp,
): string | undefined {
  const candidate = annotationAttrs(line).id;
  if (candidate && fullMatch(idPattern, candidate)) return candidate;
  if (definitionMarker.test(line)) {
    const cleaned = line.trim().replace(leadPattern, "");
    const flags = idPattern.flags.replace("g", "").replace("y", "");
    const match = new RegExp(idPattern.source, flags).exec(cleaned);
    if (match?.index === 0) return match[0];
  }
  if (line.trimStart().startsWith("|")) {
    const cells = line
      .trim()
      .replace(/^\|+|\|+$/g, "")
      .split("|")
      .map((cell) => cell.trim().replaceAll("`", ""));
    if (cells[0] && fullMatch(idPattern, cells[0])) return cells[0];
  }
  return undefined;
}

export function primaryDefinitionIds(
  text: string,
  resolver: (line: string) => string | undefined,
): Set<string> {
  const identifiers = new Set<string>();
  for (const line of splitLines(stripFencedCode(text))) {
    if (line.trimStart().startsWith("|")) continue;
    const resolved = resolver(line);
    if (resolved) identifiers.add(resolved);
  }
  return identifiers;
}

function fullMatch(pattern: RegExp, value: string): boolean {
  const flags = pattern.flags.replace("g", "").replace("y", "");
  return new RegExp(`^(?:${pattern.source})$`, flags).test(value);
}
