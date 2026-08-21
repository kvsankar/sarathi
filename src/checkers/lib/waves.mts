import { annotationAttrs, stripFencedCode } from "./markdown-structure.mjs";
import { compareCodePoints, splitLines } from "./output.mjs";
import {
  isPlanId,
  isWaveId,
  planIdCandidates,
  waveIdCandidates,
} from "./schemas.mjs";

interface Wave {
  id: string;
  name: string;
  heading: string;
  order: number | null;
  learning_target: string | null;
  members: string[];
  wip_limit: number | null;
  checkpoint: string | null;
  stop_or_replan: string | null;
  plan_path: string | null;
}

export interface LearningWaves {
  declared: boolean;
  waves: Wave[];
  malformed_ids: string[];
  duplicates: string[];
  missing_fields: Record<string, string[]>;
  invalid_orders: string[];
  invalid_wip_limits: string[];
  duplicate_orders: number[];
  invalid_members: Record<string, string[]>;
  invalid_member_kinds: Record<string, string[]>;
  duplicate_members: Record<string, string[]>;
  empty_members: string[];
}

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const WAVE_FIELDS: readonly [readonly string[], keyof FieldValues][] = [
  [["Order"], "order"],
  [["Expected Result", "Learning Target"], "learningTarget"],
  [["Members"], "membersRaw"],
  [["Parallel Limit", "WIP Limit"], "wipLimit"],
  [["Review Point", "Feedback/Integration Checkpoint"], "checkpoint"],
  [["Stop Conditions", "Stop/Replan Triggers"], "stopOrReplan"],
];
interface FieldValues {
  order: string | null;
  learningTarget: string | null;
  membersRaw: string | null;
  wipLimit: string | null;
  checkpoint: string | null;
  stopOrReplan: string | null;
}

