# @santaka-ui/styles

Santaka UI reset, base element styles, focus-ring and visually-hidden primitives, and the glass overlay surface.

The reset, base element styles, and the two primitives every component leans on: the `:focus-visible` ring and the visually-hidden class. Load it after the tokens, because it resolves token variables.

## Install

```bash
pnpm add @santaka-ui/styles
```

## Use

```ts
import "@santaka-ui/tokens/css"
import "@santaka-ui/styles"
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
