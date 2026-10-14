/**
 * A minimal unified diff, for the two places §8 requires one: printing what a
 * conflict would change, and `santaka diff` reporting drift.
 *
 * Written rather than pulled in, because the requirement is narrow — show a
 * consumer the lines of a file they edited next to the lines the registry
 * supplies — and a general diff library would be a dependency for one function.
 * The algorithm is the ordinary LCS table; the output format is unified with
 * three lines of context, which is what `git diff` shows and what every review
 * tool renders.
 *
 * This is display-only. Nothing here decides whether a file is written — that is
 * `compareFiles` in `manifest.ts`, which compares hashes. A diff is for the human
 * deciding, not for the machine deciding.
 */

const CONTEXT = 3

export type DiffLine =
  | { kind: "context"; text: string; oldLine: number; newLine: number }
  | { kind: "add"; text: string; newLine: number }
  | { kind: "remove"; text: string; oldLine: number }

/** Longest common subsequence, as a table of line matches. */
function lcsTable(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  )
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i]![j] =
        a[i] === b[j]
          ? (table[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(table[i + 1]?.[j] ?? 0, table[i]?.[j + 1] ?? 0)
    }
  }
  return table
}

/** Every line of `a` and `b`, marked. */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n")
  const b = newText.split("\n")
  const table = lcsTable(a, b)
  const lines: DiffLine[] = []

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: "context", text: a[i] ?? "", oldLine: i + 1, newLine: j + 1 })
      i++
      j++
    } else if ((table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0)) {
      lines.push({ kind: "remove", text: a[i] ?? "", oldLine: i + 1 })
      i++
    } else {
      lines.push({ kind: "add", text: b[j] ?? "", newLine: j + 1 })
      j++
    }
  }
  while (i < a.length) {
    lines.push({ kind: "remove", text: a[i] ?? "", oldLine: i + 1 })
    i++
  }
  while (j < b.length) {
    lines.push({ kind: "add", text: b[j] ?? "", newLine: j + 1 })
    j++
  }
  return lines
}

/** True when the two texts are identical. */
export function isIdentical(oldText: string, newText: string): boolean {
  return oldText === newText
}

export type RenderOptions = {
  /** Colour callbacks, so this module has no opinion about the terminal. */
  paint?: {
    add: (text: string) => string
    remove: (text: string) => string
    hunk: (text: string) => string
  }
}

/**
 * Render a unified diff, or an empty string when the texts match.
 *
 * Hunks are split where more than `2 × CONTEXT` unchanged lines separate two
 * changes, which is the standard rule: a diff that prints the entire file
 * because two distant lines changed is a diff nobody reads.
 */
export function renderDiff(
  oldText: string,
  newText: string,
  labels: { old: string; new: string },
  options: RenderOptions = {},
): string {
  if (isIdentical(oldText, newText)) return ""

  const lines = diffLines(oldText, newText)
  const changed = lines
    .map((line, index) => (line.kind === "context" ? -1 : index))
    .filter((index) => index >= 0)
  if (changed.length === 0) return ""

  // Group changed lines whose context windows overlap.
  const groups: Array<[number, number]> = []
  for (const index of changed) {
    const start = Math.max(0, index - CONTEXT)
    const end = Math.min(lines.length - 1, index + CONTEXT)
    const last = groups[groups.length - 1]
    if (last && start <= last[1] + 1) {
      last[1] = Math.max(last[1], end)
    } else {
      groups.push([start, end])
    }
  }

  const paint = options.paint ?? {
    add: (text: string) => text,
    remove: (text: string) => text,
    hunk: (text: string) => text,
  }

  const output: string[] = [`--- ${labels.old}`, `+++ ${labels.new}`]
  for (const [start, end] of groups) {
    const slice = lines.slice(start, end + 1)
    const first = slice[0]
    const oldStart = first?.kind === "add" ? (first.newLine ?? 1) : (first?.oldLine ?? 1)
    const newStart = first?.kind === "remove" ? (first.oldLine ?? 1) : (first?.newLine ?? 1)
    const oldCount = slice.filter((line) => line.kind !== "add").length
    const newCount = slice.filter((line) => line.kind !== "remove").length
    output.push(paint.hunk(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`))
    for (const line of slice) {
      if (line.kind === "add") output.push(paint.add(`+${line.text}`))
      else if (line.kind === "remove") output.push(paint.remove(`-${line.text}`))
      else output.push(` ${line.text}`)
    }
  }

  return output.join("\n")
}
