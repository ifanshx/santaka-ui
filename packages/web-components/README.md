# @santaka-ui/web-components

Santaka UI universal custom elements: the default owner of component behavior.

Thirty-eight components — from Button and Input to Combobox, Dialog, and Table — each owning its ARIA wiring, keyboard model, and form participation. The React, Vue, and Svelte packages adapt these elements rather than reimplementing them.

## Install

```bash
pnpm add @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles
```

## Use

```ts
import "@santaka-ui/tokens/css"
import "@santaka-ui/web-components/styles.css"
import "@santaka-ui/web-components"   // registers every element
```

```html
<sk-button variant="primary">Save</sk-button>
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
