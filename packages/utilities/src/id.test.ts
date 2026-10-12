import { describe, expect, it } from "vitest"
import { nextId } from "./id.js"

describe("nextId", () => {
  it("never repeats an id within a module lifetime", () => {
    const ids = Array.from({ length: 1000 }, () => nextId("sk"))
    expect(new Set(ids).size).toBe(1000)
  })

  it("uses the caller's prefix", () => {
    expect(nextId("sk-label")).toMatch(/^sk-label-[a-z0-9]+$/)
  })
})
