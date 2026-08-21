export function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^[./]+/, "");
}

const PYTHON_LINE_BOUNDARY = new RegExp(
  // eslint-disable-next-line no-control-regex -- Python splitlines includes record separators.
  "\\r\\n|[\\n\\v\\f\\r\\u001c-\\u001e\\u0085\\u2028\\u2029]",
);

/** Match Python's str.splitlines() boundaries and trailing-line behavior. */
export function splitLines(value: string): string[] {
  if (value === "") return [];
  const lines = value.split(PYTHON_LINE_BOUNDARY);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

export function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareCodePoints);
}

export function stableJson(value: unknown): string {
  return `${serialize(value, 0)}\n`;
}

export function pythonReportJson(value: unknown): string {
  return serializeReport(value, 0);
}

/** Compare strings the way Python orders Unicode strings. */
export function compareCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(
    left,
    (character) => character.codePointAt(0) ?? 0,
  );
  const rightPoints = Array.from(
    right,
    (character) => character.codePointAt(0) ?? 0,
  );
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftPoints[index] ?? 0) - (rightPoints[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function serialize(value: unknown, depth: number): string {
  if (value === null) return "null";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" || typeof value === "boolean") {
    return typeof value === "string"
      ? quoteString(value)
      : JSON.stringify(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? JSON.stringify(value) : "null";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const indent = "  ".repeat(depth + 1);
    const closing = "  ".repeat(depth);
    const entries = value.map((entry) =>
      serialize(entry === undefined ? null : entry, depth + 1),
    );
    return `[\n${indent}${entries.join(`,\n${indent}`)}\n${closing}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => compareCodePoints(left, right));
    if (entries.length === 0) return "{}";
    const indent = "  ".repeat(depth + 1);
    const closing = "  ".repeat(depth);
    const properties = entries.map(
      ([key, nested]) => `${quoteString(key)}: ${serialize(nested, depth + 1)}`,
    );
    return `{\n${indent}${properties.join(`,\n${indent}`)}\n${closing}}`;
  }
  return "null";
}

function serializeReport(value: unknown, depth: number, key?: string): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return quoteString(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "null";
    return key?.endsWith("_pct") && Number.isInteger(value)
      ? `${String(value)}.0`
      : String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const indent = "  ".repeat(depth + 1);
    const closing = "  ".repeat(depth);
    return `[\n${indent}${value.map((item) => serializeReport(item, depth + 1)).join(`,\n${indent}`)}\n${closing}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(
      ([, item]) => item !== undefined,
    );
    if (entries.length === 0) return "{}";
    const indent = "  ".repeat(depth + 1);
    const closing = "  ".repeat(depth);
    return `{\n${indent}${entries
      .map(
        ([name, item]) =>
          `${quoteString(name)}: ${serializeReport(item, depth + 1, name)}`,
      )
      .join(`,\n${indent}`)}\n${closing}}`;
  }
  return "null";
}

/** Match Python json.dumps()'s default ensure_ascii behavior. */
function quoteString(value: string): string {
  return JSON.stringify(value).replace(
    /[\u007f-\uffff]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
