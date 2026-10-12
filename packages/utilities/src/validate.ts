/**
 * Validation rules shared by every implementation (section 4, Forms
 * integration contract). Implemented once here so React, Web Components, and
 * the CLI cannot drift apart.
 */

export type ValidationRule = {
  required?: boolean
  min?: number | string
  max?: number | string
  pattern?: RegExp
  validate?: (value: unknown, rule: ValidationRule) => string | undefined
}

export type ValidationResult = { valid: boolean; errors: string[] }

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Compare a value against a numeric bound.
 *
 * Returns `null` when the value is not a number at all: a text value is not
 * "within range", it is the wrong type, and reporting it as out-of-range would
 * tell the user to fix something that is already correct.
 */
function compareNumeric(value: unknown, bound: number): -1 | 0 | 1 | null {
  const n = typeof value === "number" ? value : Number(value)
  if (typeof value === "boolean" || Number.isNaN(n)) return null
  return n < bound ? -1 : n > bound ? 1 : 0
}

function compareLength(value: unknown, bound: string): -1 | 0 | 1 {
  const length = typeof value === "string" ? value.length : String(value).length
  return length < bound.length ? -1 : length > bound.length ? 1 : 0
}

/**
 * Apply rules in order and return every failure, so a consumer can show all
 * problems at once instead of one at a time.
 */
export function validate(value: unknown, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = []

  for (const rule of rules) {
    if (rule.required && isEmpty(value)) {
      errors.push("This field is required.")
      continue
    }
    // Remaining checks only make sense once a value exists.
    if (isEmpty(value)) continue

    if (rule.min !== undefined) {
      const comparison =
        typeof rule.min === "number"
          ? compareNumeric(value, rule.min)
          : compareLength(value, rule.min)
      if (comparison === null) {
        errors.push(`Enter a number of at least ${rule.min}.`)
        continue
      }
      if (comparison < 0) {
        errors.push(`Use at least ${rule.min}.`)
        continue
      }
    }

    if (rule.max !== undefined) {
      const comparison =
        typeof rule.max === "number"
          ? compareNumeric(value, rule.max)
          : compareLength(value, rule.max)
      if (comparison === null) {
        errors.push(`Enter a number of at most ${rule.max}.`)
        continue
      }
      if (comparison > 0) {
        errors.push(`Use at most ${rule.max}.`)
        continue
      }
    }

    if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      errors.push("This value has an invalid format.")
      continue
    }

    const custom = rule.validate?.(value, rule)
    if (custom) errors.push(custom)
  }

  return { valid: errors.length === 0, errors }
}
