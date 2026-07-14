#!/usr/bin/env python3
"""Render explicit OpenAPI 3 examples as deterministic Markdown and optional HTML."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from render_markdown_html import render_html  # noqa: E402

HTTP_METHODS = ("get", "put", "post", "delete", "options", "head", "patch", "trace")
MISSING = object()


def load_document(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    if path.suffix.casefold() == ".json":
        value = json.loads(text)
    else:
        try:
            import yaml
        except ImportError as exc:
            raise RuntimeError("PyYAML is required for YAML input") from exc
        value = yaml.safe_load(text)
    if not isinstance(value, dict):
        raise ValueError("OpenAPI document must be an object")
    if not str(value.get("openapi", "")).startswith("3."):
        raise ValueError("Only OpenAPI 3.x documents are supported")
    return value


def resolve_ref(document: dict[str, Any], value: Any) -> Any:
    seen: set[str] = set()
    while isinstance(value, dict) and "$ref" in value:
        ref = value["$ref"]
        if not isinstance(ref, str) or not ref.startswith("#/"):
            raise ValueError(f"Only local references are supported: {ref!r}")
        if ref in seen:
            raise ValueError(f"Reference cycle while resolving {ref}")
        seen.add(ref)
        current: Any = document
        for token in ref[2:].split("/"):
            token = token.replace("~1", "/").replace("~0", "~")
            if not isinstance(current, dict) or token not in current:
                raise ValueError(f"Unresolved reference: {ref}")
            current = current[token]
        siblings = {key: item for key, item in value.items() if key != "$ref"}
        value = {**current, **siblings} if isinstance(current, dict) else current
    return value


def first_explicit_value(
    document: dict[str, Any], schema: Any, direction: str | None = None
) -> Any:
    schema = resolve_ref(document, schema)
    if not isinstance(schema, dict):
        return MISSING
    examples = schema.get("examples")
    if isinstance(examples, list) and examples:
        return examples[0]
    for key in ("example", "const"):
        if key in schema:
            return schema[key]
    for union_key in ("oneOf", "anyOf"):
        variants = schema.get(union_key)
        if isinstance(variants, list):
            for variant in variants:
                value = first_explicit_value(document, variant, direction)
                if value is not MISSING:
                    return value
    all_of = schema.get("allOf")
    if isinstance(all_of, list):
        merged: dict[str, Any] = {}
        found = False
        for part in all_of:
            value = first_explicit_value(document, part, direction)
            if isinstance(value, dict):
                merged.update(value)
                found = True
        if found:
            return merged
    properties = schema.get("properties")
    if isinstance(properties, dict):
        result: dict[str, Any] = {}
        required = set(schema.get("required", []))
        for name in sorted(properties):
            prop = resolve_ref(document, properties[name])
            if isinstance(prop, dict):
                if direction == "request" and prop.get("readOnly"):
                    continue
                if direction == "response" and prop.get("writeOnly"):
                    continue
            value = first_explicit_value(document, prop, direction)
            if value is not MISSING:
                result[name] = value
            elif name in required:
                return MISSING
        if result or not required:
            return result
    if schema.get("type") == "array" or "items" in schema:
        item = first_explicit_value(document, schema.get("items", {}), direction)
        return [item] if item is not MISSING else MISSING
    return MISSING


def named_examples(
    document: dict[str, Any], media: Any, direction: str
) -> list[tuple[str, Any]]:
    media = resolve_ref(document, media)
    if not isinstance(media, dict):
        return []
    examples = media.get("examples")
    if isinstance(examples, dict):
        result = []
        for name in sorted(examples, key=str.casefold):
            item = resolve_ref(document, examples[name])
            if isinstance(item, dict) and "value" in item:
                result.append((name, item["value"]))
        if result:
            return result
    if "example" in media:
        return [("example", media["example"])]
    value = first_explicit_value(document, media.get("schema", {}), direction)
    return [("example", value)] if value is not MISSING else []


def parameter_examples(
    document: dict[str, Any], parameter: Any
) -> list[tuple[str, Any]]:
    parameter = resolve_ref(document, parameter)
    if not isinstance(parameter, dict):
        return []
    examples = parameter.get("examples")
    if isinstance(examples, dict):
        result = []
        for name in sorted(examples, key=str.casefold):
            item = resolve_ref(document, examples[name])
            if isinstance(item, dict) and "value" in item:
                result.append((name, item["value"]))
        if result:
            return result
    if "example" in parameter:
        return [("example", parameter["example"])]
    value = first_explicit_value(document, parameter.get("schema", {}), "request")
    return [("example", value)] if value is not MISSING else []


def json_block(value: Any) -> list[str]:
    return ["```json", json.dumps(value, indent=2, sort_keys=True), "```", ""]


def markdown_table_cell(value: str) -> str:
    return value.replace("\\", "\\\\").replace("|", "\\|")


def render(document: dict[str, Any], base_url: str | None) -> tuple[str, list[str]]:
    info = document.get("info", {})
    title = (
        info.get("title", "API Examples") if isinstance(info, dict) else "API Examples"
    )
    version = (
        info.get("version", "unspecified") if isinstance(info, dict) else "unspecified"
    )
    servers = document.get("servers", [])
    if base_url is None and isinstance(servers, list) and servers:
        server = servers[0]
        if isinstance(server, dict):
            base_url = server.get("url")
    base_url = str(base_url or "http://localhost")
    lines = [
        "<!-- Generated from the authoritative OpenAPI document. Do not edit. -->",
        "",
        f"# {title} Examples",
        "",
        f"Contract version: `{version}`",
        "",
    ]
    missing: list[str] = []
    paths = document.get("paths", {})
    if not isinstance(paths, dict):
        raise ValueError("OpenAPI paths must be an object")
    for path in sorted(paths):
        path_item = resolve_ref(document, paths[path])
        if not isinstance(path_item, dict):
            continue
        for method in HTTP_METHODS:
            operation = path_item.get(method)
            if not isinstance(operation, dict):
                continue
            label = f"{method.upper()} {path}"
            summary = operation.get("summary") or operation.get("operationId") or label
            lines.extend([f"## {summary}", "", f"`{label}`", ""])
            parameters = [
                *path_item.get("parameters", []),
                *operation.get("parameters", []),
            ]
            parameter_rows = []
            for parameter in parameters:
                resolved = resolve_ref(document, parameter)
                if not isinstance(resolved, dict):
                    continue
                values = parameter_examples(document, resolved)
                if not values and resolved.get("required"):
                    missing.append(f"{label} parameter {resolved.get('name', '?')}")
                for name, value in values:
                    parameter_rows.append(
                        (
                            str(resolved.get("in", "")),
                            str(resolved.get("name", "")),
                            name,
                            json.dumps(value, sort_keys=True),
                        )
                    )
            if parameter_rows:
                lines.extend(
                    [
                        "### Parameters",
                        "",
                        "| In | Name | Example | Value |",
                        "| --- | --- | --- | --- |",
                    ]
                )
                for location, name, example_name, value in sorted(parameter_rows):
                    location = markdown_table_cell(location)
                    name = markdown_table_cell(name)
                    example_name = markdown_table_cell(example_name)
                    value = markdown_table_cell(value)
                    lines.append(
                        f"| {location} | `{name}` | {example_name} | `{value}` |"
                    )
                lines.append("")
            request_found = False
            request_body = operation.get("requestBody")
            if request_body:
                request_body = resolve_ref(document, request_body)
                content = (
                    request_body.get("content", {})
                    if isinstance(request_body, dict)
                    else {}
                )
                for media_type in sorted(content):
                    for name, value in named_examples(
                        document, content[media_type], "request"
                    ):
                        request_found = True
                        lines.extend([f"### Request: {name} ({media_type})", ""])
                        request_url = f"{base_url.rstrip('/')}{path}"
                        lines.extend(
                            [
                                "```bash",
                                f"curl -X {method.upper()} '{request_url}' \\",
                                f"  -H 'Content-Type: {media_type}' \\",
                                "  --data-binary @request.json",
                                "```",
                                "",
                            ]
                        )
                        lines.extend(json_block(value))
                if not request_found:
                    missing.append(f"{label} request")
            responses = operation.get("responses", {})
            response_found = False
            response_payload_expected = False
            if isinstance(responses, dict):
                for status in sorted(responses, key=str):
                    response = resolve_ref(document, responses[status])
                    content = (
                        response.get("content", {})
                        if isinstance(response, dict)
                        else {}
                    )
                    response_payload_expected = response_payload_expected or bool(
                        content
                    )
                    for media_type in sorted(content):
                        for name, value in named_examples(
                            document, content[media_type], "response"
                        ):
                            response_found = True
                            lines.extend(
                                [f"### Response {status}: {name} ({media_type})", ""]
                            )
                            lines.extend(json_block(value))
            if response_payload_expected and not response_found:
                missing.append(f"{label} response")
    return "\n".join(lines).rstrip() + "\n", missing


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("schema", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--html-output",
        type=Path,
        help="also derive deterministic standalone HTML from the generated Markdown",
    )
    parser.add_argument("--base-url")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--allow-missing", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.html_output and args.html_output.resolve() == args.output.resolve():
        print(
            "error: Markdown and HTML outputs must use different paths", file=sys.stderr
        )
        return 2
    try:
        text, missing = render(load_document(args.schema), args.base_url)
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    if missing and not args.allow_missing:
        print("error: explicit examples are missing:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    artifacts = [(args.output, text.encode("utf-8"), "API examples")]
    if args.html_output:
        try:
            html_text = render_html(text)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2
        artifacts.append(
            (args.html_output, html_text.encode("utf-8"), "API example HTML")
        )
    if args.check:
        stale = [
            (path, label)
            for path, encoded, label in artifacts
            if not path.exists() or path.read_bytes() != encoded
        ]
        for path, label in stale:
            print(f"stale generated {label}: {path}", file=sys.stderr)
        if stale:
            return 1
        return 0
    for path, encoded, _ in artifacts:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
