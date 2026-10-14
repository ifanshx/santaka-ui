#!/usr/bin/env node
/**
 * Consumer fixture (plan.md §17: "Public TypeScript types and package exports
 * validate in clean consumer projects ... Nothing has yet installed the package
 * into a scratch project and imported it, which is what this gate actually
 * asks for").
 *
 * Every other check in this repository resolves through the **workspace**. That
 * is why three defects of the same class shipped before this fixture existed:
 *
 *   - `glass.css` was built, listed in `files`, and absent from `exports` — so
 *     it was in the tarball and unreachable. `publint` passed.
 *   - 358 KB of CommonJS was emitted and named by no export condition. Nothing
 *     measured it, because the budget tooling measures *reachable* entrypoints.
 *   - Source mode in the CLI resolved component source through a path that
 *     existed only in the monorepo, so it passed every test here and would fail
 *     for every consumer.
 *
 * `attw --pack` and `publint` are the strongest checks available without a
 * consumer, and they are not this: both inspect the tarball, and neither can say
 * whether `import "@santaka-ui/react"` actually loads in a project that is not
 * this one. So this script packs all eight packages, installs the tarballs into
 * a scratch project outside the workspace, and exercises them the way a consumer
 * would.
 *
 * Usage:
 *   node tests/consumer/run.mjs            # pack, install, verify
 *   node tests/consumer/run.mjs --keep     # leave the scratch project for inspection
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..")

/** Every publishable package, in dependency order (nothing depends on order here,
 *  but a stable list makes the output readable). */
const PACKAGES = ["tokens", "styles", "utilities", "core", "web-components", "react", "mcp", "cli"]

const keep = process.argv.includes("--keep")
const scratch = mkdtempSync(join(tmpdir(), "santaka-consumer-"))

/**
 * Run a command, throwing with its output when it fails.
 *
 * `shell: true` is needed on Windows because `pnpm` is a `.cmd` shim that
 * `spawnSync` cannot execute directly. The cost is that the shell parses the
 * arguments, so a path containing a space (`C:\Program Files\nodejs\node.exe`)
 * is split at the space and the command fails with `'C:\Program' is not
 * recognized`. Quoting every argument that contains a space is the fix; passing
 * an argument array to a shell is not enough on its own.
 */
