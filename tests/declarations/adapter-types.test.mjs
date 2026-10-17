import assert from "node:assert/strict"
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"

/**
 * The custom elements are the runtime; every adapter's element types are a
 * hand-written copy of that runtime. Copies drift, and a drifted type is worse
 * than no type: it makes a wrong call compile.
 *
 * This suite compares all four copies against the `@Prop` decorators that the
 * components themselves declare, in `packages/web-components/src/components`.
 *   - the React JSX declarations and element types (`custom-elements.d.ts`)
 *   - the React adapter element types (`packages/react/src/*.tsx`)
 *   - the Vue adapter element types (`packages/vue/src/*.ts`)
 *   - the Svelte element types (`packages/svelte/src/custom-elements.d.ts`)
 *
 * The rule is exact equality in both directions: a property the element has may
 * not be hidden, and a member the element does not have may not be declared. It
 * was written because that rule was false — seven components were missing a real
 * property, and three declared an `onValueChange` handler no element has (those
 * components dispatch a `sk-value-change` `CustomEvent` directly, so reading
 * `element.onValueChange` would have been `undefined` while TypeScript said
 * otherwise). The intent is that the next such mistake fails here instead of
 * compiling.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..")
const COMPONENTS_DIR = join(ROOT, "packages/web-components/src/components")
const REACT_JSX = join(ROOT, "packages/react/src/custom-elements.d.ts")
const ADAPTER_DIRS = {
  react: join(ROOT, "packages/react/src"),
  vue: join(ROOT, "packages/vue/src"),
}
const SVELTE_TYPES = join(ROOT, "packages/svelte/src/custom-elements.d.ts")

/**
 * The members of every `type <Name> = ... & { ... }` block in a source file,
 * found by brace matching rather than a line pattern so a nested object type
 * cannot end the block early.
 */
