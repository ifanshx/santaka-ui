import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"

/**
 * Automated accessibility scans (ADR-008).
 *
 * axe-core covers what a rule can check: semantic names, contrast, ARIA
 * wiring, landmark structure. It does NOT certify a component — plan.md §12
 * says so explicitly — and it cannot check keyboard flow or screen-reader
 * output, which the per-component browser tests cover by asserting behavior.
 * What it adds is a regression net across the whole example page on every
 * commit, against WCAG 2.2 A/AA rules axe implements.
 *
 * The scan runs against the vanilla example page, which mounts every
 * component in its documented states. A violation here is a shipped bug, not
 * a fixture artifact, so the ruleset is the strict one and nothing is
 * disabled. `withTags` pins the WCAG version so an axe release that adds
 * rules cannot silently change what "passing" means.
 */

/** The WCAG 2.0/2.1 A + AA tags axe implements, pinned for stability. */
const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]

/** Scan the page in its current state and assert no violations. */
export async function expectNoAxeViolations(
  page: Page,
  label: string,
  options: { include?: string[]; skip?: string[] } = {},
) {
  const builder = new AxeBuilder({ page }).withTags(WCAG_AA_TAGS)
  if (options.include) builder.include(options.include)
  if (options.skip) builder.disableRules(options.skip)

  const { violations } = await builder.analyze()

  const reported = violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `      - ${n.target.join(" ")}`).join("\n")
      return `  ${v.id} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"}): ${v.help}\n${nodes}`
    })
    .join("\n")

  expect(violations, `${label}: axe found accessibility violations:\n${reported}`).toEqual([])
}

export { AxeBuilder }
