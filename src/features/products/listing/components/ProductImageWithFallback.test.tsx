import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import ProductImageWithFallback from "./ProductImageWithFallback"

describe("ProductImageWithFallback", () => {
  it("falls back to the placeholder image when src is empty", () => {
    render(<ProductImageWithFallback src="" alt="Product" width={64} height={64} />)

    expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("dentypro-product-placeholder.png"))
  })

  it("renders the given src when it is present", () => {
    render(<ProductImageWithFallback src="/x.png" alt="Product" width={64} height={64} />)

    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "/x.png")
    expect(img).not.toHaveAttribute("src", expect.stringContaining("dentypro-product-placeholder.png"))
  })
})
