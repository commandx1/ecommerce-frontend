import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import CardBrandIcon from "./CardBrandIcon"

describe("CardBrandIcon", () => {
  it("renders the brand logo for a known brand", () => {
    render(<CardBrandIcon brand="visa" />)

    const img = screen.getByAltText("Visa")
    expect(img).toBeInTheDocument()
    expect(img.getAttribute("src")).toContain("/card-brands/visa.svg")
  })

  it.each([null, undefined, 4242, "unknown-brand", "diners"])("falls back to a generic icon for %s", (brand) => {
    render(<CardBrandIcon brand={brand} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("falls back to the generic icon when the logo fails to load", () => {
    render(<CardBrandIcon brand="mastercard" />)

    const img = screen.getByAltText("Mastercard")
    fireEvent.error(img)

    expect(screen.queryByAltText("Mastercard")).not.toBeInTheDocument()
  })
})
