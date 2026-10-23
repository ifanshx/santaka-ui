# @santaka-ui/core

Santaka UI framework-neutral contracts: component metadata, registry schema, validation.

The contracts every other package builds on: the registry JSON Schema, validation for untrusted entries, and the metadata types. No DOM dependency, so it runs in Node, in a browser, or in a build script.

## Install

```bash
pnpm add @santaka-ui/core
```

## Use

```ts
import { validateRegistryItem } from "@santaka-ui/core"

// Parses once at the boundary; everything downstream reads typed data.
const item = validateRegistryItem(untrustedJson)
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