function run(command, args, options = {}) {
  const quote = (value) => (process.platform === "win32" && /\s/.test(value) ? `"${value}"` : value)
  const result = spawnSync(quote(command), args.map(quote), {
    encoding: "utf8",
    shell: process.platform === "win32",
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status})\n${result.stdout ?? ""}\n${
        result.stderr ?? ""
      }`,
    )
  }
  return result.stdout ?? ""
}

/**
 * Write a script into the scratch project and run it with Node.
 *
 * A file rather than `node -e`: a multi-line program passed to a shell through
 * `-e` is split and quoted by the shell before Node sees it, which is how the
 * first version of this harness reported eight failures that were all one
 * quoting bug.
 */
function runScript(name, source, options = {}) {
  const path = join(scratch, `.check-${name}.mjs`)
  writeFileSync(path, source)
  return run(process.execPath, [path], { cwd: scratch, ...options })
}

const checks = []
function check(name, fn) {
  checks.push({ name, fn })
}

// ---------------------------------------------------------------------------
// 1. Pack every package
// ---------------------------------------------------------------------------

function packAll(tarballDir) {
  mkdirSync(tarballDir, { recursive: true })
  for (const name of PACKAGES) {
    // `pnpm pack`, not `npm pack`. `npm pack` copies the manifest verbatim, so
    // the tarball keeps `"@santaka-ui/styles": "workspace:^"` — which no
    // registry can resolve, so the consumer install fails with a 404 for a
    // package that is not published yet. `pnpm pack` rewrites `workspace:^` to
    // the real version range, which is what a consumer would receive.
    run("pnpm", ["pack", "--pack-destination", tarballDir], {
      cwd: join(repoRoot, "packages", name),
    })
  }
}

// ---------------------------------------------------------------------------
// 2. Build the scratch consumer
// ---------------------------------------------------------------------------

/**
 * A consumer project with only the tarballs installed.
 *
 * `--ignore-workspace` is required, not cosmetic: the scratch project is created
 * under the OS temp directory, but pnpm walks up from `cwd` looking for
 * `pnpm-workspace.yaml`, and on Windows the temp directory is on the same drive.
 * Without the flag pnpm treats the fixture as a tenth workspace project, finds
 * the packages already in the store, and installs nothing from the tarballs —
 * so the fixture would silently test the workspace again.
 *
 * The `pnpm.overrides` entries are what make the internal ranges resolvable
 * before anything is published: `@santaka-ui/web-components` peers
 * `@santaka-ui/styles@^0.1.0`, and `^0.1.0` does not exist on npm yet. Each
 * override points that range at the local tarball, which is exactly the state a
 * consumer will be in after the first release and nothing more.
 */
function writeConsumerProject(dir, tarballDir) {
  const dependency = (name) => `file:${join(tarballDir, `santaka-ui-${name}-0.1.0.tgz`)}`
  const dependencies = {}
  const overrides = {}
  for (const name of PACKAGES) {
    dependencies[`@santaka-ui/${name}`] = dependency(name)
    overrides[`@santaka-ui/${name}`] = dependency(name)
  }
  dependencies.react = "^19.0.0"
  dependencies["react-dom"] = "^19.0.0"
  // The MCP client used by the fixture is the consumer's own dependency, not a
  // re-export of `@santaka-ui/mcp`. A consumer that mounts the server on a
  // transport imports the SDK directly, so the fixture does too — and pinning it
  // here is what caught the first version importing a package the fixture had
  // never declared.
  dependencies["@modelcontextprotocol/sdk"] = "1.32.1"

  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "santaka-consumer-fixture",
        private: true,
        type: "module",
        dependencies,
        pnpm: { overrides },
      },
      null,
      2,
    )}\n`,
  )
  writeFileSync(
    join(dir, ".npmrc"),
    "# The fixture installs only local tarballs; a registry is never contacted.\n",
  )
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** The subpaths every package promises, with the file each must resolve to. */
const EXPORT_SUBPATHS = [
  "@santaka-ui/tokens/css",
  "@santaka-ui/tokens/css/light.css",
  "@santaka-ui/tokens/css/dark.css",
  "@santaka-ui/tokens/css/index.css",
  "@santaka-ui/styles/reset.css",
  "@santaka-ui/styles/base.css",
  "@santaka-ui/styles/primitives.css",
  "@santaka-ui/styles/index.css",
  "@santaka-ui/styles/glass.css",
  "@santaka-ui/utilities",
  "@santaka-ui/core",
  "@santaka-ui/core/schema",
  "@santaka-ui/core/schema/registry-item-v1.json",
  "@santaka-ui/core/registry",
  "@santaka-ui/web-components",
  "@santaka-ui/web-components/loader",
  "@santaka-ui/web-components/santaka.css",
  "@santaka-ui/react",
  "@santaka-ui/react/styles.css",
  "@santaka-ui/react/jsx",
  "@santaka-ui/mcp",
  "@santaka-ui/cli",
]

check("every documented export subpath resolves from the tarball", () => {
  const script = `
    const specs = ${JSON.stringify(EXPORT_SUBPATHS)}
    let failed = 0
    for (const spec of specs) {
      try {
        import.meta.resolve(spec)
      } catch (error) {
        failed++
        console.log("UNRESOLVED", spec, error.code ?? error.message)
      }
    }
    console.log(failed === 0 ? "ok" : "failed:" + failed)
  `
  const out = runScript("exports", script)
  if (!out.includes("ok")) throw new Error(out)
})

check("the ESM entrypoints actually import, and export what they claim", () => {
  const script = `
    import * as utilities from "@santaka-ui/utilities"
    import * as core from "@santaka-ui/core"
    import * as mcp from "@santaka-ui/mcp"
    import * as cli from "@santaka-ui/cli"
    import * as react from "@santaka-ui/react"

    const problems = []
    const expect = (condition, message) => { if (!condition) problems.push(message) }

    expect(typeof utilities.cn === "function", "utilities.cn is not a function")
    expect(typeof utilities.validate === "function", "utilities.validate is not a function")
    expect(typeof core.validateRegistryItem === "function", "core.validateRegistryItem is not a function")
    expect(typeof core.searchComponents === "function", "core.searchComponents is not a function")
    expect(typeof mcp.createServer === "function", "mcp.createServer is not a function")
    expect(typeof cli.detectProject === "function", "cli.detectProject is not a function")
    expect(typeof react.Button === "object" || typeof react.Button === "function", "react.Button is not exported")

    // The registry aggregate must be readable through its subpath, not only
    // through the package root — that subpath is what the CLI and MCP use.
    const { createRequire } = await import("node:module")
    const require = createRequire(import.meta.url)
    const index = require("@santaka-ui/core/registry")
    expect(Array.isArray(index.items) && index.items.length > 0, "core/registry has no items")

    console.log(problems.length === 0 ? "ok" : problems.join("; "))
  `
  const out = runScript("imports", script)
  if (!out.includes("ok")) throw new Error(out)
})

