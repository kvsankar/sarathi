import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (
    ROOT / "skills" / "api-contract-examples" / "scripts" / "render_markdown_html.py"
)


def load_renderer():
    spec = importlib.util.spec_from_file_location("render_markdown_html", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def generated_markdown() -> str:
    return """<!-- Generated from the authoritative OpenAPI document. Do not edit. -->

# Orders Examples

Contract version: `1.2.3`

## Create order

`POST /orders`

### Parameters

| In | Name | Example | Value |
| --- | --- | --- | --- |
| query | `filter` | normal | `{"value": "a\\|b"}` |

```json
{"unsafe": "<script>alert('no')</script>"}
```

Raw <strong>HTML</strong> remains text.
"""


def test_render_html_is_deterministic_and_escapes_untrusted_content():
    module = load_renderer()

    first = module.render_html(generated_markdown())
    second = module.render_html(generated_markdown())

    assert first.encode() == second.encode()
    assert "<title>Orders Examples</title>" in first
    assert "<h2>Create order</h2>" in first
    assert '<code class="language-json">' in first
    assert "<table>" in first
    assert "<code>{&quot;value&quot;: &quot;a|b&quot;}</code>" in first
    assert "<script>" not in first
    assert "&lt;script&gt;alert(&#x27;no&#x27;)&lt;/script&gt;" in first
    assert "Raw &lt;strong&gt;HTML&lt;/strong&gt; remains text." in first
    assert "Generated from deterministic Markdown. Do not edit." in first


def test_main_writes_and_checks_freshness(tmp_path, monkeypatch):
    module = load_renderer()
    markdown = tmp_path / "api-examples.md"
    output = tmp_path / "api-examples.html"
    markdown.write_text(generated_markdown(), encoding="utf-8")

    monkeypatch.setattr(sys, "argv", [str(SCRIPT), str(markdown), str(output)])
    assert module.main() == 0
    expected = output.read_bytes()

    monkeypatch.setattr(
        sys, "argv", [str(SCRIPT), str(markdown), str(output), "--check"]
    )
    assert module.main() == 0
    output.write_text("stale\n", encoding="utf-8")
    assert module.main() == 1
    assert output.read_bytes() != expected


def test_unclosed_code_fence_is_rejected():
    module = load_renderer()

    try:
        module.render_html("# Examples\n\n```json\n{}\n")
    except ValueError as exc:
        assert "Unclosed fenced code block" in str(exc)
    else:
        raise AssertionError("Expected an unclosed code fence to fail")
