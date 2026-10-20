import { defineComponent, h, ref, useId } from "vue"
import { elementProps, elementProxy, optionalProp } from "./props.js"

/**
 * Slider — Vue 3 adapter.
 *
 * Behavior owner: `web-components`. The element wraps a real
 * `<input type="range">`, so the platform owns the slider role, `aria-valuenow`,
 * and the arrow/Page/Home/End model rather than this adapter or the element
 * reimplementing them.
 *
 * `format` is a consumer-supplied `Intl.NumberFormat` pattern string that becomes
 * `aria-valuetext`, so a slider reading "50%" or "$50" announces that instead of a
 * bare number. It is a string, not a function, because the element owns the
 * formatting and the adapter must not pass a reactive closure across the boundary.
 */
export type SkSliderElement = HTMLElement & {
  label: string
  description: string
  error: string
  invalid: boolean
  disabled: boolean
  name: string
  min: number
  max: number
  step: number
  value: number
  showValue: boolean
  format: string
}

export const Slider = defineComponent({
  name: "SkSlider",
  props: {
    label: optionalProp<string>(String),
    description: optionalProp<string>(String),
    error: optionalProp<string>(String),
    invalid: optionalProp<boolean>(Boolean),
    disabled: optionalProp<boolean>(Boolean),
    name: optionalProp<string>(String),
    min: optionalProp<number>(Number),
    max: optionalProp<number>(Number),
    step: optionalProp<number>(Number),
    value: optionalProp<number>(Number),
    showValue: optionalProp<boolean>(Boolean),
    format: optionalProp<string>(String),
    id: optionalProp<string>(String),
    onValueChange: optionalProp<(value: number) => void>(Function),
  },
  setup(props, { emit, expose }) {
    const el = ref<SkSliderElement | null>(null)
    expose(elementProxy(el))
    const generatedId = useId()
    return () =>
      h("sk-slider", {
        ref: el,
        id: props.id ?? generatedId,
        ...elementProps({
          label: props.label,
          description: props.description,
          error: props.error,
          invalid: props.invalid,
          disabled: props.disabled,
          name: props.name,
          min: props.min,
          max: props.max,
          step: props.step,
          value: props.value,
          showValue: props.showValue,
          format: props.format,
        }),
        onSkValueChange: (event: Event) => {
          const value = (event as CustomEvent<{ value: number }>).detail.value
          props.onValueChange?.(value)
          emit("update:value", value)
        },
      })
  },
})

export type SliderProps = {
  label?: string
  description?: string
  error?: string
  invalid?: boolean
  disabled?: boolean
  name?: string
  min?: number
  max?: number
  step?: number
  value?: number
  showValue?: boolean
  format?: string
  id?: string
  onValueChange?: (value: number) => void
}