check("the loader entrypoint registers nothing until it is called (ADR-005)", () => {
  // The lazy path is what SSR consumers import. It must not define elements on
  // import, or a server render would upgrade the tags.
  const script = `
    const before = typeof globalThis.customElements === "undefined" ? null : globalThis.customElements.get("sk-button")
    await import("@santaka-ui/web-components/loader")
    const after = typeof globalThis.customElements === "undefined" ? null : globalThis.customElements.get("sk-button")
    if (before !== null || after !== null) {
      console.log("FAIL: the loader defined sk-button on import")
    } else {
      console.log("ok")
    }
  `
  const out = runScript("loader", script)
  if (!out.includes("ok")) throw new Error(out)
})

check("the stylesheets are real files with the tokens the components need", () => {
  const tokens = readFileSync(
    join(scratch, "node_modules/@santaka-ui/tokens/dist/css/light.css"),
    "utf8",
  )
  if (!tokens.includes("--sk-color-primary")) throw new Error("light.css has no --sk-color-primary")

  const componentCss = readFileSync(
    join(scratch, "node_modules/@santaka-ui/web-components/dist/santaka.css"),
    "utf8",
  )
  if (!componentCss.includes("sk-button")) throw new Error("santaka.css has no sk-button rules")

  const glass = readFileSync(
    join(scratch, "node_modules/@santaka-ui/styles/dist/glass.css"),
    "utf8",
  )
  if (!glass.includes("backdrop-filter")) throw new Error("glass.css has no backdrop-filter")
})

check("no CommonJS is reachable through any export (ADR-012)", () => {
  // ESM-only is a *distribution contract* (ADR-012), so the check is about what
  // a consumer can reach, not about every byte in the tarball. A package may
  // legitimately carry a Node-only script that the exports map does not name.
  //
  // The distinction is not pedantic: an earlier version of this check walked
  // every `.js` file and failed on `loader/cdn.js` — a CommonJS shim pointing at
  // `dist/cjs/loader.cjs.js`, a file the build deletes. That is a real defect and
  // it is now fixed in `strip-cjs-output.mjs`, but it is *also* a defect the
  // resolution check above cannot see, which is why both exist.
  const script = `
    import { createRequire } from "node:module"
    import { readFileSync } from "node:fs"
    import { pathToFileURL } from "node:url"
    const require = createRequire(import.meta.url)

    const specs = ${JSON.stringify(EXPORT_SUBPATHS)}
    const offenders = []
    for (const spec of specs) {
      let resolved
      try {
        resolved = import.meta.resolve(spec)
      } catch {
        offenders.push(spec + " (unresolvable)")
        continue
      }
      if (!resolved.endsWith(".js")) continue
      const path = new URL(resolved)
      const head = readFileSync(path, "utf8").slice(0, 400)
      if (/\\bmodule\\.exports\\b|\\brequire\\(/.test(head)) {
        offenders.push(spec + " resolves to CommonJS")
      }
    }
    console.log(offenders.length === 0 ? "ok" : offenders.join("\\n"))
  `
  const out = runScript("cjs", script)
  if (!out.includes("ok")) throw new Error(out)
})

