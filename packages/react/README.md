# @santaka-ui/react

React adapter for Santaka UI components.

Thin wrappers over the same custom elements: typing, prop-to-property mapping, ref forwarding, and form wiring. Behavior stays with the element, so a React app and a plain-HTML app cannot drift apart.

## Install

```bash
pnpm add @santaka-ui/react @santaka-ui/web-components @santaka-ui/tokens @santaka-ui/styles
```

## Use

```tsx
import "@santaka-ui/tokens/css"
import "@santaka-ui/react/styles.css"
import { Button, Dialog, DialogTrigger } from "@santaka-ui/react"

export function Example() {
  return (
    <DialogTrigger>
      <Button variant="primary">Open</Button>
    </DialogTrigger>
  )
}
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
