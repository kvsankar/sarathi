# Ecosystem Adapters

Choose the project's existing contract tool when it can emit standard examples faithfully.
Pin versions and inspect the generated contract because annotation support and OpenAPI versions
vary. The Markdown renderer consumes the contract, and the HTML renderer consumes only that
Markdown, so framework-specific annotations must not leak into either layer.

## Contract Formats

- **OpenAPI 3.x / JSON Schema**: Prefer standard `example` and `examples` fields at schema,
  parameter, and media-type locations. OpenAPI 3.0 and 3.1 differ because 3.1 aligns its Schema
  Object with JSON Schema 2020-12. Respect the document's declared version and the rule that
  parameter/media examples override schema examples.
- **AsyncAPI**: Keep message and payload examples in the AsyncAPI document, validate payloads
  against message schemas, and render channels/operations/messages in stable order.
- **GraphQL**: GraphQL SDL has no standard payload-example keyword. Keep canonical operations
  and variables in deterministic sidecar fixtures tied to schema validation; do not encode them
  in unrelated descriptions.
- **Protocol Buffers / gRPC**: Proto definitions have no standard request/response example
  field. Use deterministic textproto or JSON fixtures validated by generated message types and
  render RPC methods in descriptor order normalized to a documented stable order.

## Python

- **FastAPI / Pydantic**: Use Pydantic schema `examples` for schema examples and FastAPI
  `openapi_examples` for named OpenAPI parameter/body examples. Generate through `app.openapi()`
  or the project's export command and test the emitted OpenAPI, not only decorator arguments.
- **Django REST Framework**: Use the installed OpenAPI generator's native schema and operation
  extension mechanisms. Prefer native Example Objects. If framework metadata must carry a
  compatibility extension, document and test its extraction into standard OpenAPI fields.
- **Flask and other Python stacks**: Use the established OpenAPI extension or an OpenAPI-first
  document. Keep Marshmallow/Pydantic/dataclass metadata as an input, not a second contract.

## Java And Kotlin

- **Spring Boot / springdoc-openapi**: Use Swagger annotations such as schema examples and
  named `ExampleObject` values on request/response content. Generate the OpenAPI document in a
  build task or test and inspect the emitted media-type examples.
- **JAX-RS / MicroProfile OpenAPI**: Use MicroProfile or Swagger OpenAPI annotations on schemas,
  operations, request bodies, and responses, then export through the runtime/build plugin.
- **Ktor**: Prefer an OpenAPI plugin already adopted by the project or an OpenAPI-first contract;
  verify annotation/plugin output because Kotlin reflection and serialization plugins differ.

## .NET

- **ASP.NET Core built-in OpenAPI**: Generate with `Microsoft.AspNetCore.OpenApi` and add example
  metadata through schema, operation, or document transformers. For build-time output, use the
  supported OpenAPI document-generation package and pin its version.
- **Swashbuckle / NSwag**: Use schema/operation filters or the project's examples extension to
  populate standard OpenAPI fields. Test the serialized document so filter registration and
  serializer differences cannot hide missing examples.

## TypeScript And JavaScript

- **NestJS**: Use `@ApiProperty({ example })` or `examples` for DTO properties and request/
  response decorators for operation-level examples. If the CLI plugin derives examples from
  comments, test the generated document and keep runtime validation decorators intact.
- **Express, Fastify, Hono, and serverless handlers**: Prefer route schemas from TypeBox, Zod,
  JSON Schema, or the project's OpenAPI plugin. Put examples in the schema/route contract and
  test conversion because not every converter preserves all JSON Schema/OpenAPI keywords.

## Go

- **Code-first comment generators**: Tools such as swaggo/swag can produce Swagger/OpenAPI from
  declarative comments, but version and example support vary. Verify the generated document and
  convert or reject Swagger 2.0 when the downstream renderer requires OpenAPI 3.
- **OpenAPI-first**: Generate server/client types with the project's selected generator and keep
  examples in the OpenAPI source. This usually gives stronger drift control than free-form
  comments.

## Rust

- **utoipa**: Use `ToSchema`/`schema` attributes and path/request/response example support. Prefer
  plural `examples` where supported and disable or normalize optional order-preservation features
  unless their order is part of the documented output contract.
- **aide, paperclip, and other stacks**: Use native OpenAPI/JSON Schema hooks and test the
  serialized document. Derive macros are inputs; emitted OpenAPI is the integration boundary.

## Tooling Classes

Use one tool from each applicable class, favoring existing project choices:

- contract generation: framework exporter, build plugin, or checked-in design-first schema;
- lint/validation: an OpenAPI/AsyncAPI validator plus JSON Schema example validation;
- rendering: the bundled contract-to-Markdown and Markdown-to-HTML renderers, Widdershins,
  Redocly-based custom extraction, or a project-native pipeline with deterministic tests;
- freshness: regenerate plus `git diff --exit-code` or an equivalent clean-tree assertion;
- determinism: two isolated generations followed by byte comparison or SHA-256 comparison.

Primary references:

- OpenAPI Specification: <https://spec.openapis.org/oas/>
- FastAPI request examples: <https://fastapi.tiangolo.com/tutorial/schema-extra-example/>
- NestJS OpenAPI types and examples: <https://docs.nestjs.com/openapi/types-and-parameters>
- springdoc-openapi: <https://github.com/springdoc/springdoc-openapi>
- ASP.NET Core OpenAPI metadata: <https://learn.microsoft.com/aspnet/core/fundamentals/openapi/include-metadata>
- swaggo/swag annotations: <https://github.com/swaggo/swag>
- utoipa schema derive: <https://docs.rs/utoipa/latest/utoipa/derive.ToSchema.html>
