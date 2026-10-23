import { describe, expect, it } from "vitest"
import type { RegistryItem } from "@santaka-ui/core"
import { diffLines, isIdentical, renderDiff } from "./diff.js"
import { detectProject, isFramework, resolveFramework, SUPPORTED_FRAMEWORKS } from "./detect.js"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { applyWrites, checksumOfBytes, resolveInside } from "./fs-safe.js"
import { resolveClosure, typeCounts, type LoadedRegistry } from "./registry.js"
import {
  compareFiles,
  conflictsOf,
  emptyManifest,
  readManifest,
  recordItem,
  removeItem,
  writeManifest,
} from "./manifest.js"

function tempProject(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "santaka-cli-"))
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    mkdirSync(join(path, ".."), { recursive: true })
    writeFileSync(path, content)
  }
  return dir
}

describe("path safety", () => {
  it("accepts a path inside the target", () => {
    const result = resolveInside("/project", "src/components/sk-button/sk-button.tsx")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.relative).toBe("src/components/sk-button/sk-button.tsx")
  })

  it("refuses traversal with ..", () => {
    const result = resolveInside("/project", "../../.ssh/authorized_keys")
    expect(result.ok).toBe(false)
  })

  it("refuses a sibling directory whose name shares a prefix", () => {
    // The case a naive `startsWith("/project")` check gets wrong: "/project-evil"
    // starts with "/project" but is not inside it.
    const result = resolveInside("/project", "../project-evil/file")
    expect(result.ok).toBe(false)
  })

  it("refuses an absolute path", () => {
    const result = resolveInside("/project", "/etc/passwd")
    expect(result.ok).toBe(false)
  })

  it("refuses a null byte", () => {
    expect(resolveInside("/project", "src/\0evil").ok).toBe(false)
  })

  it("refuses an empty path", () => {
    expect(resolveInside("/project", "  ").ok).toBe(false)
  })
})

describe("rollback-safe writes", () => {
  it("writes new files", () => {
    const dir = tempProject({})
    const result = applyWrites([
      { destination: join(dir, "a/b.txt"), content: "hello", action: "create" },
    ])
    expect(result.written).toHaveLength(1)
    expect(readFileSync(join(dir, "a/b.txt"), "utf8")).toBe("hello")
  })

  it("reports identical content as unchanged and writes nothing", () => {
    const dir = tempProject({ "a.txt": "same" })
    const result = applyWrites([
      { destination: join(dir, "a.txt"), content: "same", action: "replace" },
    ])
    expect(result.written).toHaveLength(0)
    expect(result.unchanged).toEqual([join(dir, "a.txt")])
  })

  it("restores a replaced file when a later write fails", () => {
    const dir = tempProject({ "a.txt": "original" })
    // The second entry targets a directory that exists as a *file*, so the write
    // fails after the first one has already replaced a.txt.
    writeFileSync(join(dir, "blocker"), "i am a file")
    expect(() =>
      applyWrites([
        { destination: join(dir, "a.txt"), content: "replaced", action: "replace" },
        { destination: join(dir, "blocker/nested.txt"), content: "nope", action: "create" },
      ]),
    ).toThrow()

    // The first write must have been rolled back.
    expect(readFileSync(join(dir, "a.txt"), "utf8")).toBe("original")
  })

  it("removes files it created when a later write fails", () => {
    const dir = tempProject({})
    writeFileSync(join(dir, "blocker"), "i am a file")
    expect(() =>
      applyWrites([
        { destination: join(dir, "created.txt"), content: "new", action: "create" },
        { destination: join(dir, "blocker/nested.txt"), content: "nope", action: "create" },
      ]),
    ).toThrow()
    expect(existsSync(join(dir, "created.txt"))).toBe(false)
  })

  it("leaves no backup files behind on success", () => {
    const dir = tempProject({ "a.txt": "one" })
    applyWrites([{ destination: join(dir, "a.txt"), content: "two", action: "replace" }])
    expect(existsSync(join(dir, "a.txt.santaka-backup"))).toBe(false)
    expect(readFileSync(join(dir, "a.txt"), "utf8")).toBe("two")
  })

  it("hashes bytes in the registry's sha256- form", () => {
    expect(checksumOfBytes("hello")).toMatch(/^sha256-[a-f0-9]{64}$/)
  })
})

