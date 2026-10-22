<script setup lang="ts">
import { ref } from "vue"
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Link,
  RadioGroup,
  Select,
  Switch,
  Textarea,
} from "@santaka-ui/vue"

/**
 * The Vue example (docs/ARCHITECTURE.md section 10, framework examples; section 16).
 *
 * The page is deliberately a single real form containing all six form-associated
 * controls, because the claim under test is not "the adapter renders" — jsdom
 * covers that — but "the browser submits these controls through a plain form".
 * That claim needs a real form element, a real submit, and a real `FormData`.
 *
 * Everything the test asserts is rendered here rather than reached through
 * internal state, so the test reads the same DOM a consumer would ship.
 */

type Submission = {
  /** The submitted entries, in order, so a missing control is visible. */
  entries: [string, string][]
  /** The control the browser reported as invalid, if submission was blocked. */
  invalid: string | null
}

const submission = ref<Submission | null>(null)

function onSubmit(event: Event) {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  const data = new FormData(form)
  const entries: [string, string][] = []
  for (const [name, value] of data.entries()) {
    // A File would mean a control submitted something other than a string,
    // which for these controls is a defect rather than a case to handle.
    entries.push([name, typeof value === "string" ? value : `<${value.name}>`])
  }
  submission.value = { entries, invalid: null }
}

/**
 * Submission is blocked by native constraint validation, so `onSubmit` never
 * runs for an invalid form. Recording *which* control the browser rejected is
 * the point: it proves the constraint is the platform's and not a Vue
 * re-implementation.
 */
function onInvalid(event: Event) {
  const target = event.target as HTMLInputElement
  submission.value = { entries: [], invalid: target.name || target.localName }
}
</script>

<template>
  <main class="sk-stack" style="max-inline-size: 44rem; margin-inline: auto; padding: 2rem">
    <h1>Santaka UI — Vue</h1>
    <p class="sk-text-muted">
      The same custom elements, through the Vue adapter. Submit the form to see what the browser
      sends.
    </p>

    <form class="sk-stack" data-testid="form" @submit="onSubmit" @invalid="onInvalid">
      <Input name="email" type="email" label="Email" required placeholder="you@example.com" />

      <Input name="name" label="Name" description="A plain text field." />

      <Textarea name="bio" label="Bio" :rows="3" />

      <Select
        name="plan"
        label="Plan"
        placeholder="Choose a plan"
        :options="[
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
        ]"
      />

      <Checkbox name="terms" label="I accept the terms" value="accepted" />

      <Switch name="updates" label="Email me updates" value="on" />

      <RadioGroup
        name="tier"
        label="Tier"
        :options="[
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
        ]"
      />

      <div class="sk-cluster">
        <Button type="submit" variant="primary" data-testid="submit">Submit</Button>
        <Button type="reset" variant="secondary" data-testid="reset">Reset</Button>
      </div>
    </form>

    <!-- The result is in the DOM, not only in Vue state, so the test asserts
         what a reader sees rather than reaching into the component. -->
    <output data-testid="result" class="sk-text-muted">{{
      submission === null
        ? "not submitted"
        : submission.invalid !== null
          ? `blocked: ${submission.invalid}`
          : JSON.stringify(submission.entries)
    }}</output>

    <Card heading="What this proves" subtitle="and what it does not">
      <p class="sk-text-muted">
        The form above is a plain <code>&lt;form&gt;</code>. Every control in it is a
        form-associated custom element rendered by <code>@santaka-ui/vue</code>, so the entries in
        the output come from the browser&rsquo;s own <code>FormData</code> — not from Vue state, and
        not from a hidden native input.
      </p>
      <p class="sk-text-muted">
        The Vue adapter forwards <code>name</code> and <code>value</code> and nothing else; form
        participation is owned by <code>@santaka-ui/web-components</code>. See
        <Link href="https://example.test/ownership">behavior ownership</Link>.
      </p>
      <Badge variant="success">face</Badge>
    </Card>
  </main>
</template>
