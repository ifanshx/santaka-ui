# @santaka-ui/utilities

Minimal framework-neutral helpers shared by every Santaka UI implementation.

Three helpers shared by every implementation: `cn` for class merging, `validate` for the registry boundary, and `nextId` for stable generated ids. Deliberately small — a utility package that grows becomes a framework.

## Install

```bash
pnpm add @santaka-ui/utilities
```

## Use

```ts
import { cn, nextId } from "@santaka-ui/utilities"

const id = nextId("field")
const className = cn("base", isActive && "is-active")
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
