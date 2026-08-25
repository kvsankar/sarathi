/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-plus-operands, @typescript-eslint/restrict-template-expressions -- Presentation consumes the heterogeneous, serialized status model without changing it. */
import { relative, resolve, sep } from "node:path";

import { compareCodePoints } from "../checkers/lib/output.mjs";
import { STATUS_CSS, STATUS_SCRIPT } from "./assets.mjs";
import {
  compactValue,
  explicitFocusItem,
  scopeLevel,
  stateLabel,
  WIP_PRODUCT_FIELDS,
  type StatusValue,
} from "./model.mjs";

export const GUIDE_FILENAME = "sarathi-process.html";

export function esc(value: unknown): string {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

function renderProductSnapshot(wip: StatusValue): string {
  const product = wip.product_status ?? {};
  const recorded = String(product.status_result ?? "").toLocaleLowerCase(
    "en-US",
  );
  const labels: Record<string, string> = {
    ready: "Ready",
    "ready after minor fixes": "Ready after minor fixes",
    "not ready": "Not ready",
    "cannot assess yet": "Cannot assess yet",
  };
  const result = labels[recorded] ?? "Cannot assess yet";
  const summary = labels[recorded]
    ? product.status_summary ||
      "No plain-language reason was recorded for this status."
    : "No valid plain-language status is recorded. Review the engineering details below before deciding whether the work can continue.";
  const cards = WIP_PRODUCT_FIELDS.map(
    ([label, key]) =>
      `<article class="product-status-card"><h3>${esc(label)}</h3><p>${esc(product[key] || "Not recorded")}</p></article>`,
  ).join("");
  const note = WIP_PRODUCT_FIELDS.some(([, key]) => !product[key])
    ? '<p class="product-status-warning">This project has not recorded a complete project status. The records below cannot prove that the product is complete.</p>'
    : "";
  return `
  <section class="product-status" aria-labelledby="product-status-title">
    <div class="product-status-head">
      <div class="product-status-kicker">Project-reported engineering status</div>
      <h2 id="product-status-title">Status result: ${esc(result)}</h2>
      <p>${esc(summary)}</p>
    </div>
    <div class="product-status-grid">${cards}</div>
    <p class="product-status-warning">This is a project-authored status snapshot, not an independent readiness check.</p>
    ${note}
  </section>`;
}

function hrefFor(
  root: string,
  output: string,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  return relative(resolve(output, ".."), resolve(root, path))
    .split(sep)
    .map((part) =>
      encodeURIComponent(part)
        .replaceAll("%2E", ".")
        .replaceAll("%5F", "_")
        .replaceAll("%2D", "-"),
    )
    .join("/");
}

export function badge(state: string, label?: string): string {
  const success = new Set([
    "approved",
    "assessed",
    "children-assessed",
    "slice-handed-off",
    "completed",
  ]);
  const progress = new Set([
    "stale",
    "unapproved",
    "expanded",
    "started",
    "in-progress",
    "evidence",
    "planned",
  ]);
  const [visual, symbol] = success.has(state)
    ? ["success", "&#10003;"]
    : progress.has(state)
      ? ["progress", "&#9679;"]
      : ["pending", "&#9675;"];
  return `<span class="status status-${visual}"><span aria-hidden="true">${symbol}</span>${esc(label ?? stateLabel(state))}</span>`;
}

function renderParentApprovalDialog(
  stages: StatusValue,
  root: string,
  output: string,
): string {
  const rows = [
    ["spec", "Requirements"],
    ["design", "Design"],
    ["plan", "Delivery plan"],
  ]
    .map(([kind, label]) => {
      const stage = stages[kind!]!;
      const state = stage.state;
      const approval = stage.approval ?? {};
      const link = hrefFor(root, output, stage.path);
      const path = link
        ? `<a href="${link}">${esc(stage.path)}</a>`
        : esc(stage.path || "Not found");
      const detail =
        state === "approved"
          ? `Current approval ${esc(approval.id || "record")} by ${esc(approval.approved_by || "Not recorded")} at ${esc(approval.approved_at || "Not recorded")}.`
          : state === "stale"
            ? `${esc(approval.id || "The latest approval")} covers an earlier version from ${esc(approval.approved_at || "an unrecorded time")}. Review and approve the current version.`
            : state === "unapproved"
              ? "No approval was found. Review and approve the current document."
              : "The document is missing. Create it before requesting approval.";
      const hashes =
        state === "stale"
          ? `<div class="approval-hashes"><span>Approved version <code>${esc(String(approval.record_hash || "Not recorded").slice(0, 16))}</code></span><span>Current version <code>${esc(String(approval.hash || "Not recorded").slice(0, 16))}</code></span></div>`
          : "";
      return `<li class="approval-row">
  <div class="approval-row-head"><strong>${esc(label)}</strong>${badge(state)}</div>
  <div class="approval-path">${path}</div>
  <p>${detail}</p>
  ${hashes}
</li>`;
    })
    .join("");
  return `
<dialog id="approval-details" class="approval-dialog" aria-labelledby="approval-details-title">
  <form method="dialog">
    <div class="approval-dialog-head"><div><h2 id="approval-details-title">Document approvals</h2><p>An approval applies only to the document version that was reviewed.</p></div><button class="dialog-close" value="close" aria-label="Close approval details">Close</button></div>
    <ol class="approval-rows">${rows}</ol>
  </form>
</dialog>`;
}

function feedbackBadge(status: unknown): string {
  const normalized = String(status || "")
    .trim()
    .toLocaleLowerCase("en-US");
  if (normalized === "received") return badge("approved", "Feedback received");
  if (["requested", "unavailable"].includes(normalized))
    return badge("started", `Feedback ${normalized}`);
  if (normalized === "not-applicable")
    return badge("missing", "Feedback not applicable");
  return normalized
    ? badge("missing", `Invalid feedback status: ${String(status)}`)
    : badge("missing", "Feedback not recorded");
}

function displayLevel(level: unknown): string {
  return (
    (
      { product: "Product", feature: "Feature", slice: "Slice" } as Record<
        string,
        string
      >
    )[String(level)] ?? "Level unknown"
  );
}

function renderArtifactNode(
  root: string,
  output: string,
  kind: string,
  level: unknown,
  title: string,
  stage?: StatusValue | null,
  missingText?: string,
): string {
  const state = stage?.state ?? "missing";
  const levelClass = ["product", "feature", "slice"].includes(String(level))
    ? String(level)
    : "unknown";
  const kindLabel = (
    { spec: "Spec", design: "Design", plan: "Plan" } as Record<string, string>
  )[kind]!;
  let details: string;
  if (stage?.path) {
    let readiness = stage.metadata?.["Ready To Implement"];
    if (readiness)
      readiness =
        String(readiness).toLocaleLowerCase("en-US") === "yes"
          ? "Ready to implement"
          : String(readiness).toLocaleLowerCase("en-US") === "no"
            ? "Not ready to implement"
            : readiness;
    else readiness = stage.metadata?.["Implementation Readiness"];
    const href = hrefFor(root, output, stage.path);
    details = href
      ? `<a href="${href}">${esc(stage.path)}</a>`
      : '<span class="empty">No document found</span>';
    if (readiness) details += `<small>${esc(readiness)}</small>`;
  } else
    details = `<span class="empty">${esc(missingText ?? `No child ${kindLabel.toLocaleLowerCase("en-US")} discovered`)}</span>`;
  return `
<div class="node artifact-${esc(kind)}">
  <div class="node-meta">
    <div class="identity-tags"><span class="level level-${esc(levelClass)}">${esc(displayLevel(level))}</span><span class="kind">${esc(kindLabel)}</span></div>
    ${badge(state)}
  </div>
  <strong>${esc(title)}</strong>
  <div class="node-detail">${details}</div>
</div>`;
}

function renderPrs(prs: StatusValue[], itemState: string): string {
  if (!prs.length) return '<span class="empty">Not yet known</span>';
  const state = ["slice-handed-off", "assessed"].includes(itemState)
    ? itemState
    : prs.some((pr) => pr.evidence_count)
      ? "evidence"
      : "planned";
  return `<div class="pr-list tree-pr-list">${prs.map((pr) => `<span class="pr"><strong>${esc(pr.name)}</strong><small><code>${esc(pr.id)}</code> · ${pr.evidence_count} linked tests</small>${badge(state)}</span>`).join("")}</div>`;
}

function renderAssessmentLearning(item: StatusValue): string {
  const assessment = item.code_assessment ?? {};
  if (!Object.keys(assessment).length) return "";
  const learning = assessment.learning ?? {};
  if (!Object.keys(learning).length)
    return '<div class="assessment-learning"><h3>What we learned</h3><span class="empty">Not recorded</span></div>';
  const rows = [
    ["What we wanted to learn", "target"],
    ["Who or what reviewed it", "feedback_target"],
    ["Feedback", "feedback_status"],
    ["Evidence", "feedback_evidence"],
    ["What changed", "invalidation_result"],
    ["Related documents", "ancestor_impact"],
    ["When to change course", "stop_or_replan"],
  ]
    .map(
      ([label, key]) =>
        `<dt>${esc(label)}</dt><dd>${esc(learning[key!] || "Not recorded")}</dd>`,
    )
    .join("");
  return `<div class="assessment-learning"><h3>What we learned</h3><div class="assessment-feedback">${feedbackBadge(learning.feedback_status)}</div><dl class="learning-record">${rows}</dl></div>`;
}

function renderCodeNode(item: StatusValue): string {
  const children = item.children ?? [];
  if (children.length) {
    const assessed = children.filter((child: StatusValue) =>
      ["assessed", "slice-handed-off"].includes(child.state),
    ).length;
    const state =
      assessed === children.length ? "children-assessed" : "started";
    const level = item.child_level;
    const cls = ["product", "feature", "slice"].includes(level)
      ? level
      : "unknown";
    return `
<div class="node artifact-code">
  <div class="node-meta">
    <div class="identity-tags"><span class="level level-${esc(cls)}">${esc(displayLevel(level))}</span><span class="kind">Child delivery</span></div>
    ${badge(state)}
  </div>
  <strong>Delivered by child slices</strong>
  <div class="node-detail">${assessed} of ${children.length} child slice${children.length !== 1 ? "s" : ""} passed checks and review or were approved for the next step</div>
</div>`;
  }
  const prs = item.prs ?? [];
  const evidence = item.evidence_count ?? 0;
  let state = item.state;
  if (!["assessed", "slice-handed-off"].includes(state))
    state = evidence ? "evidence" : prs.length ? "planned" : "missing";
  const level = item.child_level;
  const cls = ["product", "feature", "slice"].includes(level)
    ? level
    : "unknown";
  const detail = prs.length
    ? `${prs.length} planned change${prs.length !== 1 ? "s" : ""} &middot; ${evidence} linked test entr${evidence !== 1 ? "ies" : "y"}`
    : '<span class="empty">No implementation PRs discovered</span>';
  return `
<div class="node artifact-code">
  <div class="node-meta">
    <div class="identity-tags"><span class="level level-${esc(cls)}">${esc(displayLevel(level))}</span><span class="kind">Code + tests</span></div>
    ${badge(state)}
  </div>
  <strong>Code + executable tests</strong>
  <div class="node-detail">${detail}</div>
</div>`;
}

function renderFlow(nodes: string[]): string {
  return `<div class="flow">${nodes.join('<span class="arrow" aria-hidden="true"></span>')}</div>`;
}

function renderMalformedWarning(ids: string[]): string {
  if (!ids.length) return "";
  const count = ids.length;
  return `
<aside class="validation-warning" role="alert">
  <strong>${count} invalid work item${count !== 1 ? "s" : ""} excluded from the totals</strong>
  <span>${ids.map((id) => `<code>${esc(id)}</code>`).join(" ")}</span>
  <small>Use <code>WORK-AREA-NAME</code>; each slug token must be 2-32 uppercase letters or digits and start with a letter.</small>
</aside>`;
}

function renderWaveIssues(issues: StatusValue[]): string {
  if (!issues.length) return "";
  return `
<details class="wave-issues">
  <summary>Plan checks needing attention</summary>
  <ul>${issues.map((item) => `<li><code>${esc(item.plan_path)}</code>: ${esc(item.message)}</li>`).join("")}</ul>
</details>`;
}

function renderTreeBranch(
  root: string,
  output: string,
  item: StatusValue,
  focusId?: string,
  ownerId = "product",
  ownerName = "Product",
): string {
  const child = item.child_plan;
  const level = item.child_level;
  const wave = item.wave ?? {};
  const waveIds = wave.id ? [wave.id] : [];
  const waveLabel = wave.id
    ? `<span class="wave-marker" title="${esc(wave.id)}">Group ${esc(wave.order || "?")}</span>`
    : "";
  const parentLabel = displayLevel(item.parent_level);
  const childLabel = displayLevel(level);
  const planType = String(
    child?.metadata?.["Plan Type"] ?? "",
  ).toLocaleLowerCase("en-US");
  const compact =
    (child &&
      ["yes"].includes(
        String(
          child.metadata?.["Inherited Intent Record"] ?? "",
        ).toLocaleLowerCase("en-US"),
      )) ||
    (child &&
      String(child.metadata?.["Lean Change Record"] ?? "").toLocaleLowerCase(
        "en-US",
      ) === "yes");
  const planTitle =
    planType === "breakdown"
      ? "Breakdown plan"
      : planType === "implementation" || level === "slice"
        ? "Implementation plan"
        : level === "feature"
          ? "Feature plan"
          : "Child plan";
  const nodes = compact
    ? [
        renderArtifactNode(root, output, "plan", level, "Compact plan", child),
        renderCodeNode(item),
      ]
    : [
        renderArtifactNode(
          root,
          output,
          "spec",
          level,
          `${childLabel} spec`,
          item.child_spec,
        ),
        renderArtifactNode(
          root,
          output,
          "design",
          level,
          `${childLabel} design / LLD`,
          item.child_design,
        ),
        renderArtifactNode(root, output, "plan", level, planTitle, child),
        renderCodeNode(item),
      ];
  const searchable = [
    item.id,
    item.name,
    item.parent_scope,
    item.child_scope,
    item.scope,
    item.parent_obligations,
    item.dependencies,
    item.learning_target,
    item.feedback_target,
    item.invalidation_question,
    item.learning_wave,
    compactValue(item.code_assessment?.learning),
    child?.path,
    (item.prs ?? []).map((pr: StatusValue) => pr.id).join(" "),
  ]
    .map((value) => String(value || ""))
    .join(" ")
    .toLocaleLowerCase("en-US");
  const detailFields = [
    ["Parent scope", "parent_scope"],
    ["Child scope", "child_scope"],
    ["Related requirements", "parent_obligations"],
    ["Dependencies", "dependencies"],
    ["Ready when", "readiness_target"],
    ["Documents needed", "child_requirement"],
    ["Done when", "done_signal"],
    ["Risks", "risks"],
    ["What we need to learn", "learning_target"],
    ["Who or what will review it", "feedback_target"],
    ["How feedback is gathered", "feedback_method"],
    ["What could change the plan", "invalidation_question"],
    ["Dependency details", "dependency_types"],
    ["When to change course", "stop_or_replan"],
  ];
  let details = detailFields
    .map(
      ([label, key]) =>
        `<dt>${esc(label)}</dt><dd>${esc(item[key!] || "Not recorded")}</dd>`,
    )
    .join("");
  if (wave.id)
    details += [
      ["Work group", `Group ${wave.order || "?"}: ${wave.id || ""}`],
      ["Expected result", wave.learning_target],
      ["Review point", wave.checkpoint],
      ["Stop condition", wave.stop_or_replan],
    ]
      .map(
        ([label, value]) =>
          `<dt>${esc(label)}</dt><dd>${esc(value || "Not recorded")}</dd>`,
      )
      .join("");
  const claim = item.wip_claim ?? {};
  const claimHtml = claim.status
    ? `<p class="wip-claim">Recorded status: ${esc(claim.status)}</p>`
    : "";
  const prs = item.prs?.length
    ? `<div class="tree-prs"><strong>Implementation PRs</strong>${renderPrs(item.prs, item.state)}</div>`
    : "";
  const children = item.children ?? [];
  const childrenHtml = children.length
    ? `<div class="branches nested-branches">${children.map((nested: StatusValue) => renderTreeBranch(root, output, nested, focusId, item.id, item.name)).join("")}</div>`
    : "";
  const focus = item.id === focusId;
  const status =
    (
      {
        frontier: "Not started",
        assessed: "Code checks and review passed",
        "children-assessed":
          "Child work passed checks and review or was approved for the next step",
        "slice-handed-off": "Approved for the next integration step",
      } as Record<string, string>
    )[item.state] ?? "In progress";
  return `
<details class="tree-branch" data-id="${esc(item.id)}" data-name="${esc(item.name)}" data-owner-id="${esc(ownerId)}" data-owner-name="${esc(ownerName)}" data-waves="${esc(waveIds.join(" "))}" data-level="${esc(level)}" data-state="${esc(item.state)}" data-search="${esc(searchable)}"${focus ? " open" : ""}>
  <summary class="branch-summary">
    <span class="branch-title"><strong>${esc(item.name)}</strong><small><code>${esc(item.id)}</code></small></span>
    <span class="branch-path">${esc(parentLabel)} &rarr; ${esc(childLabel)}</span>
    ${waveLabel}
    ${focus ? '<span class="focus-label">Current focus</span>' : ""}
    ${badge(item.state, status)}
  </summary>
  <div class="branch-content">
    ${renderFlow(nodes)}
    ${prs}
    ${childrenHtml}
    <details class="branch-details">
      <summary>Scope, planned changes, and evidence</summary>
      <div class="detail-layout"><dl>${details}</dl><div>${claimHtml}${renderAssessmentLearning(item)}</div></div>
    </details>
  </div>
</details>`;
}

function deliveryRollup(
  items: StatusValue[],
  level: string,
): Record<string, number> {
  const flatten = (nodes: StatusValue[]): StatusValue[] =>
    nodes.flatMap((item) => [item, ...flatten(item.children ?? [])]);
  const scoped = flatten(items).filter((item) => item.child_level === level);
  const handed = scoped.filter(
    (item) => item.state === "slice-handed-off",
  ).length;
  const assessed = scoped.filter((item) =>
    ["assessed", "children-assessed"].includes(item.state),
  ).length;
  const active = (item: StatusValue): boolean =>
    item.state === "started" ||
    ["active", "in-progress", "in progress"].includes(
      String(item.wip_claim?.status ?? "").toLocaleLowerCase("en-US"),
    );
  const inProgress = scoped.filter(active).length;
  const planned = scoped.filter(
    (item) =>
      item.child_plan &&
      ![
        "assessed",
        "children-assessed",
        "slice-handed-off",
        "started",
      ].includes(item.state) &&
      !active(item),
  ).length;
  return {
    total: scoped.length,
    handed_off: handed,
    assessed,
    in_progress: inProgress,
    planned,
    not_planned: scoped.length - handed - assessed - inProgress - planned,
  };
}

function pythonJson(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value === "string")
    return JSON.stringify(value).replace(
      /[\u007f-\uffff]/g,
      (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
  if (["number", "boolean"].includes(typeof value))
    return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(pythonJson).join(", ")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => compareCodePoints(left, right));
  return `{${entries.map(([key, item]) => `${pythonJson(key)}: ${pythonJson(item)}`).join(", ")}}`;
}

function deliveryRow(
  label: string,
  filter: string,
  rollup: Record<string, number>,
  total: string,
): string {
  return `<div class="delivery-row">
        <div class="delivery-scope"><a href="#work-items" data-level-filter="${filter}">${label}</a></div>
        <div class="delivery-states">${rollup.handed_off} of ${rollup.total} approved for the next integration step &middot; ${rollup.assessed} passed code checks and review, or all child work passed checks and review or was approved for the next integration step &middot; ${rollup.in_progress} in progress &middot; ${rollup.planned} planned next &middot; ${rollup.not_planned} not yet planned</div>
        <div class="delivery-total">${total}</div>
      </div>`;
}

export function renderHtml(
  model: StatusValue,
  root: string,
  output: string,
  guideHref?: string,
): string {
  const stages = model.stages;
  const rootLevel =
    scopeLevel(stages.spec.metadata?.["Work Scope"]) ?? "product";
  const rootLabel = displayLevel(rootLevel);
  const rootImplementation =
    String(stages.plan.metadata?.["Plan Type"] ?? "").toLocaleLowerCase(
      "en-US",
    ) === "implementation";
  const rootNodes = [
    renderArtifactNode(
      root,
      output,
      "spec",
      rootLevel,
      `${rootLabel} spec`,
      stages.spec,
      "No product spec discovered",
    ),
    renderArtifactNode(
      root,
      output,
      "design",
      rootLevel,
      `${rootLabel} design / ${rootLevel === "slice" ? "LLD" : "HLD"}`,
      stages.design,
      "No product design discovered",
    ),
    renderArtifactNode(
      root,
      output,
      "plan",
      rootLevel,
      rootImplementation ? "Implementation plan" : "Breakdown plan",
      stages.plan,
      "No product plan discovered",
    ),
  ];
  if (rootImplementation || model.root_prs.length) {
    const evidence = model.root_prs.reduce(
      (sum: number, pr: StatusValue) => sum + pr.evidence_count,
      0,
    );
    rootNodes.push(
      renderCodeNode({
        prs: model.root_prs,
        evidence_count: evidence,
        state: evidence ? "evidence" : "planned",
        child_level: rootLevel,
      }),
    );
  }
  const explicit = explicitFocusItem(model.work_items, model.wip);
  const active = model.work_items.filter(
    (item: StatusValue) => item.state !== "frontier",
  );
  const focus =
    explicit ?? active.find((item: StatusValue) => item.wip_claim) ?? active[0];
  let branches = model.work_items
    .map((item: StatusValue) => renderTreeBranch(root, output, item, focus?.id))
    .join("");
  if (!branches && !rootImplementation)
    branches = `
<div class="empty-state">
  <strong>No child work planned</strong>
  <span>This view expands when the plan links to smaller pieces of work.</span>
</div>`;
  const branchesHtml = branches
    ? `<div id="work-items" class="branches">${branches}</div>`
    : "";
  const feature = deliveryRollup(model.work_items, "feature");
  const featureSlices = deliveryRollup(
    model.work_items.flatMap((item: StatusValue) => item.children ?? []),
    "slice",
  );
  const productSlices = deliveryRollup(
    model.work_items.filter(
      (item: StatusValue) => item.child_level === "slice",
    ),
    "slice",
  );
  const productStages = [
    ["spec", "Requirements"],
    ["design", "Design"],
    ["plan", "Delivery plan"],
  ]
    .map(
      ([kind, label]) =>
        `${label} ${stages[kind!].state === "approved" ? "Approved" : stateLabel(stages[kind!].state)}`,
    )
    .join(" | ");
  const summary = model.summary;
  const scope = rootImplementation ? "Document" : "Parent";
  const gateText =
    summary.approved_stages === 3
      ? `All ${scope.toLocaleLowerCase("en-US")} approvals current`
      : `${summary.approved_stages} of 3 ${scope.toLocaleLowerCase("en-US")} approvals current`;
  const parentState =
    summary.approved_stages === 3
      ? "approved"
      : Object.values(stages).some(
            (stage) => (stage as StatusValue).state !== "missing",
          )
        ? "started"
        : "missing";
  const note = (key: string, prefix: string) =>
    model[key] ? `<p class="warning">${prefix}: ${esc(model[key])}</p>` : "";
  const stateNote = model.workflow_state_issues.length
    ? `<aside class="validation-warning" role="alert"><strong>Current-work or project-choice values need correction.</strong><ul>${model.workflow_state_issues.map((item: StatusValue) => `<li>${esc(item.path)}: ${esc(item.field)} ${esc(item.reason)}; found ${esc(item.value)}</li>`).join("")}</ul></aside>`
    : "";
  const guideLink = guideHref
    ? `<a class="process-guide" href="${esc(guideHref)}">Process guide</a>`
    : "";
  // A JSON script element is raw text in HTML. Escape every opening angle bracket so
  // mixed-case closing tags and future HTML-significant values cannot end the element.
  const embedded = pythonJson(model).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.project)} - sarathi workflow status</title>
