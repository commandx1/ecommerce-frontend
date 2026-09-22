"use client"

import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState } from "react"

type FocusField = "number" | "expiry" | "cvc" | null

interface CompleteState {
  number: boolean
  expiry: boolean
  cvc: boolean
}

interface StripeCardFieldsProps {
  onBrandChange?: (brand: string) => void
  onFocusFieldChange?: (field: FocusField) => void
  onCompleteChange?: (complete: CompleteState) => void
  className?: string
}

// Stripe's element `onChange` event isn't typed by `@stripe/react-stripe-js` beyond `unknown` in
// our mocks, and the real SDK types are heavier than this file needs — narrow just the fields used.
interface StripeElementChangeEvent {
  complete: boolean
  brand?: string
  error?: { message: string }
}

/**
 * Presentational Stripe card fields. Deliberately store-free: state (brand, focus, completion) is
 * reported to the caller via callbacks instead of being read from a checkout store.
 */
export default function StripeCardFields({
  onBrandChange,
  onFocusFieldChange,
  onCompleteChange,
  className,
}: StripeCardFieldsProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [focusField, setFocusField] = useState<FocusField>(null)
  // Never read during render, so a ref: calling the parent's callback from a state updater would
  // run it in the render phase (and twice under StrictMode).
  const completeRef = useRef<CompleteState>({ number: false, expiry: false, cvc: false })
  const [errors, setErrors] = useState<{ number?: string; expiry?: string; cvc?: string }>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const cardElementOptions = useMemo(
    () => ({
      disableLink: true,
      style: {
        base: {
          fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "16px",
          color: isDark ? "#F4F1EA" : "#1F2937",
          iconColor: isDark ? "#F4F1EA" : "#475569",
          "::placeholder": {
            color: isDark ? "#A8B0BD" : "#94A3B8",
          },
        },
        invalid: {
          color: "#DC2626",
          iconColor: "#DC2626",
        },
      },
    }),
    [isDark],
  )

  const setFocused = (field: FocusField) => {
    setFocusField(field)
    onFocusFieldChange?.(field)
  }

  const handleChange = (field: keyof CompleteState) => (event: StripeElementChangeEvent) => {
    if (field === "number" && event.brand) {
      onBrandChange?.(event.brand)
    }
    const next = { ...completeRef.current, [field]: event.complete }
    completeRef.current = next
    onCompleteChange?.(next)
    setErrors((prev) => ({ ...prev, [field]: event.error?.message }))
  }

  const wrapperClass = (field: keyof CompleteState) =>
    `rounded-lg border bg-surface-elevated px-4 py-3 transition ${
      errors[field]
        ? "border-danger"
        : focusField === field
          ? "border-brand ring-2 ring-brand/25"
          : "border-border-soft"
    }`

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div>
        <div className="mb-1 text-xs font-medium text-text-secondary">Card Number</div>
        <div className={wrapperClass("number")}>
          <CardNumberElement
            options={cardElementOptions}
            onChange={handleChange("number")}
            onFocus={() => setFocused("number")}
            onBlur={() => setFocused(null)}
          />
        </div>
        {errors.number ? (
          <p role="alert" className="mt-1 text-xs text-danger">
            {errors.number}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium text-text-secondary">Expiry Date</div>
          <div className={wrapperClass("expiry")}>
            <CardExpiryElement
              options={cardElementOptions}
              onChange={handleChange("expiry")}
              onFocus={() => setFocused("expiry")}
              onBlur={() => setFocused(null)}
            />
          </div>
          {errors.expiry ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.expiry}
            </p>
          ) : null}
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-text-secondary">CVC</div>
          <div className={wrapperClass("cvc")}>
            <CardCvcElement
              options={cardElementOptions}
              onChange={handleChange("cvc")}
              onFocus={() => setFocused("cvc")}
              onBlur={() => setFocused(null)}
            />
          </div>
          {errors.cvc ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.cvc}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
