import type { ErrorObject } from "ajv/dist/2020.js"
import validateSchema from "./registry-item-validator.js"
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
 * The compiled validator is generated at build time by
 * `scripts/build-validator.mjs` from the same schema in
 * `registry-item-schema.ts` — the schema remains the single source of truth.
 *
 * It used to be `new Ajv2020(...).compile(...)` here, which put a 41.2 KB
 * gzipped JSON Schema engine in front of every consumer for one schema that
 * cannot change at runtime. The generated module is Ajv's own output, so the
 * behavior is identical; `validate-item.test.ts` is the proof, not the claim.
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
