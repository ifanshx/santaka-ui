import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js"
import { registryItemSchema } from "./registry-item-schema.js"
import type { RegistryItem } from "./types.js"

/**
 * Registry entry validation (section 9, Registry safety rules).
 *
 * The JSON Schema in `registry-item-schema.ts` is the single boundary check:
 * an untrusted entry is parsed once, here, and every consumer downstream works
 * from the typed `RegistryItem` rather than re-inspecting raw fields.
 *
 * Nothing in this module writes to disk or executes registry content.
 */

export type ValidationError = { pointer: string; message: string }

export type ValidationOutcome =
  { ok: true; item: RegistryItem } | { ok: false; errors: ValidationError[] }

/**
 * One Ajv instance, compiled once at module load. Recompiling the schema per
 * call would dominate the cost of validating a single entry.
 */
const ajv = new Ajv2020({ allErrors: true, strict: true })
const validateSchema = ajv.compile(registryItemSchema)

/**
 * A stable component must tell an agent (or a person) what to use instead.
 * JSON Schema cannot express "this string names another component", so it is
 * checked here against the already-typed item.
 */
const ALTERNATIVE_HINT = /\b(use|instead|prefer|avoid)\b/i

function semanticErrors(item: RegistryItem): ValidationError[] {
  if (item.stability !== "stable") return []
  const namesAlternative = item.ai.whenNotToUse.some((entry) => ALTERNATIVE_HINT.test(entry))
  return namesAlternative
    ? []
    : [
        {
          pointer: "/ai/whenNotToUse",
          message: "at least one entry must name the alternative component",
        },
      ]
}

export function validateRegistryItem(input: unknown): ValidationOutcome {
  if (validateSchema(input)) {
    const errors = semanticErrors(input as RegistryItem)
    return errors.length > 0 ? { ok: false, errors } : { ok: true, item: input as RegistryItem }
  }

  const errors: ValidationError[] = (validateSchema.errors ?? []).map((error: ErrorObject) => ({
    pointer: error.instancePath === "" ? "/" : error.instancePath,
    message: `${error.message ?? "invalid"}${
      Object.keys(error.params).length > 0 ? ` (${JSON.stringify(error.params)})` : ""
    }`,
  }))
  return { ok: false, errors }
}
