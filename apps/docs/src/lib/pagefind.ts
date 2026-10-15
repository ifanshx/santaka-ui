/**
 * The subset of Pagefind's runtime API the docs site uses.
 *
 * Pagefind ships no types for the runtime bundle it writes into `dist/pagefind/`,
 * and that bundle does not exist at compile time anyway. Declaring the shape here
 * keeps the dynamic import in `Search.astro` typed without falling back to `any`.
 */
export interface PagefindResult {
  data(): Promise<{ url: string; excerpt?: string; meta?: { title?: string } }>
}

export interface PagefindSearch {
  results: PagefindResult[]
}

export interface PagefindModule {
  search(query: string): Promise<PagefindSearch>
  debouncedSearch?(query: string): Promise<PagefindSearch | undefined>
}
