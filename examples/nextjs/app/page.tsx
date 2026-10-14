import { DefineCustomElements } from "./define-custom-elements"

/**
 * The SSR proof page. Every element below renders on the server as inert
 * markup and upgrades on the client. The attributes are the public contract:
 * if the server output and the hydrated tree disagree about any of them, the
 * proof script fails.
 */
export default function Home() {
  return (
    <main style={{ maxWidth: "44rem", margin: "0 auto", padding: "2rem" }}>
      <h1>Santaka UI — Next.js SSR proof</h1>

      <section aria-labelledby="forms-heading" style={{ display: "grid", gap: "1rem" }}>
        <h2 id="forms-heading">Form controls, server-rendered</h2>

        <sk-button id="ssr-button" type="button" variant="primary">
          Server-rendered button
        </sk-button>

        <sk-input name="handle" label="Handle" description="Shown publicly"></sk-input>

        <sk-checkbox name="agree" label="I agree to the terms"></sk-checkbox>

        <sk-switch name="dark" label="Dark mode"></sk-switch>

        <sk-select
          name="environment"
          label="Environment"
          placeholder="Choose an environment"
          options='[{"value":"production","label":"Production"},{"value":"staging","label":"Staging"}]'
        ></sk-select>
      </section>

      <section aria-labelledby="overlay-heading" style={{ display: "grid", gap: "1rem" }}>
        <h2 id="overlay-heading">Glass overlay</h2>
        <sk-tooltip placement="top">Hover me — server-rendered</sk-tooltip>
      </section>

      {/* Registers every element after hydration. Renders nothing. */}
      <DefineCustomElements />
    </main>
  )
}