function readTypeBlocks(source) {
  const blocks = new Map()
  const bases = new Map()
  const opener = /^(?:export )?type (\w*(?:Element|Attributes)) = [^=]*?&?\s*\{/gm
  // Helper types in these files are generic wrappers rather than element types.
  const helpers = new Set(["BaseCustomElement"])

  for (const match of source.matchAll(opener)) {
    const name = match[1]
    if (helpers.has(name)) continue
    // A composed type (`SkIconButtonElement = SkButtonElement & { label }`)
    // inherits the members of the type it is built from, which is declared in the
    // same file when it is one of these blocks.
    const base = source.slice(match.index, match.index + match[0].length).match(/= (\w+) &/)?.[1]
    if (base) bases.set(name, base)
    let depth = 1
    let index = match.index + match[0].length
    const start = index

    while (index < source.length && depth > 0) {
      const char = source[index]
      if (char === "{") depth += 1
      else if (char === "}") depth -= 1
      index += 1
    }
    if (depth !== 0) throw new Error(`unbalanced braces in the block for ${name}`)

    const body = source.slice(start, index - 1)
    const members = new Map()
    for (const member of body.matchAll(/^\s*(?:readonly )?("?[\w-]+"?)\??:\s*(.+)$/gm)) {
      members.set(member[1].replace(/^"|"$/g, ""), member[2].trim())
    }
    blocks.set(name, members)
  }

  for (const [name, base] of bases) {
    const inherited = blocks.get(base)
    if (!inherited) continue
    // The composed type's own members win, which is how a narrower member in the
    // derived type is expressed.
    blocks.set(name, new Map([...inherited, ...blocks.get(name)]))
  }

  return blocks
}

/** A `"a" | "b"` union as a set, or `undefined` for any other type text. */
function literalUnion(text) {
  const parts = text
    .trim()
    .replace(/;$/, "")
    .split("|")
    .map((part) => part.trim())
  if (!parts.every((part) => /^"[^"]*"$/.test(part))) return undefined
  return new Set(parts.map((part) => part.slice(1, -1)))
}

/**
 * The string-literal unions a package declares as named types, so a member
 * written as `variant: BadgeVariant` can still be compared with the source it
 * copies instead of being taken on trust.
 */
function readAliasUnions(dir) {
  const aliases = new Map()
  for (const match of readSourceText(dir).matchAll(/^(?:export )?type (\w+) = ([^\n]+)$/gm)) {
    const literals = literalUnion(match[2])
    if (literals) aliases.set(match[1], literals)
  }
  return aliases
}

/**
 * A prop the source types as a union of string literals has to stay that narrow
 * in the copy. Widening it to `string` compiles, so nothing else in CI notices:
 * the copies are never assignability-checked against the components.
 */
function compareLiteralTypes(tag, declared, label, aliases) {
  let compared = 0
  const problems = []
  for (const [prop, literals] of components.get(tag).literalTypes) {
    const text = declared.get(prop)
    if (text === undefined) continue

    const written = literalUnion(text) ?? aliases.get(text.trim())
    if (written) {
      compared += 1
      const expected = [...literals].sort()
      const actual = [...written].sort()
      if (expected.join("|") !== actual.join("|")) {
        problems.push(
          `${label}: ${prop} is ${actual.join(" | ")}, the element is ${expected.join(" | ")}`,
        )
      }
      continue
    }

    // A name may be an import this walk cannot resolve; a bare primitive is a
    // deliberate widening, and the element's own type is the truth.
    if (/^(string|number|boolean|any)\b/.test(text.trim())) {
      problems.push(
        `${label}: ${prop} is widened to ${text.trim()}, the element is ${[...literals].join(" | ")}`,
      )
    }
  }
  return { compared, problems }
}

/**
 * The members of a copy that names them the way attributes are written
 * (kebab-case, lowercase, or quoted), re-keyed by the property names the element
 * declares. Returns the properties the copy does not expose at all.
 */
function keyByProp(tag, members) {
  const { props, attributes } = components.get(tag)
  const attribute = (prop) => prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  const lowercased = new Map([...members].map(([name, text]) => [name.toLowerCase(), text]))
  const keyed = new Map()
  const missing = []

  for (const prop of props) {
    const declared = attributes.get(prop)
    const name = [prop, attribute(prop), declared].find(
      (candidate) => candidate && members.has(candidate),
    )
    const text =
      name !== undefined
        ? members.get(name)
        : (lowercased.get(prop.toLowerCase()) ?? lowercased.get(attribute(prop).toLowerCase()))

    if (text === undefined) missing.push(prop)
    else keyed.set(prop, text)
  }

  return { keyed, missing }
}

/** Every `@Prop` a component declares, and every tag its sources render. */
function readComponents() {
  const components = new Map()

  for (const dir of readdirSync(COMPONENTS_DIR)) {
    const file = join(COMPONENTS_DIR, dir, `${dir}.tsx`)
    if (!existsSync(file)) continue

    const source = readFileSync(file, "utf8")
    const tag = source.match(/@Component\(\{[\s\S]*?tag:\s*"([^"]+)"/)?.[1]
    if (!tag) continue

    const props = new Set([...source.matchAll(/@Prop\([^)]*\)\s*(\w+)\s*[?:=]/g)].map((m) => m[1]))

    // A prop may declare an attribute name that differs from the field
    // (`@Prop({ attribute: "for" }) forId`), and that is the name the JSX map
    // has to expose.
    const attributes = new Map()
    for (const match of source.matchAll(/@Prop\(([^)]*)\)\s*(\w+)\s*[?:=]/g)) {
      const attribute = match[1].match(/attribute:\s*"([^"]+)"/)?.[1]
      if (attribute) attributes.set(match[2], attribute)
    }

    // A prop the source types as a union of string literals; the shape a
    // hand-written copy silently widens to `string`, which compiles.
    const literalTypes = new Map()
    for (const match of source.matchAll(/@Prop\([^)]*\)\s*(\w+)\??\s*:\s*([^\n=]+)/g)) {
      const literals = literalUnion(match[2])
      if (literals) literalTypes.set(match[1], literals)
    }

    // The same shape written as a named union (`variant: ButtonVariant`), which
    // the package declares as an alias.
    for (const match of source.matchAll(/@Prop\([^)]*\)\s*(\w+)\??\s*:\s*([A-Za-z]\w*)\s*=/g)) {
      const literals = sourceAliases.get(match[2])
      if (literals) literalTypes.set(match[1], literals)
    }

    components.set(tag, { props, attributes, literalTypes, dir })
  }

  return components
}

