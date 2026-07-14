import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (
    ROOT / "skills" / "api-contract-examples" / "scripts" / "render_openapi_examples.py"
)


def load_renderer():
    spec = importlib.util.spec_from_file_location("render_openapi_examples", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def document():
    return {
        "openapi": "3.1.0",
        "info": {"title": "Orders", "version": "1.2.3"},
        "servers": [{"url": "https://api.example.com"}],
        "paths": {
            "/orders": {
                "post": {
                    "summary": "Create order",
                    "parameters": [
                        {
                            "name": "dry_run",
                            "in": "query",
                            "schema": {"type": "boolean", "example": False},
                        }
                    ],
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "examples": {
                                    "priority": {
                                        "value": {"sku": "ABC", "quantity": 2}
                                    },
                                    "normal": {"value": {"sku": "XYZ", "quantity": 1}},
                                },
                                "schema": {"$ref": "#/components/schemas/CreateOrder"},
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Order"}
                                }
                            }
                        },
                        "400": {
                            "content": {
                                "application/problem+json": {
                                    "example": {"title": "Invalid order", "status": 400}
                                }
                            }
                        },
                    },
                }
            }
        },
        "components": {
            "schemas": {
                "CreateOrder": {
                    "type": "object",
                    "required": ["sku", "quantity"],
                    "properties": {
                        "quantity": {"type": "integer", "example": 1},
                        "sku": {"type": "string", "examples": ["XYZ"]},
                    },
                },
                "Order": {
                    "allOf": [
                        {"$ref": "#/components/schemas/CreateOrder"},
                        {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "readOnly": True,
                                    "example": "ord_123",
                                },
                                "secret": {
                                    "type": "string",
                                    "writeOnly": True,
                                    "example": "not-a-real-secret",
                                },
                            },
                        },
                    ]
                },
            }
        },
    }


def test_render_is_deterministic_and_uses_named_and_schema_examples():
    module = load_renderer()
    source = document()
    first, missing = module.render(source, None)
    second, second_missing = module.render(source, None)

    assert first.encode() == second.encode()
    assert missing == second_missing == []
    assert first.index("Request: normal") < first.index("Request: priority")
    assert '"id": "ord_123"' in first
    assert "| query | `dry_run` | example | `false` |" in first
    response_start = first.index("Response 201")
    response_end = first.index("Response 400")
    assert "not-a-real-secret" not in first[response_start:response_end]
    assert "Response 400" in first
    assert "Do not edit" in first
    order_schema = {"$ref": "#/components/schemas/Order"}
    request_value = module.first_explicit_value(source, order_schema, "request")
    response_value = module.first_explicit_value(source, order_schema, "response")
    assert "id" not in request_value and "secret" in request_value
    assert "id" in response_value and "secret" not in response_value
    override = {
        "$ref": "#/components/schemas/CreateOrder",
        "example": {"sku": "OVERRIDE", "quantity": 3},
    }
    assert module.first_explicit_value(source, override) == {
        "sku": "OVERRIDE",
        "quantity": 3,
    }


def test_main_writes_and_checks_freshness(tmp_path, monkeypatch):
    module = load_renderer()
    schema = tmp_path / "openapi.json"
    output = tmp_path / "api-examples.md"
    html_output = tmp_path / "api-examples.html"
    schema.write_text(json.dumps(document()), encoding="utf-8")

    monkeypatch.setattr(
        sys,
        "argv",
        [str(SCRIPT), str(schema), str(output), "--html-output", str(html_output)],
    )
    assert module.main() == 0
    expected = output.read_bytes()
    expected_html = html_output.read_bytes()
    assert b"<title>Orders Examples</title>" in expected_html

    monkeypatch.setattr(
        sys,
        "argv",
        [
            str(SCRIPT),
            str(schema),
            str(output),
            "--html-output",
            str(html_output),
            "--check",
        ],
    )
    assert module.main() == 0
    html_output.write_text("stale\n", encoding="utf-8")
    assert module.main() == 1
    assert expected == output.read_bytes()
    assert expected_html != html_output.read_bytes()


def test_missing_explicit_examples_fail_by_default(tmp_path, monkeypatch):
    module = load_renderer()
    value = document()
    value["paths"]["/orders"]["post"]["responses"] = {
        "200": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["result"],
                        "properties": {"result": {"type": "string"}},
                    }
                }
            }
        }
    }
    schema = tmp_path / "openapi.json"
    output = tmp_path / "api-examples.md"
    schema.write_text(json.dumps(value), encoding="utf-8")

    monkeypatch.setattr(sys, "argv", [str(SCRIPT), str(schema), str(output)])
    assert module.main() == 1
    assert not output.exists()


def test_no_content_response_does_not_require_an_example():
    module = load_renderer()
    value = document()
    value["paths"]["/orders"]["post"]["responses"] = {"204": {"description": "Done"}}

    _, missing = module.render(value, None)

    assert missing == []
