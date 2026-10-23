# @santaka-ui/tokens

Santaka UI design tokens: DTCG source of truth compiled to CSS custom properties.

DTCG source compiled to CSS custom properties: light and dark themes, spacing, radius, border, shadow, motion, glass, and type. Overriding a token is the whole customization contract — no build step, no theme object.

## Install

```bash
pnpm add @santaka-ui/tokens
```

## Use

```ts
import "@santaka-ui/tokens/css"            // light, the default
import "@santaka-ui/tokens/css/dark.css"   // activated by [data-sk-theme="dark"]
```

```css
/* Your brand, without touching component CSS */
:root {
  --sk-color-primary: #7c3aed;
}
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