function readSourceText(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .map((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return readSourceText(path)
      return /\.tsx?$/.test(entry.name) ? readFileSync(path, "utf8") : ""
    })
    .join("\n")
}

/** `sk-radio-group` -> `SkRadioGroupElement`; `SkRadioGroupElement` -> `sk-radio-group`. */
const toSkType = (tag) =>
  tag
    .replace(/^sk-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
const toElementType = (tag) => `${toSkType(tag)}Element`
const toTag = (typeName) =>
  `sk${typeName
    .replace(/^Sk/, "")
    .replace(/Element$/, "")
    .replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`)}`

/** The unions the elements themselves declare as named types. */
const sourceAliases = readAliasUnions(join(ROOT, "packages/web-components/src"))

const components = readComponents()
const adapterBlocks = new Map()

for (const [name, dir] of Object.entries(ADAPTER_DIRS)) {
  for (const file of readdirSync(dir)) {
    if (!/\.tsx?$/.test(file) || file.includes(".test.")) continue
    const blocks = readTypeBlocks(readFileSync(join(dir, file), "utf8"))
    for (const [typeName, members] of blocks) {
      if (typeName.startsWith("Sk") && typeName.endsWith("Element")) {
        adapterBlocks.set(`${name}/${typeName}`, members)
      }
    }
  }
}
for (const [typeName, members] of readTypeBlocks(readFileSync(SVELTE_TYPES, "utf8"))) {
  if (typeName.startsWith("Sk") && typeName.endsWith("Element")) {
    adapterBlocks.set(`svelte/${typeName}`, members)
  }
}

/** The Svelte `Sk*Attributes` maps, keyed by element type name without the suffix. */
const svelteAttributes = new Map()
for (const [typeName, members] of readTypeBlocks(readFileSync(SVELTE_TYPES, "utf8"))) {
  if (typeName.startsWith("Sk") && typeName.endsWith("Attributes")) {
    svelteAttributes.set(typeName.slice(0, -"Attributes".length), members)
  }
}

/** The named literal unions each package declares, for resolving member types. */
const aliasUnions = Object.fromEntries(
  Object.entries(ADAPTER_DIRS).map(([name, dir]) => [name, readAliasUnions(dir)]),
)
aliasUnions.svelte = readAliasUnions(join(ROOT, "packages/svelte/src"))

const reactJsx = readFileSync(REACT_JSX, "utf8")
const jsxTags = new Set([...reactJsx.matchAll(/^\s*"(sk-[\w-]+)":/gm)].map((m) => m[1]))
const reactBlocks = readTypeBlocks(reactJsx)

/** The component tests below only mean something if the readers found things. */
describe("the declaration drift guard", () => {
  it("reads the elements, the JSX declarations and every adapter copy", () => {
    assert.ok(components.size >= 26, `found ${components.size} components`)
    assert.ok(reactBlocks.size >= 26, `found ${reactBlocks.size} React element types`)
    assert.ok(adapterBlocks.size >= 50, `found ${adapterBlocks.size} adapter element types`)
    assert.ok(jsxTags.size >= 28, `found ${jsxTags.size} JSX tags`)
    assert.ok(svelteAttributes.size >= 20, `found ${svelteAttributes.size} Svelte attribute maps`)
  })
})

function compare(actual, expected, label) {
  const missing = [...expected].filter((member) => !actual.has(member))
  const extra = [...actual.keys()].filter((member) => !expected.has(member))
  assert.deepEqual(missing, [], `${label} is missing members the element has`)
  assert.deepEqual(extra, [], `${label} declares members the element does not have`)
}

describe("the React element types match the elements", () => {
  it("declares exactly the properties each element has", () => {
    for (const [tag, { props }] of components) {
      const typeName = toElementType(tag)
      const members = reactBlocks.get(typeName)
      if (!members) {
        assert.equal(tag, "sk-icon-button", `no React element type for ${tag}`)
        continue
      }
      compare(members, props, `React ${typeName}`)
    }
  })

  it("declares the icon button as the button's props plus its label", () => {
    // Its JSX entry reuses the button's type, so the shared element type must
    // cover the union or the reuse would silently narrow the icon button.
    const button = reactBlocks.get("ButtonElement")
    assert.ok(button, "no ButtonElement")
    const iconButton = components.get("sk-icon-button")
    assert.ok(iconButton)
    for (const prop of iconButton.props) {
      if (prop === "label") continue
      assert.ok(
        button.has(prop),
        `button element type is missing ${prop}, which the icon button has`,
      )
    }
    assert.match(reactJsx, /"sk-icon-button": ButtonPropsOf<ButtonElement>/)
  })
})

/**
 * The components with no element type of their own in each adapter. React reuses
 * the button's type in its JSX map and Svelte composes `SkButtonElement` with the
 * label, but both still declare an element type for the icon button, so the list
 * is empty — it is kept explicit so that a component which *stops* having one
 * fails here rather than passing silently.
 */
const WITHOUT_ELEMENT_TYPE = {
  react: [],
  vue: [],
  svelte: [],
}

describe("each adapter's element types match the elements", () => {
  for (const adapter of ["react", "vue", "svelte"]) {
    it(`${adapter} declares exactly the properties the elements have`, () => {
      const checked = []
      const problems = []
      const absent = []
      let unions = 0
      for (const [tag, { props }] of components) {
        // The adapters name their element types with the `Sk` prefix the
        // Stencil classes use (`SkCheckboxElement`), the JSX file without it.
        const members = adapterBlocks.get(`${adapter}/Sk${toSkType(tag)}Element`)
        if (!members) {
          absent.push(tag)
          continue
        }

        compare(members, new Set(props), `${adapter} Sk${toSkType(tag)}Element`)
        const unionsOf = compareLiteralTypes(
          tag,
          members,
          `${adapter} Sk${toSkType(tag)}Element`,
          aliasUnions[adapter],
        )
        unions += unionsOf.compared
        problems.push(...unionsOf.problems)
        checked.push(tag)
      }

      // The exceptions are the point of this assertion: every component has an
      // element type in every adapter, and these are the ones that do not, each
      // for a reason the next test checks directly.
      assert.deepEqual(absent, WITHOUT_ELEMENT_TYPE[adapter], `${adapter}: no element type`)
      assert.deepEqual(problems, [], "literal unions the copies do not keep")
      assert.ok(checked.length >= 20, `${adapter}: only ${checked.length} element types compared`)
      assert.ok(unions >= 15, `${adapter}: only ${unions} literal unions compared`)
    })
  }

  it("declares the icon button as the button's type plus its label", () => {
    // Svelte composes `SkButtonElement` with the label, so it has no block of its
    // own to compare — and the reuse is the claim, so replacing it with an
    // independent copy has to fail here.
    assert.match(
      readFileSync(SVELTE_TYPES, "utf8"),
      /export type SkIconButtonElement = SkButtonElement & \{\s*label: string\s*\}/,
    )

    const vue = adapterBlocks.get("vue/SkIconButtonElement")
    assert.ok(vue, "no Vue icon button element type")
    assert.deepEqual(
      [...vue.keys()].sort(),
      [...components.get("sk-icon-button").props].sort(),
      "vue SkIconButtonElement",
    )
  })

  it("maps every adapter element type back to a tag the element sources render", () => {
    // A type for a tag that no longer exists is how a rename leaves debris. The
    // internal elements (`sk-tab`, `sk-tab-panel`, `sk-option`) have no directory
    // of their own, so the tag is looked up in the sources rather than the tree.
    const source = readSourceText(join(ROOT, "packages/web-components/src"))
    const orphaned = [...adapterBlocks.keys()].filter((key) => {
      const [, typeName] = key.split("/")
      const tag = toTag(typeName)
      return !source.includes(`"${tag}"`) && !source.includes(`'${tag}'`)
    })

    assert.deepEqual(orphaned, [], "element types with no element behind them")
  })
})

describe("the Svelte attribute maps match the elements", () => {
  it("exposes every property the element has, and keeps its unions", () => {
    // `SkBadgeAttributes` is what a Svelte consumer's props are checked
    // against, so it is the same contract as the React JSX map.
    const missingProps = []
    const problems = []
    let checked = 0
    let unions = 0

    for (const [tag] of components) {
      const members = svelteAttributes.get(`Sk${toSkType(tag)}`)
      if (!members) continue

      const { keyed, missing } = keyByProp(tag, members)
      for (const prop of missing) missingProps.push(`${tag}.${prop}`)

      const unionsOf = compareLiteralTypes(
        tag,
        keyed,
        `svelte ${toSkType(tag)}Attributes`,
        aliasUnions.svelte,
      )
      unions += unionsOf.compared
      problems.push(...unionsOf.problems)
      checked += 1
    }

    assert.deepEqual(missingProps, [], "properties the Svelte attribute maps do not expose")
    assert.deepEqual(problems, [], "literal unions the Svelte attribute maps do not keep")
    assert.ok(checked >= 20, `only ${checked} Svelte attribute maps compared`)
    assert.ok(unions >= 15, `only ${unions} literal unions compared in the Svelte attribute maps`)
  })
})

describe("the React JSX declarations match the elements", () => {
  it("declares a tag for every component, and no tag the sources never render", () => {
    const tags = [...components.keys()]
    const missing = tags.filter((tag) => !jsxTags.has(tag))

    const source = readSourceText(join(ROOT, "packages/web-components/src"))
    const stale = [...jsxTags].filter(
      (tag) => !source.includes(`"${tag}"`) && !source.includes(`'${tag}'`),
    )

    assert.deepEqual(missing, [], "components with no JSX declaration")
    assert.deepEqual(stale, [], "JSX declarations for tags the sources never render")
  })

  it("exposes every property the element has, and keeps its unions", () => {
    // `sk-button` and `sk-icon-button` share the `ButtonPropsOf` helper instead of
    // an inline body, so their attributes come from that block; everything else
    // declares its own. A new helper form would have to be added here on purpose.
    const helpers = new Map()
    for (const match of reactJsx.matchAll(
      /type (\w+)<T extends HTMLElement> = BaseCustomElement<T> & \{([\s\S]*?)\n\}/g,
    )) {
      helpers.set(
        match[1],
        new Map(
          [...match[2].matchAll(/^\s*(\w+)\??:\s*(.*)$/gm)].map((member) => [
            member[1],
            member[2].trim(),
          ]),
        ),
      )
    }

    const inline = new Set()
    const viaHelper = new Map([
      ["sk-button", "ButtonPropsOf"],
      ["sk-icon-button", "ButtonPropsOf"],
    ])
    const missingProps = []
    const problems = []
    let unions = 0

    for (const [tag] of components) {
      if (!jsxTags.has(tag)) continue

      let exposed

      const helper = viaHelper.get(tag)
      if (helper) {
        exposed = new Map(helpers.get(helper))
        assert.ok(exposed.size > 0, `no ${helper} block for ${tag}`)

        // A helper entry may still add its own members on the same line, which
        // is how the icon button gets `label`.
        const line = reactJsx.slice(reactJsx.indexOf(`"${tag}":`)).split("\n")[0]
        for (const extra of line.matchAll(/&\s*\{([^}]*)\}/g)) {
          for (const member of extra[1].matchAll(/(\w+)\??:\s*([^;}]*)/g)) {
            exposed.set(member[1], member[2].trim())
          }
        }
      } else {
        inline.add(tag)
        const block = reactJsx.slice(reactJsx.indexOf(`"${tag}":`))
        const body = block.slice(0, block.indexOf("\n      }"))
        exposed = new Map(
          [...body.matchAll(/^\s*"?([\w-]+)"?\??:\s*(.*)$/gm)].map((member) => [
            member[1],
            member[2].trim(),
          ]),
        )
      }

      const { keyed, missing } = keyByProp(tag, exposed)
      for (const prop of missing) missingProps.push(`${tag}.${prop}`)

      const unionsOf = compareLiteralTypes(tag, keyed, `React ${tag}`, aliasUnions.react)
      unions += unionsOf.compared
      problems.push(...unionsOf.problems)
    }

    assert.deepEqual(missingProps, [], "properties the JSX declarations do not expose")
    assert.deepEqual(problems, [], "literal unions the JSX declarations do not keep")
    assert.ok(unions >= 15, `only ${unions} literal unions compared in the JSX declarations`)

    for (const [tag, helper] of viaHelper) {
      assert.ok(!inline.has(tag), `${tag} is both inline and helper-shaped`)
      assert.ok(helpers.has(helper), `no ${helper} block`)
    }
  })
})
