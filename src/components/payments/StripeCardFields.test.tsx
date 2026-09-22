import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"

// Local stub: the shared `@/test/mocks/stripe` stubs render a plain input and don't expose a way
// to fire Stripe's `onChange`/`onFocus`/`onBlur` element events, so this file wires its own.
vi.mock("@stripe/react-stripe-js", () => {
  const stub = (label: string) =>
    function StripeElementStub({
      onChange,
      onFocus,
      onBlur,
    }: {
      onChange?: (event: { complete: boolean; brand?: string; error?: { message: string } }) => void
      onFocus?: () => void
      onBlur?: () => void
    }) {
      return (
        <input
          aria-label={label}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange?.({ complete: event.target.value === "complete", brand: "visa" })}
        />
      )
    }
  return {
    CardNumberElement: stub("Card Number"),
    CardExpiryElement: stub("Expiry Date"),
    CardCvcElement: stub("CVC"),
  }
})

import StripeCardFields from "./StripeCardFields"

type Props = ComponentProps<typeof StripeCardFields>

const renderFields = (props: Partial<Props> = {}) => render(<StripeCardFields {...props} />)

describe("StripeCardFields", () => {
  it("renders the three card labels", () => {
    renderFields()

    expect(screen.getByText("Card Number")).toBeInTheDocument()
    expect(screen.getByText("Expiry Date")).toBeInTheDocument()
    expect(screen.getByText("CVC")).toBeInTheDocument()
  })

  it("reports focus and blur on the active field", () => {
    const onFocusFieldChange = vi.fn()
    renderFields({ onFocusFieldChange })

    fireEvent.focus(screen.getByLabelText("Card Number"))
    expect(onFocusFieldChange).toHaveBeenLastCalledWith("number")

    fireEvent.blur(screen.getByLabelText("Card Number"))
    expect(onFocusFieldChange).toHaveBeenLastCalledWith(null)
  })

  it("reports the card brand from the number element", () => {
    const onBrandChange = vi.fn()
    renderFields({ onBrandChange })

    fireEvent.change(screen.getByLabelText("Card Number"), { target: { value: "complete" } })

    expect(onBrandChange).toHaveBeenCalledWith("visa")
  })

  it("reports completion state as each element changes", () => {
    const onCompleteChange = vi.fn()
    renderFields({ onCompleteChange })

    fireEvent.change(screen.getByLabelText("Card Number"), { target: { value: "complete" } })

    expect(onCompleteChange).toHaveBeenLastCalledWith({ number: true, expiry: false, cvc: false })
  })
})