check("the CLI runs from the tarball and installs a component", () => {
  const bin = join(scratch, "node_modules", "@santaka-ui", "cli", "dist", "cli.js")
  if (!existsSync(bin)) throw new Error(`no CLI bin at ${bin}`)

  // A project for the CLI to operate on. Detection needs a package.json; source
  // mode needs the component source to be published, which is the whole point.
  const target = join(scratch, "target-project")
  mkdirSync(target, { recursive: true })
  writeFileSync(
    join(target, "package.json"),
    `${JSON.stringify({ name: "target", dependencies: { react: "^19.0.0" } }, null, 2)}\n`,
  )

  const doctor = run(process.execPath, [bin, "doctor", "--cwd", target])
  if (!doctor.includes("react-vite"))
    throw new Error(`doctor did not detect the framework:\n${doctor}`)

  const added = run(process.execPath, [bin, "add", "button", "--cwd", target])
  const copied = join(target, "src/components/sk-button/sk-button.tsx")
  if (!existsSync(copied)) {
    throw new Error(`source mode copied nothing from the tarball:\n${added}`)
  }
  const manifest = JSON.parse(readFileSync(join(target, "santaka-manifest.json"), "utf8"))
  if (!manifest.items.button) throw new Error("the CLI did not record the install")
})

check("the MCP server answers over a real transport, from the tarball", () => {
  const script = `
    import { Client } from "@modelcontextprotocol/sdk/client/index.js"
    import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
    import { createServer } from "@santaka-ui/mcp"

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const server = createServer()
    const client = new Client({ name: "consumer", version: "0.0.0" })
    await server.connect(serverTransport)
    await client.connect(clientTransport)

    const { tools } = await client.listTools()
    if (tools.length !== 4) throw new Error("expected 4 tools, got " + tools.length)

    const result = await client.callTool({ name: "get_component", arguments: { name: "button" } })
    const payload = JSON.parse(result.content[0].text)
    if (!payload.component || payload.component.props.length === 0) {
      throw new Error("get_component returned no props from the tarball")
    }
    await client.close()
    await server.close()
    console.log("ok")
  `
  const out = runScript("mcp", script)
  if (!out.includes("ok")) throw new Error(out)
})

/**
 * The universal packages must typecheck **without** `@types/node`.
 *
 * This is the check that earns its place. A package that reaches for a Node
 * global in its public types — `Buffer`, `process`, `NodeJS.Timeout` — makes
 * every consumer install `@types/node` to use a component library. The
 * declarations are what the consumer compiles against, so `skipLibCheck: false`
 * is required here: with it on, TypeScript would not read the shipped `.d.ts`
 * at all and the check would pass on anything.
 *
 * `@santaka-ui/cli` and `@santaka-ui/mcp` are excluded by name: they *are* Node
 * programs, they declare `engines.node`, and `Buffer` in their public surface is
 * correct. The split is the point — a universal package drifting into Node types
 * is a defect, and a Node package using Node types is the design.
 */
