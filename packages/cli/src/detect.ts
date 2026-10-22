/**
 * Project detection (docs/ARCHITECTURE.md §8, CLI requirements: "Detect supported framework,
 * package manager, TypeScript usage, existing styling setup, and relevant config
 * files", with an explicit override and actionable guidance when detection
 * cannot decide).
 *
 * Detection reads only files. It never installs, never runs a script from the
 * target project, and never executes registry content — a CLI that runs a
 * project's `postinstall` to find out what it is has already run untrusted code.
 *
 * Every signal is *evidence*, and the result carries the evidence with the
 * conclusion. That is what makes the override honest: `santaka init --framework
 * vanilla` in a Next.js repo is not "detection failed", it is a user who knows
 * something the files do not say, and the output should show both.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type Framework = "react-vite" | "nextjs" | "vue" | "nuxt" | "svelte" | "astro" | "vanilla"

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

export type Detection = {
  framework: Framework | null
  /** Why the framework was chosen, in the order the signals were checked. */
  frameworkEvidence: string[]
  packageManager: PackageManager | null
  packageManagerEvidence: string[]
  typescript: boolean
  /** Paths that exist and are relevant, so `doctor` can print them. */
  configFiles: string[]
  /** Existing styling setup, if any. */
  styling: string[]
  /** Human-readable blockers. Empty means detection succeeded. */
  problems: string[]
}

/** Read and parse a JSON file, or return null. Never throws. */
function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>
  } catch {
    return null
  }
}

function hasDependency(pkg: Record<string, unknown> | null, name: string): boolean {
  if (!pkg) return false
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const group = pkg[field]
    if (group && typeof group === "object" && name in (group as Record<string, unknown>))
      return true
  }
  return false
}

/**
 * Detect the project in `cwd`.
 *
 * Framework signals are checked most-specific-first, because a Nuxt project also
 * has Vue, and an Astro project may have React. The order is the answer to "which
 * one is actually building this app", not "which one is present".
 */
export function detectProject(cwd: string): Detection {
  const pkg = readJson(join(cwd, "package.json"))
  const frameworkEvidence: string[] = []
  const packageManagerEvidence: string[] = []
  const configFiles: string[] = []
  const styling: string[] = []
  const problems: string[] = []

  if (!pkg) {
    problems.push(
      `No package.json in ${cwd}. Run this inside a project, or create one first (npm init -y).`,
    )
  }

  // --- framework -----------------------------------------------------------
  const exists = (name: string) => {
    const present = existsSync(join(cwd, name))
    if (present) configFiles.push(name)
    return present
  }

  let framework: Framework | null = null
  const consider = (candidate: Framework, condition: boolean, evidence: string) => {
    if (framework === null && condition) {
      framework = candidate
      frameworkEvidence.push(evidence)
    }
  }

  consider(
    "nextjs",
    exists("next.config.js") || exists("next.config.mjs") || exists("next.config.ts"),
    "next.config.*",
  )
  consider("nextjs", hasDependency(pkg, "next"), "package.json depends on next")
  consider("nuxt", exists("nuxt.config.ts") || exists("nuxt.config.js"), "nuxt.config.*")
  consider("nuxt", hasDependency(pkg, "nuxt"), "package.json depends on nuxt")
  consider("svelte", exists("svelte.config.js") || exists("svelte.config.ts"), "svelte.config.*")
  consider("svelte", hasDependency(pkg, "@sveltejs/kit"), "package.json depends on @sveltejs/kit")
  consider("astro", exists("astro.config.mjs") || exists("astro.config.ts"), "astro.config.*")
  consider("astro", hasDependency(pkg, "astro"), "package.json depends on astro")
  consider("vue", exists("vite.config.ts") && hasDependency(pkg, "vue"), "vite + vue")
  consider("vue", hasDependency(pkg, "vue"), "package.json depends on vue")
  consider("react-vite", exists("vite.config.ts") && hasDependency(pkg, "react"), "vite + react")
  consider("react-vite", hasDependency(pkg, "react"), "package.json depends on react")
  consider("vanilla", pkg !== null, "no framework dependency found; treating as plain HTML")

  if (framework === null) {
    frameworkEvidence.push("no signals found")
  }

  // --- package manager -----------------------------------------------------
  let packageManager: PackageManager | null = null
  const lockfiles: Array<[string, PackageManager]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["bun.lock", "bun"],
    ["package-lock.json", "npm"],
  ]
  for (const [file, manager] of lockfiles) {
    if (existsSync(join(cwd, file))) {
      packageManager = manager
      packageManagerEvidence.push(file)
      break
    }
  }
  if (!packageManager) {
    packageManagerEvidence.push("no lockfile found; assuming npm")
    packageManager = "npm"
  }

  // --- typescript ----------------------------------------------------------
  const typescript = existsSync(join(cwd, "tsconfig.json")) || hasDependency(pkg, "typescript")
  if (existsSync(join(cwd, "tsconfig.json"))) {
    if (!configFiles.includes("tsconfig.json")) configFiles.push("tsconfig.json")
  }

  // --- styling -------------------------------------------------------------
  const styleChecks: Array<[string, string]> = [
    ["tailwind.config.js", "tailwind"],
    ["tailwind.config.ts", "tailwind"],
    ["tailwind.config.mjs", "tailwind"],
  ]
  for (const [file, label] of styleChecks) {
    if (existsSync(join(cwd, file)) && !styling.includes(label)) styling.push(label)
  }
  if (hasDependency(pkg, "tailwindcss") && !styling.includes("tailwind")) styling.push("tailwind")
  if (hasDependency(pkg, "@santaka-ui/web-components")) styling.push("santaka")

  return {
    framework,
    frameworkEvidence,
    packageManager,
    packageManagerEvidence,
    typescript,
    configFiles,
    styling,
    problems,
  }
}

/**
 * Resolve the framework to use, honouring an explicit override.
 *
 * The override does not silence a problem — it answers the framework question
 * and leaves every other problem in place. `null` with a problem means the CLI
 * cannot proceed and the caller must print `problems` and exit non-zero.
 */
export function resolveFramework(
  detection: Detection,
  override?: string,
): { framework: Framework | null; problems: string[] } {
  const problems = [...detection.problems]
  if (!override) {
    if (detection.framework === null && problems.length === 0) {
      problems.push(
        "Could not detect a framework. Pass --framework with one of: " +
          SUPPORTED_FRAMEWORKS.join(", "),
      )
    }
    return { framework: detection.framework, problems }
  }

  if (!isFramework(override)) {
    problems.push(`Unknown framework "${override}". Supported: ${SUPPORTED_FRAMEWORKS.join(", ")}.`)
    return { framework: null, problems }
  }
  return { framework: override, problems }
}

export const SUPPORTED_FRAMEWORKS = [
  "react-vite",
  "nextjs",
  "vue",
  "nuxt",
  "svelte",
  "astro",
  "vanilla",
] as const

export function isFramework(value: string): value is Framework {
  return (SUPPORTED_FRAMEWORKS as readonly string[]).includes(value)
}
