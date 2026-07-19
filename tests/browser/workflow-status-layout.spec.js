import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const projectRoot = mkdtempSync(join(tmpdir(), "sarathi-layout-"));
const statusPath = join(projectRoot, "docs", "sdlc-status.html");
const guidePath = join(projectRoot, "docs", "sarathi-process.html");

function write(relativePath, content) {
  const path = join(projectRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function generateFixture() {
  write(
    "docs/spec.md",
    `# Layout Example - Software Requirements Specification

Work Scope: product/system
Implementation Readiness: Decomposable
`,
  );
  write(
    "docs/design.md",
    `# Layout Example - Software Design Document

Work Scope: product/system
Design Depth: HLD
Implementation Readiness: Decomposable
`,
  );
  write(
    "docs/plan.md",
    `# Layout Example Work Plan

Work Scope: product/system
Plan Type: Breakdown
Implementation Readiness: Decomposable

## Pull Requests / Child Work Items

- WORK-DEMO-ALPHA

  Parent scope: product/system.
  Child scope: slice/change.
  Scope: Exercise responsive workflow node sizing with deliberately long content.
  Parent IDs / inherited obligations: FR-DEMO-LAYOUT and TEST-DEMO-LAYOUT.
  Required child artifacts: slice spec, LLD, and implementation plan.
  Dependencies: approved parent artifacts.
  Readiness target: Code-ready after layout checks pass.
  Risks: labels may wrap on narrow viewports.
  Done signal: every visible node contains its rendered content.
`,
  );
  write(
    "docs/work/alpha/spec.md",
    `# Alpha Slice - Software Requirements Specification

Parent Work Item: WORK-DEMO-ALPHA
Work Scope: slice/change
Implementation Readiness: Code-ready
`,
  );
  write(
    "docs/work/alpha/design.md",
    `# Alpha Slice - Software Design Document

Parent Work Item: WORK-DEMO-ALPHA
Work Scope: slice/change
Design Depth: LLD
Implementation Readiness: Code-ready
`,
  );
  write(
    "docs/plans/work_demo_alpha.md",
    `# WORK-DEMO-ALPHA Implementation Plan

Work Scope: slice/change
Plan Type: Implementation
Implementation Readiness: Code-ready

## Pull Requests / Child Work Items

- PR-DEMO-ALPHA

## Learning Waves

### WAVE-DEMO-BOUNDARY
Order: 1
Learning Target: Verify that a long wave target wraps without obscuring member state or the feedback checkpoint.
Members: PR-DEMO-ALPHA
WIP Limit: 1
Feedback/Integration Checkpoint: Review responsive browser evidence at mobile and desktop viewports before opening the next wave.
Stop/Replan Triggers: Stop if any wave member label, status badge, checkpoint, or evidence row overflows its container.
`,
  );
  write(
    ".sdlc/wip.md",
    `# SDLC Work In Progress

Current Stage: code-create
Current Gate: feedback-checkpoint
Learning Target: Verify that a long learning target remains contained on a narrow mobile viewport without hiding its evidence or controls.
Feedback Target: Product stakeholder, accessibility reviewer, and observed responsive browser behavior.
Feedback Status: requested
Feedback Evidence: A deliberately long evidence path and review note that exercises wrapping in the executive learning strip.
Active Learning Wave: WAVE-DEMO-BOUNDARY
WIP Limit: 2
Active Slices: PR-DEMO-ALPHA
Invalidation Result: Pending mobile and desktop browser evidence.
Ancestor Impact: feedback-required: preserve the current layout contract until browser evidence is reviewed.
Stop Or Replan Triggers: Stop if any visible label, link, readiness note, badge, or detail row overflows its containing node.
`,
  );
  execFileSync(
    process.env.PYTHON || "python",
    [
      join(repoRoot, "checkers", "render_workflow_status.py"),
      projectRoot,
      "--output",
      statusPath,
      "--guide-source",
      join(repoRoot, "docs", "sarathi.html"),
    ],
    { stdio: "inherit" },
  );
}

async function layoutEvidence(page) {
  return page.evaluate(() => {
    const visible = (element) => element.checkVisibility();
    const clippedNodes = [
      ...document.querySelectorAll(
        ".node, .learning-step, .learning-fact, .learning-details, .assessment-learning, .wave-card, .wave-body, .wave-member",
      ),
    ]
      .filter(visible)
      .map((node) => ({
        text: node.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
      }))
      .filter(({ clientHeight, scrollHeight }) => scrollHeight > clientHeight + 1);
    const overlaps = [];
    for (const flow of [...document.querySelectorAll(".flow")].filter(visible)) {
      const nodes = [...flow.children].filter(
        (child) => child.classList.contains("node") && visible(child),
      );
      for (let index = 1; index < nodes.length; index += 1) {
        const previous = nodes[index - 1].getBoundingClientRect();
        const current = nodes[index].getBoundingClientRect();
        const overlapX = Math.min(previous.right, current.right) - Math.max(previous.left, current.left);
        const overlapY = Math.min(previous.bottom, current.bottom) - Math.max(previous.top, current.top);
        if (overlapX > 0.5 && overlapY > 0.5) {
          overlaps.push({ index, overlapX, overlapY });
        }
      }
    }
    for (const list of [
      ...document.querySelectorAll(".wave-sequence > ol"),
    ].filter(visible)) {
      const steps = [...list.children].filter(
        (child) => child.classList.contains("wave-step") && visible(child),
      );
      for (let index = 1; index < steps.length; index += 1) {
        const previous = steps[index - 1].getBoundingClientRect();
        const current = steps[index].getBoundingClientRect();
        if (current.top < previous.bottom - 0.5) {
          overlaps.push({
            type: "wave-step",
            index,
            overlapY: previous.bottom - current.top,
          });
        }
      }
    }
    return {
      clippedNodes,
      overlaps,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

test.beforeAll(() => generateFixture());
test.afterAll(() => rmSync(projectRoot, { recursive: true, force: true }));

test("parent approval details open on demand", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pathToFileURL(statusPath).href);
  await page.locator("#approval-details-trigger").click();
  const dialog = page.locator("#approval-details");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Parent approvals");
  await expect(dialog).toContainText("No approval was found");
  await dialog.getByRole("button", { name: "Close approval details" }).click();
  await expect(dialog).not.toBeVisible();
});

for (const [name, path] of [
  ["workflow status", statusPath],
  ["process guide", guidePath],
]) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    test(`${name} contains visible nodes at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(pathToFileURL(path).href);
      const evidence = await layoutEvidence(page);
      expect(evidence.horizontalOverflow).toBeLessThanOrEqual(0);
      expect(evidence.clippedNodes).toEqual([]);
      expect(evidence.overlaps).toEqual([]);
      const screenshotRoot = process.env.SARATHI_LAYOUT_SCREENSHOTS;
      if (screenshotRoot) {
        mkdirSync(screenshotRoot, { recursive: true });
        await page.screenshot({
          fullPage: true,
          path: join(
            screenshotRoot,
            `${name.replaceAll(" ", "-")}-${viewport.width}x${viewport.height}.png`,
          ),
        });
      }
    });
  }
}