check("the universal packages typecheck without @types/node", () => {
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2023", "DOM", "DOM.Iterable"],
      module: "NodeNext",
      // The gate §17 actually names: `node16`-family resolution. It is the mode
      // where Stencil's directory-specifier re-exports failed to resolve, which
      // is why `attw` is release-blocking.
      moduleResolution: "NodeNext",
      strict: true,
      noUncheckedIndexedAccess: true,
      noEmit: true,
      // Must be false: the check is about the shipped declarations, and this
      // option is what makes TypeScript read them.
      skipLibCheck: false,
      jsx: "react-jsx",
      types: [],
    },
    include: ["consumer.ts", "consumer.tsx"],
  }
  writeFileSync(join(scratch, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`)

  writeFileSync(
    join(scratch, "consumer.ts"),
    `// A universal consumer: a bundler, a browser, or a Node app that has not
// installed @types/node. It imports only the packages that claim to be
// universal. The CLI and MCP packages are deliberately absent — they are Node
// programs, their public types use Buffer, and importing them here would fail on
// a dependency the consumer never asked for. The check below covers them with
// the types they imply.
import { cn, validate, nextId, type ValidationResult } from "@santaka-ui/utilities"
import { validateRegistryItem, searchComponents, type RegistryItem } from "@santaka-ui/core"
import registry from "@santaka-ui/core/registry" with { type: "json" }

const className: string = cn("a", false, "b")
const id: string = nextId("sk")
const outcome = validateRegistryItem({})
const index = registry as { items: RegistryItem[] }
const found = searchComponents({ items: index.items }, "button")
const validation: ValidationResult = validate("sk-button", [{ required: true }])

export { className, id, outcome, found, validation }
`,
  )

  writeFileSync(
    join(scratch, "consumer.tsx"),
    `import { Button, Card, Dialog, DialogContent, DialogTrigger, Checkbox } from "@santaka-ui/react"

export function App() {
  return (
    <Card heading="Example">
      <Button variant="primary" onSkClick={() => undefined}>
        Save
      </Button>
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Body</DialogContent>
      </Dialog>
      <Checkbox checked label="Agree" />
    </Card>
  )
}
`,
  )

  const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc")
  run(process.execPath, [tsc, "-p", join(scratch, "tsconfig.json")])
})

check("the Node packages typecheck with @types/node present", () => {
  // The other half: the CLI's public surface uses `Buffer`, which is correct for
  // a package whose `engines.node` is set. This asserts the declarations resolve
  // once the consumer installs the types those packages imply.
  const typesNode = join(repoRoot, "node_modules", "@types", "node")
  if (!existsSync(typesNode)) throw new Error("the workspace has no @types/node to point at")

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      // DOM is included because the MCP SDK is isomorphic: its transport types
      // reference `HeadersInit`, which is a DOM global. A consumer mounting the
      // server in a bundler has both libs; `lib: ["ES2023"]` alone would fail on
      // the SDK's own declarations rather than on anything this library ships.
      lib: ["ES2023", "DOM"],
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      types: ["node"],
      typeRoots: [join(repoRoot, "node_modules", "@types")],
    },
    include: ["node-consumer.ts"],
  }
  writeFileSync(join(scratch, "tsconfig.node.json"), `${JSON.stringify(tsconfig, null, 2)}\n`)
  writeFileSync(
    join(scratch, "node-consumer.ts"),
    `import { applyWrites, checksumOf, resolveInside, type WritePlanEntry } from "@santaka-ui/cli"
import { createServer } from "@santaka-ui/mcp"

const entry: WritePlanEntry = {
  destination: "/tmp/x",
  content: Buffer.from("hi"),
  action: "create",
}
const hash: string = checksumOf("package.json")
const safety = resolveInside("/tmp", "a.txt")
const server = createServer()

export { entry, hash, safety, server, applyWrites }
`,
  )

  const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc")
  run(process.execPath, [tsc, "-p", join(scratch, "tsconfig.node.json")])
})

check("the React adapter renders the element it wraps, in a real DOM", () => {
  const script = `
    import { createElement } from "react"
    import { renderToString } from "react-dom/server"
    import { Button, Card } from "@santaka-ui/react"

    const html = renderToString(
      createElement(Card, { heading: "Hi" },
        createElement(Button, { variant: "primary" }, "Save"),
      ),
    )
    if (!html.includes("sk-card")) throw new Error("no sk-card in the server output: " + html)
    if (!html.includes("sk-button")) throw new Error("no sk-button in the server output: " + html)
    console.log("ok")
  `
  const out = runScript("react-ssr", script)
  if (!out.includes("ok")) throw new Error(out)
})

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const tarballDir = join(scratch, "tarballs")
  console.log(`[consumer] scratch project: ${scratch}`)

  console.log("[consumer] packing 8 packages with pnpm pack")
  packAll(tarballDir)

  console.log("[consumer] writing the consumer project")
  writeConsumerProject(scratch, tarballDir)

  console.log("[consumer] installing the tarballs (no registry contacted)")
  run(
    "pnpm",
    ["install", "--ignore-workspace", "--no-frozen-lockfile", "--reporter", "append-only"],
    {
      cwd: scratch,
    },
  )

  let failed = 0
  for (const { name, fn } of checks) {
    try {
      fn()
      console.log(`  ok   ${name}`)
    } catch (error) {
      failed++
      console.log(`  FAIL ${name}`)
      console.log(
        String(error instanceof Error ? error.message : error)
          .split("\n")
          .map((line) => `       ${line}`)
          .join("\n"),
      )
    }
  }

  if (!keep) {
    rmSync(scratch, { recursive: true, force: true })
  } else {
    console.log(`[consumer] kept ${scratch}`)
  }

  if (failed > 0) {
    console.error(`[consumer] ${failed} of ${checks.length} checks failed`)
    process.exit(1)
  }
  console.log(`[consumer] all ${checks.length} checks passed`)
}

await main()
