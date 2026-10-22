<script lang="ts">
  import { onMount } from "svelte"
  import { setTheme, theme } from "@santaka-ui/svelte"

  /**
   * The Svelte example (docs/ARCHITECTURE.md section 10, framework examples; section 16, and
   * the Svelte row's "Props/events, SSR and hydration tests").
   *
   * The page is deliberately a single real form containing all six
   * form-associated controls, because the claim under test is not "the page
   * renders" but "the browser submits these controls through a plain form, from
   * markup the server produced". That claim needs a real form, a real submit,
   * and a real `FormData`.
   *
   * Everything the tests assert is rendered here rather than reached through
   * internal state, so a test reads the same DOM a consumer would ship.
   */

  /** The submitted entries, in order, so a missing control is visible. */
  type Submission = { entries: [string, string][] }

  const PLANS = [
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
  ]

  const TIERS = [
    { value: "standard", label: "Standard" },
    { value: "premium", label: "Premium" },
  ]

  let submission = $state<Submission | null>(null)
  let detail = $state<string | null>(null)

  /**
   * The theme readout is rendered only after mount, and that is not a styling
   * choice. The server cannot know a preference that lives in `localStorage`, so
   * it renders a neutral value; if the client's first render read the real
   * preference, hydration would compare two different strings and report a
   * mismatch. The `<html>` attribute is what actually paints the theme, and the
   * pre-paint script sets it before either render — this readout is only a
   * visible way to confirm the store follows it.
   */
  let mounted = $state(false)
  onMount(() => {
    mounted = true
  })

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const form = event.currentTarget
    if (!(form instanceof HTMLFormElement)) return

    const entries: [string, string][] = []
    for (const [name, value] of new FormData(form).entries()) {
      // A File would mean a control submitted something other than a string,
      // which for these controls is a defect rather than a case to handle.
      entries.push([name, typeof value === "string" ? value : `<${value.name}>`])
    }
    submission = { entries }
  }

  function toggleTheme() {
    setTheme($theme === "dark" ? "light" : "dark")
  }
</script>

<main class="sk-stack" style="max-inline-size: 44rem; margin-inline: auto; padding: 2rem">
  <h1>Santaka UI — Svelte</h1>
  <p class="sk-text-muted">
    The same custom elements, through Svelte, rendered on the server and hydrated in the browser.
    Submit the form to see what the browser sends.
  </p>

  <form class="sk-stack" data-testid="form" onsubmit={onSubmit}>
    <sk-input name="email" type="email" label="Email" required placeholder="you@example.com"
    ></sk-input>

    <sk-input name="name" label="Name" description="A plain text field."></sk-input>

    <sk-textarea name="bio" label="Bio" rows={3}></sk-textarea>

    <!-- Serialized, like `@santaka-ui/react` and `@santaka-ui/vue` do, and here
         for a second reason as well: Svelte's server render writes a
         non-primitive prop as `[object Object]`, and `options` declared as a
         string is the attribute the element parses as JSON. Measured in this
         example's build — an array literal produced
         `options="[object Object],[object Object]"` in the server HTML. -->
    <sk-select
      name="plan"
      label="Plan"
      placeholder="Choose a plan"
      options={JSON.stringify(PLANS)}
    ></sk-select>

    <sk-checkbox name="terms" label="I accept the terms" value="accepted"></sk-checkbox>

    <sk-switch name="updates" label="Email me updates" value="on"></sk-switch>

    <sk-radio-group
      name="tier"
      label="Tier"
      options={JSON.stringify(TIERS)}
    ></sk-radio-group>

    <div class="sk-cluster">
      <sk-button type="submit" variant="primary" data-testid="submit">Submit</sk-button>
      <sk-button type="reset" variant="secondary" data-testid="reset">Reset</sk-button>
    </div>
  </form>

  <!-- The result is in the DOM, not only in component state, so a test asserts
       what a reader sees rather than reaching into the component. -->
  <output data-testid="result" class="sk-text-muted">{submission === null
      ? "not submitted"
      : JSON.stringify(submission.entries)}</output>

  <sk-card heading="Props and events" subtitle="the element's own, not a re-implementation">
    <div class="sk-stack">
      <div class="sk-cluster">
        <sk-button variant="primary">Primary</sk-button>
        <sk-button variant="secondary">Secondary</sk-button>
        <sk-button variant="outline">Outline</sk-button>
        <sk-button variant="ghost">Ghost</sk-button>
        <sk-button variant="danger">Danger</sk-button>
      </div>

      <div class="sk-cluster">
        <sk-button size="sm">Small</sk-button>
        <sk-button size="md">Medium</sk-button>
        <sk-button size="lg">Large</sk-button>
        <sk-button loading>Loading</sk-button>
        <sk-button disabled>Disabled</sk-button>
        <sk-icon-button label="Add item" variant="primary">+</sk-icon-button>
      </div>

      <div class="sk-cluster">
        <sk-badge variant="success">badge</sk-badge>
        <sk-spinner label="Loading" size="sm"></sk-spinner>
        <sk-link href="https://example.test/ownership">behavior ownership</sk-link>
      </div>

      <!-- `sk-value-change` is the element's own event. A test types into this
           field and asserts the detail that arrives, which is what makes the
           event binding evidence rather than markup. -->
      <sk-input
        name="live"
        label="Live value"
        description="Type to see the element's own sk-value-change event."
        onsk-value-change={(event) => {
          detail = `${event.detail.value}`
        }}
      ></sk-input>

      <p data-testid="event-detail" class="sk-text-muted">
        last sk-value-change: {detail === null ? "none" : detail}
      </p>
    </div>
  </sk-card>

  <sk-card heading="Theme" subtitle="one storage key, one document attribute">
    <div class="sk-cluster">
      <!-- Two warnings about markup Svelte can see, not the element that runs.
           `sk-button` gives its own host `role="button"` and `tabindex="0"` in
           `connectedCallback` — unless the attributes are already there — and
           handles Enter and Space in a keydown listener that calls
           `host.click()` (packages/web-components/src/components/shared/
           button-base.ts). Svelte cannot know any of that about an unknown tag,
           so it asks for a role and a key handler that the element already
           provides. The e2e suite drives both paths — a real click and a
           keyboard activation — so these ignores are measured, not assumed. The
           example also registers the elements after it hydrates, which is what
           keeps the server's markup (see src/define-elements.ts). -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <sk-button variant="outline" data-testid="theme-toggle" onclick={toggleTheme}>
        Toggle theme
      </sk-button>
      <span class="sk-text-muted">
        store: <code data-testid="theme-state">{mounted ? $theme : "unresolved"}</code>
      </span>
    </div>
  </sk-card>

  <sk-card heading="What this proves" subtitle="and what it does not">
    <p class="sk-text-muted">
      The form above is a plain <code>&lt;form&gt;</code>. Every control in it is a form-associated
      custom element, and the entries in the output come from the browser&rsquo;s own
      <code>FormData</code> — not from component state, and not from a hidden native input. The
      markup was rendered by <code>svelte/server</code> on the server, before any JavaScript ran.
    </p>
    <p class="sk-text-muted">
      Form participation is owned by <code>@santaka-ui/web-components</code>. What Svelte supplies is
      the element types, so a wrong prop name is a type error rather than a silently dropped
      attribute, plus the theme store.
    </p>
    <sk-badge variant="success">face</sk-badge>
  </sk-card>
</main>
