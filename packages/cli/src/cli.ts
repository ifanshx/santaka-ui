#!/usr/bin/env node
/**
 * The `santaka` bin (docs/ARCHITECTURE.md §8).
 *
 * Argument parsing is `cac` and colour is `kleur`, per §5's toolchain table.
 * The command implementations return their output as lines rather than printing,
 * so this file is the only place that writes to the terminal — which is what
 * makes `--dry-run` and the tests the same code path.
 *
 * Output goes through `process.stdout.write` rather than `console.log`. A CLI's
 * stdout is a product surface: it is piped, diffed, and asserted against, and
 * `console.log` is a debugging function that adds formatting assumptions on top
 * of it. Diagnostics go to stderr, so `santaka list | grep button` is not
 * polluted by a warning about a lockfile.
 */
import { cac } from "cac"
import kleur from "kleur"
import {
  add,
  diff,
  doctor,
  EXIT,
  init,
  list,
  registryAdd,
  themeInit,
  update,
  type CommandContext,
} from "./commands.js"

const out = (line: string): void => {
  process.stdout.write(`${line}\n`)
}
const err = (line: string): void => {
  process.stderr.write(`${line}\n`)
}

const paint = {
  ok: (text: string) => kleur.green(text),
  warn: (text: string) => kleur.yellow(text),
  error: (text: string) => kleur.red(text),
  dim: (text: string) => kleur.dim(text),
  bold: (text: string) => kleur.bold(text),
}

const cli = cac("santaka")

type GlobalFlags = { dryRun?: boolean; overwrite?: boolean; skip?: boolean; cwd?: string }

function context(flags: GlobalFlags): CommandContext {
  return {
    cwd: flags.cwd ?? process.cwd(),
    dryRun: Boolean(flags.dryRun),
    overwrite: Boolean(flags.overwrite),
    skip: Boolean(flags.skip),
    paint,
  }
}

/** Run a command, print its lines, and exit with its code. */
async function run(action: () => Promise<{ code: number; lines: string[] }>): Promise<never> {
  try {
    const result = await action()
    for (const line of result.lines) out(line)
    process.exit(result.code)
  } catch (error) {
    err(paint.error(`santaka failed: ${error instanceof Error ? error.message : String(error)}`))
    process.exit(EXIT.error)
  }
}

cli
  .command("init", "Set up Santaka UI in this project")
  .option("--framework <name>", "Override framework detection")
  .option("--registry <url>", "Register a component registry source")
  .option("--dry-run", "Show what would change, write nothing")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (flags: GlobalFlags & { framework?: string; registry?: string }) => {
    await run(() => init(context(flags), { framework: flags.framework, registry: flags.registry }))
  })

cli
  .command("add <...components>", "Copy component source into this project")
  .option("--source", "Source mode: copy the files (default)")
  .option("--overwrite", "Replace files you have edited")
  .option("--skip", "Leave conflicting files and install the rest")
  .option("--dry-run", "Show what would change, write nothing")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (components: string[], flags: GlobalFlags & { source?: boolean }) => {
    await run(() => add(context(flags), { names: components, source: flags.source }))
  })

cli
  .command("list", "List available components, and what is installed")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (flags: GlobalFlags) => {
    await run(() => list(context(flags)))
  })

cli
  .command("doctor", "Report what the CLI can see, and what is wrong")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (flags: GlobalFlags) => {
    await run(() => doctor(context(flags)))
  })

cli
  .command("diff [component]", "Compare installed files against the manifest")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (component: string | undefined, flags: GlobalFlags) => {
    await run(() => diff(context(flags), component))
  })

cli
  .command("theme init", "Write the theme entrypoint")
  .option("--dry-run", "Show what would change, write nothing")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (flags: GlobalFlags) => {
    await run(() => themeInit(context(flags)))
  })

cli
  .command("registry [url]", "List or add a component registry source")
  .option("--dry-run", "Show what would change, write nothing")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (url: string | undefined, flags: GlobalFlags) => {
    await run(() => registryAdd(context(flags), url))
  })

cli
  .command("update", "Reinstall every recorded component")
  .option("--overwrite", "Replace files you have edited")
  .option("--skip", "Leave conflicting files and install the rest")
  .option("--dry-run", "Show what would change, write nothing")
  .option("--cwd <dir>", "Run against another directory")
  .action(async (flags: GlobalFlags) => {
    await run(() => update(context(flags)))
  })

cli.help()
cli.version("0.1.0")

// `cac` throws on an unknown command, and its default handler prints usage and
// exits 0. Parsing with `run: false` first lets a bare `santaka` print help on
// stdout — where the user asked for it — while an *unknown* command is caught
// below and reported on stderr with a non-zero code, so a typo in a script
// fails rather than printing help into a pipeline.
try {
  cli.parse(process.argv, { run: false })
  if (!cli.matchedCommand) {
    cli.outputHelp()
    process.exit(EXIT.error)
  }
  await cli.runMatchedCommand()
} catch (error) {
  err(paint.error(error instanceof Error ? error.message : String(error)))
  process.exit(EXIT.error)
}
