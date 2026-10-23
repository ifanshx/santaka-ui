# @santaka-ui/vue

Vue 3 adapter for Santaka UI components.

The same components, exported in the same order as the React adapter. Vue decides per component whether to write a property or an attribute, so the adapter drops an unset prop rather than coercing it to an empty string.

## Install

```bash
pnpm add @santaka-ui/vue @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles
```

## Use

```vue
<script setup lang="ts">
  import "@santaka-ui/tokens/css"
  import "@santaka-ui/vue/styles.css"
  import { Button } from "@santaka-ui/vue"
</script>

<template>
  <Button variant="primary">Save</Button>
</template>
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
