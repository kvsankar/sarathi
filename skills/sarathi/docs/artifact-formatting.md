# Artifact Formatting

Sarathi-generated Markdown artifacts and reports should be easy to review in terminals,
diffs, and narrow editor panes.

## Column Width

- Wrap normal prose and bullet/numbered-list continuation lines at 80 characters where
  practical.
- Prefer short paragraphs and lists over very long wrapped blocks.
- Keep headings concise; do not rely on giant headings for important requirements.
- Do not contort content or reduce clarity only to satisfy the width guideline.

## Exceptions

Allow lines over 80 characters when wrapping would make the artifact less correct or less
readable:

- Markdown tables.
- URLs and source citations.
- Code fences, command lines, logs, stack traces, and generated output.
- Long IDs, file paths, hashes, approval records, or machine-readable snippets.
- HTML/SVG/diagram syntax where wrapping changes meaning or hurts maintainability.

## Review Guidance

Treat excessive line width as a readability finding, not a semantic failure, unless the
artifact is consistently hard to review. A few justified long lines are acceptable; a
document full of unwrapped prose should be revised before handoff.
