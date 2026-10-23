# @santaka-ui/cli

Santaka UI CLI: detect a project, install components, run diagnostics.

Detects a project, installs a component as source or as a package, and runs diagnostics. It records what it installed in `santaka-manifest.json`, so an upgrade can tell your edits from upstream changes.

## Install

```bash
pnpm add -D @santaka-ui/cli
```

## Use

```bash
npx santaka init          # detect the framework, write the theme entrypoint
npx santaka add button    # copy the component source into your project
npx santaka list          # every item in the registry, by type
npx santaka doctor        # check the project against the contract
```

## Documentation

- [Architecture and specification](https://github.com/ifanshx/santaka-ui/blob/main/docs/ARCHITECTURE.md)
- [Component reference](https://santaka.my.id)
- [Decisions](https://github.com/ifanshx/santaka-ui/tree/main/docs/adr)

## License

MIT.
