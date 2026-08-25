const slugTokenSource =
  "(?=[A-Z0-9]{2,32}(?![A-Z0-9]))(?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,32}";
const planIdPatternSource = `(MILE|WORK|PR)-(${slugTokenSource})-(${slugTokenSource})`;
const waveIdPatternSource = `WAVE-(${slugTokenSource})-(${slugTokenSource})`;

export const PLAN_ID = new RegExp(
  `(?<![A-Za-z0-9-])${planIdPatternSource}(?![A-Za-z0-9-])`,
  "g",
);
export const PLAN_ID_FULL = new RegExp(`^${planIdPatternSource}$`);
export const PLAN_ID_CANDIDATE =
  /(?<![A-Za-z0-9-])(?:MILE|WORK|PR)-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![A-Za-z0-9-])/gi;
export const WAVE_ID_FULL = new RegExp(`^${waveIdPatternSource}$`);
export const WAVE_ID_CANDIDATE =
  /(?<![A-Za-z0-9-])WAVE-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![A-Za-z0-9-])/gi;

export const PLAN_ID_BY_KIND = Object.fromEntries(
  ["MILE", "WORK", "PR"].map((kind) => [
    kind,
    new RegExp(
      `(?<![A-Za-z0-9-])${kind}-${slugTokenSource}-${slugTokenSource}(?![A-Za-z0-9-])`,
      "g",
    ),
  ]),
) as Record<string, RegExp>;

export function isPlanId(identifier: string, kind?: string): boolean {
  const match = PLAN_ID_FULL.exec(identifier);
  return match !== null && (kind === undefined || match[1] === kind);
}

export function isWaveId(identifier: string): boolean {
  return WAVE_ID_FULL.test(identifier);
}

function matches(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)].map((match) => match[0]);
}

export function planIdCandidates(text: string): string[] {
  return matches(text, PLAN_ID_CANDIDATE);
}

export function waveIdCandidates(text: string): string[] {
  return matches(text, WAVE_ID_CANDIDATE);
}

export const SPEC_SECTIONS = [
  "Mission Statement",
  "User Needs",
  "Non-Goals",
  "Features",
  "Use Cases",
  "Functional Requirements",
  "Non-Functional Requirements",
  "External Interfaces & Contracts",
  "Acceptance Tests",
  "Journey Tests",
  "Traceability Matrix",
  "Assumptions & Open Questions",
] as const;

export const LEGACY_HUMAN_FIRST_SPEC_SECTIONS = [
  ["Product Overview", "Product Crux"],
  "Traceability",
] as const;

export const HUMAN_FIRST_SPEC_SECTIONS = [
  ["Product Overview", "Product Crux"],
  "User Needs",
  "Non-Goals",
  "Features",
  "Use Cases",
  "Functional Requirements",
  "Non-Functional Requirements",
  "External Interfaces & Contracts",
  "Acceptance Tests",
  "Journey Tests",
  "Assumptions & Open Questions",
  "Traceability",
] as const;

export const DESIGN_SECTIONS = [
  "Overview",
  "Tech Stack",
  "Drivers & Constraints",
  "Layers",
  "Components",
  "Interfaces",
  ["Core vs. Shell", "Core vs. Shell / Equivalent Separation"],
  "Key Flows",
  "Data Model",
  "Design Decisions",
  "Test Strategy",
  "Risks & Trade-offs",
  "Traceability Matrix",
] as const;

export const HUMAN_FIRST_DESIGN_SECTIONS = [
  ["Technical Approach", "Technical Crux"],
  "Traceability",
] as const;

export const PLAN_SECTIONS = [
  "Overview",
  "Strategy",
  "Milestones",
  ["Pull Requests", "Pull Requests / Child Work Items"],
  "Coverage Map",
  "Sequencing & Risks",
] as const;

export const HUMAN_FIRST_PLAN_SECTIONS = [
  "Implementation Approach",
  "Traceability",
] as const;

export const PRODUCT_FIRST_PLAN_SECTIONS = [
  "Implementation Approach",
  "Baseline Reuse",
  "Traceability",
] as const;