describe("manifest and conflicts", () => {
  it("starts empty when no manifest exists", () => {
    const dir = tempProject({})
    const { manifest, error } = readManifest(dir)
    expect(error).toBeUndefined()
    expect(manifest.items).toEqual({})
  })

  it("reports a corrupt manifest rather than replacing it", () => {
    const dir = tempProject({ "santaka-manifest.json": "{ not json" })
    const { error } = readManifest(dir)
    expect(error).toContain("could not be parsed")
    // The file is left as it was: it is the consumer's only record.
    expect(readFileSync(join(dir, "santaka-manifest.json"), "utf8")).toBe("{ not json")
  })

  it("round-trips a recorded item", () => {
    const dir = tempProject({ "src/a.txt": "content" })
    const manifest = recordItem(emptyManifest(), "button", "0.1.0", [
      { path: "src/a.txt", absolute: join(dir, "src/a.txt") },
    ])
    writeManifest(dir, manifest)
    const reread = readManifest(dir).manifest
    expect(reread.items.button?.version).toBe("0.1.0")
    expect(reread.items.button?.files["src/a.txt"]).toMatch(/^sha256-/)
  })

  it("classifies clean, modified, and missing", () => {
    const dir = tempProject({ "src/a.txt": "content" })
    const manifest = recordItem(emptyManifest(), "button", "0.1.0", [
      { path: "src/a.txt", absolute: join(dir, "src/a.txt") },
    ])
    expect(compareFiles(dir, manifest.items.button!).map((entry) => entry.state)).toEqual(["clean"])

    writeFileSync(join(dir, "src/a.txt"), "edited")
    expect(compareFiles(dir, manifest.items.button!).map((entry) => entry.state)).toEqual([
      "modified",
    ])

    writeFileSync(join(dir, "src/a.txt"), "content")
    const second = recordItem(emptyManifest(), "button", "0.1.0", [
      { path: "src/gone.txt", absolute: join(dir, "src/a.txt") },
    ])
    expect(compareFiles(dir, second.items.button!).map((entry) => entry.state)).toEqual(["missing"])
  })

  it("reports modified files as the conflicts a run must not overwrite", () => {
    const dir = tempProject({ "src/a.txt": "content" })
    const manifest = recordItem(emptyManifest(), "button", "0.1.0", [
      { path: "src/a.txt", absolute: join(dir, "src/a.txt") },
    ])
    writeFileSync(join(dir, "src/a.txt"), "edited")
    const comparisons = compareFiles(dir, manifest.items.button!)
    expect(conflictsOf(comparisons)).toHaveLength(1)
  })

  it("removes an item without disturbing the others", () => {
    const dir = tempProject({ "a.txt": "1", "b.txt": "2" })
    let manifest = recordItem(emptyManifest(), "button", "0.1.0", [
      { path: "a.txt", absolute: join(dir, "a.txt") },
    ])
    manifest = recordItem(manifest, "dialog", "0.1.0", [
      { path: "b.txt", absolute: join(dir, "b.txt") },
    ])
    const trimmed = removeItem(manifest, "button")
    expect(Object.keys(trimmed.items)).toEqual(["dialog"])
  })
})

describe("list type counts", () => {
  it("reports counts per type, including a type it has never seen", () => {
    // A type the codebase has never shipped (`mystery`) proves the count is
    // derived from the entries, not from a fixed list of type names (ADR-022).
    const items: RegistryItem[] = [
      syntheticItem("a", []),
      syntheticItem("b", []),
      { ...syntheticItem("c", []), type: "block" as RegistryItem["type"] },
      { ...syntheticItem("d", []), type: "mystery" as RegistryItem["type"] },
    ]
    expect(typeCounts(items)).toBe("2 components, 1 block, 1 mystery")
  })

  it("uses the singular for a count of one", () => {
    expect(typeCounts([syntheticItem("a", [])])).toBe("1 component")
  })
})

