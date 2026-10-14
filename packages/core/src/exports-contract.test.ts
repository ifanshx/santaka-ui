import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/**
 * Package exports contract (plan.md §4, "Distribution and exports contract").
 *
 * This exists because of a shipped bug, not a hypothetical one. `glass.css`
 * was built into `packages/styles/dist/` and was listed in the styles
 * package's `files`, but was never added to the `exports` map — so a consumer
 * writing `@santaka-ui/styles/glass.css` got an unresolved-import error while the
 * file sat right there in the published tarball. Nothing in the build, the
 * tests, or `publint` caught it, because every one of them checks the file's
 * existence rather than whether the package promises a way to reach it.
 *
 * The rule this enforces: **every file a package ships through `files` must be
 * reachable through `exports`**, unless it is reached only by concatenation.
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")

const STYLE_PACKAGES = ["styles"] as const

describe("stylesheet package exports", () => {
  it.each(STYLE_PACKAGES)("%s exports every stylesheet it builds", (name) => {
    const pkgRoot = join(repoRoot, "packages", name)
    const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"))
    const exportsMap = pkg.exports as Record<string, string>

    // The stylesheets this package builds. Kept explicit rather than read from
    // the build script: a list derived from the same source as the thing it
    // checks would agree with a bug in that source.
    const BUILT = ["reset.css", "base.css", "primitives.css", "glass.css"] as const

    for (const sheet of BUILT) {
      const subpath = `./${sheet}`
      expect(
        exportsMap[subpath],
        `${name} must export ${subpath} — a file in dist/ that exports does not name is unreachable to a consumer`,
      ).toBeDefined()
      expect(exportsMap[subpath], `${name} export ${subpath} must resolve to the built file`).toBe(
        `./dist/${sheet}`,
      )
    }
  })

  it.each(STYLE_PACKAGES)("%s builds every stylesheet it exports", (name) => {
    const pkgRoot = join(repoRoot, "packages", name)
    const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"))
    const exportsMap = pkg.exports as Record<string, string>

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (!subpath.endsWith(".css")) continue
      const absolute = join(pkgRoot, target)
      expect(
        existsSync(absolute),
        `${name} exports ${subpath} -> ${target}, which does not exist. Run the package build.`,
      ).toBe(true)
    }
  })

  it.each(STYLE_PACKAGES)("%s publishes the files it exports", (name) => {
    const pkgRoot = join(repoRoot, "packages", name)
    const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"))
    // A `files` entry that omits `dist` would leave every export resolving to
    // nothing in the packed tarball while passing every check above.
    expect(pkg.files, `${name} must publish dist`).toContain("dist")
  })
})

describe("glass surface reachability", () => {
  it("is reachable as a standalone import, not only through index.css", () => {
    // The Tier 2 floating components import the surface on its own. A consumer
    // who wants only the glass material — and no reset, no base element styles —
    // must be able to ask for exactly that.
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, "packages", "styles", "package.json"), "utf8"),
    )
    expect(pkg.exports["./glass.css"]).toBeDefined()
  })

  it("declares itself side-effectful so a bundler does not drop it", () => {
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, "packages", "styles", "package.json"), "utf8"),
    )
    expect(pkg.sideEffects).toContain("**/*.css")
  })
})

describe("React JSX declarations reachability", () => {
  it("exports the custom-element JSX types as @santaka-ui/react/jsx", () => {
    // A `.d.ts` input is never re-emitted by tsc, so these declarations only
    // ship if the build copies them and the exports map names them. The Next.js
    // SSR fixture was the consumer that found the gap: rendering `sk-*` tags
    // directly failed to compile because the intrinsics existed only in the
    // repository, not in the published package.
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, "packages", "react", "package.json"), "utf8"),
    )
    const exported = pkg.exports["./jsx"]
    expect(exported, "@santaka-ui/react must export ./jsx").toBeDefined()
    expect(exported).toBe("./dist/custom-elements.d.ts")
    expect(
      existsSync(join(repoRoot, "packages", "react", exported)),
      "the export resolves to a file that does not exist — run the react build",
    ).toBe(true)
  })

  it("publishes the declarations it exports", () => {
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, "packages", "react", "package.json"), "utf8"),
    )
    expect(pkg.files).toContain("dist")
  })
})
