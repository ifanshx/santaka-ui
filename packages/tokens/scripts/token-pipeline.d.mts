/**
 * Type declarations for the token pipeline.
 *
 * `token-pipeline.mjs` is plain JavaScript so it runs under `node` with no
 * build step. These declarations let `tsc --noEmit` type-check its consumers —
 * including the test suite — without duplicating the implementation.
 */

export type TokenLeaf = {
  $value: unknown
  $description?: string
  $extensions?: Record<string, string>
}

export type TokenTree = {
  [key: string]: TokenLeaf | TokenTree | string | undefined
}

export type Oklch = { l: number; c: number; h: number; css: string }

export function luminance(hex: string): number
export function contrastRatio(hexA: string, hexB: string): number
export function hexToOklch(hex: string): Oklch
export function flatten(
  node: TokenTree,
  trail?: string[],
  out?: Record<string, TokenLeaf>,
): Record<string, TokenLeaf>
export function resolveAll(lookup: Record<string, TokenLeaf>): Record<string, TokenLeaf>
export function kebab(name: string): string
export function isColorLeaf(path: string, value: unknown): boolean