describe("project detection", () => {
  it("detects react-vite from vite plus react", () => {
    const dir = tempProject({
      "package.json": JSON.stringify({ dependencies: { react: "^19.0.0" } }),
      "vite.config.ts": "",
    })
    expect(detectProject(dir).framework).toBe("react-vite")
  })

  it("prefers the most specific framework", () => {
    // A Nuxt project also has vue; the answer to "which one builds this app" is
    // nuxt, so it must win.
    const dir = tempProject({
      "package.json": JSON.stringify({ dependencies: { vue: "^3.5.0", nuxt: "^3.0.0" } }),
      "nuxt.config.ts": "",
    })
    expect(detectProject(dir).framework).toBe("nuxt")
  })

  it("detects nextjs from its config file", () => {
    const dir = tempProject({ "package.json": "{}", "next.config.mjs": "" })
    expect(detectProject(dir).framework).toBe("nextjs")
  })

  it("falls back to vanilla when there is a package.json and no framework", () => {
    const dir = tempProject({ "package.json": "{}" })
    expect(detectProject(dir).framework).toBe("vanilla")
  })

  it("reports a missing package.json as a problem", () => {
    const dir = tempProject({})
    const detection = detectProject(dir)
    expect(detection.problems.join(" ")).toContain("package.json")
  })

  it("detects the package manager from the lockfile, and says so", () => {
    const dir = tempProject({ "package.json": "{}", "pnpm-lock.yaml": "" })
    const detection = detectProject(dir)
    expect(detection.packageManager).toBe("pnpm")
    expect(detection.packageManagerEvidence).toContain("pnpm-lock.yaml")
  })

  it("assumes npm when there is no lockfile, and says so", () => {
    const dir = tempProject({ "package.json": "{}" })
    const detection = detectProject(dir)
    expect(detection.packageManager).toBe("npm")
    expect(detection.packageManagerEvidence.join(" ")).toContain("assuming npm")
  })

  it("detects typescript from tsconfig.json", () => {
    const dir = tempProject({ "package.json": "{}", "tsconfig.json": "{}" })
    expect(detectProject(dir).typescript).toBe(true)
  })

  it("records the evidence for its conclusion", () => {
    const dir = tempProject({
      "package.json": JSON.stringify({ dependencies: { react: "^19.0.0" } }),
      "vite.config.ts": "",
    })
    expect(detectProject(dir).frameworkEvidence.length).toBeGreaterThan(0)
  })
})

describe("framework resolution and the override", () => {
  it("accepts a supported framework", () => {
    for (const framework of SUPPORTED_FRAMEWORKS) expect(isFramework(framework)).toBe(true)
  })

  it("rejects an unknown override with the supported list", () => {
    const detection = detectProject(tempProject({ "package.json": "{}" }))
    const result = resolveFramework(detection, "angular")
    expect(result.framework).toBeNull()
    expect(result.problems.join(" ")).toContain("Unknown framework")
    expect(result.problems.join(" ")).toContain("react-vite")
  })

  it("honours an override over detection", () => {
    const detection = detectProject(tempProject({ "package.json": "{}", "next.config.js": "" }))
    expect(detection.framework).toBe("nextjs")
    expect(resolveFramework(detection, "vanilla").framework).toBe("vanilla")
  })

  it("asks for --framework when it cannot decide", () => {
    const detection = detectProject(tempProject({}))
    const result = resolveFramework(detection)
    // The missing-package.json problem is the actionable one; it is reported
    // rather than a generic "could not detect".
    expect(result.problems.length).toBeGreaterThan(0)
  })
})