function normalizedHeading(value: string): string {
  return value
    .replaceAll("*", "")
    .replaceAll("`", "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

function section(text: string, title: string): string | null {
  const wanted = normalizedHeading(title);
  const lines = splitLines(text);
  let start: number | undefined;
  let level = 0;
  for (const [index, line] of lines.entries()) {
    const match = HEADING.exec(line.trim());
    if (match?.[2] && normalizedHeading(match[2]) === wanted) {
      start = index + 1;
      level = match[1]?.length ?? 0;
      break;
    }
  }
  if (start === undefined) return null;
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    const match = HEADING.exec(lines[index]?.trim() ?? "");
    if (match?.[1] && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function field(block: string, label: string): string | null {
  const match = new RegExp(
    `^\\s*(?:[-*+]\\s+)?(?:\\*\\*)?${escapeRegex(label)}(?:\\*\\*)?\\s*:\\s*(.+?)\\s*$`,
    "im",
  ).exec(block);
  return match?.[1]?.trim() ?? null;
}

export function parseLearningWaves(
  text: string,
  planPath?: string,
): LearningWaves {
  const visible = stripFencedCode(text);
  const body =
    section(visible, "Work Groups") ||
    section(visible, "Waves") ||
    section(visible, "Learning Waves");
  const result: LearningWaves = {
    declared: body !== null,
    waves: [],
    malformed_ids: [],
    duplicates: [],
    missing_fields: {},
    invalid_orders: [],
    invalid_wip_limits: [],
    duplicate_orders: [],
    invalid_members: {},
    invalid_member_kinds: {},
    duplicate_members: {},
    empty_members: [],
  };
  if (body === null) return result;

  const planType =
    /^\s*(?:[-*+]\s+)?(?:\*\*)?Plan Type(?:\*\*)?\s*:\s*(Breakdown|Implementation)\s*$/im
      .exec(visible)?.[1]
      ?.toLocaleLowerCase("en-US");
  const expectedMemberKind =
    planType === "breakdown"
      ? "WORK"
      : planType === "implementation"
        ? "PR"
        : undefined;
  const lines = splitLines(body);
  const starts: { index: number; identifier: string; heading: string }[] = [];
  for (const [index, line] of lines.entries()) {
    const heading = HEADING.exec(line.trim());
    if (!heading?.[2]) continue;
    const candidate = waveIdCandidates(heading[2])[0];
    if (candidate) {
      starts.push({ index, identifier: candidate, heading: heading[2].trim() });
      continue;
    }
    for (const following of lines.slice(index + 1)) {
      if (!following.trim()) continue;
      const identifier = annotationAttrs(following).id;
      if (identifier?.toLocaleLowerCase("en-US").startsWith("wave-")) {
        starts.push({ index, identifier, heading: heading[2].trim() });
      }
      break;
    }
  }

  const seenIds: string[] = [];
  const orders: number[] = [];
  for (const [position, start] of starts.entries()) {
    const end = starts[position + 1]?.index ?? lines.length;
    const block = lines.slice(start.index + 1, end).join("\n");
    if (!isWaveId(start.identifier)) {
      result.malformed_ids.push(start.identifier);
      continue;
    }
    seenIds.push(start.identifier);
    const fields = Object.fromEntries(
      WAVE_FIELDS.map(([labels, key]) => [
        key,
        labels.map((label) => field(block, label)).find(Boolean) ?? null,
      ]),
    ) as unknown as FieldValues;
    const missing = WAVE_FIELDS.map(([, key]) => key).filter(
      (key) => !fields[key],
    );
    if (missing.length > 0) {
      result.missing_fields[start.identifier] = missing.map(snakeCaseField);
    }
    const order = positiveInteger(fields.order);
    if (order === null) result.invalid_orders.push(start.identifier);
    else orders.push(order);
    const candidates = planIdCandidates(fields.membersRaw ?? "");
    const members = candidates.filter(
      (member) => isPlanId(member, "WORK") || isPlanId(member, "PR"),
    );
    if (members.length === 0) result.empty_members.push(start.identifier);
    const invalid = uniqueSorted(
      candidates.filter((member) => !members.includes(member)),
    );
    if (invalid.length > 0) result.invalid_members[start.identifier] = invalid;
    const wrongKinds = uniqueSorted(
      members.filter(
        (member) =>
          expectedMemberKind !== undefined &&
          !member.startsWith(`${expectedMemberKind}-`),
      ),
    );
    if (wrongKinds.length > 0)
      result.invalid_member_kinds[start.identifier] = wrongKinds;
    const repeatedMembers = duplicates(members);
    if (repeatedMembers.length > 0)
      result.duplicate_members[start.identifier] = repeatedMembers;
    const wipLimit = positiveInteger(fields.wipLimit);
    if (wipLimit === null) result.invalid_wip_limits.push(start.identifier);
    result.waves.push({
      id: start.identifier,
      name:
        waveIdCandidates(start.heading).length > 0
          ? start.identifier
              .replace(/^WAVE-/, "")
              .replaceAll("-", " ")
              .toLocaleLowerCase("en-US")
              .replace(
                /(^|[^A-Za-z])([A-Za-z])/g,
                (_match, prefix: string, character: string) =>
                  `${prefix}${character.toLocaleUpperCase("en-US")}`,
              )
          : start.heading.replaceAll("*", "").replaceAll("`", "").trim(),
      heading: start.heading,
      order,
      learning_target: fields.learningTarget,
      members: [...new Set(members)],
      wip_limit: wipLimit,
      checkpoint: fields.checkpoint,
      stop_or_replan: fields.stopOrReplan,
      plan_path: planPath ?? null,
    });
  }
  result.duplicates = duplicates(seenIds);
  result.duplicate_orders = duplicateNumbers(orders);
  result.malformed_ids = uniqueSorted(result.malformed_ids);
  result.invalid_orders = uniqueSorted(result.invalid_orders);
  result.invalid_wip_limits = uniqueSorted(result.invalid_wip_limits);
  result.empty_members = uniqueSorted(result.empty_members);
  return result;
}

function positiveInteger(value: string | null): number | null {
  return value && /^\d+$/.test(value) && Number(value) > 0
    ? Number(value)
    : null;
}

function duplicates(values: readonly string[]): string[] {
  return values.filter(
    (value, index) =>
      values.indexOf(value) === index && values.lastIndexOf(value) !== index,
  );
}

function duplicateNumbers(values: readonly number[]): number[] {
  return [
    ...new Set(
      values.filter((value, index) => values.indexOf(value) !== index),
    ),
  ].sort((a, b) => a - b);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareCodePoints);
}

function snakeCaseField(value: keyof FieldValues): string {
  return value.replace(
    /[A-Z]/g,
    (character) => `_${character.toLocaleLowerCase("en-US")}`,
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
