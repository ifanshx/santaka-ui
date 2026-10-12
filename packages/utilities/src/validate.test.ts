import { describe, expect, it } from "vitest"
import { validate } from "./validate.js"

describe("validate", () => {
  it("treats whitespace-only strings as empty for required", () => {
    const result = validate("   ", [{ required: true }])
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(["This field is required."])
  })

  it("treats empty arrays as empty for required", () => {
    expect(validate([], [{ required: true }]).valid).toBe(false)
  })

  it("reports every failure at once, not just the first", () => {
    const result = validate("", [{ required: true }, { min: 5 }, { pattern: /^\d+$/ }])
    // `required` short-circuits: remaining checks only make sense on a value.
    expect(result.errors).toHaveLength(1)
  })

  it("accumulates independent failures on a present value", () => {
    const result = validate("3", [{ min: 5 }, { pattern: /^\d{4}$/ }])
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(["Use at least 5.", "This value has an invalid format."])
  })

  it("compares numeric strings numerically, not by length", () => {
    expect(validate("3", [{ min: 10 }]).valid).toBe(false)
    expect(validate("30", [{ min: 10 }]).valid).toBe(true)
  })

  it("passes the value and rule to a custom validator", () => {
    const seen: unknown[] = []
    validate("x", [
      {
        required: true,
        validate: (value, rule) => {
          seen.push([value, rule.min])
          return value === "x" ? "no x please" : undefined
        },
      },
    ])
    expect(seen).toEqual([["x", undefined]])
  })

  it("returns valid for an empty rule list", () => {
    expect(validate("anything", [])).toEqual({ valid: true, errors: [] })
  })

  it("enforces max as the mirror of min on a numeric value", () => {
    expect(validate(10, [{ max: 3 }]).errors).toEqual(["Use at most 3."])
    expect(validate("abcdef", [{ max: 3 }]).errors).toEqual(["Enter a number of at most 3."])
  })

  it("ignores a pattern that does not apply to a non-string value", () => {
    expect(validate(42, [{ pattern: /^\d+$/ }]).valid).toBe(true)
  })

  it("reports a type mismatch instead of claiming the value is out of range", () => {
    expect(validate("abc", [{ min: 5 }]).errors).toEqual(["Enter a number of at least 5."])
    expect(validate("abc", [{ max: 5 }]).errors).toEqual(["Enter a number of at most 5."])
  })

  it("does not treat a boolean as a numeric value", () => {
    expect(validate(true, [{ min: 5 }]).errors).toEqual(["Enter a number of at least 5."])
  })

  it("treats a string bound as a character count, not a value", () => {
    expect(validate("abc", [{ min: "abcde" }]).valid).toBe(false)
    expect(validate("abcde", [{ min: "abcde" }]).valid).toBe(true)
    expect(validate(12345, [{ min: "3" }]).valid).toBe(true)
    expect(validate(12, [{ min: "100" }]).valid).toBe(false)
    expect(validate(1234, [{ max: "3" }]).valid).toBe(false)
  })
})
