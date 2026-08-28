import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import FinalReviewExcludedNotice from "./FinalReviewExcludedNotice"

describe("FinalReviewExcludedNotice", () => {
  it("renders nothing when every seller could be shipped", () => {
    const { container } = render(<FinalReviewExcludedNotice excludedFromOrder={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  // The buyer loses these items twice over - the backend orders only what the rate orders carry
  // (OrderCreationService:163-173) and then soft-deletes the whole cart on payment success
  // (CartService.processCartAfterPaymentSuccess:189-204). Naming them here is the only warning
  // they get before committing.
  it("names each unshippable seller and their items before the order is placed", () => {
    render(
      <FinalReviewExcludedNotice
        excludedFromOrder={[
          { sellerName: "Nordic Dental", itemNames: ["Composite Kit", "Curing Light"] },
          { sellerName: "Pacific Supply", itemNames: ["Impression Tray"] },
        ]}
      />,
    )

    expect(screen.getByText(/won't be ordered/i)).toBeInTheDocument()
    expect(screen.getByText(/cleared from your cart/i)).toBeInTheDocument()
    expect(screen.getByText("Nordic Dental")).toBeInTheDocument()
    expect(screen.getByText(/Composite Kit, Curing Light/)).toBeInTheDocument()
    expect(screen.getByText("Pacific Supply")).toBeInTheDocument()
  })

  it("still names the seller when the item names are missing", () => {
    render(<FinalReviewExcludedNotice excludedFromOrder={[{ sellerName: "Nordic Dental", itemNames: [] }]} />)

    expect(screen.getByText("Nordic Dental")).toBeInTheDocument()
  })

  it("announces itself to assistive technology as a warning", () => {
    render(<FinalReviewExcludedNotice excludedFromOrder={[{ sellerName: "Nordic Dental", itemNames: ["Kit"] }]} />)

    expect(screen.getByRole("alert")).toHaveTextContent(/won't be ordered/i)
  })
})
