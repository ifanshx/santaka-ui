#!/usr/bin/env node
/**
 * End-to-end CLI tests (plan.md §12 test layer 9: "CLI end-to-end tests:
 * initial setup, adding components, conflicts, private registry config, dry run,
 * and recovery").
 *
 * These run the **built binary** in a real subprocess against a real temporary
 * project, rather than calling the command functions. That distinction is the
 * point, and it is the same one the MCP smoke test makes: the functions can all
 * be correct while the process exits 0 on a conflict, prints help into a
 * pipeline, or writes to the wrong directory. Exit codes in particular are only
 * observable from a process — `process.exit(2)` is what §8's conflict contract
 * actually promises, and nothing in-process can assert it.
 *
 * `node --test` rather than a framework: no dependency, and the assertions are
 * about files and exit codes, which need no DOM or snapshot machinery.
 */
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { after, before, describe, it } from "node:test"
import assert from "node:assert/strict"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")
const CLI = resolve(here, "..", "dist", "cli.js")

/** Run the CLI, capturing stdout, stderr, and the exit code. */
function runCli(args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    })
    return { code: 0, stdout, stderr: "" }
  } catch (error) {
    return {
      code: typeof error.status === "number" ? error.status : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    }
  }
}

/** A temporary project that looks like a real react-vite app. */
function project(extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "santaka-e2e-"))
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "demo", dependencies: { react: "^19.0.0" } }, null, 2),
  )
  writeFileSync(join(dir, "vite.config.ts"), "")
  writeFileSync(join(dir, "pnpm-lock.yaml"), "")
  for (const [name, content] of Object.entries(extra)) {
    const path = join(dir, name)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }
  return dir
}

const cleanups = []
function makeProject(extra) {
  const dir = project(extra)
  cleanups.push(dir)
  return dir
}

after(() => {
  for (const dir of cleanups) rmSync(dir, { recursive: true, force: true })
})