describe("unified diff", () => {
  it("reports identical text as identical", () => {
    expect(isIdentical("a\nb", "a\nb")).toBe(true)
    expect(renderDiff("a\nb", "a\nb", { old: "x", new: "y" })).toBe("")
  })

  it("marks an added line", () => {
    const lines = diffLines("a\nb", "a\nb\nc")
    expect(lines.filter((line) => line.kind === "add").map((line) => line.text)).toEqual(["c"])
  })

  it("marks a removed line", () => {
    const lines = diffLines("a\nb\nc", "a\nc")
    expect(lines.filter((line) => line.kind === "remove").map((line) => line.text)).toEqual(["b"])
  })

  it("marks a changed line as one removal and one addition", () => {
    const lines = diffLines("a\nold\nc", "a\nnew\nc")
    expect(lines.filter((line) => line.kind === "remove")).toHaveLength(1)
    expect(lines.filter((line) => line.kind === "add")).toHaveLength(1)
  })

  it("renders a hunk header with line numbers and counts", () => {
    const rendered = renderDiff("a\nb\nc", "a\nX\nc", { old: "yours", new: "registry" })
    expect(rendered).toContain("--- yours")
    expect(rendered).toContain("+++ registry")
    expect(rendered).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/)
    expect(rendered).toContain("-b")
    expect(rendered).toContain("+X")
  })

  it("splits distant changes into separate hunks", () => {
    const before = Array.from({ length: 40 }, (_, i) => `line${i}`).join("\n")
    const after = before.replace("line1", "CHANGED").replace("line38", "ALSO")
    const rendered = renderDiff(before, after, { old: "a", new: "b" })
    expect(rendered.match(/@@ /g)).toHaveLength(2)
  })
})

/** A self-contained registry item for the closure tests: nothing is read from disk. */
function syntheticItem(name: string, registryDependencies: string[]): RegistryItem {
  return {
    $schema: "https://santaka.my.id/schema/registry-item-v1.json",
    schemaVersion: 1,
    name,
    namespace: null,
    type: "component",
    frameworks: ["web-components"],
    stability: "stable",
    behaviorOwner: "web-components",
    version: "0.1.0",
    dependencies: {},
    peerDependencies: {},
    registryDependencies,
    files: [{ path: `src/${name}.tsx`, type: "registry:component", checksum: "sha256-0" }],
    cssVariables: [],
    localesCovered: ["en-US"],
    license: "MIT",
    ai: {
      summary: `${name} summary`,
      whenToUse: ["when"],
      whenNotToUse: ["when not"],
      accessibility: "accessibility",
      example: "<example />",
      localesCovered: ["en-US"],
      knownLimitations: [],
    },
  }
}

function syntheticRegistry(items: RegistryItem[]): LoadedRegistry {
  return { items, sources: [{ name: "test", url: null }], rejected: [] }
}

describe("dependency closure", () => {
  it("walks a chain depth-first: a → b → c installs c, b, a", () => {
    const registry = syntheticRegistry([
      syntheticItem("a", ["b"]),
      syntheticItem("b", ["c"]),
      syntheticItem("c", []),
    ])
    const result = resolveClosure(registry, [registry.items[0]!])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items.map((item) => item.name)).toEqual(["c", "b", "a"])
    expect(result.missing).toEqual([])
  })

  it("installs a diamond's shared dependency once", () => {
    const registry = syntheticRegistry([
      syntheticItem("a", ["b", "c"]),
      syntheticItem("b", ["d"]),
      syntheticItem("c", ["d"]),
      syntheticItem("d", []),
    ])
    const result = resolveClosure(registry, [registry.items[0]!])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items.map((item) => item.name)).toEqual(["d", "b", "c", "a"])
  })

  it("refuses a self-cycle with the chain in the error", () => {
    const registry = syntheticRegistry([syntheticItem("s", ["s"])])
    const result = resolveClosure(registry, [registry.items[0]!])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("s → s")
  })

  it("refuses a mutual cycle with the chain in the error", () => {
    const registry = syntheticRegistry([syntheticItem("m1", ["m2"]), syntheticItem("m2", ["m1"])])
    const result = resolveClosure(registry, [registry.items[0]!])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("m1 → m2 → m1")
  })

  it("reports a missing dependency and names the parent that asked for it", () => {
    const registry = syntheticRegistry([syntheticItem("a", ["ghost"])])
    const result = resolveClosure(registry, [registry.items[0]!])
    expect(result.ok).toBe(true)
    expect(result.missing).toEqual([{ name: "ghost", requestedBy: "a" }])
  })

  it("installing a dependency-free item reports exactly the item's own files", () => {
    // The honest no-regression assertion for the 26 shipped components: with
    // `registryDependencies` empty everywhere, the plan is the named item alone.
    const registry = syntheticRegistry([syntheticItem("button", [])])
    const result = resolveClosure(registry, [registry.items[0]!])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe("button")
    expect(result.items[0]?.files).toEqual(registry.items[0]?.files)
    expect(result.missing).toEqual([])
  })
})
