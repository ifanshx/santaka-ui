# @santaka-ui/mcp

Deterministic MCP server over Santaka UI registry metadata. No model, no network.

A stdio MCP server over the same registry metadata the CLI reads. Four tools — `search_components`, `get_component`, `get_tokens`, `get_usage`. No model, no network, no API key.

## Install

```bash
pnpm add -D @santaka-ui/mcp
```

## Use

```json
{
  "mcpServers": {
    "santaka": { "command": "npx", "args": ["-y", "@santaka-ui/mcp"] }
  }
}
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