describe("the built CLI", () => {
  before(() => {
    assert.ok(
      existsSync(CLI),
      `expected the built CLI at ${CLI}. Run \`pnpm --filter @santaka-ui/cli build\` first.`,
    )
  })

  it("reports what the project is (doctor)", () => {
    const dir = makeProject()
    const result = runCli(["doctor"], dir)
    assert.equal(result.code, 0)
    assert.match(result.stdout, /Framework: react-vite/)
    assert.match(result.stdout, /Package manager: pnpm/)
  })

  it("exits non-zero on an unknown command rather than printing help into stdout", () => {
    const dir = makeProject()
    const result = runCli(["nonsense"], dir)
    assert.notEqual(result.code, 0)
  })

  it("lists components", () => {
    const dir = makeProject()
    const result = runCli(["list"], dir)
    assert.equal(result.code, 0)
    assert.match(result.stdout, /button/)
    assert.match(result.stdout, /alert-dialog/)
  })

  it("writes nothing on --dry-run", () => {
    const dir = makeProject()
    const result = runCli(["add", "button", "--dry-run"], dir)
    assert.equal(result.code, 0)
    assert.match(result.stdout, /\[dry run\]/)
    assert.equal(existsSync(join(dir, "src/components/sk-button/sk-button.tsx")), false)
    assert.equal(existsSync(join(dir, "santaka-manifest.json")), false)
  })

  it("installs a component and records it in the manifest", () => {
    const dir = makeProject()
    const result = runCli(["add", "button"], dir)
    assert.equal(result.code, 0, result.stderr)

    const tsx = join(dir, "src/components/sk-button/sk-button.tsx")
    const css = join(dir, "src/components/sk-button/sk-button.css")
    assert.ok(existsSync(tsx), "the component source was copied")
    assert.ok(existsSync(css), "the component stylesheet was copied")

    const manifest = JSON.parse(readFileSync(join(dir, "santaka-manifest.json"), "utf8"))
    assert.equal(manifest.version, 1)
    assert.equal(manifest.items.button.version, "0.1.0")
    assert.match(manifest.items.button.files["src/components/sk-button/sk-button.tsx"], /^sha256-/)
  })

  it("is idempotent: a second add writes nothing and stays exit 0", () => {
    const dir = makeProject()
    runCli(["add", "button"], dir)
    const before = readFileSync(join(dir, "santaka-manifest.json"), "utf8")
    const result = runCli(["add", "button"], dir)
    assert.equal(result.code, 0)
    assert.equal(readFileSync(join(dir, "santaka-manifest.json"), "utf8"), before)
  })

  it("exits 2 on a conflict and writes nothing", () => {
    const dir = makeProject()
    runCli(["add", "button"], dir)
    const css = join(dir, "src/components/sk-button/sk-button.css")
    const edited = `${readFileSync(css, "utf8")}\n/* consumer edit */\n`
    writeFileSync(css, edited)

    const result = runCli(["add", "button"], dir)
    assert.equal(result.code, 2, "a conflict must exit 2 so it can gate CI")
    assert.match(result.stdout, /consumer edit/)
    assert.match(result.stdout, /--overwrite/)
    // Nothing was written: the consumer's edit is intact.
    assert.equal(readFileSync(css, "utf8"), edited)
  })

  it("--overwrite replaces an edited file", () => {
    const dir = makeProject()
    runCli(["add", "button"], dir)
    const css = join(dir, "src/components/sk-button/sk-button.css")
    writeFileSync(css, `${readFileSync(css, "utf8")}\n/* consumer edit */\n`)

    const result = runCli(["add", "button", "--overwrite"], dir)
    assert.equal(result.code, 0)
    assert.doesNotMatch(readFileSync(css, "utf8"), /consumer edit/)
  })

  it("--skip leaves the edited file and installs the rest", () => {
    const dir = makeProject()
    runCli(["add", "button"], dir)
    const css = join(dir, "src/components/sk-button/sk-button.css")
    const edited = `${readFileSync(css, "utf8")}\n/* consumer edit */\n`
    writeFileSync(css, edited)

    const result = runCli(["add", "button", "--skip"], dir)
    assert.equal(result.code, 0, "--skip is how the consumer chooses to proceed")
    assert.equal(readFileSync(css, "utf8"), edited, "the consumer's edit survives")
    // And the drift is still visible afterwards, because the manifest still
    // records the hash the CLI last wrote.
    const drift = runCli(["diff"], dir)
    assert.equal(drift.code, 2)
  })

  it("diff exits 0 when clean and 2 when drifted", () => {
    const dir = makeProject()
    runCli(["add", "button"], dir)
    assert.equal(runCli(["diff"], dir).code, 0)

    const tsx = join(dir, "src/components/sk-button/sk-button.tsx")
    writeFileSync(tsx, `${readFileSync(tsx, "utf8")}\n// edited\n`)
    const drifted = runCli(["diff", "button"], dir)
    assert.equal(drifted.code, 2)
    assert.match(drifted.stdout, /modified/)
  })

  it("refuses an unknown item and names the available ones", () => {
    const dir = makeProject()
    const result = runCli(["add", "buton"], dir)
    assert.notEqual(result.code, 0)
    assert.match(result.stdout, /Unknown item/)
    assert.match(result.stdout, /button/)
  })

  it("init writes the theme entrypoint and prints the next commands", () => {
    const dir = makeProject()
    const result = runCli(["init"], dir)
    assert.equal(result.code, 0, result.stderr)
    assert.ok(existsSync(join(dir, "santaka-theme.css")))
    assert.match(
      readFileSync(join(dir, "santaka-theme.css"), "utf8"),
      /--sk-color-primary|tokens\/css/,
    )
    assert.match(result.stdout, /pnpm add/)
  })

  it("init fails with guidance when it cannot detect a framework", () => {
    const dir = mkdtempSync(join(tmpdir(), "santaka-e2e-empty-"))
    cleanups.push(dir)
    const result = runCli(["init"], dir)
    assert.notEqual(result.code, 0)
    assert.match(result.stdout, /package\.json/)
  })

  it("init honours an explicit --framework override", () => {
    const dir = makeProject()
    const result = runCli(["init", "--framework", "vue"], dir)
    assert.equal(result.code, 0)
    assert.match(result.stdout, /Framework: vue/)
    assert.match(result.stdout, /override/)
  })

  it("theme init is idempotent", () => {
    const dir = makeProject()
    const first = runCli(["theme init"], dir)
    assert.equal(first.code, 0)
    const content = readFileSync(join(dir, "santaka-theme.css"), "utf8")
    const second = runCli(["theme init"], dir)
    assert.equal(second.code, 0)
    assert.match(second.stdout, /already up to date/)
    assert.equal(readFileSync(join(dir, "santaka-theme.css"), "utf8"), content)
  })

  it("rejects a non-http registry URL with guidance", () => {
    const dir = makeProject()
    const result = runCli(["registry", "not-a-url"], dir)
    assert.notEqual(result.code, 0)
    assert.match(result.stdout, /not an http/)
  })

  it("update with nothing installed is a no-op, not an error", () => {
    const dir = makeProject()
    const result = runCli(["update"], dir)
    assert.equal(result.code, 0)
    assert.match(result.stdout, /nothing to update/i)
  })

  it("update reinstalls and reports the same conflict rule", () => {
    const dir = makeProject()
    runCli(["add", "button"], dir)
    const css = join(dir, "src/components/sk-button/sk-button.css")
    writeFileSync(css, `${readFileSync(css, "utf8")}\n/* consumer edit */\n`)
    const result = runCli(["update"], dir)
    assert.equal(result.code, 2, "update must not overwrite an edited file either")
  })

  it("adding a block installs every component's files it composes, recorded in the manifest", () => {
    // ADR-022 §3: `registryDependencies` is resolved. The authentication block
    // composes seven components (alert, button, checkbox, input, link,
    // separator, text), all dependency-free, so the plan is the block plus its
    // seven dependencies — every file on disk, every entry in the manifest.
    const dir = makeProject()
    const result = runCli(["add", "authentication"], dir)
    assert.equal(result.code, 0, result.stdout + result.stderr)

    assert.ok(
      existsSync(join(dir, "src/blocks/authentication/authentication.html")),
      "the block's own markup was copied",
    )
    assert.ok(existsSync(join(dir, "src/blocks/authentication/authentication.css")))
    for (const component of ["alert", "button", "checkbox", "input", "link", "separator", "text"]) {
      assert.ok(
        existsSync(join(dir, `src/components/sk-${component}/sk-${component}.tsx`)),
        `dependency component ${component} was copied`,
      )
    }

    const manifest = JSON.parse(readFileSync(join(dir, "santaka-manifest.json"), "utf8"))
    const installed = Object.keys(manifest.items)
    for (const name of [
      "authentication",
      "alert",
      "button",
      "checkbox",
      "input",
      "link",
      "separator",
      "text",
    ]) {
      assert.ok(installed.includes(name), `manifest records ${name}`)
    }
    assert.equal(installed.length, 8, "exactly the block and its dependencies are recorded")
    // The whole closure is one plan: the block's checksum is verified like any
    // other entry's.
    assert.match(
      manifest.items.authentication.files["src/blocks/authentication/authentication.html"],
      /^sha256-/,
    )
  })

  it("list reports counts by item type, not one total", () => {
    const dir = makeProject()
    const result = runCli(["list"], dir)
    assert.equal(result.code, 0)
    // Derived from the registry payload rather than written here. The count used
    // to be hardcoded as 26 and drifted the moment components were added: the
    // CLI kept printing the right number and this test kept failing for months
    // on whatever runner had not been updated. A number the registry already
    // knows should be read from it.
    const index = JSON.parse(
      readFileSync(join(repoRoot, "packages/core/registry/index.json"), "utf8"),
    )
    const components = index.items.filter((item) => item.type === "component").length
    const blocks = index.items.filter((item) => item.type === "block").length
    assert.match(result.stdout, new RegExp(`${components} components, ${blocks} blocks`))
  })
})
