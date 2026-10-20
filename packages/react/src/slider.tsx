import { forwardRef, type ReactElement } from "react"
import { cn } from "@santaka-ui/utilities"

/**
 * Slider - React adapter.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * Thin by construction, and one thing is worth naming: the control is a native
 * range input inside the element, so this adapter does not own the value. There
 * is no controlled/uncontrolled split here because the element renders a real
 * `<input type="range">`, whose value a plain `<form>` reads without anyone
 * reading component state.
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

export type SliderProps = {
  /** The accessible name, and the label rendered above the control. */
  label?: string
  /** Persistent helper text. */
  description?: string
  /** The validation message. Its presence drives `aria-invalid`. */
  error?: string
  /** Marks the field invalid independently of whether `error` is set. */
  invalid?: boolean
  /** Disables the control. */
  disabled?: boolean
  /** Native form semantics. */
  name?: string
  /** Smallest value. */
  min?: number
  /** Largest value. */
  max?: number
  /** Granularity. `0` means any value the browser can represent. */
  step?: number
  /** The current value. */
  value?: number
  /** Renders the numeric output beside the label. */
  showValue?: boolean
  /** Template for `aria-valuetext` — "$v of $m". */
  format?: string
  className?: string
}

export const Slider = forwardRef<SkSliderElement, SliderProps>(function Slider(
  {
    label,
    description,
    error,
    invalid,
    disabled,
    name,
    min,
    max,
    step,
    value,
    showValue,
    format,
    className,
  },
  ref,
): ReactElement {
  return (
    <sk-slider
      ref={ref}
      class={cn(className)}
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      disabled={disabled}
      name={name}
      min={min}
      max={max}
      step={step}
      value={value}
      show-value={showValue}
      format={format}
    />
  )
})
