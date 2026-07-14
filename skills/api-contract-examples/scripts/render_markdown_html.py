#!/usr/bin/env python3
"""Render generated API-example Markdown as deterministic standalone HTML."""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

GENERATED_NOTICE = "Generated from deterministic Markdown. Do not edit."
SOURCE_NOTICE = (
    "<!-- Generated from the authoritative OpenAPI document. Do not edit. -->"
)
TABLE_SEPARATOR = re.compile(r"^:?-{3,}:?$")

STYLE = """\
:root {
  color-scheme: light dark;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
body {
  margin: 0;
}
main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
h1, h2, h3, h4, h5, h6 {
  line-height: 1.2;
}
h2 {
  border-bottom: 1px solid CanvasText;
  padding-bottom: 0.35rem;
}
code {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
:not(pre) > code {
  background: color-mix(in srgb, CanvasText 8%, Canvas);
  padding: 0.1rem 0.3rem;
}
pre {
  overflow-x: auto;
  background: color-mix(in srgb, CanvasText 8%, Canvas);
  padding: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}
th, td {
  border: 1px solid CanvasText;
  padding: 0.45rem 0.6rem;
  text-align: left;
  vertical-align: top;
}
"""


def render_inline(value: str) -> str:
    """Escape text and render the generated subset's inline-code spans."""
    parts: list[str] = []
    position = 0
    for match in re.finditer(r"`([^`]*)`", value):
        parts.append(html.escape(value[position : match.start()], quote=True))
        code = match.group(1).replace(r"\|", "|").replace(r"\\", "\\")
        parts.append(f"<code>{html.escape(code, quote=True)}</code>")
        position = match.end()
    parts.append(html.escape(value[position:], quote=True))
    return "".join(parts)


def table_cells(line: str) -> list[str]:
    """Split a generated Markdown table row while respecting escaped pipes."""
    value = line.strip()
    if not value.startswith("|") or not value.endswith("|"):
        raise ValueError(f"Invalid generated table row: {line!r}")
    cells: list[str] = []
    current: list[str] = []
    escaped = False
    for character in value[1:-1]:
        if escaped:
            current.extend(("\\", character))
            escaped = False
        elif character == "\\":
            escaped = True
        elif character == "|":
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(character)
    if escaped:
        current.append("\\")
    cells.append("".join(current).strip())
    return cells


def is_table_start(lines: list[str], index: int) -> bool:
    if index + 1 >= len(lines):
        return False
    try:
        header = table_cells(lines[index])
        separator = table_cells(lines[index + 1])
    except ValueError:
        return False
    return (
        bool(header)
        and len(header) == len(separator)
        and all(TABLE_SEPARATOR.fullmatch(cell) for cell in separator)
    )


def is_block_start(lines: list[str], index: int) -> bool:
    line = lines[index]
    return bool(
        line.startswith("```")
        or re.match(r"^#{1,6} ", line)
        or is_table_start(lines, index)
    )


def document_title(lines: list[str]) -> str:
    for line in lines:
        if line.startswith("# "):
            return re.sub(r"`([^`]*)`", r"\1", line[2:]).strip() or "API Examples"
    return "API Examples"


def render_html(markdown_text: str) -> str:
    """Render the generated Markdown subset with stable ordering and LF newlines."""
    lines = markdown_text.splitlines()
    body: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip() or line == SOURCE_NOTICE:
            index += 1
            continue
        if line.startswith("```"):
            language = line[3:].strip()
            index += 1
            code_lines: list[str] = []
            while index < len(lines) and lines[index] != "```":
                code_lines.append(lines[index])
                index += 1
            if index == len(lines):
                raise ValueError("Unclosed fenced code block in generated Markdown")
            class_name = (
                f' class="language-{html.escape(language, quote=True)}"'
                if language
                else ""
            )
            code = html.escape("\n".join(code_lines), quote=True)
            body.append(f"<pre><code{class_name}>{code}</code></pre>")
            index += 1
            continue
        heading = re.match(r"^(#{1,6}) (.+)$", line)
        if heading:
            level = len(heading.group(1))
            body.append(f"<h{level}>{render_inline(heading.group(2))}</h{level}>")
            index += 1
            continue
        if is_table_start(lines, index):
            headers = table_cells(line)
            index += 2
            rows: list[list[str]] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                row = table_cells(lines[index])
                if len(row) != len(headers):
                    raise ValueError("Generated table row has a different column count")
                rows.append(row)
                index += 1
            body.extend(["<table>", "<thead>", "<tr>"])
            body.extend(f"<th>{render_inline(cell)}</th>" for cell in headers)
            body.extend(["</tr>", "</thead>", "<tbody>"])
            for row in rows:
                body.append("<tr>")
                body.extend(f"<td>{render_inline(cell)}</td>" for cell in row)
                body.append("</tr>")
            body.extend(["</tbody>", "</table>"])
            continue
        paragraph = [line]
        index += 1
        while (
            index < len(lines)
            and lines[index].strip()
            and lines[index] != SOURCE_NOTICE
            and not is_block_start(lines, index)
        ):
            paragraph.append(lines[index])
            index += 1
        body.append(f"<p>{render_inline(' '.join(paragraph))}</p>")

    title = html.escape(document_title(lines), quote=True)
    rendered_body = "\n".join(body)
    return (
        "<!doctype html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{title}</title>\n"
        f"<style>\n{STYLE}</style>\n"
        "</head>\n"
        "<body>\n"
        "<main>\n"
        f"<!-- {GENERATED_NOTICE} -->\n"
        f"{rendered_body}\n"
        "</main>\n"
        "</body>\n"
        "</html>\n"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("markdown", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--check", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.markdown.resolve() == args.output.resolve():
        print(
            "error: Markdown input and HTML output must use different paths",
            file=sys.stderr,
        )
        return 2
    try:
        rendered = render_html(args.markdown.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    encoded = rendered.encode("utf-8")
    if args.check:
        if not args.output.exists() or args.output.read_bytes() != encoded:
            print(f"stale generated API example HTML: {args.output}", file=sys.stderr)
            return 1
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