<style>${STATUS_CSS}</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <div><div class="eyebrow">Sarathi project status</div><h1>${esc(model.project)}</h1></div>
    <div class="topbar-meta">${guideLink}</div>
  </div>
</header>
<main>
  ${renderProductSnapshot(model.wip)}
  <details class="read-note" open>
    <summary>Current activity — ${esc(model.current_activity.work_target)} (${esc(model.current_activity.scope)})</summary>
    <p>Command: ${esc(model.current_activity.command)}. Stage: ${esc(model.current_activity.stage)}. Action: ${esc(model.current_activity.action)}.</p>
  </details>
  <section class="executive" aria-labelledby="delivery-title">
    <div class="executive-head">
      <div><div class="executive-kicker">Delivery progress</div><h2 id="delivery-title">Documents, code, and reviews</h2></div>
    </div>
    <p class="delivery-intro">These records support the project status above. They do not prove that the feature is complete. Select an area to see its details below.</p>
    <div class="delivery-rows">
      <div class="delivery-row"><div class="delivery-scope"><a href="#product-workflow" data-level-filter="">Documents</a></div><div class="delivery-states">${esc(productStages)}</div><div class="delivery-total">${summary.work_items} delivery areas identified</div></div>
      ${deliveryRow("Features", "feature", feature, "Feature progress is based on its plans, code, tests, and reviews.")}
      ${deliveryRow("Feature slices", "slice", featureSlices, "Feature-owned slices are shown with their feature prefix.")}
      ${deliveryRow("Product-owned slices", "slice", productSlices, "These slices cover work shared across features or needed for release.")}
    </div>
  </section>
  ${renderMalformedWarning(model.malformed_allocations)}
  ${stateNote}
  <details class="read-note"><summary>Delivery choices</summary><p>Delivery path: ${esc(model.delivery.profile)}. Approvals: ${esc(model.delivery.approval_policy)}. Intended result: ${esc(model.delivery.work_outcome)}. Extra checks: ${esc(model.delivery.modules)}.</p></details>
  <div class="tree-heading"><div><h2>Work</h2><p id="tree-description">Open an item to see its documents and evidence.</p></div><div class="toolbar"><label class="search"><input id="search" type="search" placeholder="Filter work" aria-label="Filter work"></label><button class="tree-action" id="expand-all" type="button">Expand all</button><button class="tree-action" id="collapse-all" type="button">Collapse all</button></div></div>
  <div id="structured-filters" class="structured-filters" aria-label="Workflow filters"></div>
  <details class="legend"><summary>Legend</summary><div class="encoding" aria-label="Tree encoding"><div class="encoding-row"><span class="encoding-label">Background = document type</span><span class="key key-spec">Spec</span><span class="key key-design">Design</span><span class="key key-plan">Plan</span><span class="key key-code">Code + tests</span></div><div class="encoding-row"><span class="encoding-label">Level tag = work scope</span><span class="level level-product">Product</span><span class="level level-feature">Feature</span><span class="level level-slice">Slice</span></div><div class="encoding-row"><span class="encoding-label">Status = observed state</span>${badge("approved")}${badge("started", "In progress")}${badge("missing", "Not started")}</div></div></details>
  <section id="product-workflow" class="tree-panel" aria-label="Workflow expansion tree"><div class="product-heading"><strong>${esc(rootLabel)} workflow</strong><button id="approval-details-trigger" class="approval-trigger" type="button" aria-haspopup="dialog" aria-controls="approval-details">${badge(parentState, gateText)}</button></div>${renderFlow(rootNodes)}${branchesHtml}</section>
  ${renderParentApprovalDialog(stages, root, output)}
  <section class="technical-details" aria-label="Workflow details"><details class="read-note"><summary>How to read this status</summary><p>Green checks mean a document is approved, a code change passed its checks and review, a slice is approved for the next integration step, or a group checkpoint finished. They do not mean that the whole feature is complete. Amber dots mean work or supporting records exist. Gray circles mean not started. The page shows only recorded status; it does not guess from Git or passing tests.</p>${note("approval_error", "Could not read approvals")}${note("traceability_error", "Could not read test links")}${note("assessment_error", "Could not read code checks and review results")}${model.wave_checkpoint_error ? `<p class="warning">Could not read work-group checkpoints for feedback, integration, and parent-document decisions: ${esc(model.wave_checkpoint_error)}</p>` : ""}</details>${renderWaveIssues(model.learning_waves.issues)}</section>
</main>
<script type="application/json" id="workflow-model">${embedded}</script>
<script>${STATUS_SCRIPT}</script>
</body>
</html>
`;
}

export function normalizeRenderedHtml(value: string): string {
  return `${value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n*$/, "")}\n`;
}
