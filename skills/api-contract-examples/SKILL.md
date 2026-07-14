---
name: api-contract-examples
description: Design, implement, or review schema-owned API examples and deterministic human-readable API example documentation. Use for OpenAPI or other machine-readable HTTP, RPC, event, or service contracts; code-first or design-first schema generation; request/response/error examples; generated api-examples.md and derived HTML files; contract-example validation; reproducible documentation builds; or stale generated API docs across Python, Java/Kotlin, .NET, TypeScript/JavaScript, Go, Rust, and other ecosystems.
---

# API Contract Examples

Keep examples with the authoritative machine-readable contract and derive human-readable
example documentation from that source. Do not create a separately maintained payload catalog.

## Workflow

1. Identify the contract format, version, source of truth, and code-first or design-first flow.
2. Inspect the project stack and load [references/ecosystems.md](references/ecosystems.md) only
   for the relevant ecosystem or contract format.
3. Annotate representative request, success-response, and error-response examples at the
   narrowest truthful contract location. Prefer standard schema/media/operation example fields;
   use a documented compatibility extension only when the selected generator cannot emit them.
4. Generate the machine-readable contract with pinned tools. Validate the contract and every
   explicit example against its effective schema after references and composition are resolved.
5. Generate a human-readable Markdown artifact from the contract, then derive standalone HTML
   from that exact Markdown. Markdown is the canonical human-readable intermediate; HTML must
   never independently reinterpret the API contract. Use the bundled
   `scripts/render_openapi_examples.py` and `--html-output` for OpenAPI 3 when they fit;
   otherwise implement the same deterministic chain with established project tooling.
6. Prove reproducibility by generating both artifacts twice from a clean input and comparing
   bytes or SHA-256 hashes. Pin ordering, formatting, newline policy, tool versions, seed,
   clock, base URL, styling, and any fallback values. Prefer no synthesized fallback at all.
7. Add a freshness gate that regenerates and fails on a diff. A local hook may update files for
   convenience, but CI must detect stale output rather than silently accepting or staging it.
8. Make generated-file ownership explicit and never hand-edit generated output.

## Example Precedence

Use the contract format's semantics. For OpenAPI 3, prefer media-type or parameter `examples`,
then media-type or parameter `example`, then schema `examples`/`example`. Treat `default` as an
example only when the API contract explicitly says it is representative. Keep named examples
stable and meaningful; do not select one through map iteration or randomness.

Cover both singular and plural/named forms supported by the chosen contract version and tool.
Include authentication placeholders, pagination variants, polymorphic/discriminator cases,
validation failures, authorization failures, and domain errors where relevant. Never place live
secrets, credentials, personal data, production identifiers, or unstable timestamps in examples.

## Required Evidence

Require all of the following before declaring the pipeline complete:

- authoritative schema path and generation command;
- annotation convention and precedence;
- generated Markdown and derived HTML paths and generation command;
- schema validation and explicit-example conformance command;
- two-run byte/hash determinism command;
- regenerate-and-diff freshness command suitable for CI;
- tests for references, composition, arrays, required/read-only/write-only behavior, named
  examples, request/success/error rendering, Markdown-to-HTML derivation, HTML escaping,
  ordering, and missing examples;
- owner, review trigger, publication/discovery path, and generated-file notice.

For Sarathi designs, record `API Surface: Present` or `API Surface: None`. When present, include
the evidence above and create explicit `TEST-` obligations for conformance, deterministic output,
and freshness so planning and implementation cannot quietly drop them.

## Bundled Renderer

Run:

```text
python scripts/render_openapi_examples.py openapi.yaml docs/api-examples.md --html-output docs/api-examples.html
python scripts/render_openapi_examples.py openapi.yaml docs/api-examples.md --html-output docs/api-examples.html --check
```

The renderer supports OpenAPI 3 JSON directly and YAML when PyYAML is available. It uses only
explicit examples, resolves local references, applies stable ordering, emits LF UTF-8 Markdown
and standalone HTML, and fails on missing examples unless `--allow-missing` is provided. The
HTML renderer handles the generated Markdown subset, escapes raw content, and uses fixed CSS;
it is not a general-purpose Markdown engine. To rebuild HTML separately from an existing
canonical Markdown file, run:

```text
python scripts/render_markdown_html.py docs/api-examples.md docs/api-examples.html
python scripts/render_markdown_html.py docs/api-examples.md docs/api-examples.html --check
```

These are deterministic renderers, not complete OpenAPI validators; pair them with the
ecosystem's schema validator.
