import { describe, expect, it } from "vitest"
import { cn } from "./cn.js"

describe("cn", () => {
  it("joins strings in author order so consumer classes win", () => {
    expect(cn("sk-button", "sk-button--primary", "consumer")).toBe(
      "sk-button sk-button--primary consumer",
    )
  })

  it("drops every falsy value shape", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b")
  })

  it("keeps 0, which is a valid class name suffix source", () => {
    expect(cn("col", 0)).toBe("col 0")
  })

  it("applies object keys only when enabled", () => {
    expect(cn("base", { active: true, disabled: false, loading: undefined })).toBe("base active")
  })

  it("flattens nested arrays and objects", () => {
    expect(cn(["a", ["b", { c: true, d: false }]], "e")).toBe("a b c e")
  })

  it("returns an empty string when nothing survives", () => {
    expect(cn(false, null, undefined, {})).toBe("")
  })
})
