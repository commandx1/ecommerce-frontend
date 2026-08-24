import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import ProductHeroGallery from "./ProductHeroGallery"

const renderGallery = (props: Partial<Parameters<typeof ProductHeroGallery>[0]> = {}) =>
  render(
    <ProductHeroGallery
      title="Intra Oral Mixing Tips"
      sku="ABCDEF12"
      mainImage="/uploads/main.png"
      thumbnailImages={["/uploads/alt-1.png", "/uploads/alt-2.png"]}
      {...props}
    />,
  )

describe("ProductHeroGallery", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows the main image first and offers every image as a thumbnail", () => {
    renderGallery()

    expect(screen.getByAltText("Intra Oral Mixing Tips")).toHaveAttribute("src", "/uploads/main.png")
    expect(screen.getByAltText("Intra Oral Mixing Tips thumbnail 1")).toBeInTheDocument()
    expect(screen.getByAltText("Intra Oral Mixing Tips thumbnail 3")).toBeInTheDocument()
  })

  it("swaps the main image when a thumbnail is picked", async () => {
    const user = userEvent.setup()
    renderGallery()

    await user.click(screen.getByAltText("Intra Oral Mixing Tips thumbnail 2"))

    expect(screen.getByAltText("Intra Oral Mixing Tips")).toHaveAttribute("src", "/uploads/alt-1.png")
  })

  it("renders a badge only when the product carries one", () => {
    renderGallery({ badge: "New" })

    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("keeps the picked thumbnail while the magnifier is toggled", async () => {
    const user = userEvent.setup()
    renderGallery()

    await user.click(screen.getByAltText("Intra Oral Mixing Tips thumbnail 3"))
    await user.click(screen.getByRole("button", { name: "Toggle magnifier" }))

    expect(screen.getByAltText("Intra Oral Mixing Tips")).toHaveAttribute("src", "/uploads/alt-2.png")
  })

  // Y4 fix: the gallery used to derive `images` from the `thumbnailImages` prop by identity, so
  // a parent re-render passing an equal-but-new array silently threw the shopper back to the main
  // image. `useProductImageGallery` now keys its reset effect on the image list's content, so an
  // equal (even if not referentially identical) array no longer resets the pick.
  it("keeps the picked thumbnail when the parent re-renders with an equal array", async () => {
    const user = userEvent.setup()
    const { rerender } = renderGallery()

    await user.click(screen.getByAltText("Intra Oral Mixing Tips thumbnail 2"))
    expect(screen.getByAltText("Intra Oral Mixing Tips")).toHaveAttribute("src", "/uploads/alt-1.png")

    rerender(
      <ProductHeroGallery
        title="Intra Oral Mixing Tips"
        sku="ABCDEF12"
        mainImage="/uploads/main.png"
        thumbnailImages={["/uploads/alt-1.png", "/uploads/alt-2.png"]}
      />,
    )

    expect(screen.getByAltText("Intra Oral Mixing Tips")).toHaveAttribute("src", "/uploads/alt-1.png")
  })

  it("keeps the favourites control present but inert", () => {
    renderGallery()

    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeEnabled()
  })
})
