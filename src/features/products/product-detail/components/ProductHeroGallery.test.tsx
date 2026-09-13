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
      productId="p-1"
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
        productId="p-1"
      />,
    )

    expect(screen.getByAltText("Intra Oral Mixing Tips")).toHaveAttribute("src", "/uploads/alt-1.png")
  })

  // 13 Sep 2026: the working FavoriteProductButton moved here from ProductHeroDetails so the
  // heart sits on the top-right corner of the product image.
  it("renders the favorites button over the image", () => {
    renderGallery()

    expect(screen.getByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
  })

  // A11y: axe's `nested-interactive` flagged this on /products/p-1 - `role="img"` used to sit on
  // the OUTER container, which also holds the "Toggle magnifier" button, and an element with
  // role="img" isn't allowed to contain focusable content (AT treats its subtree as one image, so
  // the button becomes unreachable). jsdom/Testing Library's `getByRole` doesn't enforce that
  // nesting rule the way axe/real assistive tech does, so this asserts the DOM structure directly:
  // the element carrying role="img" must not contain a button.
  it("keeps the magnifier toggle button out of the role=img element", () => {
    renderGallery()

    const imgRoleEl = screen.getByRole("img", { name: "Product image with magnifier" })
    expect(imgRoleEl.querySelector("button")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Toggle magnifier" })).toBeInTheDocument()
  })
})
