# @santaka-ui/svelte

Svelte 5 support for Santaka UI components.

No wrappers. The Svelte 5 compiler already assigns properties and attributes for custom elements correctly, so a wrapper would duplicate it. This package ships the theme store and the type declarations that make `<sk-button>` typecheck in a template.

## Install

```bash
pnpm add @santaka-ui/svelte
```

## Use

```svelte
<script lang="ts">
  import { setTheme } from "@santaka-ui/svelte"
  import "@santaka-ui/web-components"
</script>

<sk-button variant="primary">Save</sk-button>
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
